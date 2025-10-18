import { Resend } from 'resend';
import { render } from '@react-email/render';
import OrderConfirmationEmail from '@/emails/OrderConfirmation';
import ShippingNotificationEmail from '@/emails/ShippingNotification';
import VendorNewOrderAlertEmail from '@/emails/VendorNewOrderAlert';
import WelcomeVendorEmail from '@/emails/WelcomeVendor';
import ReviewRequestEmail from '@/emails/ReviewRequest';
import SubscriptionActivatedEmail from '@/emails/SubscriptionActivated';
import PaymentFailedEmail from '@/emails/PaymentFailed';
import TrialEndingEmail from '@/emails/TrialEnding';
import SubscriptionCancelledEmail from '@/emails/SubscriptionCancelled';
import QuotaWarningEmail from '@/emails/QuotaWarning';
import OrderPaymentFailedEmail from '@/emails/OrderPaymentFailed';
import OrderRefundConfirmationEmail from '@/emails/OrderRefundConfirmation';
import LowStockAlertEmail from '@/emails/LowStockAlert';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'SteppersLife Stores <noreply@stepperslife.com>';

export interface OrderConfirmationData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  estimatedDelivery?: string;
}

export interface ShippingNotificationData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  shippedDate: string;
  estimatedDelivery: string;
  items: Array<{
    name: string;
    quantity: number;
    imageUrl?: string;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

export interface VendorNewOrderData {
  vendorName: string;
  vendorEmail: string;
  storeName: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  orderDetailsUrl: string;
}

export interface WelcomeVendorData {
  vendorName: string;
  vendorEmail: string;
  storeName: string;
  dashboardUrl: string;
}

export interface ReviewRequestData {
  customerName: string;
  customerEmail: string;
  productName: string;
  productImageUrl?: string;
  orderNumber: string;
  storeName: string;
  reviewUrl: string;
}

export interface OrderPaymentFailedData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  amount: number;
  failureReason?: string;
  retryPaymentUrl: string;
}

export interface OrderRefundConfirmationData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  refundAmount: number;
  refundReason?: string;
  refundDate: string;
  originalAmount: number;
  isPartialRefund: boolean;
}

export interface LowStockAlertData {
  vendorName: string;
  vendorEmail: string;
  storeName: string;
  products: Array<{
    id: string;
    name: string;
    sku?: string;
    currentStock: number;
    lowStockThreshold: number;
    imageUrl?: string;
    hasVariants: boolean;
    variants?: Array<{
      id: string;
      name: string;
      value: string;
      currentStock: number;
    }>;
  }>;
  dashboardUrl: string;
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmation(data: OrderConfirmationData) {
  try {
    const emailHtml = render(
      OrderConfirmationEmail({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        orderDate: data.orderDate,
        items: data.items,
        subtotal: data.subtotal,
        shippingCost: data.shippingCost,
        tax: data.tax,
        total: data.total,
        shippingAddress: data.shippingAddress,
        estimatedDelivery: data.estimatedDelivery,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: emailHtml,
    });

    console.log(`Order confirmation email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw error;
  }
}

/**
 * Send shipping notification email to customer
 */
export async function sendShippingNotification(data: ShippingNotificationData) {
  try {
    const emailHtml = render(
      ShippingNotificationEmail({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        shippedDate: data.shippedDate,
        estimatedDelivery: data.estimatedDelivery,
        items: data.items,
        shippingAddress: data.shippingAddress,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Your order ${data.orderNumber} has shipped!`,
      html: emailHtml,
    });

    console.log(`Shipping notification email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send shipping notification email:', error);
    throw error;
  }
}

/**
 * Send new order alert email to vendor
 */
export async function sendVendorNewOrderAlert(data: VendorNewOrderData) {
  try {
    const emailHtml = render(
      VendorNewOrderAlertEmail({
        vendorName: data.vendorName,
        storeName: data.storeName,
        orderNumber: data.orderNumber,
        orderDate: data.orderDate,
        customerName: data.customerName,
        items: data.items,
        total: data.total,
        shippingAddress: data.shippingAddress,
        orderDetailsUrl: data.orderDetailsUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.vendorEmail,
      subject: `New Order Received - ${data.orderNumber}`,
      html: emailHtml,
    });

    console.log(`Vendor new order alert sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send vendor new order alert:', error);
    throw error;
  }
}

/**
 * Send welcome email to new vendor
 */
export async function sendWelcomeVendor(data: WelcomeVendorData) {
  try {
    const emailHtml = render(
      WelcomeVendorEmail({
        vendorName: data.vendorName,
        storeName: data.storeName,
        dashboardUrl: data.dashboardUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.vendorEmail,
      subject: `Welcome to SteppersLife Stores! 🎉`,
      html: emailHtml,
    });

    console.log(`Welcome vendor email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send welcome vendor email:', error);
    throw error;
  }
}

/**
 * Send review request email to customer
 */
export async function sendReviewRequest(data: ReviewRequestData) {
  try {
    const emailHtml = render(
      ReviewRequestEmail({
        customerName: data.customerName,
        productName: data.productName,
        productImageUrl: data.productImageUrl,
        orderNumber: data.orderNumber,
        storeName: data.storeName,
        reviewUrl: data.reviewUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `How was your purchase of ${data.productName}?`,
      html: emailHtml,
    });

    console.log(`Review request email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send review request email:', error);
    throw error;
  }
}

/**
 * Send order payment failed email to customer
 */
export async function sendOrderPaymentFailed(data: OrderPaymentFailedData) {
  try {
    const emailHtml = render(
      OrderPaymentFailedEmail({
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        orderNumber: data.orderNumber,
        amount: data.amount,
        failureReason: data.failureReason,
        retryPaymentUrl: data.retryPaymentUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Payment Failed for Order ${data.orderNumber}`,
      html: emailHtml,
    });

    console.log(`Order payment failed email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send order payment failed email:', error);
    throw error;
  }
}

/**
 * Send order refund confirmation email to customer
 */
export async function sendOrderRefundConfirmation(data: OrderRefundConfirmationData) {
  try {
    const emailHtml = render(
      OrderRefundConfirmationEmail({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        refundAmount: data.refundAmount,
        refundReason: data.refundReason,
        refundDate: data.refundDate,
        originalAmount: data.originalAmount,
        isPartialRefund: data.isPartialRefund,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Refund Confirmation for Order ${data.orderNumber}`,
      html: emailHtml,
    });

    console.log(`Order refund confirmation email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send order refund confirmation email:', error);
    throw error;
  }
}

export interface SubscriptionActivatedData {
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  price: number;
  billingDate: string;
  maxProducts: number;
  maxOrders: number;
  maxStorage: string;
  dashboardUrl: string;
}

export interface PaymentFailedData {
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  amount: number;
  failureReason?: string;
  retryDate?: string;
  updatePaymentUrl: string;
}

export interface TrialEndingData {
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  trialEndDate: string;
  daysRemaining: number;
  choosePlanUrl: string;
}

export interface SubscriptionCancelledData {
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  cancelDate: string;
  accessUntil: string;
  cancelledImmediately: boolean;
  cancellationReason?: string;
  reactivateUrl: string;
  feedbackUrl?: string;
}

export interface QuotaWarningData {
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  quotaType: 'products' | 'orders' | 'storage';
  currentUsage: number;
  limit: number;
  percentage: number;
  upgradeUrl: string;
}

/**
 * Send subscription activated email to tenant owner
 */
export async function sendSubscriptionActivated(data: SubscriptionActivatedData) {
  try {
    const emailHtml = render(
      SubscriptionActivatedEmail({
        tenantName: data.tenantName,
        ownerName: data.ownerName,
        plan: data.plan,
        price: data.price,
        billingDate: data.billingDate,
        maxProducts: data.maxProducts,
        maxOrders: data.maxOrders,
        maxStorage: data.maxStorage,
        dashboardUrl: data.dashboardUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.ownerEmail,
      subject: `Your ${data.plan} subscription is now active!`,
      html: emailHtml,
    });

    console.log(`Subscription activated email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send subscription activated email:', error);
    throw error;
  }
}

/**
 * Send payment failed email to tenant owner
 */
export async function sendPaymentFailed(data: PaymentFailedData) {
  try {
    const emailHtml = render(
      PaymentFailedEmail({
        tenantName: data.tenantName,
        ownerName: data.ownerName,
        plan: data.plan,
        amount: data.amount,
        failureReason: data.failureReason,
        retryDate: data.retryDate,
        updatePaymentUrl: data.updatePaymentUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.ownerEmail,
      subject: `⚠️ Payment Failed - Action Required for ${data.tenantName}`,
      html: emailHtml,
    });

    console.log(`Payment failed email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
    throw error;
  }
}

/**
 * Send trial ending email to tenant owner
 */
export async function sendTrialEnding(data: TrialEndingData) {
  try {
    const emailHtml = render(
      TrialEndingEmail({
        tenantName: data.tenantName,
        ownerName: data.ownerName,
        trialEndDate: data.trialEndDate,
        daysRemaining: data.daysRemaining,
        choosePlanUrl: data.choosePlanUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.ownerEmail,
      subject: `Your trial ends in ${data.daysRemaining} days - Choose your plan`,
      html: emailHtml,
    });

    console.log(`Trial ending email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send trial ending email:', error);
    throw error;
  }
}

/**
 * Send subscription cancelled email to tenant owner
 */
export async function sendSubscriptionCancelled(data: SubscriptionCancelledData) {
  try {
    const emailHtml = render(
      SubscriptionCancelledEmail({
        tenantName: data.tenantName,
        ownerName: data.ownerName,
        plan: data.plan,
        cancelDate: data.cancelDate,
        accessUntil: data.accessUntil,
        cancelledImmediately: data.cancelledImmediately,
        cancellationReason: data.cancellationReason,
        reactivateUrl: data.reactivateUrl,
        feedbackUrl: data.feedbackUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.ownerEmail,
      subject: `Subscription Cancelled - ${data.tenantName}`,
      html: emailHtml,
    });

    console.log(`Subscription cancelled email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send subscription cancelled email:', error);
    throw error;
  }
}

/**
 * Send quota warning email to tenant owner
 */
export async function sendQuotaWarning(data: QuotaWarningData) {
  try {
    const emailHtml = render(
      QuotaWarningEmail({
        tenantName: data.tenantName,
        ownerName: data.ownerName,
        plan: data.plan,
        quotaType: data.quotaType,
        currentUsage: data.currentUsage,
        limit: data.limit,
        percentage: data.percentage,
        upgradeUrl: data.upgradeUrl,
      })
    );

    const quotaTypeLabels = {
      products: 'Products',
      orders: 'Orders',
      storage: 'Storage',
    };

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.ownerEmail,
      subject: `⚠️ ${quotaTypeLabels[data.quotaType]} Quota Warning - ${data.percentage}% Used`,
      html: emailHtml,
    });

    console.log(`Quota warning email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send quota warning email:', error);
    throw error;
  }
}

/**
 * Send low stock alert email to vendor
 */
export async function sendLowStockAlert(data: LowStockAlertData) {
  try {
    const emailHtml = render(
      LowStockAlertEmail({
        vendorName: data.vendorName,
        storeName: data.storeName,
        products: data.products,
        dashboardUrl: data.dashboardUrl,
      })
    );

    const totalItems = data.products.reduce((sum, product) => {
      if (product.hasVariants && product.variants) {
        return sum + product.variants.length;
      }
      return sum + 1;
    }, 0);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.vendorEmail,
      subject: `⚠️ Low Stock Alert - ${totalItems} item(s) need restocking`,
      html: emailHtml,
    });

    console.log(`Low stock alert email sent: ${result.data?.id}`);
    return result;
  } catch (error) {
    console.error('Failed to send low stock alert email:', error);
    throw error;
  }
}

/**
 * Email service object with all email sending functions
 */
export const emailService = {
  sendOrderConfirmation,
  sendShippingNotification,
  sendVendorNewOrderAlert,
  sendWelcomeVendor,
  sendReviewRequest,
  sendOrderPaymentFailed,
  sendOrderRefundConfirmation,
  sendSubscriptionActivated,
  sendPaymentFailed,
  sendTrialEnding,
  sendSubscriptionCancelled,
  sendQuotaWarning,
  sendLowStockAlert,
};
