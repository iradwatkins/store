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

interface TrialEndingEmailProps {
  tenantName: string;
  ownerName: string;
  trialEndDate: string;
  daysRemaining: number;
  choosePlanUrl: string;
}

export const TrialEndingEmail = ({
  tenantName = 'My Store',
  ownerName = 'Store Owner',
  trialEndDate = 'January 15, 2025',
  daysRemaining = 3,
  choosePlanUrl = 'https://stores.stepperslife.com/tenant-dashboard/billing',
}: TrialEndingEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Your trial ends in {daysRemaining} days - Choose your plan to continue
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div style={clockIcon}>⏰</div>
            <Heading style={h1}>Your Trial is Ending Soon</Heading>
          </Section>

          {/* Countdown Badge */}
          <Section style={countdownSection}>
            <div style={countdownBadge}>
              <Text style={countdownNumber}>{daysRemaining}</Text>
              <Text style={countdownLabel}>
                day{daysRemaining !== 1 ? 's' : ''} remaining
              </Text>
            </div>
          </Section>

          {/* Main message */}
          <Section style={content}>
            <Text style={greeting}>Hi {ownerName},</Text>
            <Text style={text}>
              We hope you've been enjoying your trial of <strong>{tenantName}</strong> on
              SteppersLife Stores!
            </Text>
            <Text style={text}>
              Your trial ends on <strong>{trialEndDate}</strong>. To continue using your
              marketplace without interruption, please choose a subscription plan before your trial
              expires.
            </Text>
          </Section>

          {/* What happens */}
          <Section style={warningBox}>
            <Heading style={h3}>⚠️ What Happens After Trial?</Heading>
            <Text style={warningText}>
              If you don't subscribe by {trialEndDate}, your marketplace will be{' '}
              <strong>temporarily suspended</strong>:
            </Text>
            <ul style={list}>
              <li style={warningListItem}>Vendors won't be able to access their dashboards</li>
              <li style={warningListItem}>Customers won't be able to browse or purchase</li>
              <li style={warningListItem}>Your subdomain will display a suspended notice</li>
            </ul>
            <Text style={warningText}>
              Don't worry - your data will be safe and you can reactivate anytime!
            </Text>
          </Section>

          {/* Plans Preview */}
          <Section style={content}>
            <Heading style={h2}>Choose Your Plan</Heading>
            <Text style={text}>
              We offer flexible plans to fit your marketplace needs:
            </Text>
          </Section>

          <Section style={plansSection}>
            <Row>
              <Column style={planColumn}>
                <div style={planBox}>
                  <Text style={planName}>Starter</Text>
                  <Text style={planPrice}>$29/mo</Text>
                  <ul style={planFeatures}>
                    <li style={planFeature}>50 products</li>
                    <li style={planFeature}>100 orders/mo</li>
                    <li style={planFeature}>1GB storage</li>
                  </ul>
                </div>
              </Column>
              <Column style={planColumn}>
                <div style={{ ...planBox, ...recommendedPlan }}>
                  <div style={recommendedBadge}>POPULAR</div>
                  <Text style={planName}>Pro</Text>
                  <Text style={planPrice}>$79/mo</Text>
                  <ul style={planFeatures}>
                    <li style={planFeature}>500 products</li>
                    <li style={planFeature}>1,000 orders/mo</li>
                    <li style={planFeature}>10GB storage</li>
                  </ul>
                </div>
              </Column>
              <Column style={planColumn}>
                <div style={planBox}>
                  <Text style={planName}>Enterprise</Text>
                  <Text style={planPrice}>$299/mo</Text>
                  <ul style={planFeatures}>
                    <li style={planFeature}>Unlimited</li>
                    <li style={planFeature}>Unlimited</li>
                    <li style={planFeature}>100GB storage</li>
                  </ul>
                </div>
              </Column>
            </Row>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={choosePlanUrl} style={button}>
              Choose Your Plan Now
            </Link>
          </Section>

          {/* Benefits reminder */}
          <Section style={benefitsBox}>
            <Heading style={h3}>✨ Keep Enjoying These Benefits</Heading>
            <ul style={list}>
              <li style={listItem}>
                <strong>Multi-vendor marketplace:</strong> Support unlimited vendor stores
              </li>
              <li style={listItem}>
                <strong>Complete branding control:</strong> Custom subdomain, colors, and logo
              </li>
              <li style={listItem}>
                <strong>Payment processing:</strong> Integrated Stripe payments with automatic
                payouts
              </li>
              <li style={listItem}>
                <strong>Order management:</strong> Built-in fulfillment and tracking
              </li>
              <li style={listItem}>
                <strong>Priority support:</strong> Our team is here to help you succeed
              </li>
            </ul>
          </Section>

          {/* Support */}
          <Section style={supportBox}>
            <Text style={supportText}>
              <strong>Have questions about plans?</strong>
              <br />
              We're here to help you choose the right plan. Email us at{' '}
              <Link href="mailto:support@stepperslife.com" style={link}>
                support@stepperslife.com
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Thank you for trying SteppersLife Stores! We hope to continue serving you.
            </Text>
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

export default TrialEndingEmail;

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
  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  textAlign: 'center' as const,
};

const clockIcon = {
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

const countdownSection = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const countdownBadge = {
  display: 'inline-block',
  backgroundColor: '#fef3c7',
  border: '3px solid #f59e0b',
  borderRadius: '16px',
  padding: '24px 48px',
};

const countdownNumber = {
  color: '#92400e',
  fontSize: '48px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1',
};

const countdownLabel = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '8px 0 0 0',
};

const content = {
  padding: '0 20px',
};

const greeting = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '16px 0',
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

const warningBox = {
  backgroundColor: '#fef2f2',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '24px 20px',
  margin: '24px 20px',
};

const warningText = {
  color: '#7c2d12',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const warningListItem = {
  color: '#7c2d12',
  fontSize: '14px',
  lineHeight: '22px',
  marginBottom: '8px',
};

const plansSection = {
  padding: '24px 10px',
};

const planColumn = {
  padding: '0 10px',
  verticalAlign: 'top' as const,
};

const planBox = {
  backgroundColor: '#f9fafb',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  position: 'relative' as const,
};

const recommendedPlan = {
  backgroundColor: '#eff6ff',
  border: '2px solid #3b82f6',
};

const recommendedBadge = {
  position: 'absolute' as const,
  top: '-12px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: 'bold',
  padding: '4px 12px',
  borderRadius: '12px',
};

const planName = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '8px 0',
};

const planPrice = {
  color: '#059669',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '8px 0 16px',
};

const planFeatures = {
  listStyle: 'none',
  padding: '0',
  margin: '0',
};

const planFeature = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  marginBottom: '4px',
};

const buttonSection = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
};

const benefitsBox = {
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
  color: '#f59e0b',
  textDecoration: 'underline',
};
