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
      admin_alerts: {
        Row: {
          alert_type: string
          amount: number | null
          created_at: string
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          message: string
          metadata: Json | null
          related_entity_id: string | null
          related_entity_type: string | null
          related_user_id: string | null
          resolved_at: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          amount?: number | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          related_user_id?: string | null
          resolved_at?: string | null
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          amount?: number | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          related_user_id?: string | null
          resolved_at?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
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
      booking_conflicts: {
        Row: {
          conflict_type: string
          created_at: string
          email_sent: boolean | null
          existing_client: string
          existing_time_end: string
          existing_time_start: string
          id: string
          industry: string
          metadata: Json | null
          new_client: string
          new_client_email: string | null
          new_time_end: string
          new_time_start: string
          resolution: string
          resolved_resource_id: string | null
          resolved_resource_name: string | null
          resource_id: string | null
          resource_name: string
          suggested_slot_end: string | null
          suggested_slot_start: string | null
          user_id: string
        }
        Insert: {
          conflict_type?: string
          created_at?: string
          email_sent?: boolean | null
          existing_client: string
          existing_time_end: string
          existing_time_start: string
          id?: string
          industry?: string
          metadata?: Json | null
          new_client: string
          new_client_email?: string | null
          new_time_end: string
          new_time_start: string
          resolution?: string
          resolved_resource_id?: string | null
          resolved_resource_name?: string | null
          resource_id?: string | null
          resource_name: string
          suggested_slot_end?: string | null
          suggested_slot_start?: string | null
          user_id: string
        }
        Update: {
          conflict_type?: string
          created_at?: string
          email_sent?: boolean | null
          existing_client?: string
          existing_time_end?: string
          existing_time_start?: string
          id?: string
          industry?: string
          metadata?: Json | null
          new_client?: string
          new_client_email?: string | null
          new_time_end?: string
          new_time_start?: string
          resolution?: string
          resolved_resource_id?: string | null
          resolved_resource_name?: string | null
          resource_id?: string | null
          resource_name?: string
          suggested_slot_end?: string | null
          suggested_slot_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_conflicts_resolved_resource_id_fkey"
            columns: ["resolved_resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_conflicts_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
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
      cancellation_requests: {
        Row: {
          competitor_name: string | null
          country: string | null
          created_at: string
          feature_requested: string | null
          final_action: string
          id: string
          industry: string | null
          offer_shown: string | null
          plan: string | null
          reason: string
          reason_details: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string
          value_summary: Json | null
        }
        Insert: {
          competitor_name?: string | null
          country?: string | null
          created_at?: string
          feature_requested?: string | null
          final_action?: string
          id?: string
          industry?: string | null
          offer_shown?: string | null
          plan?: string | null
          reason: string
          reason_details?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id: string
          value_summary?: Json | null
        }
        Update: {
          competitor_name?: string | null
          country?: string | null
          created_at?: string
          feature_requested?: string | null
          final_action?: string
          id?: string
          industry?: string | null
          offer_shown?: string | null
          plan?: string | null
          reason?: string
          reason_details?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
          value_summary?: Json | null
        }
        Relationships: []
      }
      checkout_events: {
        Row: {
          created_at: string
          discount_code: string | null
          event_type: string
          id: string
          metadata: Json | null
          plan: string | null
          price_id: string | null
          session_id: string
          source_page: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount_code?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          plan?: string | null
          price_id?: string | null
          session_id: string
          source_page?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount_code?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          plan?: string | null
          price_id?: string | null
          session_id?: string
          source_page?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      churn_risk_scores: {
        Row: {
          cancel_probability: number
          computed_at: string
          id: string
          risk_score: number
          signals: Json | null
          suggested_action: string | null
          user_id: string
        }
        Insert: {
          cancel_probability?: number
          computed_at?: string
          id?: string
          risk_score: number
          signals?: Json | null
          suggested_action?: string | null
          user_id: string
        }
        Update: {
          cancel_probability?: number
          computed_at?: string
          id?: string
          risk_score?: number
          signals?: Json | null
          suggested_action?: string | null
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
      }
      crm_activities: {
        Row: {
          ai_generated: boolean | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          is_completed: boolean | null
          metadata: Json | null
          scheduled_at: string | null
          subject: string | null
          ticket_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_completed?: boolean | null
          metadata?: Json | null
          scheduled_at?: string | null
          subject?: string | null
          ticket_id?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_completed?: boolean | null
          metadata?: Json | null
          scheduled_at?: string | null
          subject?: string | null
          ticket_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "crm_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activity_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          industry: string
          ip_hint: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          industry?: string
          ip_hint?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          industry?: string
          ip_hint?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      crm_automations: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string
          description: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          is_active: boolean | null
          last_triggered_at: string | null
          metadata: Json | null
          name: string
          trigger_count: number | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_active?: boolean | null
          last_triggered_at?: string | null
          metadata?: Json | null
          name: string
          trigger_count?: number | null
          trigger_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_active?: boolean | null
          last_triggered_at?: string | null
          metadata?: Json | null
          name?: string
          trigger_count?: number | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          address: string | null
          ai_score: number | null
          ai_score_reason: string | null
          avatar_url: string | null
          churn_risk: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          last_contacted_at: string | null
          lifecycle_stage: string
          metadata: Json | null
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          tags: string[] | null
          total_bookings: number | null
          total_revenue: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          ai_score?: number | null
          ai_score_reason?: string | null
          avatar_url?: string | null
          churn_risk?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          last_contacted_at?: string | null
          lifecycle_stage?: string
          metadata?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          total_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          ai_score?: number | null
          ai_score_reason?: string | null
          avatar_url?: string | null
          churn_risk?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          last_contacted_at?: string | null
          lifecycle_stage?: string
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          total_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_daily_plans: {
        Row: {
          ai_recommendations: Json | null
          created_at: string
          focus_areas: string[] | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          mood: string | null
          notes: string | null
          plan_date: string
          productivity_score: number | null
          tasks_summary: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_recommendations?: Json | null
          created_at?: string
          focus_areas?: string[] | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          mood?: string | null
          notes?: string | null
          plan_date: string
          productivity_score?: number | null
          tasks_summary?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_recommendations?: Json | null
          created_at?: string
          focus_areas?: string[] | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          mood?: string | null
          notes?: string | null
          plan_date?: string
          productivity_score?: number | null
          tasks_summary?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_deals: {
        Row: {
          contact_id: string | null
          created_at: string
          currency: string | null
          expected_close_date: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          lost_at: string | null
          lost_reason: string | null
          metadata: Json | null
          notes: string | null
          pipeline_id: string | null
          probability: number | null
          stage: string
          title: string
          updated_at: string
          user_id: string
          value: number | null
          won_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          expected_close_date?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          lost_at?: string | null
          lost_reason?: string | null
          metadata?: Json | null
          notes?: string | null
          pipeline_id?: string | null
          probability?: number | null
          stage?: string
          title: string
          updated_at?: string
          user_id: string
          value?: number | null
          won_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          expected_close_date?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          lost_at?: string | null
          lost_reason?: string | null
          metadata?: Json | null
          notes?: string | null
          pipeline_id?: string | null
          probability?: number | null
          stage?: string
          title?: string
          updated_at?: string
          user_id?: string
          value?: number | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_google_connections: {
        Row: {
          access_token_encrypted: string | null
          calendar_sync_enabled: boolean | null
          chat_sync_enabled: boolean | null
          created_at: string
          gmail_sync_enabled: boolean | null
          google_email: string | null
          id: string
          last_sync_at: string | null
          metadata: Json | null
          refresh_token_encrypted: string | null
          scopes: string[] | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          calendar_sync_enabled?: boolean | null
          chat_sync_enabled?: boolean | null
          created_at?: string
          gmail_sync_enabled?: boolean | null
          google_email?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          calendar_sync_enabled?: boolean | null
          chat_sync_enabled?: boolean | null
          created_at?: string
          gmail_sync_enabled?: boolean | null
          google_email?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_google_synced_items: {
        Row: {
          body_preview: string | null
          created_at: string
          external_id: string | null
          from_address: string | null
          id: string
          is_read: boolean | null
          item_date: string | null
          item_type: string
          labels: string[] | null
          linked_contact_id: string | null
          metadata: Json | null
          title: string | null
          to_addresses: string[] | null
          user_id: string
        }
        Insert: {
          body_preview?: string | null
          created_at?: string
          external_id?: string | null
          from_address?: string | null
          id?: string
          is_read?: boolean | null
          item_date?: string | null
          item_type: string
          labels?: string[] | null
          linked_contact_id?: string | null
          metadata?: Json | null
          title?: string | null
          to_addresses?: string[] | null
          user_id: string
        }
        Update: {
          body_preview?: string | null
          created_at?: string
          external_id?: string | null
          from_address?: string | null
          id?: string
          is_read?: boolean | null
          item_date?: string | null
          item_type?: string
          labels?: string[] | null
          linked_contact_id?: string | null
          metadata?: Json | null
          title?: string | null
          to_addresses?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_google_synced_items_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_performance_reports: {
        Row: {
          ai_recommendations: Json | null
          ai_summary: string | null
          avg_session_minutes: number | null
          created_at: string
          days_active: number | null
          id: string
          industry: string
          is_read: boolean | null
          longest_session_minutes: number | null
          metadata: Json | null
          productivity_score: number | null
          report_month: string
          total_break_seconds: number
          total_breaks: number
          total_sessions: number
          total_work_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_recommendations?: Json | null
          ai_summary?: string | null
          avg_session_minutes?: number | null
          created_at?: string
          days_active?: number | null
          id?: string
          industry?: string
          is_read?: boolean | null
          longest_session_minutes?: number | null
          metadata?: Json | null
          productivity_score?: number | null
          report_month: string
          total_break_seconds?: number
          total_breaks?: number
          total_sessions?: number
          total_work_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_recommendations?: Json | null
          ai_summary?: string | null
          avg_session_minutes?: number | null
          created_at?: string
          days_active?: number | null
          id?: string
          industry?: string
          is_read?: boolean | null
          longest_session_minutes?: number | null
          metadata?: Json | null
          productivity_score?: number | null
          report_month?: string
          total_break_seconds?: number
          total_breaks?: number
          total_sessions?: number
          total_work_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_pipelines: {
        Row: {
          color: string | null
          created_at: string
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          is_default: boolean | null
          metadata: Json | null
          name: string
          stages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_default?: boolean | null
          metadata?: Json | null
          name: string
          stages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_default?: boolean | null
          metadata?: Json | null
          name?: string
          stages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_resolved: boolean | null
          message: string
          metadata: Json | null
          resolved_at: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          ai_category: string | null
          ai_priority_score: number | null
          ai_suggestions: Json | null
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          is_recurring: boolean | null
          linked_contact_id: string | null
          linked_deal_id: string | null
          linked_ticket_id: string | null
          metadata: Json | null
          priority: string | null
          recurrence_rule: string | null
          scheduled_time: string | null
          sort_order: number | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_category?: string | null
          ai_priority_score?: number | null
          ai_suggestions?: Json | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_recurring?: boolean | null
          linked_contact_id?: string | null
          linked_deal_id?: string | null
          linked_ticket_id?: string | null
          metadata?: Json | null
          priority?: string | null
          recurrence_rule?: string | null
          scheduled_time?: string | null
          sort_order?: number | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_category?: string | null
          ai_priority_score?: number | null
          ai_suggestions?: Json | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_recurring?: boolean | null
          linked_contact_id?: string | null
          linked_deal_id?: string | null
          linked_ticket_id?: string | null
          metadata?: Json | null
          priority?: string | null
          recurrence_rule?: string | null
          scheduled_time?: string | null
          sort_order?: number | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_linked_deal_id_fkey"
            columns: ["linked_deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "crm_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tickets: {
        Row: {
          ai_category: string | null
          ai_sentiment: string | null
          ai_suggested_resolution: string | null
          ai_summary: string | null
          assigned_to: string | null
          category: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          metadata: Json | null
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          sla_deadline: string | null
          source: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_category?: string | null
          ai_sentiment?: string | null
          ai_suggested_resolution?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          category?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          metadata?: Json | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_deadline?: string | null
          source?: string | null
          status?: string
          subject: string
          ticket_number?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_category?: string | null
          ai_sentiment?: string | null
          ai_suggested_resolution?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          category?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          metadata?: Json | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_deadline?: string | null
          source?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_work_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          notes: string | null
          session_type: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          notes?: string | null
          session_type?: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          notes?: string | null
          session_type?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          customer: string
          destination: string
          driver_id: string | null
          driver_name: string | null
          eta: string | null
          id: string
          metadata: Json | null
          origin: string
          priority: string
          status: string
          time_slot: string | null
          tracking: string
          updated_at: string
          user_id: string
          vehicle_id: string | null
          weight: string | null
        }
        Insert: {
          created_at?: string
          customer?: string
          destination?: string
          driver_id?: string | null
          driver_name?: string | null
          eta?: string | null
          id?: string
          metadata?: Json | null
          origin?: string
          priority?: string
          status?: string
          time_slot?: string | null
          tracking?: string
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
          weight?: string | null
        }
        Update: {
          created_at?: string
          customer?: string
          destination?: string
          driver_id?: string | null
          driver_name?: string | null
          eta?: string | null
          id?: string
          metadata?: Json | null
          origin?: string
          priority?: string
          status?: string
          time_slot?: string | null
          tracking?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "logistics_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "logistics_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_bookings: {
        Row: {
          booked_at: string
          created_at: string
          customer_name: string
          email: string | null
          event_id: string | null
          event_name: string
          id: string
          metadata: Json | null
          status: string
          ticket_type: string
          tickets: number
          total_paid: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booked_at?: string
          created_at?: string
          customer_name: string
          email?: string | null
          event_id?: string | null
          event_name?: string
          id?: string
          metadata?: Json | null
          status?: string
          ticket_type?: string
          tickets?: number
          total_paid?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booked_at?: string
          created_at?: string
          customer_name?: string
          email?: string | null
          event_id?: string | null
          event_name?: string
          id?: string
          metadata?: Json | null
          status?: string
          ticket_type?: string
          tickets?: number
          total_paid?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          base_price: number
          capacity: number
          category: string
          created_at: string
          current_price: number
          demand: string
          duration: string | null
          event_date: string
          event_time: string
          id: string
          image: string | null
          metadata: Json | null
          name: string
          performers: string[] | null
          price_overridden: boolean
          revenue: number
          sold: number
          status: string
          updated_at: string
          user_id: string
          venue_id: string | null
          venue_name: string
        }
        Insert: {
          base_price?: number
          capacity?: number
          category?: string
          created_at?: string
          current_price?: number
          demand?: string
          duration?: string | null
          event_date: string
          event_time?: string
          id?: string
          image?: string | null
          metadata?: Json | null
          name: string
          performers?: string[] | null
          price_overridden?: boolean
          revenue?: number
          sold?: number
          status?: string
          updated_at?: string
          user_id: string
          venue_id?: string | null
          venue_name?: string
        }
        Update: {
          base_price?: number
          capacity?: number
          category?: string
          created_at?: string
          current_price?: number
          demand?: string
          duration?: string | null
          event_date?: string
          event_time?: string
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string
          performers?: string[] | null
          price_overridden?: boolean
          revenue?: number
          sold?: number
          status?: string
          updated_at?: string
          user_id?: string
          venue_id?: string | null
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      exit_surveys: {
        Row: {
          ai_recommendations: Json | null
          ai_summary: string | null
          cancellation_request_id: string | null
          created_at: string
          free_text: string | null
          id: string
          satisfaction_score: number | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          ai_recommendations?: Json | null
          ai_summary?: string | null
          cancellation_request_id?: string | null
          created_at?: string
          free_text?: string | null
          id?: string
          satisfaction_score?: number | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          ai_recommendations?: Json | null
          ai_summary?: string | null
          cancellation_request_id?: string | null
          created_at?: string
          free_text?: string | null
          id?: string
          satisfaction_score?: number | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "exit_surveys_cancellation_request_id_fkey"
            columns: ["cancellation_request_id"]
            isOneToOne: false
            referencedRelation: "cancellation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          last_used_at: string | null
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          last_used_at?: string | null
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          last_used_at?: string | null
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      healthcare_appointments: {
        Row: {
          appointment_time: string
          created_at: string
          doctor_id: string | null
          doctor_name: string
          duration_minutes: number
          fee: number | null
          id: string
          metadata: Json | null
          no_show_risk: number | null
          notes: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          specialization: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_time: string
          created_at?: string
          doctor_id?: string | null
          doctor_name: string
          duration_minutes?: number
          fee?: number | null
          id?: string
          metadata?: Json | null
          no_show_risk?: number | null
          notes?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          specialization?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_time?: string
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string
          duration_minutes?: number
          fee?: number | null
          id?: string
          metadata?: Json | null
          no_show_risk?: number | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          specialization?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "healthcare_appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "healthcare_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "healthcare_appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "healthcare_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      healthcare_doctors: {
        Row: {
          avatar: string | null
          created_at: string
          id: string
          max_patients: number
          metadata: Json | null
          name: string
          next_available: string | null
          patients_today: number
          phone: string | null
          rating: number | null
          room: string | null
          slot_duration: number | null
          specialization: string
          status: string
          updated_at: string
          user_id: string
          working_days: string | null
          working_hours: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          id?: string
          max_patients?: number
          metadata?: Json | null
          name: string
          next_available?: string | null
          patients_today?: number
          phone?: string | null
          rating?: number | null
          room?: string | null
          slot_duration?: number | null
          specialization?: string
          status?: string
          updated_at?: string
          user_id: string
          working_days?: string | null
          working_hours?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          id?: string
          max_patients?: number
          metadata?: Json | null
          name?: string
          next_available?: string | null
          patients_today?: number
          phone?: string | null
          rating?: number | null
          room?: string | null
          slot_duration?: number | null
          specialization?: string
          status?: string
          updated_at?: string
          user_id?: string
          working_days?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      healthcare_patients: {
        Row: {
          age: number | null
          condition: string | null
          created_at: string
          doctor_id: string | null
          doctor_name: string | null
          email: string | null
          gender: string | null
          id: string
          last_visit_at: string | null
          metadata: Json | null
          name: string
          no_show_count: number
          notes: string | null
          phone: string | null
          status: string
          total_visits: number
          upcoming_appointment_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          condition?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          last_visit_at?: string | null
          metadata?: Json | null
          name: string
          no_show_count?: number
          notes?: string | null
          phone?: string | null
          status?: string
          total_visits?: number
          upcoming_appointment_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          condition?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          last_visit_at?: string | null
          metadata?: Json | null
          name?: string
          no_show_count?: number
          notes?: string | null
          phone?: string | null
          status?: string
          total_visits?: number
          upcoming_appointment_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "healthcare_patients_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "healthcare_doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_drivers: {
        Row: {
          avatar: string | null
          created_at: string
          deliveries_today: number
          id: string
          license: string | null
          metadata: Json | null
          name: string
          phone: string | null
          rating: number
          status: string
          updated_at: string
          user_id: string
          zone: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          deliveries_today?: number
          id?: string
          license?: string | null
          metadata?: Json | null
          name: string
          phone?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id: string
          zone?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          deliveries_today?: number
          id?: string
          license?: string | null
          metadata?: Json | null
          name?: string
          phone?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      logistics_vehicles: {
        Row: {
          capacity: string | null
          created_at: string
          fuel: number
          id: string
          last_service: string | null
          metadata: Json | null
          name: string
          plate: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capacity?: string | null
          created_at?: string
          fuel?: number
          id?: string
          last_service?: string | null
          metadata?: Json | null
          name: string
          plate?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capacity?: string | null
          created_at?: string
          fuel?: number
          id?: string
          last_service?: string | null
          metadata?: Json | null
          name?: string
          plate?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      onboarding_settings: {
        Row: {
          ai_tips_enabled: boolean
          created_at: string
          default_steps: Json
          enabled: boolean
          id: string
          industry: string
          updated_at: string
          welcome_video_url: string | null
        }
        Insert: {
          ai_tips_enabled?: boolean
          created_at?: string
          default_steps?: Json
          enabled?: boolean
          id?: string
          industry: string
          updated_at?: string
          welcome_video_url?: string | null
        }
        Update: {
          ai_tips_enabled?: boolean
          created_at?: string
          default_steps?: Json
          enabled?: boolean
          id?: string
          industry?: string
          updated_at?: string
          welcome_video_url?: string | null
        }
        Relationships: []
      }
      payment_refunds: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          plan: string | null
          reason: string | null
          reason_details: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          plan?: string | null
          reason?: string | null
          reason_details?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          plan?: string | null
          reason?: string | null
          reason_details?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          plan_name: string
          plan_price: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          plan_name: string
          plan_price: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          plan_name?: string
          plan_price?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          notified: boolean | null
          plan: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified?: boolean | null
          plan?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified?: boolean | null
          plan?: string | null
          source?: string | null
        }
        Relationships: []
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
      price_alerts: {
        Row: {
          alert_type: string
          change_percent: number
          confidence: string | null
          created_at: string
          current_price: number
          expires_at: string | null
          id: string
          industry: string
          is_applied: boolean | null
          is_read: boolean | null
          reasoning: string | null
          resource_name: string
          suggested_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type?: string
          change_percent?: number
          confidence?: string | null
          created_at?: string
          current_price: number
          expires_at?: string | null
          id?: string
          industry: string
          is_applied?: boolean | null
          is_read?: boolean | null
          reasoning?: string | null
          resource_name: string
          suggested_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          change_percent?: number
          confidence?: string | null
          created_at?: string
          current_price?: number
          expires_at?: string | null
          id?: string
          industry?: string
          is_applied?: boolean | null
          is_read?: boolean | null
          reasoning?: string | null
          resource_name?: string
          suggested_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          business_hours: Json | null
          business_subtype: string | null
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
          business_subtype?: string | null
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
          business_subtype?: string | null
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
      retention_offers: {
        Row: {
          accepted_at: string | null
          cancellation_request_id: string | null
          created_at: string
          discount_percent: number | null
          duration_days: number | null
          expires_at: string | null
          id: string
          offer_type: string
          status: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          cancellation_request_id?: string | null
          created_at?: string
          discount_percent?: number | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          offer_type: string
          status?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          cancellation_request_id?: string | null
          created_at?: string
          discount_percent?: number | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          offer_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_offers_cancellation_request_id_fkey"
            columns: ["cancellation_request_id"]
            isOneToOne: false
            referencedRelation: "cancellation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          ai_decision: string | null
          ai_reason: string | null
          country_code: string | null
          created_at: string
          id: string
          is_auto_rejected: boolean
          rating: number
          region: string | null
          review_text: string
          reviewer_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_decision?: string | null
          ai_reason?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          is_auto_rejected?: boolean
          rating: number
          region?: string | null
          review_text: string
          reviewer_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_decision?: string | null
          ai_reason?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          is_auto_rejected?: boolean
          rating?: number
          region?: string | null
          review_text?: string
          reviewer_name?: string
          status?: string
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
      scheduling_conflict_policy: {
        Row: {
          auto_reschedule_ai_on_conflict: boolean
          buffer_minutes: number
          created_at: string
          google_calendar_wins_over_ai: boolean
          id: string
          notify_on_resolution: boolean
          priority_order: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_reschedule_ai_on_conflict?: boolean
          buffer_minutes?: number
          created_at?: string
          google_calendar_wins_over_ai?: boolean
          id?: string
          notify_on_resolution?: boolean
          priority_order?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_reschedule_ai_on_conflict?: boolean
          buffer_minutes?: number
          created_at?: string
          google_calendar_wins_over_ai?: boolean
          id?: string
          notify_on_resolution?: boolean
          priority_order?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduling_conflict_resolutions: {
        Row: {
          conflict_end: string
          conflict_start: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string
          resolution_action: string
          source_a: string
          source_b: string
          user_id: string
          winner: string
        }
        Insert: {
          conflict_end: string
          conflict_start: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason: string
          resolution_action: string
          source_a: string
          source_b: string
          user_id: string
          winner: string
        }
        Update: {
          conflict_end?: string
          conflict_start?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string
          resolution_action?: string
          source_a?: string
          source_b?: string
          user_id?: string
          winner?: string
        }
        Relationships: []
      }
      subscription_pauses: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          pause_days: number
          starts_at: string
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          pause_days: number
          starts_at?: string
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          pause_days?: number
          starts_at?: string
          status?: string
          subscription_id?: string | null
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
          trial_ends_at?: string
          trial_starts_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      translation_updates: {
        Row: {
          created_at: string
          id: string
          language_code: string
          last_updated_at: string
          status: string
          translation_data: Json | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          language_code: string
          last_updated_at?: string
          status?: string
          translation_data?: Json | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          language_code?: string
          last_updated_at?: string
          status?: string
          translation_data?: Json | null
          updated_at?: string
          version?: number
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
      user_onboarding_progress: {
        Row: {
          completed_steps: Json
          created_at: string
          current_step: number
          finished: boolean
          finished_at: string | null
          id: string
          industry: string
          language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_steps?: Json
          created_at?: string
          current_step?: number
          finished?: boolean
          finished_at?: string | null
          id?: string
          industry: string
          language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_steps?: Json
          created_at?: string
          current_step?: number
          finished?: boolean
          finished_at?: string | null
          id?: string
          industry?: string
          language?: string
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
      venues: {
        Row: {
          amenities: string[] | null
          capacity: number
          created_at: string
          events_this_month: number
          id: string
          metadata: Json | null
          name: string
          status: string
          type: string
          updated_at: string
          user_id: string
          utilization: number
        }
        Insert: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          events_this_month?: number
          id?: string
          metadata?: Json | null
          name: string
          status?: string
          type?: string
          updated_at?: string
          user_id: string
          utilization?: number
        }
        Update: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          events_this_month?: number
          id?: string
          metadata?: Json | null
          name?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          utilization?: number
        }
        Relationships: []
      }
      voice_assistant_settings: {
        Row: {
          enabled: boolean
          id: string
          industry: string
          latency_mode: string
          updated_at: string
          updated_by: string | null
          voice_id: string | null
        }
        Insert: {
          enabled?: boolean
          id?: string
          industry: string
          latency_mode?: string
          updated_at?: string
          updated_by?: string | null
          voice_id?: string | null
        }
        Update: {
          enabled?: boolean
          id?: string
          industry?: string
          latency_mode?: string
          updated_at?: string
          updated_by?: string | null
          voice_id?: string | null
        }
        Relationships: []
      }
      win_back_campaigns: {
        Row: {
          campaign_type: string
          created_at: string
          created_by: string
          description: string | null
          discount_percent: number | null
          duration_months: number
          ends_at: string | null
          expiry_days: number
          id: string
          is_active: boolean
          message: string | null
          name: string
          reactivated_count: number
          sent_count: number
          starts_at: string | null
          status: string
          target_audience: string
          target_plan: string | null
          target_reason: string | null
          updated_at: string
        }
        Insert: {
          campaign_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          discount_percent?: number | null
          duration_months?: number
          ends_at?: string | null
          expiry_days?: number
          id?: string
          is_active?: boolean
          message?: string | null
          name: string
          reactivated_count?: number
          sent_count?: number
          starts_at?: string | null
          status?: string
          target_audience?: string
          target_plan?: string | null
          target_reason?: string | null
          updated_at?: string
        }
        Update: {
          campaign_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          discount_percent?: number | null
          duration_months?: number
          ends_at?: string | null
          expiry_days?: number
          id?: string
          is_active?: boolean
          message?: string | null
          name?: string
          reactivated_count?: number
          sent_count?: number
          starts_at?: string | null
          status?: string
          target_audience?: string
          target_plan?: string | null
          target_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      win_back_offers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campaign_id: string | null
          cancellation_request_id: string | null
          created_at: string
          discount_code: string | null
          expires_at: string | null
          id: string
          language: string
          redeemed_at: string | null
          sent_at: string | null
          status: string
          text_message: string | null
          updated_at: string
          user_id: string
          viewed_at: string | null
          voice_script: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string | null
          cancellation_request_id?: string | null
          created_at?: string
          discount_code?: string | null
          expires_at?: string | null
          id?: string
          language?: string
          redeemed_at?: string | null
          sent_at?: string | null
          status?: string
          text_message?: string | null
          updated_at?: string
          user_id: string
          viewed_at?: string | null
          voice_script?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string | null
          cancellation_request_id?: string | null
          created_at?: string
          discount_code?: string | null
          expires_at?: string | null
          id?: string
          language?: string
          redeemed_at?: string | null
          sent_at?: string | null
          status?: string
          text_message?: string | null
          updated_at?: string
          user_id?: string
          viewed_at?: string | null
          voice_script?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "win_back_offers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "win_back_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "win_back_offers_cancellation_request_id_fkey"
            columns: ["cancellation_request_id"]
            isOneToOne: false
            referencedRelation: "cancellation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      win_back_voice_log: {
        Row: {
          completed: boolean | null
          duration_seconds: number | null
          id: string
          language: string
          offer_id: string
          played_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          duration_seconds?: number | null
          id?: string
          language: string
          offer_id: string
          played_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          duration_seconds?: number | null
          id?: string
          language?: string
          offer_id?: string
          played_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "win_back_voice_log_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "win_back_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_admin_notes: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          notes: string | null
          withdrawal_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          notes?: string | null
          withdrawal_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          withdrawal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_admin_notes_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
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
      workspaces: {
        Row: {
          base_price: number
          created_at: string
          discount_amount: number
          discount_percentage: number
          final_price: number
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          industry_number: number
          is_active: boolean
          name: string
          payment_status: string
          plan: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          discount_amount?: number
          discount_percentage?: number
          final_price?: number
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          industry_number?: number
          is_active?: boolean
          name: string
          payment_status?: string
          plan?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_price?: number
          created_at?: string
          discount_amount?: number
          discount_percentage?: number
          final_price?: number
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          industry_number?: number
          is_active?: boolean
          name?: string
          payment_status?: string
          plan?: string
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
      can_join_conversation: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      create_conversation_with_participant: {
        Args: { _listing_id?: string; _type?: string }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_lifetime_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_activity_log: {
        Args: {
          _action_type: string
          _description?: string
          _entity_id?: string
          _entity_type: string
          _industry: string
          _metadata?: Json
        }
        Returns: string
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      update_workspace_safe: {
        Args: { _is_active?: boolean; _name?: string; _workspace_id: string }
        Returns: undefined
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
      subscription_plan: "trial" | "basic" | "pro" | "standard" | "premium"
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
      subscription_plan: ["trial", "basic", "pro", "standard", "premium"],
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
