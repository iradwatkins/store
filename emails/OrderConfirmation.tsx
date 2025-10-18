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

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  estimatedDelivery?: string;
  trackingUrl?: string;
}

export const OrderConfirmationEmail = ({
  customerName = 'Customer',
  orderNumber = 'SL-ORD-12345',
  orderDate = 'January 1, 2025',
  items = [
    {
      name: 'Sample Product',
      quantity: 1,
      price: 29.99,
      imageUrl: 'https://via.placeholder.com/100',
    },
  ],
  subtotal = 29.99,
  shippingCost = 8.99,
  tax = 3.15,
  total = 42.13,
  shippingAddress = {
    street: '123 Main St',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60601',
    country: 'USA',
  },
  estimatedDelivery = 'January 5-7, 2025',
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Order Confirmation - {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>SteppersLife Stores</Heading>
            <Text style={tagline}>Chicago Steppin Marketplace</Text>
          </Section>

          {/* Thank you message */}
          <Section style={content}>
            <Heading style={h2}>Thank you for your order!</Heading>
            <Text style={text}>
              Hi {customerName},
            </Text>
            <Text style={text}>
              We've received your order and are getting it ready. You'll receive a shipping
              confirmation email with tracking information once your items have been shipped.
            </Text>
          </Section>

          {/* Order details box */}
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
          </Section>

          {/* Order items */}
          <Section style={content}>
            <Heading style={h3}>Order Summary</Heading>
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
                <Column align="right">
                  <Text style={itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Order totals */}
          <Section style={totalsSection}>
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Subtotal</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>${subtotal.toFixed(2)}</Text>
              </Column>
            </Row>
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Shipping</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>${shippingCost.toFixed(2)}</Text>
              </Column>
            </Row>
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Tax</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>${tax.toFixed(2)}</Text>
              </Column>
            </Row>
            <Row style={totalRowFinal}>
              <Column>
                <Text style={totalLabelFinal}>Total</Text>
              </Column>
              <Column align="right">
                <Text style={totalValueFinal}>${total.toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Shipping address */}
          <Section style={content}>
            <Heading style={h3}>Shipping Address</Heading>
            <Text style={address}>
              {shippingAddress.street}
              <br />
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
              <br />
              {shippingAddress.country}
            </Text>
            {estimatedDelivery && (
              <Text style={deliveryEstimate}>
                Estimated delivery: <strong>{estimatedDelivery}</strong>
              </Text>
            )}
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/account/orders`} style={button}>
              View Order Details
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions about your order? Contact us at{' '}
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

export default OrderConfirmationEmail;

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

const orderBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 20px',
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

const itemPrice = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const totalsSection = {
  padding: '24px 20px',
  borderTop: '2px solid #e5e7eb',
};

const totalRow = {
  marginBottom: '8px',
};

const totalRowFinal = {
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid #e5e7eb',
};

const totalLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const totalValue = {
  color: '#1f2937',
  fontSize: '14px',
  margin: '0',
};

const totalLabelFinal = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const totalValueFinal = {
  color: '#10b981',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const address = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const deliveryEstimate = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '16px 0 0 0',
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
