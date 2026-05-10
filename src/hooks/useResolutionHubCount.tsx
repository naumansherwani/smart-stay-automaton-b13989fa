import { useEffect, useState } from "react";
import { replitCall } from "@/lib/replitApi";

export interface ResolutionHubCount {
  active: number;
  sherlock_active: number;
  total_open: number;
}

/**
 * Polls GET /api/resolution-hub/count every 15s.
 * Returns null until first fetch completes.
 */
export function useResolutionHubCount(intervalMs = 15000): ResolutionHubCount | null {
  const [count, setCount] = useState<ResolutionHubCount | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await replitCall<ResolutionHubCount>(
        "/resolution-hub/count",
        undefined,
        { method: "GET" },
      );
      if (!alive) return;
      if (res.data) {
        setCount({
          active: Number(res.data.active ?? 0),
          sherlock_active: Number(res.data.sherlock_active ?? 0),
          total_open: Number(res.data.total_open ?? 0),
        });
      }
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return count;
}