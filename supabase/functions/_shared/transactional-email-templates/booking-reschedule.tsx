import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "HostFlow AI"

interface BookingRescheduleProps {
  clientName?: string
  originalDate?: string
  newDate?: string
  resourceName?: string
  newResourceName?: string
  resolution?: 'reassigned' | 'rescheduled' | 'declined'
  industry?: string
  dashboardUrl?: string
}

const BookingRescheduleEmail = ({
  clientName,
  originalDate,
  newDate,
  resourceName,
  newResourceName,
  resolution = 'reassigned',
  dashboardUrl,
}: BookingRescheduleProps) => {
  const isReassigned = resolution === 'reassigned'
  const isRescheduled = resolution === 'rescheduled'
  const isDeclined = resolution === 'declined'

  const title = isDeclined
    ? 'Booking Update Required'
    : 'Your Booking Has Been Updated'

  const previewText = isDeclined
    ? `Hi ${clientName || 'there'}, your booking needs attention`
    : `Hi ${clientName || 'there'}, your booking has been automatically updated`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={logo}>🛡️ {SITE_NAME}</Text>
          </Section>

          <Heading style={h1}>{title}</Heading>

          <Text style={text}>
            Hi {clientName || 'there'},
          </Text>

          {isDeclined && (
            <>
              <Text style={text}>
                Your booking for <strong>{resourceName}</strong> on <strong>{originalDate}</strong> could not be confirmed due to a scheduling conflict.
              </Text>
              <Text style={text}>
                Please contact us to find an alternative time that works for you.
              </Text>
            </>
          )}

          {isReassigned && (
            <>
              <Text style={text}>
                Your original booking for <strong>{resourceName}</strong> on <strong>{originalDate}</strong> had a scheduling conflict.
              </Text>
              <Section style={highlightBox}>
                <Text style={highlightTitle}>✅ Automatically Reassigned</Text>
                <Text style={highlightText}>
                  New {newResourceName ? 'resource' : 'slot'}: <strong>{newResourceName || resourceName}</strong>
                </Text>
                <Text style={highlightText}>
                  Date/Time: <strong>{newDate || originalDate}</strong>
                </Text>
              </Section>
              <Text style={text}>
                Your booking has been confirmed at the new assignment. No action needed from your side.
              </Text>
            </>
          )}

          {isRescheduled && (
            <>
              <Text style={text}>
                Your original booking for <strong>{resourceName}</strong> on <strong>{originalDate}</strong> had a scheduling conflict.
              </Text>
              <Section style={highlightBox}>
                <Text style={highlightTitle}>📅 Automatically Rescheduled</Text>
                <Text style={highlightText}>
                  Resource: <strong>{resourceName}</strong>
                </Text>
                <Text style={highlightText}>
                  New Date/Time: <strong>{newDate}</strong>
                </Text>
              </Section>
              <Text style={text}>
                Your booking has been confirmed at the new time. No action needed from your side.
              </Text>
            </>
          )}

          {dashboardUrl && (
            <Section style={btnSection}>
              <Button style={button} href={dashboardUrl}>
                View Your Booking
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Best regards,<br />The {SITE_NAME} Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BookingRescheduleEmail,
  subject: (data: Record<string, any>) =>
    data?.resolution === 'declined'
      ? 'Action Required: Booking Conflict'
      : 'Your Booking Has Been Updated',
  displayName: 'Booking reschedule/reassign notification',
  previewData: {
    clientName: 'Jane',
    originalDate: 'Apr 15, 2026 2:00 PM',
    newDate: 'Apr 16, 2026 2:00 PM',
    resourceName: 'Room 3',
    newResourceName: 'Room 5',
    resolution: 'reassigned',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { padding: '20px 0 10px' }
const logo = { fontSize: '16px', fontWeight: '700' as const, color: '#2a9d8f', margin: '0' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#4a4a5a', lineHeight: '1.6', margin: '0 0 16px' }
const highlightBox = { backgroundColor: '#f0faf8', border: '1px solid #2a9d8f33', borderRadius: '8px', padding: '16px', margin: '0 0 16px' }
const highlightTitle = { fontSize: '14px', fontWeight: '600' as const, color: '#2a9d8f', margin: '0 0 8px' }
const highlightText = { fontSize: '13px', color: '#4a4a5a', margin: '0 0 4px', lineHeight: '1.5' }
const btnSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#2a9d8f', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '0' }
