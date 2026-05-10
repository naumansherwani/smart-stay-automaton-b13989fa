import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeShim } from "@/lib/replitApi";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MessageSquare, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      const payload = {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        subject: String(fd.get("subject") || ""),
        message: String(fd.get("message") || ""),
      };
      const { data, error } = await invokeShim<{ ok?: boolean; error?: string }>("contact-form", { body: payload });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || "Failed to send message");
      setSubmitted(true);
      toast.success("Message sent! Check your inbox for confirmation.");
    } catch (err: any) {
      const msg = err?.message || "Failed to send message";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)]">
      <Navbar />
      <main className="container pt-24 pb-16 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Get in Touch</h1>
          <p className="text-[hsl(213,97%,87%)]/70 max-w-lg mx-auto">
            Have questions about HostFlow AI? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-[hsl(222,40%,14%)] border-[hsl(217,91%,60%)]/20 text-center">
            <CardContent className="pt-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-white">Message Us</h3>
              <p className="text-sm text-[hsl(213,97%,87%)]/70">Use the form below — we'll reply by email.</p>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(222,40%,14%)] border-[hsl(217,91%,60%)]/20 text-center">
            <CardContent className="pt-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-white">WhatsApp</h3>
              <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Chat with us</a>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(222,40%,14%)] border-[hsl(217,91%,60%)]/20 text-center">
            <CardContent className="pt-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-white">Response Time</h3>
              <p className="text-sm text-[hsl(213,97%,87%)]/70">Within 24 hours</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[hsl(222,40%,14%)] border-[hsl(217,91%,60%)]/20 max-w-2xl mx-auto">
          <CardContent className="pt-6">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle className="w-16 h-16 text-primary mx-auto" />
                <h3 className="text-xl font-bold text-white">Message Sent!</h3>
                <p className="text-[hsl(213,97%,87%)]/70">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                <Button onClick={() => setSubmitted(false)} variant="outline" className="border-primary/40 text-primary">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    {errorMsg}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Name</Label>
                    <Input id="name" name="name" required placeholder="Your name" className="bg-[hsl(222,47%,11%)] border-[hsl(217,91%,60%)]/20 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="you@example.com" className="bg-[hsl(222,47%,11%)] border-[hsl(217,91%,60%)]/20 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-white">Subject</Label>
                  <Input id="subject" name="subject" required placeholder="How can we help?" className="bg-[hsl(222,47%,11%)] border-[hsl(217,91%,60%)]/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white">Message</Label>
                  <Textarea id="message" name="message" required rows={5} placeholder="Tell us more..." className="bg-[hsl(222,47%,11%)] border-[hsl(217,91%,60%)]/20 text-white resize-none" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
