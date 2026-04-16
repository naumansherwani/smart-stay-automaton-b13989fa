import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface EventRecord {
  id: string;
  name: string;
  venue_name: string;
  event_date: string;
  event_time: string;
  duration: string;
  category: string;
  capacity: number;
  sold: number;
  base_price: number;
  current_price: number;
  status: string;
  demand: string;
  revenue: number;
  price_overridden: boolean;
  performers: string[];
  image: string;
  created_at: string;
}

export interface EventBookingRecord {
  id: string;
  event_id: string | null;
  event_name: string;
  customer_name: string;
  email: string;
  tickets: number;
  ticket_type: string;
  total_paid: number;
  booked_at: string;
  status: string;
}

export interface VenueRecord {
  id: string;
  name: string;
  type: string;
  capacity: number;
  amenities: string[];
  status: string;
  events_this_month: number;
  utilization: number;
}

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [bookings, setBookings] = useState<EventBookingRecord[]>([]);
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [evRes, bkRes, vnRes] = await Promise.all([
        supabase.from("events").select("*").order("created_at", { ascending: false }),
        supabase.from("event_bookings").select("*").order("booked_at", { ascending: false }),
        supabase.from("venues").select("*").order("name"),
      ]);
      if (evRes.data) setEvents(evRes.data as EventRecord[]);
      if (bkRes.data) setBookings(bkRes.data as EventBookingRecord[]);
      if (vnRes.data) setVenues(vnRes.data as VenueRecord[]);
    } catch (e) {
      console.error("Failed to fetch events data", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addEvent = async (data: Partial<EventRecord>) => {
    if (!user) return;
    const { error } = await supabase.from("events").insert({ ...data, user_id: user.id } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Event created");
    fetchAll();
  };

  const addBooking = async (data: Partial<EventBookingRecord>) => {
    if (!user) return;
    const { error } = await supabase.from("event_bookings").insert({ ...data, user_id: user.id } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Booking created");
    fetchAll();
  };

  const addVenue = async (data: Partial<VenueRecord>) => {
    if (!user) return;
    const { error } = await supabase.from("venues").insert({ ...data, user_id: user.id } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Venue added");
    fetchAll();
  };

  return { events, bookings, venues, loading, refetch: fetchAll, addEvent, addBooking, addVenue };
}