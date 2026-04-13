import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr, Column, Row,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "HostFlow AI"

interface TicketConfirmationProps {
  passengerName?: string
  resourceName?: string
  departure?: string
  arrival?: string
  bookingRef?: string
  price?: string
  industry?: string
  ticketType?: string
  viewTicketUrl?: string
}

const industryLabels: Record<string, { label: string; emoji: string }> = {
  airlines: { label: 'Boarding Pass', emoji: '✈️' },
  railways: { label: 'Train Ticket', emoji: '🚆' },
  events_entertainment: { label: 'Event Ticket', emoji: '🎭' },
}

const TicketConfirmationEmail = ({
  passengerName,
  resourceName,
  departure,
  arrival,
  bookingRef,
  price,
  industry = 'airlines',
  ticketType,
  viewTicketUrl,
}: TicketConfirmationProps) => {
  const info = industryLabels[industry] || { label: 'Ticket', emoji: '🎫' }
  const label = ticketType || info.label

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Your ${label} is confirmed — ${bookingRef || 'Ref'}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={logo}>{info.emoji} {SITE_NAME}</Text>
          </Section>

          <Heading style={h1}>Your {label} is Ready!</Heading>

          <Text style={text}>
            Hi {passengerName || 'there'},
          </Text>

          <Text style={text}>
            Your booking has been confirmed. Here are your ticket details:
          </Text>

          <Section style={ticketBox}>
            <Text style={ticketHeader}>{info.emoji} {label.toUpperCase()}</Text>

            <Row>
              <Column style={detailCol}>
                <Text style={detailLabel}>Reference</Text>
                <Text style={detailValue}>{bookingRef || '—'}</Text>
              </Column>
              <Column style={detailCol}>
                <Text style={detailLabel}>{industry === 'airlines' ? 'Flight' : industry === 'railways' ? 'Train' : 'Event'}</Text>
                <Text style={detailValue}>{resourceName || '—'}</Text>
              </Column>
            </Row>

            <Hr style={ticketHr} />

            <Row>
              <Column style={detailCol}>
                <Text style={detailLabel}>{industry === 'events_entertainment' ? 'Doors Open' : 'Departure'}</Text>
                <Text style={detailValue}>{departure || '—'}</Text>
              </Column>
              <Column style={detailCol}>
                <Text style={detailLabel}>{industry === 'events_entertainment' ? 'Event Ends' : 'Arrival'}</Text>
                <Text style={detailValue}>{arrival || '—'}</Text>
              </Column>
            </Row>

            {price && (
              <>
                <Hr style={ticketHr} />
                <Text style={detailLabel}>Total Price</Text>
                <Text style={priceText}>${price}</Text>
              </>
            )}
          </Section>

          {viewTicketUrl && (
            <Section style={btnSection}>
              <Button style={button} href={viewTicketUrl}>
                View & Download Ticket
              </Button>
            </Section>
          )}

          <Text style={text}>
            You can view and download your ticket with QR code anytime from your dashboard.
          </Text>

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
  component: TicketConfirmationEmail,
  subject: (data: Record<string, any>) => {
    const info = industryLabels[data?.industry] || { label: 'Ticket', emoji: '🎫' }
    return `${info.emoji} Your ${data?.ticketType || info.label} is Confirmed — ${data?.bookingRef || 'Ref'}`
  },
  displayName: 'Ticket confirmation (Airlines, Railways, Events)',
  previewData: {
    passengerName: 'John',
    resourceName: 'Flight HF-201',
    departure: 'Apr 15, 2026 10:00 AM',
    arrival: 'Apr 15, 2026 2:30 PM',
    bookingRef: 'A1B2C3D4',
    price: '249',
    industry: 'airlines',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { padding: '20px 0 10px' }
const logo = { fontSize: '16px', fontWeight: '700' as const, color: '#2a9d8f', margin: '0' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#4a4a5a', lineHeight: '1.6', margin: '0 0 16px' }
const ticketBox = { backgroundColor: '#f0faf8', border: '1px solid #2a9d8f33', borderRadius: '12px', padding: '20px', margin: '0 0 20px' }
const ticketHeader = { fontSize: '12px', fontWeight: '700' as const, color: '#2a9d8f', letterSpacing: '2px', margin: '0 0 16px' }
const detailCol = { width: '50%', verticalAlign: 'top' as const }
const detailLabel = { fontSize: '10px', color: '#888', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 2px' }
const detailValue = { fontSize: '14px', fontWeight: '600' as const, color: '#1a1a2e', margin: '0 0 12px' }
const priceText = { fontSize: '18px', fontWeight: '700' as const, color: '#2a9d8f', margin: '0' }
const ticketHr = { borderColor: '#2a9d8f33', margin: '12px 0' }
const btnSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#2a9d8f', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '0' }
