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

interface VendorNewOrderAlertEmailProps {
  vendorName: string;
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

export const VendorNewOrderAlertEmail = ({
  vendorName = 'Vendor',
  storeName = 'My Store',
  orderNumber = 'SL-ORD-12345',
  orderDate = 'January 1, 2025',
  customerName = 'John Doe',
  items = [
    {
      name: 'Sample Product',
      quantity: 1,
      price: 29.99,
    },
  ],
  total = 29.99,
  shippingAddress = {
    street: '123 Main St',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60601',
  },
  orderDetailsUrl = 'https://stores.stepperslife.com/dashboard/orders/123',
}: VendorNewOrderAlertEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New order received - {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>SteppersLife Stores</Heading>
            <Text style={tagline}>Vendor Dashboard</Text>
          </Section>

          {/* Alert icon and message */}
          <Section style={alertSection}>
            <div style={alertCircle}>
              <Text style={alertIcon}>🎉</Text>
            </div>
            <Heading style={h2}>New Order Received!</Heading>
            <Text style={subtitle}>
              You have a new order for {storeName}
            </Text>
          </Section>

          {/* Order info box */}
          <Section style={orderBox}>
            <Row>
              <Column>
                <Text style={orderLabel}>Order Number</Text>
                <Text style={orderValue}>{orderNumber}</Text>
              </Column>
              <Column align="right">
                <Text style={orderLabel}>Order Date</Text>
                <Text style={orderValue}>{orderDate}</Text>
              </Column>
            </Row>
            <Row style={{ marginTop: '16px' }}>
              <Column>
                <Text style={orderLabel}>Customer</Text>
                <Text style={orderValue}>{customerName}</Text>
              </Column>
              <Column align="right">
                <Text style={orderLabel}>Order Total</Text>
                <Text style={totalAmount}>${total.toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Order items */}
          <Section style={content}>
            <Heading style={h3}>Order Items</Heading>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column>
                  <Text style={itemName}>{item.name}</Text>
                  <Text style={itemQty}>Quantity: {item.quantity}</Text>
                </Column>
                <Column align="right">
                  <Text style={itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Shipping address */}
          <Section style={content}>
            <Heading style={h3}>Ship To</Heading>
            <Text style={address}>
              <strong>{customerName}</strong>
              <br />
              {shippingAddress.street}
              <br />
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
            </Text>
          </Section>

          {/* Action required box */}
          <Section style={actionBox}>
            <Heading style={actionHeading}>📋 Action Required</Heading>
            <ul style={actionList}>
              <li style={actionItem}>Review the order details</li>
              <li style={actionItem}>Prepare items for shipment</li>
              <li style={actionItem}>Mark as shipped when ready</li>
            </ul>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={orderDetailsUrl} style={button}>
              View Order & Fulfill
            </Link>
          </Section>

          {/* Tips section */}
          <Section style={tipsBox}>
            <Text style={tipText}>
              💡 <strong>Pro Tip:</strong> Customers who receive their orders within 2-3 days
              are more likely to leave positive reviews and become repeat buyers.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Need help? Visit our{' '}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/docs`} style={link}>
                Vendor Help Center
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

export default VendorNewOrderAlertEmail;

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
  backgroundColor: '#4f46e5',
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

const alertSection = {
  padding: '40px 20px 20px',
  textAlign: 'center' as const,
};

const alertCircle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: '#fef3c7',
  margin: '0 auto 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const alertIcon = {
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

const orderBox = {
  backgroundColor: '#eff6ff',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '20px',
  margin: '32px 20px',
};

const orderLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px 0',
};

const orderValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const totalAmount = {
  color: '#10b981',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
};

const itemRow = {
  borderBottom: '1px solid #e5e7eb',
  padding: '12px 20px',
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

const itemPrice = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const address = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const actionBox = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  padding: '20px',
  margin: '32px 20px',
};

const actionHeading = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const actionList = {
  margin: '0',
  paddingLeft: '20px',
};

const actionItem = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '8px',
};

const buttonSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const tipsBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 20px',
};

const tipText = {
  color: '#4b5563',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
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
  color: '#4f46e5',
  textDecoration: 'underline',
};
