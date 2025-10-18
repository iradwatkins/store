/**
 * Base Email Template
 * 
 * Eliminates duplication of email structure across 12+ email templates
 * Provides consistent styling and layout for all transactional emails
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Column,
  Row,
} from '@react-email/components'
import * as React from 'react'

// Base email theme configuration
export const emailTheme = {
  colors: {
    primary: '#1e40af', // Blue-600
    secondary: '#6b7280', // Gray-500
    success: '#059669', // Emerald-600
    warning: '#d97706', // Amber-600
    danger: '#dc2626', // Red-600
    text: {
      primary: '#111827', // Gray-900
      secondary: '#6b7280', // Gray-500
      muted: '#9ca3af', // Gray-400
      inverse: '#ffffff'
    },
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb', // Gray-50
      muted: '#f3f4f6' // Gray-100
    },
    border: '#e5e7eb' // Gray-200
  },
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    mono: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px'
  }
}

// Email styles
const main = {
  backgroundColor: emailTheme.colors.background.secondary,
  fontFamily: emailTheme.fonts.primary,
  padding: emailTheme.spacing.lg
}

const container = {
  backgroundColor: emailTheme.colors.background.primary,
  border: `1px solid ${emailTheme.colors.border}`,
  borderRadius: emailTheme.borderRadius.md,
  margin: '0 auto',
  maxWidth: '600px',
  padding: '0'
}

const header = {
  backgroundColor: emailTheme.colors.primary,
  padding: emailTheme.spacing.lg,
  textAlign: 'center' as const
}

const headerTitle = {
  color: emailTheme.colors.text.inverse,
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0'
}

const content = {
  padding: emailTheme.spacing.xl
}

const footer = {
  backgroundColor: emailTheme.colors.background.muted,
  padding: emailTheme.spacing.lg,
  textAlign: 'center' as const,
  borderTop: `1px solid ${emailTheme.colors.border}`
}

const footerText = {
  color: emailTheme.colors.text.secondary,
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0'
}

// Component interfaces
export interface BaseEmailProps {
  preview: string
  title: string
  children: React.ReactNode
  headerColor?: string
  showLogo?: boolean
  logoUrl?: string
  footerContent?: React.ReactNode
  unsubscribeUrl?: string
  companyName?: string
  companyAddress?: string
}

/**
 * Base email template component that provides consistent structure
 */
export function BaseEmailTemplate({
  preview,
  title,
  children,
  headerColor = emailTheme.colors.primary,
  showLogo = true,
  logoUrl = 'https://via.placeholder.com/120x40?text=SteppersLife',
  footerContent,
  unsubscribeUrl,
  companyName = 'SteppersLife',
  companyAddress = '123 Commerce St, Business City, BC 12345'
}: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ ...header, backgroundColor: headerColor }}>
            {showLogo && logoUrl && (
              <Img
                src={logoUrl}
                alt={companyName}
                width="120"
                height="40"
                style={{
                  margin: '0 auto 16px',
                  display: 'block'
                }}
              />
            )}
            <Heading style={headerTitle}>{title}</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            {footerContent || (
              <>
                <Text style={footerText}>
                  <strong>{companyName}</strong>
                  <br />
                  {companyAddress}
                </Text>
                
                <Text style={{ ...footerText, marginTop: emailTheme.spacing.md }}>
                  This email was sent to you because you have an account with {companyName}.
                  {unsubscribeUrl && (
                    <>
                      <br />
                      <Link
                        href={unsubscribeUrl}
                        style={{
                          color: emailTheme.colors.text.secondary,
                          textDecoration: 'underline'
                        }}
                      >
                        Unsubscribe from these emails
                      </Link>
                    </>
                  )}
                </Text>

                <Text style={{ ...footerText, marginTop: emailTheme.spacing.md }}>
                  © {new Date().getFullYear()} {companyName}. All rights reserved.
                </Text>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

/**
 * Email section component for consistent content blocks
 */
export function EmailSection({ 
  children, 
  background = 'transparent',
  padding = emailTheme.spacing.lg
}: {
  children: React.ReactNode
  background?: string
  padding?: string
}) {
  return (
    <Section style={{ 
      backgroundColor: background, 
      padding,
      borderRadius: emailTheme.borderRadius.sm,
      marginBottom: emailTheme.spacing.md
    }}>
      {children}
    </Section>
  )
}

/**
 * Email heading component
 */
export function EmailHeading({ 
  children, 
  level = 2,
  color = emailTheme.colors.text.primary,
  align = 'left'
}: {
  children: React.ReactNode
  level?: 1 | 2 | 3
  color?: string
  align?: 'left' | 'center' | 'right'
}) {
  const sizes = {
    1: '28px',
    2: '20px',
    3: '16px'
  }

  return (
    <Heading style={{
      color,
      fontSize: sizes[level],
      fontWeight: 'bold',
      margin: `0 0 ${emailTheme.spacing.md} 0`,
      textAlign: align
    }}>
      {children}
    </Heading>
  )
}

/**
 * Email text component
 */
export function EmailText({ 
  children, 
  color = emailTheme.colors.text.primary,
  size = '14px',
  align = 'left',
  margin = `0 0 ${emailTheme.spacing.md} 0`
}: {
  children: React.ReactNode
  color?: string
  size?: string
  align?: 'left' | 'center' | 'right'
  margin?: string
}) {
  return (
    <Text style={{
      color,
      fontSize: size,
      lineHeight: '20px',
      margin,
      textAlign: align
    }}>
      {children}
    </Text>
  )
}

/**
 * Email button component
 */
export function EmailButton({ 
  href, 
  children,
  color = emailTheme.colors.primary,
  textColor = emailTheme.colors.text.inverse,
  size = 'medium'
}: {
  href: string
  children: React.ReactNode
  color?: string
  textColor?: string
  size?: 'small' | 'medium' | 'large'
}) {
  const sizes = {
    small: { padding: '8px 16px', fontSize: '12px' },
    medium: { padding: '12px 24px', fontSize: '14px' },
    large: { padding: '16px 32px', fontSize: '16px' }
  }

  return (
    <Link
      href={href}
      style={{
        backgroundColor: color,
        borderRadius: emailTheme.borderRadius.sm,
        color: textColor,
        display: 'inline-block',
        ...sizes[size],
        textDecoration: 'none',
        fontWeight: 'bold',
        textAlign: 'center'
      }}
    >
      {children}
    </Link>
  )
}

/**
 * Email table component for data display
 */
export function EmailTable({ 
  children,
  style = {}
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      border: `1px solid ${emailTheme.colors.border}`,
      borderRadius: emailTheme.borderRadius.sm,
      overflow: 'hidden',
      ...style
    }}>
      {children}
    </table>
  )
}

/**
 * Email table row component
 */
export function EmailTableRow({ 
  children,
  isHeader = false,
  background
}: {
  children: React.ReactNode
  isHeader?: boolean
  background?: string
}) {
  return (
    <tr style={{
      backgroundColor: background || (isHeader ? emailTheme.colors.background.muted : 'transparent'),
      borderBottom: `1px solid ${emailTheme.colors.border}`
    }}>
      {children}
    </tr>
  )
}

/**
 * Email table cell component
 */
export function EmailTableCell({ 
  children,
  align = 'left',
  padding = emailTheme.spacing.md,
  isHeader = false
}: {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
  padding?: string
  isHeader?: boolean
}) {
  const Tag = isHeader ? 'th' : 'td'
  
  return React.createElement(Tag, {
    style: {
      padding,
      textAlign: align,
      fontSize: '14px',
      fontWeight: isHeader ? 'bold' : 'normal',
      color: emailTheme.colors.text.primary
    }
  }, children)
}

/**
 * Email divider component
 */
export function EmailDivider({ 
  margin = emailTheme.spacing.lg,
  color = emailTheme.colors.border
}: {
  margin?: string
  color?: string
}) {
  return (
    <Hr style={{
      border: 'none',
      borderTop: `1px solid ${color}`,
      margin: `${margin} 0`
    }} />
  )
}

/**
 * Email two-column layout
 */
export function EmailTwoColumn({ 
  left, 
  right,
  leftWidth = '50%',
  rightWidth = '50%',
  gap = emailTheme.spacing.md
}: {
  left: React.ReactNode
  right: React.ReactNode
  leftWidth?: string
  rightWidth?: string
  gap?: string
}) {
  return (
    <Row style={{ marginBottom: emailTheme.spacing.md }}>
      <Column style={{ width: leftWidth, paddingRight: gap }}>
        {left}
      </Column>
      <Column style={{ width: rightWidth, paddingLeft: gap }}>
        {right}
      </Column>
    </Row>
  )
}

/**
 * Alert/notification box component
 */
export function EmailAlert({ 
  children, 
  type = 'info',
  icon
}: {
  children: React.ReactNode
  type?: 'info' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode
}) {
  const typeColors = {
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    success: { bg: '#d1fae5', border: '#10b981', text: '#047857' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    danger: { bg: '#fee2e2', border: '#ef4444', text: '#dc2626' }
  }

  const colors = typeColors[type]

  return (
    <Section style={{
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: emailTheme.borderRadius.sm,
      padding: emailTheme.spacing.md,
      marginBottom: emailTheme.spacing.md
    }}>
      {icon && (
        <div style={{ marginBottom: emailTheme.spacing.sm }}>
          {icon}
        </div>
      )}
      <Text style={{
        color: colors.text,
        fontSize: '14px',
        margin: '0'
      }}>
        {children}
      </Text>
    </Section>
  )
}