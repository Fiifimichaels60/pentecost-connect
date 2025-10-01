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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      anaji_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          member_count: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      anaji_history: {
        Row: {
          cost: number
          created_at: string
          delivered_count: number
          failed_count: number
          group_id: string | null
          id: string
          message: string
          recipient_count: number
          recipient_name: string
          recipient_type: string
          recipients: string[] | null
          sent_date: string
          sent_time: string
          status: string
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          delivered_count?: number
          failed_count?: number
          group_id?: string | null
          id?: string
          message: string
          recipient_count?: number
          recipient_name: string
          recipient_type: string
          recipients?: string[] | null
          sent_date?: string
          sent_time?: string
          status?: string
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          delivered_count?: number
          failed_count?: number
          group_id?: string | null
          id?: string
          message?: string
          recipient_count?: number
          recipient_name?: string
          recipient_type?: string
          recipients?: string[] | null
          sent_date?: string
          sent_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anaji_history_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "anaji_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      anaji_members: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string | null
          group_id: string | null
          id: string
          image_url: string | null
          location: string | null
          name: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anaji_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "anaji_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      anaji_sms_campaigns: {
        Row: {
          campaign_name: string
          cost: number
          created_at: string
          delivered_count: number
          failed_count: number
          group_id: string | null
          id: string
          message: string
          recipient_count: number
          recipient_name: string
          recipient_type: string
          recipients: string[] | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_name: string
          cost?: number
          created_at?: string
          delivered_count?: number
          failed_count?: number
          group_id?: string | null
          id?: string
          message: string
          recipient_count?: number
          recipient_name: string
          recipient_type: string
          recipients?: string[] | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_name?: string
          cost?: number
          created_at?: string
          delivered_count?: number
          failed_count?: number
          group_id?: string | null
          id?: string
          message?: string
          recipient_count?: number
          recipient_name?: string
          recipient_type?: string
          recipients?: string[] | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      anaji_sms_delivery_reports: {
        Row: {
          campaign_id: string
          created_at: string
          delivery_time: string | null
          error_message: string | null
          id: string
          provider_message_id: string | null
          recipient_phone: string
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          delivery_time?: string | null
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          recipient_phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          delivery_time?: string | null
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          recipient_phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anaji_sms_delivery_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "anaji_sms_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          id: string
          marked_at: string
          member_id: string
          present: boolean
          session_id: string
        }
        Insert: {
          id?: string
          marked_at?: string
          member_id: string
          present?: boolean
          session_id: string
        }
        Update: {
          id?: string
          marked_at?: string
          member_id?: string
          present?: boolean
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "anaji_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          absent_count: number
          created_at: string
          created_by: string | null
          date: string
          group_id: string | null
          id: string
          notes: string | null
          present_count: number
          status: string
          title: string
          total_members: number
          type: string
          updated_at: string
        }
        Insert: {
          absent_count?: number
          created_at?: string
          created_by?: string | null
          date: string
          group_id?: string | null
          id?: string
          notes?: string | null
          present_count?: number
          status?: string
          title: string
          total_members?: number
          type?: string
          updated_at?: string
        }
        Update: {
          absent_count?: number
          created_at?: string
          created_by?: string | null
          date?: string
          group_id?: string | null
          id?: string
          notes?: string | null
          present_count?: number
          status?: string
          title?: string
          total_members?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "anaji_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      nana_admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          password_hash: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          password_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      nana_cart: {
        Row: {
          color: string | null
          created_at: string
          id: string
          product_id: string
          quantity: number
          size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          size?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      nana_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      nana_chat_messages: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
          sender_type: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "nana_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "nana_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      nana_chats: {
        Row: {
          admin_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nana_chats_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "nana_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nana_chats_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "nana_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      nana_customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          national_id: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          national_id?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          national_id?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      nana_foods: {
        Row: {
          category_id: string | null
          created_at: string
          delivery_price: number
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          delivery_price?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          delivery_price?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nana_foods_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "nana_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      nana_order_items: {
        Row: {
          created_at: string
          food_id: string | null
          id: string
          order_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          food_id?: string | null
          id?: string
          order_id?: string | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          food_id?: string | null
          id?: string
          order_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "nana_order_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "nana_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nana_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "nana_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      nana_orders: {
        Row: {
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_fee: number
          id: string
          notes: string | null
          order_type: string
          payment_reference: string | null
          payment_status: string
          rejected_at: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_type: string
          payment_reference?: string | null
          payment_status?: string
          rejected_at?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_type?: string
          payment_reference?: string | null
          payment_status?: string
          rejected_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nana_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "nana_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      nana_profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nana_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          size: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          size?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          shipping_address: Json
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          shipping_address: Json
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          shipping_address?: Json
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pie_admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          password: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          password?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pie_contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["contact_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pie_quotes: {
        Row: {
          cargo_type: string | null
          company_name: string | null
          created_at: string | null
          currency: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          destination: string
          dimensions: string | null
          estimated_value: number | null
          id: string
          notes: string | null
          origin: string
          quote_amount: number | null
          quote_number: string
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["quote_status"] | null
          updated_at: string | null
          valid_until: string | null
          weight: number | null
        }
        Insert: {
          cargo_type?: string | null
          company_name?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          destination: string
          dimensions?: string | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          origin: string
          quote_amount?: number | null
          quote_number: string
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["quote_status"] | null
          updated_at?: string | null
          valid_until?: string | null
          weight?: number | null
        }
        Update: {
          cargo_type?: string | null
          company_name?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          destination?: string
          dimensions?: string | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          origin?: string
          quote_amount?: number | null
          quote_number?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["quote_status"] | null
          updated_at?: string | null
          valid_until?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      pie_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_type: Database["public"]["Enums"]["setting_type"] | null
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: Database["public"]["Enums"]["setting_type"] | null
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: Database["public"]["Enums"]["setting_type"] | null
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pie_tracking: {
        Row: {
          actual_delivery: string | null
          created_at: string | null
          current_location: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          destination: string
          dimensions: string | null
          estimated_delivery: string | null
          id: string
          origin: string
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: string
          tracking_number: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          actual_delivery?: string | null
          created_at?: string | null
          current_location?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          destination: string
          dimensions?: string | null
          estimated_delivery?: string | null
          id?: string
          origin: string
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: string
          tracking_number: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          actual_delivery?: string | null
          created_at?: string | null
          current_location?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          destination?: string
          dimensions?: string | null
          estimated_delivery?: string | null
          id?: string
          origin?: string
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: string
          tracking_number?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      pie_tracking_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          event_time: string
          id: string
          location: string
          status: string
          tracking_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          event_time: string
          id?: string
          location: string
          status: string
          tracking_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_time?: string
          id?: string
          location?: string
          status?: string
          tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pie_tracking_events_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "pie_active_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_tracking_events_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "pie_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          colors: Json | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price: number
          sale_price: number | null
          sizes: Json | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          colors?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price: number
          sale_price?: number | null
          sizes?: Json | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          colors?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number
          sale_price?: number | null
          sizes?: Json | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      pie_active_shipments: {
        Row: {
          actual_delivery: string | null
          created_at: string | null
          current_location: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          destination: string | null
          dimensions: string | null
          estimated_delivery: string | null
          event_count: number | null
          id: string | null
          last_update: string | null
          origin: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: string | null
          tracking_number: string | null
          updated_at: string | null
          weight: number | null
        }
        Relationships: []
      }
      pie_recent_messages: {
        Row: {
          created_at: string | null
          days_old: number | null
          email: string | null
          id: string | null
          message: string | null
          name: string | null
          phone: string | null
          status: Database["public"]["Enums"]["contact_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_old?: never
          email?: string | null
          id?: string | null
          message?: string | null
          name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_old?: never
          email?: string | null
          id?: string | null
          message?: string | null
          name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_tracking_event: {
        Args: {
          p_description?: string
          p_location: string
          p_status: string
          p_tracking_number: string
        }
        Returns: boolean
      }
      admin_login: {
        Args: { admin_email: string; admin_password: string }
        Returns: Json
      }
      cleanup_old_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_tracking_info: {
        Args: { tracking_num: string }
        Returns: {
          events: Json
          tracking_data: Json
        }[]
      }
    }
    Enums: {
      contact_status: "unread" | "read" | "replied"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      quote_status: "pending" | "quoted" | "accepted" | "rejected" | "expired"
      service_type: "ocean" | "air" | "land" | "express"
      setting_type: "string" | "number" | "boolean" | "json"
      user_role: "admin" | "manager" | "operator"
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
      contact_status: ["unread", "read", "replied"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
      quote_status: ["pending", "quoted", "accepted", "rejected", "expired"],
      service_type: ["ocean", "air", "land", "express"],
      setting_type: ["string", "number", "boolean", "json"],
      user_role: ["admin", "manager", "operator"],
    },
  },
} as const
