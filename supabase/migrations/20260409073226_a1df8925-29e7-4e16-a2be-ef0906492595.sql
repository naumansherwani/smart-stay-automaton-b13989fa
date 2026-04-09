
-- Extend profiles table with marketplace fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Allow public read on profiles for marketplace
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Drop the old restrictive select policies that conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Service Listings
CREATE TABLE public.service_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_min NUMERIC DEFAULT 0,
  price_max NUMERIC DEFAULT 0,
  category TEXT,
  industry TEXT,
  location TEXT,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can browse listings"
ON public.service_listings FOR SELECT TO authenticated
USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create own listings"
ON public.service_listings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
ON public.service_listings FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
ON public.service_listings FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_listings_industry ON public.service_listings(industry);
CREATE INDEX idx_listings_category ON public.service_listings(category);
CREATE INDEX idx_listings_status ON public.service_listings(status);
CREATE INDEX idx_listings_featured ON public.service_listings(is_featured) WHERE is_featured = true;

-- Listing Inquiries
CREATE TABLE public.listing_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.service_listings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender and listing owner can view inquiries"
ON public.listing_inquiries FOR SELECT TO authenticated
USING (
  sender_id = auth.uid() OR
  listing_id IN (SELECT id FROM public.service_listings WHERE user_id = auth.uid())
);

CREATE POLICY "Authenticated users can create inquiries"
ON public.listing_inquiries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Listing owner can update inquiry status"
ON public.listing_inquiries FOR UPDATE TO authenticated
USING (listing_id IN (SELECT id FROM public.service_listings WHERE user_id = auth.uid()));

-- Conversations
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.service_listings(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'deal_based',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversation Participants
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participations"
ON public.conversation_participants FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can join conversations"
ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation"
ON public.conversation_participants FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Conversations policy (only participants)
CREATE POLICY "Participants can view conversations"
ON public.conversations FOR SELECT TO authenticated
USING (
  id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (true);

-- Messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT TO authenticated
USING (
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Updated_at triggers
CREATE TRIGGER update_service_listings_updated_at
BEFORE UPDATE ON public.service_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
