import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, MailX } from "lucide-react";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        if (data.valid === false && data.reason === "already_unsubscribed") { setStatus("already"); return; }
        if (data.valid) { setStatus("valid"); return; }
        setStatus("invalid");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch { setStatus("error"); }
    finally { setProcessing(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />}
        {status === "valid" && (
          <>
            <MailX className="w-16 h-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Unsubscribe</h1>
            <p className="text-muted-foreground">Are you sure you want to unsubscribe from HostFlow AI emails?</p>
            <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
              {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Confirm Unsubscribe"}
            </Button>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Unsubscribed</h1>
            <p className="text-muted-foreground">You have been successfully unsubscribed.</p>
          </>
        )}
        {status === "already" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Already Unsubscribed</h1>
            <p className="text-muted-foreground">This email has already been unsubscribed.</p>
          </>
        )}
        {status === "invalid" && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Invalid Link</h1>
            <p className="text-muted-foreground">This unsubscribe link is invalid or expired.</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Something Went Wrong</h1>
            <p className="text-muted-foreground">Please try again later.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
