import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { CheckCircle2, MessageCircle, Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";
import {
  ApiError,
  requestWhatsAppOtp,
  verifyWhatsAppOtp,
  getWhatsAppConnection,
  disconnectWhatsApp,
  type WhatsAppConnection,
} from "@/lib/api";

type Stage = "idle" | "otp" | "connected";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Phone number too long")
  .regex(/^[+0-9\s-]+$/, "Only digits, spaces, +, - allowed");

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function WhatsAppConnect() {
  const [stage, setStage] = useState<Stage>("idle");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [conn, setConn] = useState<WhatsAppConnection | null>(null);
  const timerRef = useRef<number | null>(null);

  const startCountdown = (seconds: number) => {
    setSecondsLeft(seconds);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000) as unknown as number;
  };

  // Initial status check on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getWhatsAppConnection();
        if (!mounted) return;
        if (data.connected) {
          setConn(data);
          setStage("connected");
        }
      } catch {
        /* silent — handleApiError already covers global cases */
      } finally {
        if (mounted) setBootstrapping(false);
      }
    })();
    return () => {
      mounted = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const sendOtp = async () => {
    setPhoneError(null);
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setPhoneError(parsed.error.issues[0]?.message || "Invalid phone");
      return;
    }
    setLoading(true);
    try {
      const res = await requestWhatsAppOtp(parsed.data);
      setStage("otp");
      setOtp("");
      setOtpError(null);
      setAttemptsLeft(null);
      startCountdown(res.expiresIn || 60);
      toast.success("Verification code sent on WhatsApp");
    } catch (e) {
      if (e instanceof ApiError) {
        switch (e.code) {
          case "INVALID_PHONE":
            setPhoneError(e.message || "Invalid phone format");
            break;
          case "ALREADY_CONNECTED":
            toast.error("Already connected. Disconnect first.");
            // Refresh status
            try {
              const data = await getWhatsAppConnection();
              setConn(data);
              if (data.connected) setStage("connected");
            } catch { /* noop */ }
            break;
          case "OTP_COOLDOWN":
            toast.error(e.message || "Please wait before requesting another code.");
            break;
          case "WHATSAPP_SEND_FAILED":
            toast.error("Couldn't send code. Check the number and try again.");
            break;
          case "CRM_PREMIUM_ONLY":
            // Already handled globally (upgrade modal)
            break;
          default:
            toast.error(e.message || "Could not send verification code.");
        }
      } else {
        toast.error("Could not send verification code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    setOtpError(null);
    try {
      const res = await verifyWhatsAppOtp(otp);
      setConn({
        connected: true,
        phone: res.phone,
        connectedAt: new Date().toISOString(),
      });
      setStage("connected");
      setOtp("");
      toast.success("WhatsApp connected");
    } catch (e) {
      if (e instanceof ApiError) {
        const remaining = (e.extras?.attempts_remaining as number | undefined) ??
          (e.extras?.attemptsRemaining as number | undefined);
        switch (e.code) {
          case "INVALID_CODE":
            setOtpError("Enter the full 6-digit code");
            break;
          case "WRONG_CODE":
            if (typeof remaining === "number") setAttemptsLeft(remaining);
            setOtpError(
              typeof remaining === "number"
                ? `Wrong code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
                : "Wrong code. Please try again."
            );
            break;
          case "NO_PENDING_OTP":
            toast.error("Please request a new code.");
            setStage("idle");
            break;
          case "OTP_EXPIRED":
            setOtpError("Code expired. Request a new one.");
            setSecondsLeft(0);
            break;
          case "OTP_MAX_ATTEMPTS":
            setOtpError("Too many wrong attempts. Request a new code.");
            setSecondsLeft(0);
            break;
          default:
            setOtpError(e.message || "Verification failed.");
        }
      } else {
        setOtpError("Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnectWhatsApp();
      setConn(null);
      setStage("idle");
      setPhone("");
      toast.success("WhatsApp disconnected");
    } catch {
      toast.error("Could not disconnect. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-500" />
          WhatsApp Integration
        </CardTitle>
        <CardDescription>
          Connect your WhatsApp number to send and receive customer messages directly from CRM.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bootstrapping ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Checking status…
          </div>
        ) : stage === "connected" && conn ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{conn.phone}</p>
                {conn.connectedAt && (
                  <p className="text-xs text-muted-foreground">
                    Connected {formatDate(conn.connectedAt)}
                  </p>
                )}
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                Active
              </Badge>
            </div>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={loading}
              className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4 mr-2" />
              )}
              Disconnect
            </Button>
          </div>
        ) : stage === "otp" ? (
          <div className="space-y-3">
            <Label className="text-sm">Enter the 6-digit code we sent on WhatsApp</Label>
            <InputOTP maxLength={6} value={otp} onChange={(v) => { setOtp(v); setOtpError(null); }}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {otpError && <p className="text-xs text-rose-500">{otpError}</p>}
            {attemptsLeft !== null && !otpError && (
              <p className="text-xs text-muted-foreground">{attemptsLeft} attempts remaining</p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button onClick={verify} disabled={loading || otp.length !== 6}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Verify
              </Button>
              <Button
                variant="ghost"
                onClick={sendOtp}
                disabled={loading || secondsLeft > 0}
              >
                {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend code"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStage("idle"); setOtp(""); setOtpError(null); }}
              >
                Change number
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="wa-phone">WhatsApp Number</Label>
              <Input
                id="wa-phone"
                type="tel"
                placeholder="+923001234567"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
                maxLength={20}
                inputMode="tel"
                autoComplete="tel"
              />
              {phoneError && <p className="text-xs text-rose-500 mt-1">{phoneError}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                International format (e.g. +923001234567) or local Pakistani (03001234567).
              </p>
            </div>
            <Button onClick={sendOtp} disabled={loading || !phone.trim()}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Send Verification Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}