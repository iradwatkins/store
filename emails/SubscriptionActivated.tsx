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

interface SubscriptionActivatedEmailProps {
  tenantName: string;
  ownerName: string;
  plan: string;
  price: number;
  billingDate: string;
  maxProducts: number;
  maxOrders: number;
  maxStorage: string;
  dashboardUrl: string;
}

export const SubscriptionActivatedEmail = ({
  tenantName = 'My Store',
  ownerName = 'Store Owner',
  plan = 'STARTER',
  price = 29,
  billingDate = 'January 1, 2025',
  maxProducts = 50,
  maxOrders = 100,
  maxStorage = '1GB',
  dashboardUrl = 'https://stores.stepperslife.com/tenant-dashboard',
}: SubscriptionActivatedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your {plan} subscription is now active! Welcome to SteppersLife Stores.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>🎉 Subscription Activated!</Heading>
          </Section>

          {/* Welcome message */}
          <Section style={content}>
            <Text style={greeting}>Hi {ownerName},</Text>
            <Text style={text}>
              Great news! Your <strong>{plan} Plan</strong> subscription for{' '}
              <strong>{tenantName}</strong> is now active and ready to go.
            </Text>
            <Text style={text}>
              Your trial has ended and you're now on a paid plan. Thank you for choosing
              SteppersLife Stores to power your marketplace!
            </Text>
          </Section>

          {/* Subscription Details */}
          <Section style={detailsBox}>
            <Heading style={h3}>📋 Subscription Details</Heading>
            <div style={detailRow}>
              <Text style={detailLabel}>Plan:</Text>
              <Text style={detailValue}>{plan}</Text>
            </div>
            <div style={detailRow}>
              <Text style={detailLabel}>Monthly Cost:</Text>
              <Text style={detailValue}>${price.toFixed(2)}</Text>
            </div>
            <div style={detailRow}>
              <Text style={detailLabel}>Next Billing Date:</Text>
              <Text style={detailValue}>{billingDate}</Text>
            </div>
          </Section>

          {/* Plan Features */}
          <Section style={featuresBox}>
            <Heading style={h3}>✨ Your Plan Includes</Heading>
            <Row style={featureRow}>
              <Column style={featureColumn}>
                <div style={featureIcon}>📦</div>
                <Text style={featureValue}>{maxProducts}</Text>
                <Text style={featureLabel}>Products</Text>
              </Column>
              <Column style={featureColumn}>
                <div style={featureIcon}>🛍️</div>
                <Text style={featureValue}>{maxOrders}</Text>
                <Text style={featureLabel}>Orders/Month</Text>
              </Column>
              <Column style={featureColumn}>
                <div style={featureIcon}>💾</div>
                <Text style={featureValue}>{maxStorage}</Text>
                <Text style={featureLabel}>Storage</Text>
              </Column>
            </Row>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={dashboardUrl} style={button}>
              Go to Dashboard
            </Link>
          </Section>

          {/* What's Next */}
          <Section style={content}>
            <Heading style={h2}>What's Next?</Heading>
            <ul style={list}>
              <li style={listItem}>
                Continue building out your marketplace with vendor stores
              </li>
              <li style={listItem}>
                Monitor your usage in the dashboard to stay within your quota
              </li>
              <li style={listItem}>
                Upgrade anytime if you need more resources
              </li>
            </ul>
          </Section>

          {/* Billing Info */}
          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Billing Information:</strong>
              <br />
              You'll be charged ${price.toFixed(2)} on the 1st of each month. You can update your
              payment method or view invoices anytime in your{' '}
              <Link href={`${dashboardUrl}/billing`} style={link}>
                Billing Dashboard
              </Link>
              .
            </Text>
          </Section>

          {/* Support */}
          <Section style={supportBox}>
            <Text style={supportText}>
              <strong>Questions or need help?</strong>
              <br />
              Contact our support team at{' '}
              <Link href="mailto:support@stepperslife.com" style={link}>
                support@stepperslife.com
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Thank you for your business!</Text>
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

export default SubscriptionActivatedEmail;

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
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
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

const featuresBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '32px 20px',
  margin: '24px 20px',
};

const featureRow = {
  marginTop: '24px',
};

const featureColumn = {
  textAlign: 'center' as const,
  padding: '0 10px',
};

const featureIcon = {
  fontSize: '32px',
  marginBottom: '8px',
};

const featureValue = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '8px 0 4px 0',
};

const featureLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0',
};

const buttonSection = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
};

const list = {
  margin: '16px 0',
  paddingLeft: '20px',
};

const listItem = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '8px',
};

const infoBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 20px',
};

const infoText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
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
  color: '#10b981',
  textDecoration: 'underline',
};
