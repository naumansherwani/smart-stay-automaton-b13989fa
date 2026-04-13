
# CalendarAI Marketplace & Chat Implementation Plan

## Revenue Model: Subscription + Featured Listings (No Commission)
- Primary income: Monthly subscriptions (Basic $15 / Standard $39 / Premium $99)
- Secondary income: Featured Listings (pay to promote services/profile)
- Marketplace access: Free for all subscribers
- No commission on deals = users stay on platform

## Phase 1: Database Schema (Migration)
### New Tables:
1. **service_listings** - Users list their services/products
   - title, description, price_range, category, industry, location
   - is_featured (paid promotion), featured_until
   - status (active/paused/draft)
   - user_id (owner)

2. **listing_inquiries** - Deal/inquiry requests
   - listing_id, sender_id, message, status (pending/accepted/rejected)
   - Privacy: only sender and listing owner can see

3. **conversations** - Chat threads (created from inquiries)
   - type: deal_based (from inquiry) 
   - participants stored separately

4. **conversation_participants** - Who's in which conversation
   - conversation_id, user_id, last_read_at

5. **messages** - Chat messages
   - conversation_id, sender_id, content, read status
   - Realtime enabled for live chat

6. **profile extensions** - Industry-specific extra fields
   - Add to profiles: bio, website, address, social_links (jsonb), business_hours (jsonb), certifications (text[]), gallery_urls (text[]), verified (boolean)

### RLS Policies:
- Listings: Public read (all authenticated), owner CRUD
- Inquiries: Only sender and listing owner
- Messages: Only conversation participants
- Profiles: Public read (for marketplace), owner update

## Phase 2: Frontend Pages & Components
1. **Marketplace Page** (`/marketplace`)
   - Browse all service listings by industry
   - Search, filter by category/location/price
   - Featured listings appear at top (highlighted)

2. **Listing Detail Page** (`/marketplace/:id`)
   - Service details, provider profile
   - "Send Inquiry" button → creates inquiry + conversation

3. **My Listings Page** (in dashboard)
   - Create/edit/pause listings
   - View inquiries received
   - "Promote to Featured" button (links to payment)

4. **Chat/Messages Page** (`/messages`)
   - Conversation list (sidebar)
   - Real-time messaging
   - Deal-based: shows linked listing info

5. **Enhanced Profile Page**
   - Industry-specific fields
   - Public profile view for marketplace
   - Services gallery

## Phase 3: Featured Listings Payment
- Use manual payment approval flow
- Offer featured listing upgrades via payment request
- Feature a listing for 7/30 days after manual confirmation
- Auto-expire featured status

## Privacy & Security
- Chat only through inquiries (no random DMs)
- Messages encrypted in transit (Supabase default)
- Block/report functionality
- RLS ensures data isolation
- No personal info shared until user chooses to
