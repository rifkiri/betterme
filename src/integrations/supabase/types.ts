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
      habits: {
        Row: {
          archived: boolean
          category: Database["public"]["Enums"]["habit_category"] | null
          completed: boolean
          created_at: string
          description: string | null
          id: string
          is_deleted: boolean
          name: string
          streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          category?: Database["public"]["Enums"]["habit_category"] | null
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          category?: Database["public"]["Enums"]["habit_category"] | null
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          mood: number
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          mood: number
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mood?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          has_changed_password: boolean
          id: string
          last_login: string | null
          name: string
          position: string | null
          role: Database["public"]["Enums"]["user_role"]
          temporary_password: string | null
          updated_at: string
          user_status: Database["public"]["Enums"]["user_status"] | null
        }
        Insert: {
          created_at?: string
          email: string
          has_changed_password?: boolean
          id: string
          last_login?: string | null
          name: string
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          temporary_password?: string | null
          updated_at?: string
          user_status?: Database["public"]["Enums"]["user_status"] | null
        }
        Update: {
          created_at?: string
          email?: string
          has_changed_password?: boolean
          id?: string
          last_login?: string | null
          name?: string
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          temporary_password?: string | null
          updated_at?: string
          user_status?: Database["public"]["Enums"]["user_status"] | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          completed_date: string | null
          created_date: string
          deleted_date: string | null
          description: string | null
          due_date: string
          id: string
          is_deleted: boolean
          is_moved: boolean
          original_due_date: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          title: string
          updated_at: string
          user_id: string
          weekly_output_id: string | null
        }
        Insert: {
          completed?: boolean
          completed_date?: string | null
          created_date?: string
          deleted_date?: string | null
          description?: string | null
          due_date: string
          id?: string
          is_deleted?: boolean
          is_moved?: boolean
          original_due_date?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          title: string
          updated_at?: string
          user_id: string
          weekly_output_id?: string | null
        }
        Update: {
          completed?: boolean
          completed_date?: string | null
          created_date?: string
          deleted_date?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_deleted?: boolean
          is_moved?: boolean
          original_due_date?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          title?: string
          updated_at?: string
          user_id?: string
          weekly_output_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_weekly_output_id_fkey"
            columns: ["weekly_output_id"]
            isOneToOne: false
            referencedRelation: "weekly_outputs"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_outputs: {
        Row: {
          completed_date: string | null
          created_date: string
          deleted_date: string | null
          description: string | null
          due_date: string
          id: string
          is_deleted: boolean
          is_moved: boolean
          original_due_date: string | null
          progress: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_date?: string | null
          created_date?: string
          deleted_date?: string | null
          description?: string | null
          due_date: string
          id?: string
          is_deleted?: boolean
          is_moved?: boolean
          original_due_date?: string | null
          progress?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_date?: string | null
          created_date?: string
          deleted_date?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_deleted?: boolean
          is_moved?: boolean
          original_due_date?: string | null
          progress?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_outputs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
    }
    Enums: {
      habit_category:
        | "health"
        | "productivity"
        | "personal"
        | "fitness"
        | "learning"
        | "other"
      task_priority: "low" | "medium" | "high" | "urgent"
      user_role: "admin" | "manager" | "team-member"
      user_status: "pending" | "active"
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
    Enums: {
      habit_category: [
        "health",
        "productivity",
        "personal",
        "fitness",
        "learning",
        "other",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      user_role: ["admin", "manager", "team-member"],
      user_status: ["pending", "active"],
    },
  },
} as const
