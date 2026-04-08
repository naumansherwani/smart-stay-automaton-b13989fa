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
}

export interface Property {
  id: string;
  name: string;
  location: string;
  basePrice: number;
  maxGuests: number;
  image?: string;
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
  type: "double-booking" | "check-in" | "pricing" | "sync";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const DEMO_PROPERTIES: Property[] = [
  { id: "p1", name: "Oceanfront Villa", location: "Malibu, CA", basePrice: 350, maxGuests: 8 },
  { id: "p2", name: "Downtown Loft", location: "New York, NY", basePrice: 180, maxGuests: 4 },
  { id: "p3", name: "Mountain Cabin", location: "Aspen, CO", basePrice: 275, maxGuests: 6 },
];

const today = new Date();
const d = (offset: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  return date;
};

const DEMO_BOOKINGS: Booking[] = [
  { id: "b1", propertyName: "Oceanfront Villa", guestName: "Sarah Johnson", platform: "airbnb", checkIn: d(-2), checkOut: d(3), totalPrice: 1750, status: "confirmed", nightlyRate: 350 },
  { id: "b2", propertyName: "Downtown Loft", guestName: "Mike Chen", platform: "booking", checkIn: d(5), checkOut: d(8), totalPrice: 540, status: "confirmed", nightlyRate: 180 },
  { id: "b3", propertyName: "Mountain Cabin", guestName: "Emily Davis", platform: "vrbo", checkIn: d(10), checkOut: d(15), totalPrice: 1375, status: "pending", nightlyRate: 275 },
  { id: "b4", propertyName: "Oceanfront Villa", guestName: "James Wilson", platform: "direct", checkIn: d(7), checkOut: d(12), totalPrice: 1750, status: "confirmed", nightlyRate: 350 },
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

export function useBookingStore() {
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS);
  const [properties] = useState<Property[]>(DEMO_PROPERTIES);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: "a1", type: "check-in", title: "Upcoming Check-in", message: "Sarah Johnson checks in today at Oceanfront Villa", timestamp: new Date(), read: false },
    { id: "a2", type: "pricing", title: "Price Recommendation", message: "Consider raising prices for Mountain Cabin next weekend (+15%)", timestamp: d(-1), read: false },
  ]);

  const addBooking = useCallback((booking: Omit<Booking, "id">) => {
    const conflicts = bookings.filter(
      b => b.propertyName === booking.propertyName && b.status !== "cancelled" && datesOverlap(b, booking)
    );
    if (conflicts.length > 0) {
      const alert: Alert = {
        id: `a-${Date.now()}`,
        type: "double-booking",
        title: "Double Booking Prevented!",
        message: `Cannot book ${booking.propertyName} for ${booking.guestName}: conflicts with ${conflicts[0].guestName}'s reservation (${conflicts[0].checkIn.toLocaleDateString()} - ${conflicts[0].checkOut.toLocaleDateString()})`,
        timestamp: new Date(),
        read: false,
      };
      setAlerts(prev => [alert, ...prev]);
      return { success: false, conflict: conflicts[0] };
    }
    const newBooking: Booking = { ...booking, id: `b-${Date.now()}` };
    setBookings(prev => [...prev, newBooking]);
    setAlerts(prev => [
      { id: `a-${Date.now()}`, type: "sync", title: "Booking Synced", message: `New booking for ${booking.guestName} at ${booking.propertyName} synced across all calendars`, timestamp: new Date(), read: false },
      ...prev,
    ]);
    return { success: true, booking: newBooking };
  }, [bookings]);

  const markAlertRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, []);

  return { bookings, properties, alerts, addBooking, markAlertRead };
}
