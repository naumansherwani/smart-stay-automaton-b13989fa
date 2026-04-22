import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { logCheckoutEvent } from "@/lib/checkoutTracking";

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: {
    priceId: string;
    quantity?: number;
    customerEmail?: string;
    customData?: Record<string, string>;
    successUrl?: string;
    discountCode?: string;
  }) => {
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      const userId = options.customData?.userId || null;
      // Log checkout opened
      void logCheckoutEvent("opened", {
        plan: options.priceId,
        priceId: options.priceId,
        discountCode: options.discountCode,
        userId,
      });

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: options.quantity || 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: options.customData,
        ...(options.discountCode ? { discountCode: options.discountCode } : {}),
        settings: {
          displayMode: "overlay",
          successUrl: options.successUrl || `${window.location.origin}/dashboard`,
          allowLogout: false,
          variant: "one-page",
        },
        eventCallback: (ev: any) => {
          if (ev?.name === "checkout.completed") {
            void logCheckoutEvent("completed", {
              plan: options.priceId,
              priceId: options.priceId,
              discountCode: options.discountCode,
              userId,
            });
          } else if (ev?.name === "checkout.closed") {
            void logCheckoutEvent("abandoned", {
              plan: options.priceId,
              priceId: options.priceId,
              userId,
            });
          }
        },
      });
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}