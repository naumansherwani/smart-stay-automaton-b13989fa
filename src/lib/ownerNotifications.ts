import { supabase } from "@/integrations/supabase/client";

const OWNER_EMAIL = "naumankhansherwani@gmail.com";

export const sendOwnerNotification = async ({
  eventType,
  eventTitle,
  details,
}: {
  eventType: string;
  eventTitle: string;
  details: string;
}) => {
  try {
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "admin-notification",
        recipientEmail: OWNER_EMAIL,
        idempotencyKey: `admin-${eventType}-${Date.now()}`,
        templateData: {
          eventType,
          eventTitle,
          details,
          timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }),
        },
      },
    });
  } catch (err) {
    console.error("Failed to send owner notification:", err);
  }
};
