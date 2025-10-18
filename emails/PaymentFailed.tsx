import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PaymentFailedEmailProps {
  tenantName: string;
  ownerName: string;
  plan: string;
  amount: number;
  failureReason?: string;
  retryDate?: string;
  updatePaymentUrl: string;
}

export const PaymentFailedEmail = ({
  tenantName = 'My Store',
  ownerName = 'Store Owner',
  plan = 'STARTER',
  amount = 29,
  failureReason = 'Your card was declined',
  retryDate = 'in 3 days',
  updatePaymentUrl = 'https://stores.stepperslife.com/tenant-dashboard/billing',
}: PaymentFailedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Payment failed for your {plan} subscription - Action required</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div style={alertIcon}>⚠️</div>
            <Heading style={h1}>Payment Failed</Heading>
          </Section>

          {/* Alert message */}
          <Section style={alertBox}>
            <Text style={alertText}>
              <strong>Action Required:</strong> We couldn't process your payment for{' '}
              <strong>{tenantName}</strong>
            </Text>
          </Section>

          {/* Main message */}
          <Section style={content}>
            <Text style={greeting}>Hi {ownerName},</Text>
            <Text style={text}>
              We tried to charge your payment method for your <strong>{plan} Plan</strong>{' '}
              subscription (${amount.toFixed(2)}), but the payment failed.
            </Text>
            {failureReason && (
              <Text style={text}>
                <strong>Reason:</strong> {failureReason}
              </Text>
            )}
          </Section>

          {/* Payment Details */}
          <Section style={detailsBox}>
            <Heading style={h3}>💳 Payment Details</Heading>
            <div style={detailRow}>
              <Text style={detailLabel}>Subscription:</Text>
              <Text style={detailValue}>{plan} Plan</Text>
            </div>
            <div style={detailRow}>
              <Text style={detailLabel}>Amount:</Text>
              <Text style={detailValue}>${amount.toFixed(2)}</Text>
            </div>
            <div style={detailRow}>
              <Text style={detailLabel}>Retry Date:</Text>
              <Text style={detailValue}>{retryDate}</Text>
            </div>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={updatePaymentUrl} style={button}>
              Update Payment Method
            </Link>
          </Section>

          {/* What happens next */}
          <Section style={content}>
            <Heading style={h2}>What Happens Next?</Heading>
            <Text style={text}>
              <strong>We'll automatically retry</strong> your payment {retryDate}. However, to avoid
              any service interruption, we recommend updating your payment method now.
            </Text>
            <Text style={text}>
              If payment continues to fail, your subscription may be suspended and your marketplace
              will be temporarily unavailable to vendors and customers.
            </Text>
          </Section>

          {/* Common reasons */}
          <Section style={tipsBox}>
            <Heading style={h3}>💡 Common Payment Issues</Heading>
            <ul style={list}>
              <li style={listItem}>
                <strong>Insufficient funds:</strong> Make sure your account has enough balance
              </li>
              <li style={listItem}>
                <strong>Expired card:</strong> Check if your card has expired and needs updating
              </li>
              <li style={listItem}>
                <strong>Billing address mismatch:</strong> Verify your billing address is correct
              </li>
              <li style={listItem}>
                <strong>Bank security:</strong> Your bank may have flagged the transaction - contact
                them to authorize
              </li>
            </ul>
          </Section>

          {/* Support */}
          <Section style={supportBox}>
            <Text style={supportText}>
              <strong>Need help resolving this?</strong>
              <br />
              Our billing team is here to help! Email us at{' '}
              <Link href="mailto:billing@stepperslife.com" style={link}>
                billing@stepperslife.com
              </Link>{' '}
              and we'll assist you right away.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>The SteppersLife Stores Team</Text>
            <Text style={footerTextSmall}>
              © 2025 SteppersLife Stores. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentFailedEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '48px 20px',
  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  textAlign: 'center' as const,
};

const alertIcon = {
  fontSize: '48px',
  marginBottom: '8px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const alertBox = {
  backgroundColor: '#fef2f2',
  border: '2px solid #ef4444',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 20px',
};

const alertText = {
  color: '#991b1b',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 20px',
};

const greeting = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '32px 0 16px',
};

const text = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '16px 0',
};

const h2 = {
  color: '#1f2937',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
};

const h3 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const detailsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px 20px',
  margin: '24px 20px',
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const detailValue = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const buttonSection = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#ef4444',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
};

const tipsBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '24px 20px',
  margin: '24px 20px',
};

const list = {
  margin: '16px 0',
  paddingLeft: '20px',
};

const listItem = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '12px',
};

const supportBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 20px',
};

const supportText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  textAlign: 'center' as const,
};

const footer = {
  padding: '32px 20px',
  borderTop: '1px solid #e5e7eb',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const footerTextSmall = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '16px 0 0 0',
};

const link = {
  color: '#ef4444',
  textDecoration: 'underline',
};
