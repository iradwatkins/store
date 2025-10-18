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

interface OrderRefundConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  refundAmount: number;
  refundReason?: string;
  refundDate: string;
  originalAmount: number;
  isPartialRefund: boolean;
}

export const OrderRefundConfirmationEmail = ({
  customerName = 'Customer',
  orderNumber = 'SL-ORD-12345',
  refundAmount = 42.13,
  refundReason,
  refundDate = 'January 10, 2025',
  originalAmount = 42.13,
  isPartialRefund = false,
}: OrderRefundConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Refund Confirmation for Order {orderNumber}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>SteppersLife Stores</Heading>
            <Text style={tagline}>Chicago Steppin Marketplace</Text>
          </Section>

          {/* Success message */}
          <Section style={successBox}>
            <Text style={successText}>
              ✓ {isPartialRefund ? 'Partial Refund' : 'Refund'} Processed
            </Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Heading style={h2}>
              Your {isPartialRefund ? 'Partial ' : ''}Refund Has Been Processed
            </Heading>
            <Text style={text}>
              Hi {customerName},
            </Text>
            <Text style={text}>
              We've processed a{isPartialRefund ? ' partial' : ''} refund for your order{' '}
              <strong>{orderNumber}</strong>.
            </Text>
          </Section>

          {/* Refund details box */}
          <Section style={detailsBox}>
            <Row style={detailRow}>
              <Column>
                <Text style={detailLabel}>Order Number</Text>
                <Text style={detailValue}>{orderNumber}</Text>
              </Column>
              <Column align="right">
                <Text style={detailLabel}>Refund Date</Text>
                <Text style={detailValue}>{refundDate}</Text>
              </Column>
            </Row>
            <Row style={detailRow}>
              <Column>
                <Text style={detailLabel}>Original Amount</Text>
                <Text style={detailValue}>${originalAmount.toFixed(2)}</Text>
              </Column>
              <Column align="right">
                <Text style={detailLabel}>Refund Amount</Text>
                <Text style={detailValueHighlight}>${refundAmount.toFixed(2)}</Text>
              </Column>
            </Row>
            {refundReason && (
              <Row style={detailRow}>
                <Column>
                  <Text style={detailLabel}>Reason</Text>
                  <Text style={detailValue}>{refundReason}</Text>
                </Column>
              </Row>
            )}
          </Section>

          {/* What to expect */}
          <Section style={content}>
            <Heading style={h3}>What to expect</Heading>
            <Text style={text}>
              The refund of <strong>${refundAmount.toFixed(2)}</strong> has been issued to your
              original payment method.
            </Text>
            <Text style={text}>
              Depending on your bank or card issuer, it may take 5-10 business days for the refund
              to appear in your account.
            </Text>
            {isPartialRefund && (
              <Text style={text}>
                This is a partial refund. If you have questions about the remaining amount, please
                contact support.
              </Text>
            )}
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/account/orders`} style={button}>
              View Order History
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions about your refund? Contact us at{' '}
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

export default OrderRefundConfirmationEmail;

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

const successBox = {
  backgroundColor: '#f0fdf4',
  borderLeft: '4px solid #10b981',
  padding: '16px 20px',
  margin: '24px 20px',
};

const successText = {
  color: '#065f46',
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

const detailsBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 20px',
};

const detailRow = {
  marginBottom: '16px',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px 0',
};

const detailValue = {
  color: '#1f2937',
  fontSize: '14px',
  margin: '0',
};

const detailValueHighlight = {
  color: '#10b981',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const buttonSection = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#10b981',
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
