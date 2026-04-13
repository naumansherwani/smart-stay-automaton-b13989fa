import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "HostFlow AI"

interface PaymentLinkProps {
  name?: string
  planName?: string
  planPrice?: number
}

const PaymentLinkEmail = ({ name, planName, planPrice }: PaymentLinkProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Payment Link – {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{SITE_NAME}</Heading>
        <Hr style={hr} />
        <Text style={text}>
          Hi{name ? ` ${name}` : ''},
        </Text>
        <Text style={text}>
          Thank you for choosing {SITE_NAME}.
        </Text>
        {planName && (
          <Text style={highlight}>
            Your selected plan: <strong>{planName}</strong>
            {planPrice != null ? ` — $${planPrice}/mo` : ''}
          </Text>
        )}
        <Text style={text}>
          We are preparing your secure USD payment link. It will be sent shortly.
        </Text>
        <Text style={text}>
          Once payment is completed, your account will be activated.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>– {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentLinkEmail,
  subject: 'Your Payment Link – HostFlow AI',
  displayName: 'Payment link notification',
  previewData: { name: 'John', planName: 'Professional', planPrice: 49 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#1e293b', margin: '0 0 24px', textAlign: 'center' as const }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const highlight = { fontSize: '15px', color: '#0f766e', lineHeight: '1.6', margin: '0 0 16px', padding: '12px 16px', backgroundColor: '#f0fdfa', borderRadius: '8px', border: '1px solid #99f6e4' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '24px 0 0', textAlign: 'center' as const }
