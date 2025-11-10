import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface AbandonedCartRecoveryEmailProps {
  customerName: string;
  storeName: string;
  cartItems: Array<{
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  cartTotal: number;
  recoveryUrl: string;
  expiresIn: string;
  discountCode?: string;
  discountPercent?: number;
  reminderStage?: number;
}

export default function AbandonedCartRecoveryEmail({
  customerName = 'Customer',
  storeName = 'Store',
  cartItems = [],
  cartTotal = 0,
  recoveryUrl = 'https://stores.stepperslife.com/cart/recover?token=xxx',
  expiresIn = '7 days',
  discountCode,
  discountPercent = 10,
  reminderStage = 1,
}: AbandonedCartRecoveryEmailProps) {
  // Customize messaging based on reminder stage
  const headings = [
    'You left something behind!',
    "Don't miss out on your items!",
    'Last chance! Your cart expires soon!',
  ]

  const heading = headings[reminderStage - 1] || headings[0]

  return (
    <Html>
      <Head />
      <Preview>{heading}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{heading}</Heading>

          <Text style={text}>
            Hi {customerName},
          </Text>

          {reminderStage === 1 && (
            <Text style={text}>
              We noticed you left some items in your cart at <strong>{storeName}</strong>. Good news - we saved them for you!
            </Text>
          )}

          {reminderStage === 2 && (
            <Text style={text}>
              Your items are still waiting for you at <strong>{storeName}</strong>! Complete your purchase now and save {discountPercent}% with your exclusive discount code.
            </Text>
          )}

          {reminderStage === 3 && (
            <Text style={text}>
              This is your final reminder! Your cart at <strong>{storeName}</strong> will expire soon. Don't lose your items and your special {discountPercent}% discount!
            </Text>
          )}

          <Section style={cartSection}>
            <Heading as="h2" style={h2}>
              Your Cart
            </Heading>

            {cartItems.map((item, index) => (
              <Section key={index} style={itemSection}>
                <table style={itemTable}>
                  <tr>
                    {item.imageUrl && (
                      <td style={itemImageCell}>
                        <Img
                          src={item.imageUrl}
                          alt={item.name}
                          width="80"
                          height="80"
                          style={itemImage}
                        />
                      </td>
                    )}
                    <td style={itemDetailsCell}>
                      <Text style={itemName}>{item.name}</Text>
                      <Text style={itemQuantity}>Quantity: {item.quantity}</Text>
                    </td>
                    <td style={itemPriceCell}>
                      <Text style={itemPrice}>${item.price.toFixed(2)}</Text>
                    </td>
                  </tr>
                </table>
              </Section>
            ))}

            <Hr style={hr} />

            <Section style={totalSection}>
              <table style={{ width: '100%' }}>
                <tr>
                  <td style={totalLabel}>
                    <Text style={totalText}>Total:</Text>
                  </td>
                  <td style={totalAmount}>
                    <Text style={totalPrice}>${cartTotal.toFixed(2)}</Text>
                  </td>
                </tr>
              </table>
            </Section>
          </Section>

          {discountCode && (
            <Section style={discountSection}>
              <Heading as="h3" style={discountHeading}>
                🎁 Special Offer Just For You!
              </Heading>
              <Text style={discountText}>
                Use code <strong style={discountCodeStyle}>{discountCode}</strong> for{' '}
                <strong>{discountPercent}% OFF</strong> your purchase!
              </Text>
              <Text style={discountExpiry}>
                This discount is automatically applied when you click the button below.
              </Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={recoveryUrl}>
              Complete Your Purchase
            </Button>
          </Section>

          <Text style={urgencyText}>
            🕐 Your cart will be saved for {expiresIn}
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you have any questions, please don't hesitate to contact us.
            <br />
            <br />
            Thanks,
            <br />
            The {storeName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

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

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
  lineHeight: '1.3',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#374151',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 15px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 40px 20px',
};

const cartSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  margin: '0 40px 32px',
};

const itemSection = {
  marginBottom: '16px',
};

const itemTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const itemImageCell = {
  width: '90px',
  paddingRight: '16px',
  verticalAlign: 'top' as const,
};

const itemImage = {
  borderRadius: '6px',
  objectFit: 'cover' as const,
};

const itemDetailsCell = {
  verticalAlign: 'top' as const,
};

const itemPriceCell = {
  textAlign: 'right' as const,
  verticalAlign: 'top' as const,
  whiteSpace: 'nowrap' as const,
};

const itemName = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 4px',
};

const itemQuantity = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const itemPrice = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const totalSection = {
  marginTop: '16px',
};

const totalLabel = {
  textAlign: 'left' as const,
};

const totalAmount = {
  textAlign: 'right' as const,
};

const totalText = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
};

const totalPrice = {
  color: '#2563eb',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const buttonContainer = {
  padding: '0 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
  width: 'auto',
};

const urgencyText = {
  color: '#dc2626',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 40px',
  fontWeight: '500',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '32px 40px 0',
};

const discountSection = {
  backgroundColor: '#fef3c7',
  border: '2px dashed #f59e0b',
  borderRadius: '8px',
  padding: '24px',
  margin: '0 40px 32px',
  textAlign: 'center' as const,
};

const discountHeading = {
  color: '#92400e',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const discountText = {
  color: '#78350f',
  fontSize: '18px',
  lineHeight: '28px',
  margin: '0 0 8px',
};

const discountCodeStyle = {
  backgroundColor: '#fff',
  color: '#dc2626',
  padding: '4px 12px',
  borderRadius: '4px',
  fontSize: '20px',
  letterSpacing: '2px',
  fontFamily: 'monospace',
};

const discountExpiry = {
  color: '#92400e',
  fontSize: '13px',
  margin: '0',
};
