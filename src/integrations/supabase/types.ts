export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          assigned_room: string | null
          assigned_staff: string[] | null
          check_in: string
          check_out: string
          cleaning_fee: number | null
          created_at: string
          guest_email: string | null
          guest_name: string
          guest_phone: string | null
          guest_score: number | null
          id: string
          metadata: Json | null
          nightly_rate: number | null
          notes: string | null
          platform: string | null
          reminder_sent: boolean | null
          repeat_guest: boolean | null
          rescheduled_from: string | null
          resource_id: string
          status: string
          timezone: string | null
          total_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_room?: string | null
          assigned_staff?: string[] | null
          check_in: string
          check_out: string
          cleaning_fee?: number | null
          created_at?: string
          guest_email?: string | null
          guest_name: string
          guest_phone?: string | null
          guest_score?: number | null
          id?: string
          metadata?: Json | null
          nightly_rate?: number | null
          notes?: string | null
          platform?: string | null
          reminder_sent?: boolean | null
          repeat_guest?: boolean | null
          rescheduled_from?: string | null
          resource_id: string
          status?: string
          timezone?: string | null
          total_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_room?: string | null
          assigned_staff?: string[] | null
          check_in?: string
          check_out?: string
          cleaning_fee?: number | null
          created_at?: string
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string | null
          guest_score?: number | null
          id?: string
          metadata?: Json | null
          nightly_rate?: number | null
          notes?: string | null
          platform?: string | null
          reminder_sent?: boolean | null
          repeat_guest?: boolean | null
          rescheduled_from?: string | null
          resource_id?: string
          status?: string
          timezone?: string | null
          total_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          listing_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_inquiries: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          message: string
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          message: string
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          message?: string
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_feature_limits: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          is_unlimited: boolean
          limit_value: number
          plan: Database["public"]["Enums"]["subscription_plan"]
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          is_unlimited?: boolean
          limit_value?: number
          plan: Database["public"]["Enums"]["subscription_plan"]
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          is_unlimited?: boolean
          limit_value?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          business_hours: Json | null
          certifications: string[] | null
          company_name: string | null
          created_at: string
          display_name: string | null
          gallery_urls: string[] | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"] | null
          phone: string | null
          social_links: Json | null
          updated_at: string
          user_id: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_hours?: Json | null
          certifications?: string[] | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          gallery_urls?: string[] | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          phone?: string | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_hours?: Json | null
          certifications?: string[] | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          gallery_urls?: string[] | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          phone?: string | null
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      railway_booking_passengers: {
        Row: {
          age: number | null
          booking_id: string
          coach_id: string | null
          created_at: string
          gender: string | null
          id: string
          passenger_name: string
          seat_id: string | null
          seat_number: string | null
          status: string | null
        }
        Insert: {
          age?: number | null
          booking_id: string
          coach_id?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          passenger_name: string
          seat_id?: string | null
          seat_number?: string | null
          status?: string | null
        }
        Update: {
          age?: number | null
          booking_id?: string
          coach_id?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          passenger_name?: string
          seat_id?: string | null
          seat_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "railway_booking_passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "railway_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "railway_booking_passengers_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "railway_coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "railway_booking_passengers_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "railway_seats"
            referencedColumns: ["id"]
          },
        ]
      }
      railway_bookings: {
        Row: {
          ai_price: number | null
          base_price: number | null
          booked_at: string | null
          booking_reference: string
          coach_class: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          final_price: number | null
          from_station_id: string
          from_stop_sequence: number
          id: string
          notes: string | null
          price_override: boolean | null
          schedule_id: string
          status: string | null
          to_station_id: string
          to_stop_sequence: number
          total_passengers: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_price?: number | null
          base_price?: number | null
          booked_at?: string | null
          booking_reference?: string
          coach_class?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          final_price?: number | null
          from_station_id: string
          from_stop_sequence: number
          id?: string
          notes?: string | null
          price_override?: boolean | null
          schedule_id: string
          status?: string | null
          to_station_id: string
          to_stop_sequence: number
          total_passengers?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_price?: number | null
          base_price?: number | null
          booked_at?: string | null
          booking_reference?: string
          coach_class?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          final_price?: number | null
          from_station_id?: string
          from_stop_sequence?: number
          id?: string
          notes?: string | null
          price_override?: boolean | null
          schedule_id?: string
          status?: string | null
          to_station_id?: string
          to_stop_sequence?: number
          total_passengers?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "railway_bookings_from_station_id_fkey"
            columns: ["from_station_id"]
            isOneToOne: false
            referencedRelation: "railway_stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "railway_bookings_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "railway_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "railway_bookings_to_station_id_fkey"
            columns: ["to_station_id"]
            isOneToOne: false
            referencedRelation: "railway_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      railway_coaches: {
        Row: {
          coach_class: string
          coach_number: string
          created_at: string
          id: string
          is_active: boolean | null
          layout: string | null
          rows_count: number | null
          seats_per_row: number | null
          total_seats: number | null
          train_id: string
          updated_at: string
        }
        Insert: {
          coach_class?: string
          coach_number: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          layout?: string | null
          rows_count?: number | null
          seats_per_row?: number | null
          total_seats?: number | null
          train_id: string
          updated_at?: string
        }
        Update: {
          coach_class?: string
          coach_number?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          layout?: string | null
          rows_count?: number | null
          seats_per_row?: number | null
          total_seats?: number | null
          train_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "railway_coaches_train_id_fkey"
            columns: ["train_id"]
            isOneToOne: false
            referencedRelation: "railway_trains"
            referencedColumns: ["id"]
          },
        ]
      }
      railway_notifications: {
        Row: {
          booking_id: string | null
          channel: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          schedule_id: string | null
          sent_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          schedule_id?: string | null
          sent_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          schedule_id?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "railway_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "railway_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "railway_notifications_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "railway_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      railway_pricing_overrides: {
        Row: {
          coach_class: string | null
          created_at: string
          from_station_id: string | null
          id: string
          is_active: boolean | null
          override_price: number
          override_type: string | null
          reason: string | null
          route_id: string | null
          to_station_id: string | null
          train_id: string | null
          updated_at: string
          user_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          coach_class?: string | null
          created_at?: string
          from_station_id?: string | null
          id?: string
          is_active?: boolean | null
          override_price: number
          override_type?: string | null
          reason?: string | null
          route_id?: string | null
          to_station_id?: string | null
          train_id?: string | null
          updated_at?: string
          user_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          coach_class?: string | null
          created_at?: string
          from_station_id?: string | null
          id?: string
          is_active?: boolean | null
          override_price?: number
          override_type?: string | null
          reason?: string | null
          route_id?: string | null
          to_station_id?: string | null
          train_id?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "railway_pricing_overrides_from_station_id_fkey"
            columns: ["from_station_id"]
            isOneToOne: false
            referencedRelation: "railway_stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "railway_pricing_overrides_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "railway_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "railway_pricing_overrides_to_station_id_fkey"
            columns: ["to_station_id"]
            isOneToOne: false
            referencedRelation: "railway_stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "railway_pricing_overrides_train_id_fkey"
            columns: ["train_id"]
            isOneToOne: false
            referencedRelation: "railway_trains"
            referencedColumns: ["id"]
          },
        ]
      }
      railway_route_stops: {
        Row: {
          arrival_time: string | null
          created_at: string
          day_offset: number | null
          departure_time: string | null
          distance_km: number | null
          halt_minutes: number | null
          id: string
          platform_number: string | null
          route_id: string
          station_id: string
          stop_sequence: number
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string
          day_offset?: number | null
          departure_time?: string | null
          distance_km?: number | null
          halt_minutes?: number | null
          id?: string
          platform_number?: string | null
          route_id: string
          station_id: string
          stop_sequence: number
        }
        Update: {
          arrival_time?: string | null
          created_at?: string
          day_offset?: number | null
          departure_time?: string | null
          distance_km?: number | null
          halt_minutes?: number | null
          id?: string
          platform_number?: string | null
          route_id?: string
          station_id?: string
          stop_sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "railway_route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "railway_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "railway_route_stops_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "railway_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      railway_routes: {
        Row: {
          created_at: string
          days_of_operation: number[] | null
          id: string
          is_active: boolean | null
          route_name: string
          train_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_operation?: number[] | null
          id?: string
          is_active?: boolean | null
          route_name: string
          train_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_operation?: number[] | null
          id?: string
          is_active?: boolean | null
          route_name?: string
          train_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "railway_routes_train_id_fkey"
            columns: ["train_id"]
            isOneToOne: false
            referencedRelation: "railway_trains"
            referencedColumns: ["id"]
          },
        ]
      }
      railway_schedules: {
        Row: {
          ai_optimized: boolean | null
          created_at: string
          delay_minutes: number | null
          id: string
          notes: string | null
          route_id: string
          schedule_date: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_optimized?: boolean | null
          created_at?: string
          delay_minutes?: number | null
          id?: string
          notes?: string | null
          route_id: string
          schedule_date: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_optimized?: boolean | null
          created_at?: string
          delay_minutes?: number | null
          id?: string
          notes?: string | null
          route_id?: string
          schedule_date?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "railway_schedules_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "railway_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      railway_seats: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          is_available: boolean | null
          position: string
          row_number: number
          seat_number: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          is_available?: boolean | null
          position?: string
          row_number: number
          seat_number: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          is_available?: boolean | null
          position?: string
          row_number?: number
          seat_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "railway_seats_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "railway_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      railway_stations: {
        Row: {
          city: string | null
          code: string
          country: string | null
          created_at: string
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      railway_trains: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          status: string | null
          total_coaches: number | null
          train_name: string
          train_number: string
          train_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          status?: string | null
          total_coaches?: number | null
          train_name: string
          train_number: string
          train_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          status?: string | null
          total_coaches?: number | null
          train_name?: string
          train_number?: string
          train_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          base_price: number | null
          business_type: string | null
          cleaning_cost: number | null
          created_at: string
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          is_active: boolean | null
          location: string | null
          max_capacity: number | null
          metadata: Json | null
          minimum_stay: number | null
          name: string
          turnaround_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_price?: number | null
          business_type?: string | null
          cleaning_cost?: number | null
          created_at?: string
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_active?: boolean | null
          location?: string | null
          max_capacity?: number | null
          metadata?: Json | null
          minimum_stay?: number | null
          name: string
          turnaround_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_price?: number | null
          business_type?: string | null
          cleaning_cost?: number | null
          created_at?: string
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_active?: boolean | null
          location?: string | null
          max_capacity?: number | null
          metadata?: Json | null
          minimum_stay?: number | null
          name?: string
          turnaround_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_settings: {
        Row: {
          auto_confirm: boolean
          buffer_minutes: number
          created_at: string
          holidays: string[]
          id: string
          max_capacity: number
          overbooking_allowed: boolean
          overbooking_limit: number
          resource_id: string
          slot_duration_minutes: number
          timezone: string
          updated_at: string
          user_id: string
          working_days: number[]
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          auto_confirm?: boolean
          buffer_minutes?: number
          created_at?: string
          holidays?: string[]
          id?: string
          max_capacity?: number
          overbooking_allowed?: boolean
          overbooking_limit?: number
          resource_id: string
          slot_duration_minutes?: number
          timezone?: string
          updated_at?: string
          user_id: string
          working_days?: number[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Update: {
          auto_confirm?: boolean
          buffer_minutes?: number
          created_at?: string
          holidays?: string[]
          id?: string
          max_capacity?: number
          overbooking_allowed?: boolean
          overbooking_limit?: number
          resource_id?: string
          slot_duration_minutes?: number
          timezone?: string
          updated_at?: string
          user_id?: string
          working_days?: number[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_settings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: true
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      service_listings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          featured_until: string | null
          id: string
          industry: string | null
          is_featured: boolean | null
          location: string | null
          price_max: number | null
          price_min: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          featured_until?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          location?: string | null
          price_max?: number | null
          price_min?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          featured_until?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          location?: string | null
          price_max?: number | null
          price_min?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          is_lifetime: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string
          trial_starts_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_lifetime?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string
          trial_starts_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_lifetime?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string
          trial_starts_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_earnings: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_details: Json
          payment_method: string
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_details?: Json
          payment_method?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_details?: Json
          payment_method?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          industry: Database["public"]["Enums"]["industry_type"] | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          industry?: Database["public"]["Enums"]["industry_type"] | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          industry?: Database["public"]["Enums"]["industry_type"] | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_lifetime_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      industry_type:
        | "hospitality"
        | "airlines"
        | "car_rental"
        | "healthcare"
        | "education"
        | "logistics"
        | "events_entertainment"
        | "fitness_wellness"
        | "legal_services"
        | "real_estate"
        | "coworking"
        | "marine_maritime"
        | "government"
        | "travel_tourism"
        | "railways"
      subscription_plan: "trial" | "basic" | "standard" | "premium"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      industry_type: [
        "hospitality",
        "airlines",
        "car_rental",
        "healthcare",
        "education",
        "logistics",
        "events_entertainment",
        "fitness_wellness",
        "legal_services",
        "real_estate",
        "coworking",
        "marine_maritime",
        "government",
        "travel_tourism",
        "railways",
      ],
      subscription_plan: ["trial", "basic", "standard", "premium"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "expired",
      ],
    },
  },
} as const
