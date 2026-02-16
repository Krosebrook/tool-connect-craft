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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      action_logs: {
        Row: {
          connector_id: string
          created_at: string
          error: string | null
          id: string
          latency_ms: number | null
          request: Json | null
          response: Json | null
          status: string | null
          tool_name: string
          user_id: string
        }
        Insert: {
          connector_id: string
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          request?: Json | null
          response?: Json | null
          status?: string | null
          tool_name: string
          user_id: string
        }
        Update: {
          connector_id?: string
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          request?: Json | null
          response?: Json | null
          status?: string | null
          tool_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_tools: {
        Row: {
          connector_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          schema: Json | null
          source: Database["public"]["Enums"]["tool_source"]
        }
        Insert: {
          connector_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          schema?: Json | null
          source?: Database["public"]["Enums"]["tool_source"]
        }
        Update: {
          connector_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          schema?: Json | null
          source?: Database["public"]["Enums"]["tool_source"]
        }
        Relationships: [
          {
            foreignKeyName: "connector_tools_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      connectors: {
        Row: {
          auth_type: Database["public"]["Enums"]["auth_type"]
          category: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          mcp_server_url: string | null
          name: string
          oauth_config: Json | null
          oauth_provider: string | null
          oauth_scopes: string[] | null
          slug: string
        }
        Insert: {
          auth_type?: Database["public"]["Enums"]["auth_type"]
          category?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          mcp_server_url?: string | null
          name: string
          oauth_config?: Json | null
          oauth_provider?: string | null
          oauth_scopes?: string[] | null
          slug: string
        }
        Update: {
          auth_type?: Database["public"]["Enums"]["auth_type"]
          category?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          mcp_server_url?: string | null
          name?: string
          oauth_config?: Json | null
          oauth_provider?: string | null
          oauth_scopes?: string[] | null
          slug?: string
        }
        Relationships: []
      }
      mcp_api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_connection_active: boolean
          email_connection_expired: boolean
          email_enabled: boolean
          email_health_alerts: boolean
          email_token_refreshed: boolean
          id: string
          push_connection_active: boolean
          push_connection_expired: boolean
          push_enabled: boolean
          push_health_alerts: boolean
          push_token_refreshed: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
          webhook_enabled: boolean
        }
        Insert: {
          created_at?: string
          email_connection_active?: boolean
          email_connection_expired?: boolean
          email_enabled?: boolean
          email_health_alerts?: boolean
          email_token_refreshed?: boolean
          id?: string
          push_connection_active?: boolean
          push_connection_expired?: boolean
          push_enabled?: boolean
          push_health_alerts?: boolean
          push_token_refreshed?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
          webhook_enabled?: boolean
        }
        Update: {
          created_at?: string
          email_connection_active?: boolean
          email_connection_expired?: boolean
          email_enabled?: boolean
          email_health_alerts?: boolean
          email_token_refreshed?: boolean
          id?: string
          push_connection_active?: boolean
          push_connection_expired?: boolean
          push_enabled?: boolean
          push_health_alerts?: boolean
          push_token_refreshed?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
          webhook_enabled?: boolean
        }
        Relationships: []
      }
      oauth_transactions: {
        Row: {
          code_verifier_hash: string
          completed_at: string | null
          connector_id: string
          created_at: string
          id: string
          redirect_uri: string
          state: string
          status: Database["public"]["Enums"]["oauth_transaction_status"]
          user_id: string
        }
        Insert: {
          code_verifier_hash: string
          completed_at?: string | null
          connector_id: string
          created_at?: string
          id?: string
          redirect_uri: string
          state: string
          status?: Database["public"]["Enums"]["oauth_transaction_status"]
          user_id: string
        }
        Update: {
          code_verifier_hash?: string
          completed_at?: string | null
          connector_id?: string
          created_at?: string
          id?: string
          redirect_uri?: string
          state?: string
          status?: Database["public"]["Enums"]["oauth_transaction_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_transactions_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_events: {
        Row: {
          data: Json | null
          id: string
          job_id: string
          level: Database["public"]["Enums"]["event_level"]
          message: string
          ts: string
        }
        Insert: {
          data?: Json | null
          id?: string
          job_id: string
          level?: Database["public"]["Enums"]["event_level"]
          message: string
          ts?: string
        }
        Update: {
          data?: Json | null
          id?: string
          job_id?: string
          level?: Database["public"]["Enums"]["event_level"]
          message?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "pipeline_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_jobs: {
        Row: {
          connector_id: string
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          input: Json | null
          output: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          type: string
          user_id: string
        }
        Insert: {
          connector_id: string
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json | null
          output?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type: string
          user_id: string
        }
        Update: {
          connector_id?: string
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json | null
          output?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_jobs_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduler_jobs: {
        Row: {
          created_at: string
          description: string | null
          function_name: string
          id: string
          is_active: boolean
          last_error: string | null
          last_run_at: string | null
          last_status: string | null
          name: string
          next_run_at: string | null
          run_count: number
          schedule: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          function_name: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          name: string
          next_run_at?: string | null
          run_count?: number
          schedule: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          function_name?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          name?: string
          next_run_at?: string | null
          run_count?: number
          schedule?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          connector_id: string
          created_at: string
          expires_at: string | null
          id: string
          last_used_at: string | null
          scopes: string[] | null
          secret_ref_access: string | null
          secret_ref_refresh: string | null
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          connector_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          scopes?: string[] | null
          secret_ref_access?: string | null
          secret_ref_refresh?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          connector_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          scopes?: string[] | null
          secret_ref_access?: string | null
          secret_ref_refresh?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_connections_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          delivered_at: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_code: number | null
          status: string
          webhook_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          event_type: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_code?: number | null
          status?: string
          webhook_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_code?: number | null
          status?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          name: string
          payload_template: Json | null
          secret: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name: string
          payload_template?: Json | null
          secret?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name?: string
          payload_template?: Json | null
          secret?: string | null
          updated_at?: string
          url?: string
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
      auth_type: "oauth" | "api_key" | "none"
      connection_status: "pending" | "active" | "expired" | "revoked" | "error"
      event_level: "info" | "warn" | "error"
      job_status: "queued" | "running" | "succeeded" | "failed" | "canceled"
      oauth_transaction_status: "started" | "completed" | "failed"
      tool_source: "mcp" | "rest"
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
      auth_type: ["oauth", "api_key", "none"],
      connection_status: ["pending", "active", "expired", "revoked", "error"],
      event_level: ["info", "warn", "error"],
      job_status: ["queued", "running", "succeeded", "failed", "canceled"],
      oauth_transaction_status: ["started", "completed", "failed"],
      tool_source: ["mcp", "rest"],
    },
  },
} as const
