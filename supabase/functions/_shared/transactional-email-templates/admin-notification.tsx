import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "HostFlow AI"

interface AdminNotificationProps {
  eventType?: string
  eventTitle?: string
  details?: string
  timestamp?: string
}

const AdminNotificationEmail = ({ eventType, eventTitle, details, timestamp }: AdminNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{eventTitle || 'New activity on'} {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={logo}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={hr} />
        <Heading style={h1}>
          {eventTitle || 'New Activity Alert'}
        </Heading>
        <Text style={badge}>
          {eventType || 'notification'}
        </Text>
        <Text style={text}>
          {details || 'Something happened on your platform that requires your attention.'}
        </Text>
        {timestamp && (
          <Text style={meta}>Time: {timestamp}</Text>
        )}
        <Hr style={hr} />
        <Text style={footer}>
          This notification was sent from {SITE_NAME}. You are receiving this because you are the platform owner.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminNotificationEmail,
  subject: (data: Record<string, any>) => data?.eventTitle || `New activity on ${SITE_NAME}`,
  displayName: 'Admin notification',
  to: 'naumankhansherwani@gmail.com',
  previewData: { eventType: 'new_booking', eventTitle: 'New Booking Received', details: 'John Smith booked Room 201 for Jan 15-18.', timestamp: '2025-01-15 14:30 UTC' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { padding: '10px 0' }
const logo = { fontSize: '20px', fontWeight: '700' as const, color: '#2b9a8f', margin: '0' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1e293b', margin: '0 0 12px' }
const badge = { display: 'inline-block' as const, fontSize: '12px', fontWeight: '600' as const, color: '#2b9a8f', backgroundColor: '#e6f7f5', padding: '4px 10px', borderRadius: '12px', margin: '0 0 16px', textTransform: 'uppercase' as const }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const meta = { fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '20px 0 0', lineHeight: '1.5' }
