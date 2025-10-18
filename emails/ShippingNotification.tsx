import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ShippingNotificationEmailProps {
  customerName: string;
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

export const ShippingNotificationEmail = ({
  customerName = 'Customer',
  orderNumber = 'SL-ORD-12345',
  carrier = 'USPS',
  trackingNumber = '9400111111111111111111',
  trackingUrl = 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111111111111111111',
  shippedDate = 'January 3, 2025',
  estimatedDelivery = 'January 5-7, 2025',
  items = [
    {
      name: 'Sample Product',
      quantity: 1,
      imageUrl: 'https://via.placeholder.com/100',
    },
  ],
  shippingAddress = {
    street: '123 Main St',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60601',
  },
}: ShippingNotificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your order {orderNumber} has shipped!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>SteppersLife Stores</Heading>
            <Text style={tagline}>Chicago Steppin Marketplace</Text>
          </Section>

          {/* Shipping icon and message */}
          <Section style={iconSection}>
            <div style={iconCircle}>
              <Text style={iconText}>📦</Text>
            </div>
            <Heading style={h2}>Your order is on the way!</Heading>
            <Text style={subtitle}>
              Your package has been shipped and is heading to you.
            </Text>
          </Section>

          {/* Tracking info box */}
          <Section style={trackingBox}>
            <Row>
              <Column>
                <Text style={trackingLabel}>Tracking Number</Text>
                <Text style={trackingNumber}>{trackingNumber}</Text>
              </Column>
            </Row>
            <Row style={{ marginTop: '12px' }}>
              <Column>
                <Text style={trackingLabel}>Carrier</Text>
                <Text style={trackingValue}>{carrier}</Text>
              </Column>
              <Column>
                <Text style={trackingLabel}>Shipped Date</Text>
                <Text style={trackingValue}>{shippedDate}</Text>
              </Column>
            </Row>
            <Row style={{ marginTop: '12px' }}>
              <Column>
                <Text style={trackingLabel}>Estimated Delivery</Text>
                <Text style={estimatedDeliveryText}>{estimatedDelivery}</Text>
              </Column>
            </Row>
          </Section>

          {/* Track Package Button */}
          <Section style={buttonSection}>
            <Link href={trackingUrl} style={button}>
              Track Your Package
            </Link>
          </Section>

          {/* Order details */}
          <Section style={content}>
            <Heading style={h3}>Order #{orderNumber}</Heading>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={{ width: '64px' }}>
                  {item.imageUrl && (
                    <Img
                      src={item.imageUrl}
                      width="64"
                      height="64"
                      alt={item.name}
                      style={productImage}
                    />
                  )}
                </Column>
                <Column style={{ paddingLeft: '16px' }}>
                  <Text style={itemName}>{item.name}</Text>
                  <Text style={itemQty}>Quantity: {item.quantity}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Shipping address */}
          <Section style={content}>
            <Heading style={h3}>Shipping To</Heading>
            <Text style={address}>
              {shippingAddress.street}
              <br />
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
            </Text>
          </Section>

          {/* Tips section */}
          <Section style={tipsBox}>
            <Heading style={h3}>Delivery Tips</Heading>
            <ul style={tipsList}>
              <li style={tipItem}>
                Make sure someone is available to receive the package
              </li>
              <li style={tipItem}>
                Check your tracking number regularly for updates
              </li>
              <li style={tipItem}>
                Contact the carrier directly if you have delivery questions
              </li>
            </ul>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Contact us at{' '}
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

export default ShippingNotificationEmail;

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

const iconSection = {
  padding: '40px 20px 20px',
  textAlign: 'center' as const,
};

const iconCircle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: '#dcfce7',
  margin: '0 auto 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const iconText = {
  fontSize: '40px',
  margin: '0',
};

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const subtitle = {
  color: '#6b7280',
  fontSize: '16px',
  margin: '0',
};

const h3 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
};

const content = {
  padding: '0 20px',
};

const trackingBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '20px',
  margin: '32px 20px',
};

const trackingLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px 0',
};

const trackingNumber = {
  color: '#10b981',
  fontSize: '20px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  margin: '0',
};

const trackingValue = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const estimatedDeliveryText = {
  color: '#10b981',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
};

const buttonSection = {
  padding: '24px 20px',
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

const itemRow = {
  borderBottom: '1px solid #e5e7eb',
  padding: '16px 20px',
};

const productImage = {
  borderRadius: '4px',
  border: '1px solid #e5e7eb',
};

const itemName = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px 0',
};

const itemQty = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
};

const address = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const tipsBox = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #3b82f6',
  padding: '20px',
  margin: '32px 20px',
};

const tipsList = {
  margin: '12px 0',
  paddingLeft: '20px',
};

const tipItem = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '8px',
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
