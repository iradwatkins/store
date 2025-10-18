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

interface LowStockProduct {
  id: string;
  name: string;
  sku?: string;
  currentStock: number;
  lowStockThreshold: number;
  imageUrl?: string;
  hasVariants: boolean;
  variants?: Array<{
    id: string;
    name: string;
    value: string;
    currentStock: number;
  }>;
}

interface LowStockAlertEmailProps {
  vendorName: string;
  storeName: string;
  products: LowStockProduct[];
  dashboardUrl: string;
}

export const LowStockAlertEmail = ({
  vendorName = 'Vendor',
  storeName = 'Your Store',
  products = [
    {
      id: '1',
      name: 'Sample Product',
      sku: 'SKU-123',
      currentStock: 3,
      lowStockThreshold: 5,
      imageUrl: 'https://via.placeholder.com/100',
      hasVariants: false,
    },
  ],
  dashboardUrl = 'https://stores.stepperslife.com/dashboard/products',
}: LowStockAlertEmailProps) => {
  const totalLowStockItems = products.reduce((sum, product) => {
    if (product.hasVariants && product.variants) {
      return sum + product.variants.length;
    }
    return sum + 1;
  }, 0);

  return (
    <Html>
      <Head />
      <Preview>Low Stock Alert - {totalLowStockItems} item(s) running low</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>SteppersLife Stores</Heading>
            <Text style={tagline}>Inventory Alert</Text>
          </Section>

          {/* Alert message */}
          <Section style={alertBox}>
            <Text style={alertText}>⚠️ Low Stock Alert</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Heading style={h2}>Low Inventory Detected</Heading>
            <Text style={text}>
              Hi {vendorName},
            </Text>
            <Text style={text}>
              You have <strong>{totalLowStockItems} product(s)</strong> in your store{' '}
              <strong>{storeName}</strong> that are running low on inventory and need restocking.
            </Text>
          </Section>

          {/* Products List */}
          <Section style={content}>
            <Heading style={h3}>Products Needing Attention</Heading>
            {products.map((product, index) => (
              <div key={index}>
                <Row style={productRow}>
                  <Column style={{ width: '80px' }}>
                    {product.imageUrl ? (
                      <Img
                        src={product.imageUrl}
                        width="80"
                        height="80"
                        alt={product.name}
                        style={productImage}
                      />
                    ) : (
                      <div style={productImagePlaceholder}>
                        <Text style={placeholderText}>No Image</Text>
                      </div>
                    )}
                  </Column>
                  <Column style={{ paddingLeft: '16px' }}>
                    <Text style={productName}>{product.name}</Text>
                    {product.sku && (
                      <Text style={productDetail}>SKU: {product.sku}</Text>
                    )}
                    {!product.hasVariants ? (
                      <div style={stockInfo}>
                        <Text style={stockWarning}>
                          ⚠️ Current Stock: <strong>{product.currentStock}</strong>
                        </Text>
                        <Text style={productDetail}>
                          Alert Threshold: {product.lowStockThreshold}
                        </Text>
                      </div>
                    ) : (
                      <div>
                        <Text style={variantsHeader}>Low Stock Variants:</Text>
                        {product.variants?.map((variant, vIndex) => (
                          <div key={vIndex} style={variantRow}>
                            <Text style={variantName}>
                              {variant.name}: {variant.value}
                            </Text>
                            <Text style={stockWarning}>
                              Stock: <strong>{variant.currentStock}</strong>
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </Column>
                </Row>
                {index < products.length - 1 && <div style={divider} />}
              </div>
            ))}
          </Section>

          {/* Action Items */}
          <Section style={actionBox}>
            <Heading style={h3}>Recommended Actions</Heading>
            <Text style={actionItem}>✓ Review and update inventory quantities</Text>
            <Text style={actionItem}>✓ Place restocking orders with suppliers</Text>
            <Text style={actionItem}>✓ Consider adjusting low stock thresholds</Text>
            <Text style={actionItem}>✓ Update product status if out of stock</Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={dashboardUrl} style={button}>
              Manage Inventory
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this alert because you have low stock notifications enabled.
            </Text>
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

export default LowStockAlertEmail;

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

const alertBox = {
  backgroundColor: '#fff3cd',
  borderLeft: '4px solid #ffc107',
  padding: '16px 20px',
  margin: '24px 20px',
};

const alertText = {
  color: '#856404',
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

const productRow = {
  padding: '16px 0',
  display: 'flex',
  alignItems: 'flex-start',
};

const productImage = {
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  objectFit: 'cover' as const,
};

const productImagePlaceholder = {
  width: '80px',
  height: '80px',
  borderRadius: '8px',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #e5e7eb',
};

const placeholderText = {
  color: '#9ca3af',
  fontSize: '11px',
  margin: '0',
};

const productName = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const productDetail = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '4px 0',
};

const stockInfo = {
  marginTop: '8px',
};

const stockWarning = {
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: '600',
  margin: '4px 0',
};

const variantsHeader = {
  color: '#1f2937',
  fontSize: '13px',
  fontWeight: '600',
  margin: '12px 0 8px 0',
};

const variantRow = {
  backgroundColor: '#f9fafb',
  padding: '8px 12px',
  borderRadius: '4px',
  margin: '6px 0',
};

const variantName = {
  color: '#4b5563',
  fontSize: '13px',
  margin: '0 0 4px 0',
};

const divider = {
  borderBottom: '1px solid #e5e7eb',
  margin: '16px 20px',
};

const actionBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 20px',
};

const actionItem = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
};

const buttonSection = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#fbbf24',
  borderRadius: '6px',
  color: '#1f2937',
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
