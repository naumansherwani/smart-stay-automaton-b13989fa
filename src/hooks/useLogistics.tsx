import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface DeliveryRecord {
  id: string;
  tracking: string;
  origin: string;
  destination: string;
  customer: string;
  weight: string;
  status: string;
  priority: string;
  driver_id: string | null;
  driver_name: string;
  vehicle_id: string | null;
  time_slot: string;
  eta: string;
  created_at: string;
}

export interface LogisticsVehicleRecord {
  id: string;
  name: string;
  type: string;
  plate: string;
  capacity: string;
  fuel: number;
  status: string;
  last_service: string | null;
  created_at: string;
}

export interface LogisticsDriverRecord {
  id: string;
  name: string;
  phone: string;
  license: string;
  status: string;
  rating: number;
  deliveries_today: number;
  zone: string;
  created_at: string;
}

export function useLogistics() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [vehicles, setVehicles] = useState<LogisticsVehicleRecord[]>([]);
  const [drivers, setDrivers] = useState<LogisticsDriverRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [delRes, vehRes, drvRes] = await Promise.all([
        supabase.from("deliveries").select("*").order("created_at", { ascending: false }),
        supabase.from("logistics_vehicles").select("*").order("name"),
        supabase.from("logistics_drivers").select("*").order("name"),
      ]);
      if (delRes.data) setDeliveries(delRes.data as DeliveryRecord[]);
      if (vehRes.data) setVehicles(vehRes.data as LogisticsVehicleRecord[]);
      if (drvRes.data) setDrivers(drvRes.data as LogisticsDriverRecord[]);
    } catch (e) {
      console.error("Failed to fetch logistics data", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addDelivery = async (data: Partial<DeliveryRecord>) => {
    if (!user) return;
    const { error } = await supabase.from("deliveries").insert({ ...data, user_id: user.id } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Delivery created");
    fetchAll();
  };

  const addVehicle = async (data: Partial<LogisticsVehicleRecord>) => {
    if (!user) return;
    const { error } = await supabase.from("logistics_vehicles").insert({ ...data, user_id: user.id } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Vehicle added");
    fetchAll();
  };

  const addDriver = async (data: Partial<LogisticsDriverRecord>) => {
    if (!user) return;
    const { error } = await supabase.from("logistics_drivers").insert({ ...data, user_id: user.id } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Driver added");
    fetchAll();
  };

  return { deliveries, vehicles, drivers, loading, refetch: fetchAll, addDelivery, addVehicle, addDriver };
}