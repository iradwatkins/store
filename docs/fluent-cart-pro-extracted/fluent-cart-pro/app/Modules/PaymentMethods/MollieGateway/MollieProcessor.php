<?php

namespace FluentCartPro\App\Modules\PaymentMethods\MollieGateway;

use FluentCart\Api\StoreSettings;
use FluentCart\App\Services\Payments\PaymentInstance;
use FluentCart\Framework\Support\Arr;
use FluentCartPro\App\Modules\PaymentMethods\MollieGateway\API\MollieAPI;

class MollieProcessor
{
    public function handleSinglePayment(PaymentInstance $paymentInstance, $paymentArgs = [])
    {
        $order = $paymentInstance->order;
        $transaction = $paymentInstance->transaction;
        $fcCustomer = $paymentInstance->order->customer;
        $customerBillingAddress = $paymentInstance->order->billing_address;
        $customerShippingAddress = $paymentInstance->order->shipping_address;

        $description = '';
        $lines = [];
        foreach ($order->order_items as $item) {
            $description .= $item->post_title.  ' - ' . $item->title . ' Q' . $item->quantity . ', ';

            $unitPrice = $item->unit_price;
            $value = $item->line_total;

            if ($item->tax_amount > 0 && $order->tax_behavior == 1) {
                $unitPrice += $item->tax_amount / $item->quantity;
                $value += $item->tax_amount;
            }


            $lines[] = [
                'type' => $item->fulfillment_type,
                'description' => $item->post_title . ' - ' . $item->title,
                'quantity' => $item->quantity,
                'unitPrice' => [
                    'currency' => $transaction->currency,
                    'value'    => $this->formatAmount($unitPrice, $transaction->currency)
                ],
                'totalAmount' => [
                    'currency' => $transaction->currency,
                    'value'    => $this->formatAmount($value, $transaction->currency)
                ]
            ];

        }

        // if shipping cost is there then add it to lines
        if ($order->shipping_total > 0) {
            $lines[] = [
                'type' => 'shipping_fee',
                'description' => __('Shipping', 'fluent-cart-pro'),
                'quantity' => 1,
                'unitPrice' => [
                    'currency' => $transaction->currency,
                    'value'    => $this->formatAmount($order->shipping_total, $transaction->currency)
                ],
                'totalAmount' => [
                    'currency' => $transaction->currency,
                    'value'    => $this->formatAmount($order->shipping_total, $transaction->currency)
                ]
            ];
        }

        if ($order->shipping_tax > 0 && $order->tax_behavior == 1) {
            $lines[] = [
                'type' => 'shipping_fee',
                'description' => __('Shipping Tax', 'fluent-cart-pro'),
                'quantity' => 1,
                'unitPrice' => [
                    'currency' => $transaction->currency,
                    'value'    => $this->formatAmount($order->shipping_tax, $transaction->currency)
                ],
                'totalAmount' => [
                    'currency' => $transaction->currency,
                    'value'    => $this->formatAmount($order->shipping_tax, $transaction->currency)
                ]
            ];
        }

        $billingAddress = [
            'givenName' => $fcCustomer->first_name,
            'familyName' => $fcCustomer->last_name,
            'streetAndNumber' => $customerBillingAddress->address_1,
            'email' => $fcCustomer->email,
            'postalCode' =>$customerBillingAddress->postcode,
            'city' => $customerBillingAddress->city,
            'country' => $customerBillingAddress->country
        ];

        $shippingAddress = [
            'givenName' => $fcCustomer->first_name,
            'familyName' => $fcCustomer->last_name,
            'streetAndNumber' => $customerShippingAddress->address_1,
            'email' => $fcCustomer->email,
            'postalCode' =>$customerShippingAddress->postcode,
            'city' => $customerShippingAddress->city,
            'country' => $customerShippingAddress->country
        ];

        // remove the last ',' from description
        $description = rtrim($description, ', ');

        
       $method = ''; // will be set later if needed
       $restrictPaymentMethodsToCountry = []; // will be set later if needed
       $captureMode = 'automatic'; // default capture mode


        $paymentData = [
            'description'       =>  $description,
            'amount' => [
                'currency'      => strtoupper($transaction->currency),
                'value'         => $this->formatAmount($transaction->total, $transaction->currency)
            ],
            'redirectUrl'       => Arr::get($paymentArgs, 'success_url'),
            'cancelUrl'         => Arr::get($paymentArgs, 'cancel_url'),
            'webhookUrl'        => $this->getWebhookUrl(),
            'lines'             => $lines,
            'billingAddress'    => $billingAddress,
            'shippingAddress'   => $shippingAddress,
            'locale'            => $paymentArgs['locale'] ?? null,
            'metadata'          => [
                'order_hash'         => $order->uuid,
                'transaction_hash'   => $transaction->uuid,
            ],
            'captureMode'       => $captureMode
        ];

        $customer = $this->createOrGetCustomer($fcCustomer);// will use in recurring
        if (!is_wp_error($customer)) {
            $paymentData['customerId']  = $customer['id'];
        }


        // Apply filters for customization
        $paymentData = apply_filters('fluent_cart/payments/mollie_payment_args', $paymentData, [
            'order'       => $order,
            'transaction' => $transaction
        ]);


        $payment = (new MollieAPI())->createMollieObject('payments', $paymentData);

        if (is_wp_error($payment)) {
            return $payment;
        }

        // Store Mollie payment ID in transaction
        $transaction->update([
            'vendor_charge_id' => $payment['id'],
            'meta'             => array_merge($transaction->meta ?? [], [
                'mollie_payment_id' => $payment['id']
            ])
        ]);

        // Get checkout URL from Mollie response
        $checkoutUrl = Arr::get($payment, '_links.checkout.href');

        if (!$checkoutUrl) {
            return new \WP_Error(
                'mollie_checkout_error',
                __('Unable to get checkout URL from Mollie', 'fluent-cart-pro')
            );
        }

        return [
            'status'       => 'success',
            'nextAction'   => 'mollie',
            'actionName'   => 'redirect',
            'message'      => __('Redirecting to Mollie payment page...', 'fluent-cart-pro'),
            'response'     => $payment,
            'payment_args' => array_merge($paymentArgs, [
                'checkout_url' => $checkoutUrl,
                'payment_id'   => $payment['id']
            ])
        ];
    }


    public function handleSubscription(PaymentInstance $paymentInstance, $paymentArgs = [])
    {
        $order = $paymentInstance->order;
    
        $order = $paymentInstance->order;
        $transaction = $paymentInstance->transaction;
        $subscription = $paymentInstance->subscription;
        $fcCustomer = $paymentInstance->order->customer;
        $customerBillingAddress = $paymentInstance->order->billing_address;
        $customerShippingAddress = $paymentInstance->order->shipping_address;

        $billingAddress = [
            'givenName' => $fcCustomer->first_name,
            'familyName' => $fcCustomer->last_name,
            'streetAndNumber' => $customerBillingAddress->address_1,
            'email' => $fcCustomer->email,
            'postalCode' => $customerBillingAddress->postcode ?: $fcCustomer->postcode,
            'city' => $customerBillingAddress->city ?: $fcCustomer->city,
            'country' => $customerBillingAddress->country ?: $fcCustomer->country
        ];

        $shippingAddress = [
            'givenName' => $fcCustomer->first_name,
            'familyName' => $fcCustomer->last_name,
            'streetAndNumber' => $customerShippingAddress->address_1,
            'email' => $fcCustomer->email,
            'postalCode' => $customerShippingAddress->postcode ?: $fcCustomer->postcode,
            'city' => $customerShippingAddress->city ?: $fcCustomer->city,
            'country' => $customerShippingAddress->country ?: $fcCustomer->country
        ];

        $customer = $this->createOrGetCustomer($fcCustomer);// will use in recurring
        if (is_wp_error($customer)) {
            return $customer;
        }

        $subscription->query()->update([
            'vendor_customer_id' => $customer['id']
        ]);

        if ($order->type == 'renewal') {
            $trialDays = (int) $subscription->getReactivationTrialDays();
            if ($trialDays > 0) {
                $amount = 0;
            } else {
                $amount = $subscription->getCurrentRenewalAmount();
            }

            $firstPayment = [
                'amount' => [
                    'currency' => strtoupper($transaction->currency),
                    'value' => $this->formatAmount($amount, $transaction->currency) 
                ],
                'customerId' => $customer['id'],
                'description' => $subscription->item_name . ' - First Payment',
                'sequenceType' => 'first',
                'redirectUrl' => Arr::get($paymentArgs, 'success_url'),
                'cancelUrl' => Arr::get($paymentArgs, 'cancel_url'),
                'webhookUrl' => $this->getWebhookUrl(),
                'locale' => $paymentArgs['locale'] ?? null,
                'billingAddress'    => $billingAddress,
                'shippingAddress'   => $shippingAddress,
                'metadata' => [
                    'order_hash' => $order->uuid,
                    'transaction_hash' => $transaction->uuid,
                    'subscription_hash' => $subscription->uuid,
                ]
            ];
            
        } else {
            $firstPayment = [
                'amount' => [
                    'currency' => strtoupper($transaction->currency),
                    'value' => $this->formatAmount($transaction->total, $transaction->currency) 
                ],
                'customerId' => $customer['id'],
                'description' => $subscription->item_name . ' - First Payment',
                'sequenceType' => 'first',
                'redirectUrl' => Arr::get($paymentArgs, 'success_url'),
                'cancelUrl' => Arr::get($paymentArgs, 'cancel_url'),
                'webhookUrl' => $this->getWebhookUrl(),
                'locale' => $paymentArgs['locale'] ?? null,
                'billingAddress'    => $billingAddress,
                'shippingAddress'   => $shippingAddress,
                'metadata' => [
                    'order_hash' => $order->uuid,
                    'transaction_hash' => $transaction->uuid,
                    'subscription_hash' => $subscription->uuid,
                ]
            ];
        }


        
        $payment = (new MollieAPI())->createMollieObject('payments', $firstPayment);

        if (is_wp_error($payment)) {
            return $payment;
        }

        // Store Mollie payment ID in transaction
        $transaction->update([
            'vendor_charge_id' => $payment['id']
        ]);

        return [
            'status' => 'success',
            'nextAction' => 'mollie',
            'actionName' => 'redirect',
            'message' => __('Redirecting to Mollie payment page...', 'fluent-cart-pro'),
            'response' => $payment,
            'payment_args' => array_merge($paymentArgs, [
                'checkout_url' => Arr::get($payment, '_links.checkout.href'),
                'payment_id' => $payment['id']
            ])
        ];
    }
  
    public function formatAmount($amount, $currency)
    {
        $zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'TWD'];
        
        if (in_array(strtoupper($currency), $zeroDecimalCurrencies)) {
            return number_format($amount, 0, '.', '');
        }

        return number_format($amount / 100, 2, '.', '');
    }

    public function getWebhookUrl()
    {
        return site_url('?fluent-cart=fct_payment_listener_ipn&method=mollie');
    }

    public function createOrGetCustomer($fcCustomer)
    {
        $mode = (new StoreSettings())->get('order_mode');
        $mollieCustomerId = $fcCustomer->getMeta('mollie_customer_id_' . $mode);
        
        if ($mollieCustomerId) {
            $mollieCustomer = (new MollieAPI())->getMollieObject('customers/' . $mollieCustomerId, []);  
            if (!is_wp_error($mollieCustomer)) {
                return $mollieCustomer;
            }
        }

        $customerData = [
            'name' => $fcCustomer->first_name . ' ' . $fcCustomer->last_name,
            'email' => $fcCustomer->email
        ];

        $response = (new MollieAPI())->createMollieObject('customers', $customerData);

        if (is_wp_error($response)) {
            return $response;
        }

        $fcCustomer->updateMeta('mollie_customer_id_' . $mode, $response['id'] ?? '');

        return $response;
    }
}

