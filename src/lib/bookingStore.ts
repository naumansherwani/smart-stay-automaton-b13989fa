import { useState, useCallback } from "react";

export interface Booking {
  id: string;
  propertyName: string;
  guestName: string;
  platform: "airbnb" | "booking" | "vrbo" | "direct";
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled";
  nightlyRate: number;
  guestScore?: number;
  repeatGuest?: boolean;
  cleaningFee?: number;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  basePrice: number;
  maxGuests: number;
  image?: string;
  cleaningCost: number;
  turnaroundHours: number;
}

export interface PriceSuggestion {
  date: Date;
  basePrice: number;
  suggestedPrice: number;
  reasoning: string;
  factors: { name: string; impact: number }[];
}

export interface Alert {
  id: string;
  type: "double-booking" | "check-in" | "pricing" | "sync" | "gap-night" | "guest-score";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface GapNight {
  propertyName: string;
  gapStart: Date;
  gapEnd: Date;
  gapNights: number;
  suggestedDiscount: number;
  beforeBooking: Booking;
  afterBooking: Booking;
}

export interface CompetitorPrice {
  name: string;
  avgNightly: number;
  occupancy: number;
  rating: number;
  trend: "up" | "down" | "stable";
}

export interface RevenueDay {
  date: Date;
  revenue: number;
  occupiedProperties: number;
  totalProperties: number;
}

export interface BookingVelocity {
  period: string;
  bookingsCount: number;
  revenue: number;
  avgLeadTime: number;
  trend: number;
}

const DEMO_PROPERTIES: Property[] = [
  { id: "p1", name: "Oceanfront Villa", location: "Malibu, CA", basePrice: 350, maxGuests: 8, cleaningCost: 120, turnaroundHours: 6 },
  { id: "p2", name: "Downtown Loft", location: "New York, NY", basePrice: 180, maxGuests: 4, cleaningCost: 65, turnaroundHours: 4 },
  { id: "p3", name: "Mountain Cabin", location: "Aspen, CO", basePrice: 275, maxGuests: 6, cleaningCost: 90, turnaroundHours: 5 },
];

const today = new Date();
const d = (offset: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  return date;
};

const DEMO_BOOKINGS: Booking[] = [
  { id: "b1", propertyName: "Oceanfront Villa", guestName: "Sarah Johnson", platform: "airbnb", checkIn: d(-2), checkOut: d(3), totalPrice: 1750, status: "confirmed", nightlyRate: 350, guestScore: 92, repeatGuest: true, cleaningFee: 120 },
  { id: "b2", propertyName: "Downtown Loft", guestName: "Mike Chen", platform: "booking", checkIn: d(5), checkOut: d(8), totalPrice: 540, status: "confirmed", nightlyRate: 180, guestScore: 78, repeatGuest: false, cleaningFee: 65 },
  { id: "b3", propertyName: "Mountain Cabin", guestName: "Emily Davis", platform: "vrbo", checkIn: d(10), checkOut: d(15), totalPrice: 1375, status: "pending", nightlyRate: 275, guestScore: 85, repeatGuest: false, cleaningFee: 90 },
  { id: "b4", propertyName: "Oceanfront Villa", guestName: "James Wilson", platform: "direct", checkIn: d(7), checkOut: d(12), totalPrice: 1750, status: "confirmed", nightlyRate: 350, guestScore: 45, repeatGuest: false, cleaningFee: 120 },
  { id: "b5", propertyName: "Downtown Loft", guestName: "Anna Kowalski", platform: "airbnb", checkIn: d(-10), checkOut: d(-7), totalPrice: 540, status: "confirmed", nightlyRate: 180, guestScore: 95, repeatGuest: true, cleaningFee: 65 },
  { id: "b6", propertyName: "Mountain Cabin", guestName: "David Park", platform: "booking", checkIn: d(18), checkOut: d(22), totalPrice: 1100, status: "confirmed", nightlyRate: 275, guestScore: 88, repeatGuest: false, cleaningFee: 90 },
  { id: "b7", propertyName: "Oceanfront Villa", guestName: "Lisa Brown", platform: "vrbo", checkIn: d(15), checkOut: d(19), totalPrice: 1400, status: "pending", nightlyRate: 350, guestScore: 62, repeatGuest: false, cleaningFee: 120 },
];

export function datesOverlap(a: { checkIn: Date; checkOut: Date }, b: { checkIn: Date; checkOut: Date }): boolean {
  return a.checkIn < b.checkOut && b.checkIn < a.checkOut;
}

export function getSeason(date: Date): "peak" | "high" | "shoulder" | "low" {
  const month = date.getMonth();
  if (month >= 5 && month <= 7) return "peak";
  if (month === 8 || month === 11) return "high";
  if (month >= 2 && month <= 4 || month === 9) return "shoulder";
  return "low";
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6;
}

export function calculateSmartPrice(basePrice: number, date: Date): PriceSuggestion {
  const factors: { name: string; impact: number }[] = [];
  let multiplier = 1;

  const season = getSeason(date);
  const seasonMultipliers = { peak: 0.35, high: 0.2, shoulder: 0, low: -0.15 };
  const seasonNames = { peak: "Peak Season", high: "High Season", shoulder: "Shoulder Season", low: "Low Season" };
  factors.push({ name: seasonNames[season], impact: seasonMultipliers[season] });
  multiplier += seasonMultipliers[season];

  if (isWeekend(date)) {
    factors.push({ name: "Weekend Premium", impact: 0.15 });
    multiplier += 0.15;
  } else {
    factors.push({ name: "Weekday", impact: -0.05 });
    multiplier -= 0.05;
  }

  const demandRandom = Math.sin(date.getTime() / 86400000) * 0.5 + 0.5;
  const demandImpact = demandRandom > 0.7 ? 0.1 : demandRandom < 0.3 ? -0.1 : 0;
  const demandLabel = demandImpact > 0 ? "High Demand" : demandImpact < 0 ? "Low Demand" : "Normal Demand";
  factors.push({ name: demandLabel, impact: demandImpact });
  multiplier += demandImpact;

  const suggestedPrice = Math.round(basePrice * multiplier);
  const reasoning = factors.filter(f => f.impact !== 0).map(f => `${f.name} (${f.impact > 0 ? "+" : ""}${Math.round(f.impact * 100)}%)`).join(", ");

  return { date, basePrice, suggestedPrice, reasoning: reasoning || "Base rate", factors };
}

export function calculateGuestScore(booking: Booking): { score: number; label: string; color: string; factors: string[] } {
  const score = booking.guestScore ?? 70;
  const factors: string[] = [];

  if (booking.repeatGuest) factors.push("Repeat guest (+15)");
  if (booking.platform === "airbnb") factors.push("Verified Airbnb profile (+10)");
  if (score >= 90) factors.push("Excellent review history");
  else if (score >= 70) factors.push("Good review history");
  else if (score < 60) factors.push("Limited reviews (caution)");

  const nights = Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (nights >= 7) factors.push("Long stay (+5 reliability)");
  if (nights === 1) factors.push("Single night (higher risk)");

  const label = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 55 ? "Fair" : "Caution";
  const color = score >= 85 ? "text-success" : score >= 70 ? "text-primary" : score >= 55 ? "text-warning" : "text-destructive";

  return { score, label, color, factors };
}

export function findGapNights(bookings: Booking[], propertyName: string): GapNight[] {
  const propBookings = bookings
    .filter(b => b.propertyName === propertyName && b.status !== "cancelled")
    .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());

  const gaps: GapNight[] = [];
  for (let i = 0; i < propBookings.length - 1; i++) {
    const current = propBookings[i];
    const next = propBookings[i + 1];
    const gapDays = Math.ceil((next.checkIn.getTime() - current.checkOut.getTime()) / (1000 * 60 * 60 * 24));
    if (gapDays > 0 && gapDays <= 3) {
      gaps.push({
        propertyName,
        gapStart: current.checkOut,
        gapEnd: next.checkIn,
        gapNights: gapDays,
        suggestedDiscount: gapDays === 1 ? 30 : gapDays === 2 ? 20 : 15,
        beforeBooking: current,
        afterBooking: next,
      });
    }
  }
  return gaps;
}

export function getCompetitorPrices(property: Property): CompetitorPrice[] {
  const seed = property.basePrice;
  return [
    { name: "Similar Listing A", avgNightly: Math.round(seed * 0.92), occupancy: 78, rating: 4.6, trend: "up" },
    { name: "Similar Listing B", avgNightly: Math.round(seed * 1.05), occupancy: 85, rating: 4.8, trend: "stable" },
    { name: "Similar Listing C", avgNightly: Math.round(seed * 0.88), occupancy: 65, rating: 4.3, trend: "down" },
    { name: "Area Average", avgNightly: Math.round(seed * 0.95), occupancy: 72, rating: 4.5, trend: "stable" },
  ];
}

export function getRevenueHeatmap(bookings: Booking[], days: number = 90): RevenueDay[] {
  const result: RevenueDay[] = [];
  for (let i = -30; i < days; i++) {
    const date = d(i);
    const dayBookings = bookings.filter(
      b => b.status !== "cancelled" && date >= b.checkIn && date < b.checkOut
    );
    result.push({
      date,
      revenue: dayBookings.reduce((sum, b) => sum + b.nightlyRate, 0),
      occupiedProperties: dayBookings.length,
      totalProperties: 3,
    });
  }
  return result;
}

export function getBookingVelocity(bookings: Booking[]): BookingVelocity[] {
  return [
    { period: "This Week", bookingsCount: 3, revenue: 3290, avgLeadTime: 12, trend: 15 },
    { period: "Last Week", bookingsCount: 2, revenue: 2080, avgLeadTime: 18, trend: -5 },
    { period: "2 Weeks Ago", bookingsCount: 4, revenue: 4150, avgLeadTime: 8, trend: 22 },
    { period: "3 Weeks Ago", bookingsCount: 1, revenue: 1100, avgLeadTime: 25, trend: -12 },
  ];
}

export function calculateTurnoverProfit(booking: Booking, property: Property): {
  grossRevenue: number;
  cleaningCost: number;
  platformFee: number;
  netProfit: number;
  profitPerNight: number;
  nights: number;
  margin: number;
} {
  const nights = Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const grossRevenue = booking.totalPrice;
  const cleaningCost = property.cleaningCost;
  const platformFees: Record<string, number> = { airbnb: 0.03, booking: 0.15, vrbo: 0.05, direct: 0 };
  const platformFee = Math.round(grossRevenue * (platformFees[booking.platform] || 0));
  const netProfit = grossRevenue - cleaningCost - platformFee;
  return { grossRevenue, cleaningCost, platformFee, netProfit, profitPerNight: Math.round(netProfit / nights), nights, margin: Math.round((netProfit / grossRevenue) * 100) };
}

export function useBookingStore() {
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS);
  const [properties] = useState<Property[]>(DEMO_PROPERTIES);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: "a1", type: "check-in", title: "Upcoming Check-in", message: "Sarah Johnson checks in today at Oceanfront Villa", timestamp: new Date(), read: false },
    { id: "a2", type: "pricing", title: "Price Recommendation", message: "Consider raising prices for Mountain Cabin next weekend (+15%)", timestamp: d(-1), read: false },
    { id: "a3", type: "gap-night", title: "Gap Night Opportunity", message: "1-night gap detected at Downtown Loft — suggest 30% discount to fill it", timestamp: d(-1), read: false },
    { id: "a4", type: "guest-score", title: "Low Guest Score Alert", message: "James Wilson (score: 45) booked Oceanfront Villa — review recommended", timestamp: new Date(), read: false },
  ]);

  const addBooking = useCallback((booking: Omit<Booking, "id">) => {
    // 1. Time overlap check
    const overlaps = bookings.filter(
      b => b.propertyName === booking.propertyName && b.status !== "cancelled" && datesOverlap(b, booking)
    );
    if (overlaps.length > 0) {
      const alert: Alert = {
        id: `a-${Date.now()}`,
        type: "double-booking",
        title: "🛡️ Double Booking Auto-Declined",
        message: `Cannot book ${booking.propertyName} for ${booking.guestName}: time overlap with ${overlaps[0].guestName}'s reservation (${overlaps[0].checkIn.toLocaleDateString()} – ${overlaps[0].checkOut.toLocaleDateString()}). AI prevented this conflict automatically.`,
        timestamp: new Date(),
        read: false,
      };
      setAlerts(prev => [alert, ...prev]);
      return { success: false, conflict: overlaps[0] };
    }

    // 2. Turnaround buffer check (same-day back-to-back)
    const property = properties.find(p => p.name === booking.propertyName);
    if (property) {
      const bufferMs = property.turnaroundHours * 60 * 60 * 1000;
      const turnaroundConflict = bookings.find(b => {
        if (b.propertyName !== booking.propertyName || b.status === "cancelled") return false;
        const gapAfter = booking.checkIn.getTime() - b.checkOut.getTime();
        const gapBefore = b.checkIn.getTime() - booking.checkOut.getTime();
        return (gapAfter >= 0 && gapAfter < bufferMs) || (gapBefore >= 0 && gapBefore < bufferMs);
      });
      if (turnaroundConflict) {
        const alert: Alert = {
          id: `a-${Date.now()}`,
          type: "double-booking",
          title: "⏱️ Turnaround Violation Declined",
          message: `Cannot book ${booking.propertyName} for ${booking.guestName}: insufficient turnaround time (${property.turnaroundHours}h required) after ${turnaroundConflict.guestName}'s checkout. AI auto-declined.`,
          timestamp: new Date(),
          read: false,
        };
        setAlerts(prev => [alert, ...prev]);
        return { success: false, conflict: turnaroundConflict };
      }
    }

    // 3. Success — create booking
    const newBooking: Booking = { ...booking, id: `b-${Date.now()}`, guestScore: Math.floor(Math.random() * 50) + 50 };
    setBookings(prev => [...prev, newBooking]);
    setAlerts(prev => [
      { id: `a-${Date.now()}`, type: "sync", title: "✅ Booking Synced", message: `New booking for ${booking.guestName} at ${booking.propertyName} synced across all calendars. No conflicts detected.`, timestamp: new Date(), read: false },
      ...prev,
    ]);
    return { success: true, booking: newBooking };
  }, [bookings, properties]);

  const markAlertRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, []);

  return { bookings, properties, alerts, addBooking, markAlertRead };
}
