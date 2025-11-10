<?php

namespace FluentCartPro\App\Modules\PaymentMethods\MollieGateway;

use FluentCart\App\Helpers\Status;
use FluentCart\App\Helpers\StatusHelper;
use FluentCart\App\Models\OrderTransaction;
use FluentCart\App\Models\Cart;
use FluentCart\App\Models\Subscription;
use FluentCart\Api\StoreSettings;
use FluentCart\App\Events\Subscription\SubscriptionActivated;
use FluentCart\Framework\Support\Arr;
use FluentCart\App\Services\DateTime\DateTime;
use FluentCartPro\App\Modules\PaymentMethods\MollieGateway\API\MollieAPI;

class Confirmations
{

    static private $handleSubscription = false;

    public function init(){
        
        add_action('fluent_cart/before_render_redirect_page', [$this, 'maybeConfirmaPayment'], 10, 1);

    }

    public function maybeConfirmaPayment($data){

        $isReceipt = Arr::get($data, 'is_receipt', false);
        $mtehod = Arr::get($data, 'method', '');

        if ($isReceipt || $mtehod !== 'mollie') {
            return;
        }

        $transactionHash = Arr::get($data, 'trx_hash', '');

        $transaction = OrderTransaction::query()->where('uuid', $transactionHash)
            ->where('payment_method', 'mollie')
            ->first();

        // if (!$transaction || $transaction->status === Status::TRANSACTION_SUCCEEDED || $transaction->status === Status::TRANSACTION_AUTHORIZED) {
        //     return;
        // }

        // get payment from mollie and confirm payment status
        $payment = (new MollieAPI())->getMollieObject('payments/' . $transaction->vendor_charge_id); 
        
        if (is_wp_error($payment)) {
            return;
        }

        $mandateId = Arr::get($payment, 'mandateId');

        $billingInfo = [
            'method' => Arr::get($payment, 'method'),
            'brand' => Arr::get($payment, 'details.cardLabel'),
            'last4' => Arr::get($payment, 'details.cardNumber'),
            'token' => Arr::get($payment, 'details.cardToken'),
            'mandate_id' => $mandateId
        ];

        if ($mandateId) {
              $this->handleSubscriptionCreation($transaction, [
                'mandate_id' => $mandateId,
                'billingInfo' => $billingInfo
              ]);
        }


        $status = Arr::get($payment, 'status');

        if ($status === 'paid') {
            $this->confirmPaymentSuccessByCharge($transaction, [
                'charge' => $payment,
                'vendor_charge_id' => $transaction->vendor_charge_id
            ]);
        } elseif ($status === 'authorized') {
            $this->authorizePaymentByCharge($transaction, [
                'charge' => $payment,
                'vendor_charge_id' => $transaction->vendor_charge_id
            ]);
        }
    }

    public function handleSubscriptionCreation(OrderTransaction $transaction, $args = [])
    {
        if (self::$handleSubscription) {
            return;
        }
        $subscriptionModel = Subscription::query()
            ->where('id', $transaction->subscription_id)
            ->first();
        

        $mandateId = Arr::get($args, 'mandate_id');
        $mandate = (new MollieAPI())->getMollieObject('customers/' . $subscriptionModel->vendor_customer_id . '/mandates/' . $mandateId);

        if (is_wp_error($mandate)) {
            return;
        }

        if (Arr::get($mandate, 'status') !== 'valid') {
            return;
        }

        $order = $transaction->order;

        $intervalMap = [
            'daily' => '1 day',
            'weekly' => '1 week',
            'monthly' => '1 month',
            'yearly' => '12 months',
        ];

        $times = $subscriptionModel->bill_times > 0 ? $subscriptionModel->bill_times : null;

        // if subscription have trial days but modified or have no trial days , then bill times should be reduced by 1
        if ($subscriptionModel->trial_days == 0 || Arr::get($subscriptionModel->config, 'is_trial_days_simulated') == 'yes') {
            if ($times) {
                $times = $times - 1;
            }
        }

        $description = MollieHelper::generateSubscriptionDescription($subscriptionModel, $order->currency, $order->type);
        $startDate = MollieHelper::calculateSubscriptionStartDate($subscriptionModel, $order);


        // now create the subscription in mollie, remember first payment is already done
        $mollieSubscriptionData = [
            'amount' => [
                'value' => (new MollieProcessor())->formatAmount($subscriptionModel->recurring_total, $transaction->currency),
                'currency' => $transaction->currency
            ],
            'interval' => $intervalMap[$subscriptionModel->billing_interval],
            'description' =>  $description,
            'webhookUrl' => (new MollieProcessor())->getWebhookUrl(),
            'mandateId' => $mandateId,
            'startDate' => $startDate,
            'metadata' => [
                'subscription_hash' => $subscriptionModel->uuid,
                'order_hash' => $transaction->order->uuid
            ]
        ];
       

        if ($times) {
            $mollieSubscriptionData['times'] = $times;
        }

        $mollieSubscription = (new MollieAPI())->createMollieObject('customers/' . $subscriptionModel->vendor_customer_id . '/subscriptions', $mollieSubscriptionData);

        if (is_wp_error($mollieSubscription)) {
            return null;
        }
        

        $billsCount = OrderTransaction::query()
            ->where('subscription_id', $subscriptionModel->id)
            ->where('transaction_type', Status::TRANSACTION_TYPE_CHARGE)
            ->where('total', '>', 0)
            ->count();

        $updateData = [
            'vendor_subscription_id' => Arr::get($mollieSubscription, 'id'),
            'current_payment_method' => 'mollie',
            'status' => Arr::get($mollieSubscription, 'status'),
            'bill_count' => $billsCount,
            'next_billing_date' => Arr::get($mollieSubscription, 'nextPaymentDate'),
            'vendor_response' => json_encode($mollieSubscription)
        ];

        $subscriptionModel->update($updateData);

        $subscriptionModel->updateMeta('active_payment_method', Arr::get($args, 'billingInfo', []));

        if (Arr::get($mollieSubscription, 'status') === Status::SUBSCRIPTION_ACTIVE) {
            (new SubscriptionActivated($subscriptionModel, $order, $order->customer))->dispatch();
        }

        fluent_cart_add_log(__('Mollie Subscription Activated', 'fluent-cart-pro'), __('Subscription activated in Mollie. Subscription ID: ', 'fluent-cart-pro')  . Arr::get($mollieSubscription, 'id'), 'info', [
            'module_name' => 'order',
            'module_id'   => $order->id,
        ]);

        self::$handleSubscription = true;

    }


    public function confirmPaymentSuccessByCharge(OrderTransaction $transaction, $args = [])
    {
        $charge = Arr::get($args, 'charge', []);
        $vendorChargeId = Arr::get($args, 'vendor_charge_id');

        $order = $transaction->order;

        if ($order == null) {
            return;
        }

        if ($transaction->status === Status::TRANSACTION_SUCCEEDED) {
            return;
        }


        $billingInfo = [];

        $mandateId = Arr::get($charge, 'mandateId');

         $billingInfo = [
            'method' => Arr::get($charge, 'method'),
            'brand' => Arr::get($charge, 'details.cardLabel'),
            'last4' => Arr::get($charge, 'details.cardNumber'),
            'token' => Arr::get($charge, 'details.cardToken'),
            'mandate_id' => $mandateId
        ];

        if ($mandateId) {
            $this->handleSubscriptionCreation($transaction, [
                'mandate_id' => $mandateId,
                'billingInfo' => $billingInfo
            ]);
        }

        
        // if we consider authorized as success state, then it success related actions already is handled
        // currently not handled , just implemented for later use
        if ($transaction->status === Status::TRANSACTION_AUTHORIZED && (new MollieSettingsBase())->get('is_authorize_a_success_state') == 'yes') {
            $transaction->status = Status::TRANSACTION_SUCCEEDED;
            $transaction->save();

            fluent_cart_add_log(__('Mollie Payment Confirmation', 'fluent-cart-pro'), __('Payment confirmation received from Mollie for previously authorized payment. Transaction ID: ', 'fluent-cart-pro')  . $vendorChargeId, 'info', [
                'module_name' => 'order',
                'module_id'   => $order->id,
            ]);

            return $order;
        }

        $amount = Arr::get($charge, 'amount.value');
        $currency = Arr::get($charge, 'amount.currency');
        $amountInCents = MollieHelper::convertToCents($amount, $currency);

        $details = Arr::get($charge, 'details', []);

        $transactionUpdateData = array_filter([
            'order_id'            => $order->id,
            'total'               => $amountInCents,
            'currency'            => $currency,
            'status'              => Status::TRANSACTION_SUCCEEDED,
            'payment_method'      => 'mollie',
            'card_last_4'         => Arr::get($details, 'cardNumber', ''),
            'card_brand'          => Arr::get($details, 'cardLabel', ''),
            'payment_method_type' => Arr::get($charge, 'method', ''),
            'vendor_charge_id'    => $vendorChargeId,
            'payment_mode'        => $order->mode,
            'meta'                => $transaction->meta
        ]);

        $transaction->fill($transactionUpdateData);
        $transaction->save();

        // will handle subscription, renewal later

        fluent_cart_add_log(__('Mollie Payment Confirmation', 'fluent-cart-pro'), __('Payment confirmation received from Mollie. Transaction ID: ', 'fluent-cart-pro')  . $vendorChargeId, 'info', [
            'module_name' => 'order',
            'module_id'   => $order->id,
        ]);

        (new StatusHelper($order))->syncOrderStatuses($transaction);

        return $order;

    }

    public function authorizePaymentByCharge(OrderTransaction $transaction, $args = [])
    {
        $charge = Arr::get($args, 'charge', []);
        $vendorChargeId = Arr::get($args, 'vendor_charge_id');

        $order = $transaction->order;

        if ($order == null) {
            return;
        }

        // Check if already processed
        if ($transaction->status === Status::TRANSACTION_AUTHORIZED || $transaction->status === Status::TRANSACTION_SUCCEEDED) {
            return;
        }    

        $mandateId = Arr::get($charge, 'mandateId');

        if ($mandateId) {
            $this->handleSubscriptionCreation($transaction, [
                'mandate_id' => $mandateId
            ]);
        }

        $amount = Arr::get($charge, 'amount.value');
        $currency = Arr::get($charge, 'amount.currency');
        $amountInCents = MollieHelper::convertToCents($amount, $currency);

        $details = Arr::get($charge, 'details', []);

        $transactionUpdateData = array_filter([
            'order_id'            => $order->id,
            'total'               => $amountInCents,
            'currency'            => $currency,
            'status'              => Status::TRANSACTION_AUTHORIZED,
            'payment_method'      => 'mollie',
            'card_last_4'         => Arr::get($details, 'cardNumber', ''),
            'card_brand'          => Arr::get($details, 'cardLabel', ''),
            'payment_method_type' => Arr::get($charge, 'method', ''),
            'vendor_charge_id'    => $vendorChargeId,
            'payment_mode'        => $order->mode,
            'meta'                => $transaction->meta
        ]);

        $transaction->fill($transactionUpdateData);
        $transaction->save();

        fluent_cart_add_log(__('Mollie Payment Authorized', 'fluent-cart-pro'), __('Payment Authorized in Mollie. Transaction ID: ', 'fluent-cart-pro')  . $vendorChargeId, 'info', [
            'module_name' => 'order',
            'module_id'   => $order->id,
        ]);

        $isAuthorizedASuccessState = (new MollieSettingsBase())->get('is_authorize_a_success_state') == 'yes';

        if ($isAuthorizedASuccessState) {
            (new StatusHelper($order))->syncOrderStatuses($transaction);
        } else {
            $relatedCart = Cart::query()->where('order_id', $order->id)
                ->where('stage', '!=', 'completed')
                ->first();

            if ($relatedCart) {
                $relatedCart->stage = 'completed';
                $relatedCart->completed_at = DateTime::now()->format('Y-m-d H:i:s');
                $relatedCart->save();

                do_action('fluent_cart/cart_completed', [
                    'cart'  => $relatedCart,
                    'order' => $order,
                ]);

                $onSuccessActions = Arr::get($relatedCart->checkout_data, '__on_success_actions__', []);

                if ($onSuccessActions) {
                    foreach ($onSuccessActions as $onSuccessAction) {
                        $onSuccessAction = (string)$onSuccessAction;
                        if (has_action($onSuccessAction)) {
                            do_action($onSuccessAction, [
                                'cart'        => $relatedCart,
                                'order'       => $order,
                                'transaction' => $transaction
                            ]);
                        }
                    }
                }
            }
        }
        
        return $order;

    }
}
