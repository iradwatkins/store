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

interface QuotaWarningEmailProps {
  tenantName: string;
  ownerName: string;
  plan: string;
  quotaType: 'products' | 'orders' | 'storage';
  currentUsage: number;
  limit: number;
  percentage: number;
  upgradeUrl: string;
}

export const QuotaWarningEmail = ({
  tenantName = 'My Store',
  ownerName = 'Store Owner',
  plan = 'STARTER',
  quotaType = 'products',
  currentUsage = 45,
  limit = 50,
  percentage = 90,
  upgradeUrl = 'https://stores.stepperslife.com/tenant-dashboard/billing',
}: QuotaWarningEmailProps) => {
  const quotaTypeLabels = {
    products: 'Products',
    orders: 'Monthly Orders',
    storage: 'Storage',
  };

  const quotaTypeEmoji = {
    products: '📦',
    orders: '🛍️',
    storage: '💾',
  };

  const warningLevel = percentage >= 90 ? 'critical' : 'warning';
  const warningColor = warningLevel === 'critical' ? '#ef4444' : '#f59e0b';

  const formatUsage = (type: string, value: number, limit: number) => {
    if (type === 'storage') {
      return `${value.toFixed(2)}GB / ${limit}GB`;
    }
    return `${value} / ${limit}`;
  };

  return (
    <Html>
      <Head />
      <Preview>
        Approaching {quotaTypeLabels[quotaType]} limit - {percentage}% used
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ ...header, background: `linear-gradient(135deg, ${warningColor} 0%, ${warningLevel === 'critical' ? '#dc2626' : '#d97706'} 100%)` }}>
            <div style={warningIcon}>
              {warningLevel === 'critical' ? '🚨' : '⚠️'}
            </div>
            <Heading style={h1}>
              {warningLevel === 'critical' ? 'Critical: ' : ''}Quota Warning
            </Heading>
          </Section>

          {/* Alert Badge */}
          <Section style={alertSection}>
            <div style={alertBadge}>
              <Text style={alertPercentage}>{percentage}%</Text>
              <Text style={alertLabel}>
                {quotaTypeLabels[quotaType]} Used
              </Text>
            </div>
          </Section>

          {/* Main message */}
          <Section style={content}>
            <Text style={greeting}>Hi {ownerName},</Text>
            <Text style={text}>
              Your <strong>{tenantName}</strong> marketplace is approaching its{' '}
              <strong>{quotaTypeLabels[quotaType].toLowerCase()} quota</strong> on the{' '}
              <strong>{plan} Plan</strong>.
            </Text>
            {warningLevel === 'critical' ? (
              <Text style={criticalText}>
                You're currently at <strong>{percentage}% capacity</strong>. Once you reach 100%,
                you won't be able to add more {quotaTypeLabels[quotaType].toLowerCase()} until you
                upgrade your plan or free up space.
              </Text>
            ) : (
              <Text style={text}>
                You're currently at <strong>{percentage}% capacity</strong>. We recommend upgrading
                soon to avoid hitting your limit.
              </Text>
            )}
          </Section>

          {/* Usage Stats */}
          <Section style={statsBox}>
            <Row style={statsRow}>
              <Column style={statsColumn}>
                <div style={statsIcon}>{quotaTypeEmoji[quotaType]}</div>
                <Text style={statsLabel}>{quotaTypeLabels[quotaType]}</Text>
                <Text style={statsValue}>
                  {formatUsage(quotaType, currentUsage, limit)}
                </Text>
                <div style={progressBarContainer}>
                  <div style={{ ...progressBar, width: `${percentage}%`, backgroundColor: warningColor }}></div>
                </div>
              </Column>
            </Row>
          </Section>

          {/* What happens at 100% */}
          <Section style={warningBox}>
            <Heading style={h3}>What Happens at 100%?</Heading>
            {quotaType === 'products' && (
              <>
                <Text style={warningText}>
                  When you reach your product limit, your vendors won't be able to:
                </Text>
                <ul style={list}>
                  <li style={listItem}>Add new products to their stores</li>
                  <li style={listItem}>Import products from other platforms</li>
                  <li style={listItem}>Duplicate existing products</li>
                </ul>
                <Text style={warningText}>
                  Existing products will remain active and available for purchase.
                </Text>
              </>
            )}
            {quotaType === 'orders' && (
              <>
                <Text style={warningText}>
                  When you reach your monthly order limit:
                </Text>
                <ul style={list}>
                  <li style={listItem}>New orders will be blocked until next month</li>
                  <li style={listItem}>Your storefront will display "Temporarily Closed"</li>
                  <li style={listItem}>Customers won't be able to complete checkouts</li>
                </ul>
                <Text style={warningText}>
                  Your quota resets on the 1st of each month.
                </Text>
              </>
            )}
            {quotaType === 'storage' && (
              <>
                <Text style={warningText}>
                  When you reach your storage limit:
                </Text>
                <ul style={list}>
                  <li style={listItem}>Vendors can't upload new product images</li>
                  <li style={listItem}>Store logo/banner updates will fail</li>
                  <li style={listItem}>New media uploads will be blocked</li>
                </ul>
                <Text style={warningText}>
                  Existing images will remain hosted and accessible.
                </Text>
              </>
            )}
          </Section>

          {/* Upgrade CTA */}
          <Section style={upgradeBox}>
            <Heading style={h2}>Upgrade to Get More</Heading>
            <Text style={upgradeText}>
              Don't let quotas slow down your growth! Upgrade to a higher plan and get:
            </Text>

            <Row style={plansRow}>
              <Column style={planColumn}>
                <div style={planCard}>
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
                <div style={planCard}>
                  <Text style={planName}>Enterprise</Text>
                  <Text style={planPrice}>$299/mo</Text>
                  <ul style={planFeatures}>
                    <li style={planFeature}>Unlimited products</li>
                    <li style={planFeature}>Unlimited orders</li>
                    <li style={planFeature}>100GB storage</li>
                  </ul>
                </div>
              </Column>
            </Row>

            <div style={buttonSection}>
              <Link href={upgradeUrl} style={button}>
                Upgrade Your Plan
              </Link>
            </div>
          </Section>

          {/* Alternative solutions */}
          {quotaType === 'products' && (
            <Section style={tipsBox}>
              <Heading style={h3}>💡 Alternative: Free Up Space</Heading>
              <Text style={tipsText}>
                If you're not ready to upgrade, you can free up quota by:
              </Text>
              <ul style={list}>
                <li style={listItem}>Archiving or deleting inactive products</li>
                <li style={listItem}>Removing duplicate listings</li>
                <li style={listItem}>Consolidating similar products with variants</li>
              </ul>
            </Section>
          )}

          {quotaType === 'storage' && (
            <Section style={tipsBox}>
              <Heading style={h3}>💡 Alternative: Reduce Storage</Heading>
              <Text style={tipsText}>
                You can reduce storage usage by:
              </Text>
              <ul style={list}>
                <li style={listItem}>Deleting unused or low-quality images</li>
                <li style={listItem}>Compressing images before upload (we already optimize them!)</li>
                <li style={listItem}>Removing products that are no longer sold</li>
              </ul>
            </Section>
          )}

          {/* Support */}
          <Section style={supportBox}>
            <Text style={supportText}>
              <strong>Need help choosing a plan?</strong>
              <br />
              Our team can help you find the right fit. Email us at{' '}
              <Link href="mailto:support@stepperslife.com" style={link}>
                support@stepperslife.com
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Monitor your usage anytime in your dashboard.</Text>
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

export default QuotaWarningEmail;

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
  textAlign: 'center' as const,
};

const warningIcon = {
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

const alertSection = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const alertBadge = {
  display: 'inline-block',
  backgroundColor: '#fef2f2',
  border: '3px solid #ef4444',
  borderRadius: '16px',
  padding: '24px 48px',
};

const alertPercentage = {
  color: '#991b1b',
  fontSize: '48px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1',
};

const alertLabel = {
  color: '#991b1b',
  fontSize: '14px',
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

const criticalText = {
  color: '#991b1b',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '16px 0',
  fontWeight: '600',
};

const h2 = {
  color: '#1f2937',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const h3 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const statsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '32px 20px',
  margin: '24px 20px',
};

const statsRow = {
  textAlign: 'center' as const,
};

const statsColumn = {
  textAlign: 'center' as const,
};

const statsIcon = {
  fontSize: '48px',
  marginBottom: '16px',
};

const statsLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
};

const statsValue = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const progressBarContainer = {
  backgroundColor: '#e5e7eb',
  borderRadius: '8px',
  height: '16px',
  overflow: 'hidden',
  margin: '0 auto',
  maxWidth: '300px',
};

const progressBar = {
  height: '100%',
  borderRadius: '8px',
  transition: 'width 0.3s ease',
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

const upgradeBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '32px 20px',
  margin: '24px 20px',
};

const upgradeText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const plansRow = {
  marginTop: '24px',
  marginBottom: '24px',
};

const planColumn = {
  padding: '0 10px',
  verticalAlign: 'top' as const,
};

const planCard = {
  backgroundColor: '#ffffff',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
};

const planName = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const planPrice = {
  color: '#10b981',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const planFeatures = {
  listStyle: 'none',
  padding: '0',
  margin: '0',
};

const planFeature = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '24px',
  marginBottom: '4px',
};

const buttonSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
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

const tipsBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #10b981',
  borderRadius: '8px',
  padding: '24px 20px',
  margin: '24px 20px',
};

const tipsText = {
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
