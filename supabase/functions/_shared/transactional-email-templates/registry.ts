/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as paymentLink } from './payment-link.tsx'
import { template as bookingReschedule } from './booking-reschedule.tsx'
import { template as ticketConfirmation } from './ticket-confirmation.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'payment-link': paymentLink,
  'booking-reschedule': bookingReschedule,
  'ticket-confirmation': ticketConfirmation,
}
