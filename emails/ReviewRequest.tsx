import {
  Body,
  Button,
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
} from "@react-email/components"
import * as React from "react"

interface ReviewRequestEmailProps {
  customerName: string
  productName: string
  productImageUrl?: string
  orderNumber: string
  storeName: string
  reviewUrl: string
}

export const ReviewRequestEmail = ({
  customerName = "Customer",
  productName = "Sample Product",
  productImageUrl = "https://via.placeholder.com/150",
  orderNumber = "SL-ORD-12345",
  storeName = "Sample Store",
  reviewUrl = "https://stores.stepperslife.com/review/token123",
}: ReviewRequestEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Share your experience with {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>SteppersLife Stores</Heading>
            <Text style={tagline}>Chicago Steppin Marketplace</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Heading style={h2}>How was your purchase?</Heading>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>
              We hope you're enjoying your recent purchase from{" "}
              <strong>{storeName}</strong>!
            </Text>
          </Section>

          {/* Product card */}
          <Section style={productCard}>
            <Row>
              <Column style={{ width: "150px" }}>
                {productImageUrl && (
                  <Img
                    src={productImageUrl}
                    width="150"
                    height="150"
                    alt={productName}
                    style={productImage}
                  />
                )}
              </Column>
              <Column style={{ paddingLeft: "20px", verticalAlign: "middle" }}>
                <Text style={productNameText}>{productName}</Text>
                <Text style={orderNumberText}>Order #{orderNumber}</Text>
              </Column>
            </Row>
          </Section>

          {/* Review request */}
          <Section style={content}>
            <Text style={text}>
              Your feedback helps other Chicago Steppers make informed decisions
              and helps our vendors improve their products and services.
            </Text>
            <Text style={text}>
              <strong>It only takes a minute to share your experience:</strong>
            </Text>
            <ul style={list}>
              <li style={listItem}>Rate your purchase (1-5 stars)</li>
              <li style={listItem}>Write a brief review</li>
              <li style={listItem}>
                Optionally add photos to show how it looks
              </li>
            </ul>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Button href={reviewUrl} style={button}>
              Write Your Review
            </Button>
          </Section>

          {/* Incentive note */}
          <Section style={incentiveBox}>
            <Text style={incentiveText}>
              ⭐ Your review will be visible to the Chicago Steppin community and
              helps local vendors thrive!
            </Text>
          </Section>

          {/* Link as fallback */}
          <Section style={content}>
            <Text style={smallText}>
              If the button doesn't work, copy and paste this link into your
              browser:
            </Text>
            <Text style={linkText}>
              <Link href={reviewUrl} style={link}>
                {reviewUrl}
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This review request was sent because you recently purchased from{" "}
              {storeName} on SteppersLife Stores.
            </Text>
            <Text style={footerText}>
              Questions? Contact us at{" "}
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
  )
}

export default ReviewRequestEmail

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
}

const header = {
  padding: "32px 20px",
  backgroundColor: "#10b981",
  textAlign: "center" as const,
}

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
  padding: "0",
}

const tagline = {
  color: "#ffffff",
  fontSize: "14px",
  margin: "8px 0 0 0",
  padding: "0",
}

const content = {
  padding: "0 20px",
}

const h2 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "32px 0 16px",
}

const text = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 0",
}

const productCard = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 20px",
  border: "1px solid #e5e7eb",
}

const productImage = {
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
}

const productNameText = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px 0",
}

const orderNumberText = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0",
}

const list = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "24px",
  paddingLeft: "20px",
  margin: "16px 0",
}

const listItem = {
  marginBottom: "8px",
}

const buttonSection = {
  padding: "32px 20px",
  textAlign: "center" as const,
}

const button = {
  backgroundColor: "#10b981",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 40px",
}

const incentiveBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 20px",
  border: "1px solid #fbbf24",
}

const incentiveText = {
  color: "#92400e",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
  textAlign: "center" as const,
}

const smallText = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "8px 0",
}

const linkText = {
  color: "#10b981",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "4px 0",
  wordBreak: "break-all" as const,
}

const link = {
  color: "#10b981",
  textDecoration: "underline",
}

const footer = {
  padding: "32px 20px",
  borderTop: "1px solid #e5e7eb",
}

const footerText = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center" as const,
  margin: "8px 0",
}
