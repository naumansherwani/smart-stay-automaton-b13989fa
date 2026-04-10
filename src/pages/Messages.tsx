import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, MessageSquare, User } from "lucide-react";
import { format } from "date-fns";

interface Conversation {
  id: string;
  listing_id: string | null;
  last_message_at: string | null;
  created_at: string;
  listing_title?: string;
  other_user_name?: string;
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean | null;
  created_at: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  useEffect(() => {
    if (activeConvo) {
      fetchMessages(activeConvo);
      const channel = supabase
        .channel(`messages-${activeConvo}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvo}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [activeConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    // Get participant records
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user!.id);

    if (!participations?.length) { setLoading(false); return; }

    const convoIds = participations.map(p => p.conversation_id);
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convoIds)
      .order("last_message_at", { ascending: false });

    if (!convos) { setLoading(false); return; }

    // Enrich with listing titles and other user names
    const enriched: Conversation[] = [];
    for (const c of convos) {
      let listing_title = "";
      if (c.listing_id) {
        listing_title = "Conversation";
      }

      // Get other participant name
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", c.id)
        .neq("user_id", user!.id);

      let other_user_name = "Unknown";
      if (participants?.[0]) {
        const { data: profile } = await supabase
          .from("profiles_public")
          .select("display_name, company_name")
          .eq("user_id", participants[0].user_id)
          .single();
        other_user_name = profile?.company_name || profile?.display_name || "User";
      }

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      enriched.push({
        ...c,
        listing_title,
        other_user_name,
        last_message: lastMsg?.content || "",
      });
    }

    setConversations(enriched);
    setLoading(false);
  };

  const fetchMessages = async (convoId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);

    // Mark as read
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", convoId)
      .eq("user_id", user!.id);
  };

  const sendMessage = async () => {
    if (!user || !activeConvo || !newMessage.trim()) return;

    await supabase.from("messages").insert({
      conversation_id: activeConvo,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    // Update last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeConvo);

    setNewMessage("");
  };

  const activeConversation = conversations.find(c => c.id === activeConvo);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Logo size="lg" showName />
            <span className="text-lg font-bold text-foreground">Messages</span>
          </div>
        </div>
      </header>

      <div className="flex-1 container py-4 flex gap-4 max-h-[calc(100vh-4rem)]">
        {/* Conversations sidebar */}
        <div className={`w-full md:w-80 flex-shrink-0 ${activeConvo ? "hidden md:block" : ""}`}>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-2">
              {loading ? (
                [1,2,3].map(i => (
                  <Card key={i} className="animate-pulse p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </Card>
                ))
              ) : conversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start a conversation from your dashboard</p>
                  <Button className="mt-3" variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                conversations.map(c => (
                  <Card
                    key={c.id}
                    className={`p-3 cursor-pointer transition-all hover:bg-accent/10 ${
                      activeConvo === c.id ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setActiveConvo(c.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{c.other_user_name}</p>
                        {c.listing_title && (
                          <Badge variant="secondary" className="text-[10px] mb-1">{c.listing_title}</Badge>
                        )}
                        <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {c.last_message_at ? format(new Date(c.last_message_at), "MMM d") : ""}
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!activeConvo ? "hidden md:flex" : ""}`}>
          {activeConvo ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConvo(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{activeConversation?.other_user_name}</p>
                  {activeConversation?.listing_title && (
                    <p className="text-xs text-muted-foreground">Re: {activeConversation.listing_title}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3 pb-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        msg.sender_id === user?.id
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {format(new Date(msg.created_at), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2 pt-3 border-t border-border">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  className="bg-gradient-primary"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
