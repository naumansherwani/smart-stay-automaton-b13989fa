import { useSubscription } from "./useSubscription";

export interface TrialLimits {
  crmContacts: number;       // 150
  bookings: number;          // -1 = unlimited
  aiCalendar: boolean;       // full access
  aiPricingUses: number;     // 20
  aiFollowUps: number;       // 10
  advancedCrm: boolean;      // restricted
  voiceAssistant: boolean;   // restricted
  whiteLabel: boolean;       // restricted
  multiTeam: boolean;        // restricted
}

const TRIAL_LIMITS: TrialLimits = {
  crmContacts: 150,
  bookings: -1,
  aiCalendar: true,
  aiPricingUses: 20,
  aiFollowUps: 10,
  advancedCrm: false,
  voiceAssistant: false,
  whiteLabel: false,
  multiTeam: false,
};

const FULL_ACCESS: TrialLimits = {
  crmContacts: -1,
  bookings: -1,
  aiCalendar: true,
  aiPricingUses: -1,
  aiFollowUps: -1,
  advancedCrm: true,
  voiceAssistant: true,
  whiteLabel: true,
  multiTeam: true,
};

const EXPIRED_LIMITS: TrialLimits = {
  crmContacts: 10,
  bookings: 5,
  aiCalendar: false,
  aiPricingUses: 0,
  aiFollowUps: 0,
  advancedCrm: false,
  voiceAssistant: false,
  whiteLabel: false,
  multiTeam: false,
};

export function useTrialLimits() {
  const { subscription, isTrialing, isExpired, isActive } = useSubscription();

  if (isExpired) return { limits: EXPIRED_LIMITS, isTrial: false, isExpired: true, isPaid: false };
  if (isTrialing) return { limits: TRIAL_LIMITS, isTrial: true, isExpired: false, isPaid: false };
  if (isActive && subscription?.plan !== "trial") return { limits: FULL_ACCESS, isTrial: false, isExpired: false, isPaid: true };

  // fallback for active trial plan
  return { limits: TRIAL_LIMITS, isTrial: true, isExpired: false, isPaid: false };
}
