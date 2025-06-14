export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      client_onboarding_data: {
        Row: {
          brand_assets_url: string | null
          business_goals: string | null
          client_id: string
          company_name: string | null
          competitor_info: string | null
          created_at: string
          id: string
          progress: number
          social_media_links: Json | null
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          brand_assets_url?: string | null
          business_goals?: string | null
          client_id: string
          company_name?: string | null
          competitor_info?: string | null
          created_at?: string
          id?: string
          progress?: number
          social_media_links?: Json | null
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          brand_assets_url?: string | null
          business_goals?: string | null
          client_id?: string
          company_name?: string | null
          competitor_info?: string | null
          created_at?: string
          id?: string
          progress?: number
          social_media_links?: Json | null
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_onboarding_data_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          budget_range: string | null
          business_name: string | null
          created_at: string
          email: string
          id: string
          lead_id: string
          name: string
          onboarding_status: string
          phone: string | null
          services_interested: string[] | null
        }
        Insert: {
          budget_range?: string | null
          business_name?: string | null
          created_at?: string
          email: string
          id?: string
          lead_id: string
          name: string
          onboarding_status?: string
          phone?: string | null
          services_interested?: string[] | null
        }
        Update: {
          budget_range?: string | null
          business_name?: string | null
          created_at?: string
          email?: string
          id?: string
          lead_id?: string
          name?: string
          onboarding_status?: string
          phone?: string | null
          services_interested?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          note: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          note: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          budget_range: string | null
          business_name: string | null
          created_at: string
          email: string
          id: string
          lead_source: string | null
          name: string
          notes: string | null
          phone: string | null
          services_interested: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          business_name?: string | null
          created_at?: string
          email: string
          id?: string
          lead_source?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          services_interested?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          business_name?: string | null
          created_at?: string
          email?: string
          id?: string
          lead_source?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          services_interested?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposal_items: {
        Row: {
          created_at: string
          description: string
          id: string
          proposal_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          proposal_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          proposal_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          approved_at: string | null
          client_id: string
          created_at: string
          id: string
          sent_at: string | null
          signature_url: string | null
          status: string
          terms: string | null
          title: string
          total_amount: number
        }
        Insert: {
          approved_at?: string | null
          client_id: string
          created_at?: string
          id?: string
          sent_at?: string | null
          signature_url?: string | null
          status?: string
          terms?: string | null
          title: string
          total_amount?: number
        }
        Update: {
          approved_at?: string | null
          client_id?: string
          created_at?: string
          id?: string
          sent_at?: string | null
          signature_url?: string | null
          status?: string
          terms?: string | null
          title?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
