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

interface WelcomeVendorEmailProps {
  vendorName: string;
  storeName: string;
  dashboardUrl: string;
}

export const WelcomeVendorEmail = ({
  vendorName = 'Vendor',
  storeName = 'My Store',
  dashboardUrl = 'https://stores.stepperslife.com/dashboard',
}: WelcomeVendorEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to SteppersLife Stores! Let's get your store set up.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>🎉 Welcome to SteppersLife Stores!</Heading>
          </Section>

          {/* Welcome message */}
          <Section style={content}>
            <Text style={greeting}>Hi {vendorName},</Text>
            <Text style={text}>
              Welcome to the SteppersLife Stores marketplace! We're thrilled to have{' '}
              <strong>{storeName}</strong> join our community of Chicago Steppin vendors.
            </Text>
            <Text style={text}>
              You're now part of a vibrant marketplace connecting steppers across the city with
              the best merchandise, apparel, and accessories for the Chicago Steppin scene.
            </Text>
          </Section>

          {/* Getting started section */}
          <Section style={content}>
            <Heading style={h2}>🚀 Getting Started</Heading>
            <Text style={text}>
              Here's what you can do next to set up your store and start selling:
            </Text>
          </Section>

          {/* Step boxes */}
          <Section style={stepContainer}>
            <div style={stepBox}>
              <div style={stepNumber}>1</div>
              <div style={stepContent}>
                <Heading style={stepTitle}>Add Your Products</Heading>
                <Text style={stepText}>
                  Upload photos, set prices, and manage inventory for your items. You can add as
                  many products as you'd like.
                </Text>
              </div>
            </div>

            <div style={stepBox}>
              <div style={stepNumber}>2</div>
              <div style={stepContent}>
                <Heading style={stepTitle}>Configure Shipping</Heading>
                <Text style={stepText}>
                  Set your shipping rates and preferences. Offer local pickup or flat-rate
                  shipping to your customers.
                </Text>
              </div>
            </div>

            <div style={stepBox}>
              <div style={stepNumber}>3</div>
              <div style={stepContent}>
                <Heading style={stepTitle}>Customize Your Store</Heading>
                <Text style={stepText}>
                  Upload your logo, write a compelling description, and make your store stand out
                  from the crowd.
                </Text>
              </div>
            </div>

            <div style={stepBox}>
              <div style={stepNumber}>4</div>
              <div style={stepContent}>
                <Heading style={stepTitle}>Start Selling!</Heading>
                <Text style={stepText}>
                  Once your products are live, customers can browse and purchase. You'll receive
                  email alerts for every new order.
                </Text>
              </div>
            </div>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={dashboardUrl} style={button}>
              Go to Your Dashboard
            </Link>
          </Section>

          {/* Resources section */}
          <Section style={resourcesBox}>
            <Heading style={h3}>📚 Helpful Resources</Heading>
            <ul style={resourcesList}>
              <li style={resourceItem}>
                <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/docs/vendor-guide`} style={link}>
                  Vendor Onboarding Guide
                </Link>{' '}
                - Step-by-step instructions
              </li>
              <li style={resourceItem}>
                <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/docs/shipping`} style={link}>
                  Shipping Best Practices
                </Link>{' '}
                - How to fulfill orders efficiently
              </li>
              <li style={resourceItem}>
                <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/docs/faq`} style={link}>
                  Vendor FAQ
                </Link>{' '}
                - Common questions answered
              </li>
            </ul>
          </Section>

          {/* Stats section */}
          <Section style={statsBox}>
            <Row>
              <Column align="center">
                <Text style={statValue}>7%</Text>
                <Text style={statLabel}>Platform Fee</Text>
              </Column>
              <Column align="center">
                <Text style={statValue}>24/7</Text>
                <Text style={statLabel}>Marketplace Open</Text>
              </Column>
              <Column align="center">
                <Text style={statValue}>∞</Text>
                <Text style={statLabel}>Products Allowed</Text>
              </Column>
            </Row>
          </Section>

          {/* Support section */}
          <Section style={supportBox}>
            <Text style={supportText}>
              <strong>Need help getting started?</strong>
              <br />
              Our support team is here to help! Email us at{' '}
              <Link href="mailto:vendor-support@stepperslife.com" style={link}>
                vendor-support@stepperslife.com
              </Link>{' '}
              and we'll get back to you within 24 hours.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Keep steppin' and happy selling! 💃🕺
            </Text>
            <Text style={footerText}>
              The SteppersLife Stores Team
            </Text>
            <Text style={footerTextSmall}>
              © 2025 SteppersLife Stores. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeVendorEmail;

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

const stepContainer = {
  padding: '24px 20px',
};

const stepBox = {
  display: 'flex',
  marginBottom: '24px',
  alignItems: 'flex-start',
};

const stepNumber = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginRight: '16px',
};

const stepContent = {
  flex: 1,
};

const stepTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const stepText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
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

const resourcesBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px 20px',
  margin: '24px 20px',
};

const resourcesList = {
  margin: '12px 0',
  paddingLeft: '20px',
};

const resourceItem = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '28px',
  marginBottom: '8px',
};

const statsBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '32px 20px',
  margin: '32px 20px',
};

const statValue = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const statLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0',
};

const supportBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '20px',
  margin: '32px 20px',
};

const supportText = {
  color: '#78350f',
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
