import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface OrderPaymentFailedEmailProps {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  amount: number;
  failureReason?: string;
  retryPaymentUrl: string;
}

export const OrderPaymentFailedEmail = ({
  customerName = 'Customer',
  orderNumber = 'SL-ORD-12345',
  amount = 42.13,
  failureReason = 'Your card was declined',
  retryPaymentUrl = 'https://stores.stepperslife.com',
}: OrderPaymentFailedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Payment Failed for Order {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>SteppersLife Stores</Heading>
            <Text style={tagline}>Chicago Steppin Marketplace</Text>
          </Section>

          {/* Alert message */}
          <Section style={alertBox}>
            <Text style={alertText}>⚠️ Payment Failed</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Heading style={h2}>Payment Issue with Your Order</Heading>
            <Text style={text}>
              Hi {customerName},
            </Text>
            <Text style={text}>
              We attempted to process your payment for order <strong>{orderNumber}</strong> but
              encountered an issue.
            </Text>
            {failureReason && (
              <Text style={text}>
                <strong>Reason:</strong> {failureReason}
              </Text>
            )}
            <Text style={text}>
              <strong>Amount:</strong> ${amount.toFixed(2)}
            </Text>
          </Section>

          {/* What to do next */}
          <Section style={content}>
            <Heading style={h3}>What to do next</Heading>
            <Text style={text}>
              To complete your order, please update your payment method and try again. Here are
              some common solutions:
            </Text>
            <Text style={listItem}>• Check that your card details are correct</Text>
            <Text style={listItem}>• Ensure you have sufficient funds</Text>
            <Text style={listItem}>• Contact your bank if the issue persists</Text>
            <Text style={listItem}>• Try a different payment method</Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={retryPaymentUrl} style={button}>
              Retry Payment
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Need help? Contact us at{' '}
              <Link href="mailto:support@stepperslife.com" style={link}>
                support@stepperslife.com
              </Link>
            </Text>
            <Text style={footerText}>
              © 2025 SteppersLife Stores. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderPaymentFailedEmail;

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
  padding: '32px 20px',
  backgroundColor: '#10b981',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const tagline = {
  color: '#ffffff',
  fontSize: '14px',
  margin: '8px 0 0 0',
  padding: '0',
};

const alertBox = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #ef4444',
  padding: '16px 20px',
  margin: '24px 20px',
};

const alertText = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  padding: '0 20px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
};

const h3 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
};

const text = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
};

const listItem = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
  paddingLeft: '8px',
};

const buttonSection = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#ef4444',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  padding: '32px 20px',
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '8px 0',
};

const link = {
  color: '#10b981',
  textDecoration: 'underline',
};
