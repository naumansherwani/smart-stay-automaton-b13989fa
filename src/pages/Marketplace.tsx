import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search, MapPin, Star, Crown, MessageSquare, Plus, Filter } from "lucide-react";
import { toast } from "sonner";

interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  category: string | null;
  industry: string | null;
  location: string | null;
  is_featured: boolean | null;
  created_at: string;
  profiles?: { display_name: string | null; company_name: string | null; avatar_url: string | null; verified: boolean | null } | null;
}

const CATEGORIES = [
  "Consulting", "Development", "Design", "Marketing", "Finance",
  "Legal", "Healthcare", "Education", "Logistics", "Events",
  "Real Estate", "Fitness", "Travel", "Other"
];

const Marketplace = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [category]);

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from("service_listings")
      .select("*, profiles!service_listings_user_id_fkey(display_name, company_name, avatar_url, verified)")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) {
      // Fallback without join if FK doesn't exist
      const { data: fallbackData } = await supabase
        .from("service_listings")
        .select("*")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      setListings((fallbackData as Listing[]) || []);
    } else {
      setListings((data as unknown as Listing[]) || []);
    }
    setLoading(false);
  };

  const filteredListings = listings.filter(l =>
    !search || 
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.description?.toLowerCase().includes(search.toLowerCase()) ||
    l.location?.toLowerCase().includes(search.toLowerCase())
  );

  const sendInquiry = async () => {
    if (!user || !selectedListing || !inquiryMessage.trim()) return;

    // Create inquiry
    const { error: inquiryError } = await supabase
      .from("listing_inquiries")
      .insert({
        listing_id: selectedListing.id,
        sender_id: user.id,
        message: inquiryMessage.trim(),
      });

    if (inquiryError) {
      toast.error("Failed to send inquiry");
      return;
    }

    // Create conversation
    const { data: convo, error: convoError } = await supabase
      .from("conversations")
      .insert({
        listing_id: selectedListing.id,
        type: "deal_based",
      })
      .select()
      .single();

    if (convoError || !convo) {
      toast.error("Failed to create conversation");
      return;
    }

    // Add both participants
    await supabase.from("conversation_participants").insert([
      { conversation_id: convo.id, user_id: user.id },
      { conversation_id: convo.id, user_id: selectedListing.user_id },
    ]);

    // Send first message
    await supabase.from("messages").insert({
      conversation_id: convo.id,
      sender_id: user.id,
      content: inquiryMessage.trim(),
    });

    toast.success("Inquiry sent! Check Messages for response.");
    setInquiryMessage("");
    setInquiryOpen(false);
    setSelectedListing(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Logo size="lg" showName />
            <span className="text-lg font-bold text-foreground">Marketplace</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/messages")}>
              <MessageSquare className="w-4 h-4 mr-1" /> Messages
            </Button>
            <Button className="bg-gradient-primary text-primary-foreground" size="sm" onClick={() => navigate("/my-listings")}>
              <Plus className="w-4 h-4 mr-1" /> My Listings
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search services, locations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <p className="text-muted-foreground text-lg">No listings found</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to list your service!</p>
              <Button className="mt-4 bg-gradient-primary" onClick={() => navigate("/my-listings")}>
                <Plus className="w-4 h-4 mr-1" /> Create Listing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map(listing => (
              <Card 
                key={listing.id} 
                className={`group hover:shadow-lg transition-all cursor-pointer ${
                  listing.is_featured ? "ring-2 ring-primary/50 shadow-md" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {listing.is_featured && (
                        <Badge className="mb-2 bg-gradient-primary text-primary-foreground">
                          <Crown className="w-3 h-3 mr-1" /> Featured
                        </Badge>
                      )}
                      <CardTitle className="text-base line-clamp-2">{listing.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {listing.description || "No description"}
                  </p>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {listing.category && (
                      <Badge variant="secondary" className="text-xs">{listing.category}</Badge>
                    )}
                    {listing.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {listing.location}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm font-semibold text-foreground">
                      {listing.price_min && listing.price_max
                        ? `$${listing.price_min} - $${listing.price_max}`
                        : listing.price_min
                        ? `From $${listing.price_min}`
                        : "Contact for price"}
                    </div>

                    {listing.profiles?.verified && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Star className="w-3 h-3 fill-primary text-primary" /> Verified
                      </Badge>
                    )}
                  </div>

                  {user && listing.user_id !== user.id && (
                    <Button
                      size="sm"
                      className="w-full bg-gradient-primary text-primary-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedListing(listing);
                        setInquiryOpen(true);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" /> Send Inquiry
                    </Button>
                  )}

                  {user && listing.user_id === user.id && (
                    <Badge variant="outline" className="w-full justify-center">Your Listing</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Inquiry Dialog */}
      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Inquiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{selectedListing?.title}</p>
              <p className="text-xs text-muted-foreground">{selectedListing?.category} • {selectedListing?.location}</p>
            </div>
            <Textarea
              placeholder="Hi, I'm interested in your service. Could you share more details about..."
              value={inquiryMessage}
              onChange={e => setInquiryMessage(e.target.value)}
              rows={4}
            />
            <Button 
              className="w-full bg-gradient-primary" 
              onClick={sendInquiry}
              disabled={!inquiryMessage.trim()}
            >
              Send Inquiry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
