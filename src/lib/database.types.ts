export type Database = {
  public: {
    Tables: {
      expanded_concepts: {
        Row: {
          id: string
          session_id: string
          node_id: string
          title: string
          content: string
          related_concepts: unknown
          created_at: string
          graph_hash: string
        }
        Insert: {
          id?: string
          session_id: string
          node_id: string
          title: string
          content: string
          related_concepts: unknown
          created_at?: string
          graph_hash: string
        }
        Update: {
          id?: string
          session_id?: string
          node_id?: string
          title?: string
          content?: string
          related_concepts: unknown
          created_at?: string
          graph_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "expanded_concepts_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          stripe_customer_id: string | null
          subscription_status: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          created_at: string
          id: string
          last_prompt: string | null
          last_updated_at: string
          session_data: unknown | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_prompt?: string | null
          last_updated_at?: string
          session_data: unknown | null
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_prompt?: string | null
          last_updated_at?: string
          session_data: unknown | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// PublicSchema available for future use
// type PublicSchema = Database[Extract<keyof Database, "public">]
