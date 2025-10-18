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

interface SubscriptionCancelledEmailProps {
  tenantName: string;
  ownerName: string;
  plan: string;
  cancelDate: string;
  accessUntil: string;
  cancelledImmediately: boolean;
  cancellationReason?: string;
  reactivateUrl: string;
  feedbackUrl?: string;
}

export const SubscriptionCancelledEmail = ({
  tenantName = 'My Store',
  ownerName = 'Store Owner',
  plan = 'STARTER',
  cancelDate = 'January 15, 2025',
  accessUntil = 'January 31, 2025',
  cancelledImmediately = false,
  cancellationReason,
  reactivateUrl = 'https://stores.stepperslife.com/tenant-dashboard/billing',
  feedbackUrl = 'https://stores.stepperslife.com/feedback',
}: SubscriptionCancelledEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your {plan} subscription has been cancelled - We're sorry to see you go</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div style={sadIcon}>😢</div>
            <Heading style={h1}>Subscription Cancelled</Heading>
          </Section>

          {/* Main message */}
          <Section style={content}>
            <Text style={greeting}>Hi {ownerName},</Text>
            <Text style={text}>
              Your <strong>{plan} Plan</strong> subscription for <strong>{tenantName}</strong> has
              been cancelled as of <strong>{cancelDate}</strong>.
            </Text>
            {cancelledImmediately ? (
              <Text style={text}>
                Your subscription was cancelled immediately. Your marketplace is no longer
                accessible to vendors and customers.
              </Text>
            ) : (
              <Text style={text}>
                You'll continue to have full access to all features until{' '}
                <strong>{accessUntil}</strong>, when your current billing period ends.
              </Text>
            )}
          </Section>

          {/* What happens next */}
          <Section style={infoBox}>
            <Heading style={h3}>📋 What Happens Next</Heading>
            {cancelledImmediately ? (
              <>
                <Text style={infoText}>
                  <strong>Immediate Effect:</strong>
                </Text>
                <ul style={list}>
                  <li style={listItem}>Your marketplace subdomain is now suspended</li>
                  <li style={listItem}>Vendors can't access their dashboards</li>
                  <li style={listItem}>Customers can't browse or purchase products</li>
                  <li style={listItem}>All your data is safely preserved</li>
                </ul>
              </>
            ) : (
              <>
                <Text style={infoText}>
                  <strong>Until {accessUntil}:</strong>
                </Text>
                <ul style={list}>
                  <li style={listItem}>Your marketplace remains fully operational</li>
                  <li style={listItem}>Vendors can manage products and fulfill orders</li>
                  <li style={listItem}>Customers can browse and purchase</li>
                </ul>
                <Text style={infoText}>
                  <strong>After {accessUntil}:</strong>
                </Text>
                <ul style={list}>
                  <li style={listItem}>Your marketplace will be suspended</li>
                  <li style={listItem}>All data will be safely preserved for 90 days</li>
                  <li style={listItem}>You can reactivate anytime to restore access</li>
                </ul>
              </>
            )}
          </Section>

          {/* Cancellation reason */}
          {cancellationReason && (
            <Section style={reasonBox}>
              <Heading style={h3}>💭 You mentioned:</Heading>
              <Text style={reasonText}>"{cancellationReason}"</Text>
              <Text style={reasonText}>
                We appreciate your feedback and will use it to improve our service.
              </Text>
            </Section>
          )}

          {/* We'll miss you */}
          <Section style={content}>
            <Heading style={h2}>We're Sorry to See You Go</Heading>
            <Text style={text}>
              We understand that sometimes things change. If there's anything we could have done
              better, we'd love to hear from you.
            </Text>
            {feedbackUrl && (
              <Text style={text}>
                <Link href={feedbackUrl} style={link}>
                  Share your feedback
                </Link>{' '}
                - it only takes 2 minutes and helps us improve.
              </Text>
            )}
          </Section>

          {/* Reactivate CTA */}
          <Section style={reactivateBox}>
            <Heading style={h3}>🔄 Changed Your Mind?</Heading>
            <Text style={reactivateText}>
              You can reactivate your subscription at any time! All your data, settings, and vendor
              stores will be exactly as you left them.
            </Text>
            <div style={buttonSection}>
              <Link href={reactivateUrl} style={button}>
                Reactivate Subscription
              </Link>
            </div>
          </Section>

          {/* Data retention */}
          <Section style={dataBox}>
            <Heading style={h3}>🔒 Your Data is Safe</Heading>
            <Text style={dataText}>
              We'll keep all your data (tenant settings, vendor stores, products, orders, etc.) for{' '}
              <strong>90 days</strong> after your subscription ends. During this time, you can
              reactivate and pick up right where you left off.
            </Text>
            <Text style={dataText}>
              After 90 days, if you haven't reactivated, we'll permanently delete your data per our
              privacy policy.
            </Text>
          </Section>

          {/* Support */}
          <Section style={supportBox}>
            <Text style={supportText}>
              <strong>Questions or need help?</strong>
              <br />
              Our team is still here for you. Email us at{' '}
              <Link href="mailto:support@stepperslife.com" style={supportLink}>
                support@stepperslife.com
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Thank you for being part of the SteppersLife Stores community!
            </Text>
            <Text style={footerText}>We hope to see you again soon.</Text>
            <Text style={footerText}>The SteppersLife Stores Team 💃🕺</Text>
            <Text style={footerTextSmall}>
              © 2025 SteppersLife Stores. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SubscriptionCancelledEmail;

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
  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
  textAlign: 'center' as const,
};

const sadIcon = {
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

const infoBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px 20px',
  margin: '24px 20px',
};

const infoText = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  margin: '8px 0',
};

const reasonBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '24px 20px',
  margin: '24px 20px',
};

const reasonText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
  fontStyle: 'italic' as const,
};

const reactivateBox = {
  backgroundColor: '#eff6ff',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '24px 20px',
  margin: '24px 20px',
  textAlign: 'center' as const,
};

const reactivateText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const buttonSection = {
  marginTop: '20px',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
};

const dataBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #10b981',
  borderRadius: '8px',
  padding: '24px 20px',
  margin: '24px 20px',
};

const dataText = {
  color: '#065f46',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const list = {
  margin: '12px 0',
  paddingLeft: '20px',
};

const listItem = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  marginBottom: '8px',
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

const supportLink = {
  color: '#10b981',
  textDecoration: 'underline',
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
