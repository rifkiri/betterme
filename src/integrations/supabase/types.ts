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
      goal_assignments: {
        Row: {
          acknowledged: boolean
          assigned_by: string
          assigned_date: string
          created_at: string
          goal_id: string
          id: string
          role: string
          self_assigned: boolean
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          assigned_by: string
          assigned_date?: string
          created_at?: string
          goal_id: string
          id?: string
          role: string
          self_assigned?: boolean
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          assigned_by?: string
          assigned_date?: string
          created_at?: string
          goal_id?: string
          id?: string
          role?: string
          self_assigned?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_goal_assignments_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_goal_assignments_goal_id"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_goal_assignments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_notifications: {
        Row: {
          acknowledged: boolean
          created_date: string
          goal_id: string
          id: string
          notification_type: string
          role: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          created_date?: string
          goal_id: string
          id?: string
          notification_type: string
          role: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          created_date?: string
          goal_id?: string
          id?: string
          notification_type?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          archived: boolean
          assignment_date: string | null
          category: string
          coach_id: string | null
          completed: boolean
          created_by: string | null
          created_date: string
          deadline: string | null
          deleted_date: string | null
          description: string | null
          id: string
          is_deleted: boolean
          lead_ids: string[] | null
          linked_output_ids: string[] | null
          member_ids: string[] | null
          title: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          assignment_date?: string | null
          category?: string
          coach_id?: string | null
          completed?: boolean
          created_by?: string | null
          created_date?: string
          deadline?: string | null
          deleted_date?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          lead_ids?: string[] | null
          linked_output_ids?: string[] | null
          member_ids?: string[] | null
          title: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          assignment_date?: string | null
          category?: string
          coach_id?: string | null
          completed?: boolean
          created_by?: string | null
          created_date?: string
          deadline?: string | null
          deleted_date?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          lead_ids?: string[] | null
          linked_output_ids?: string[] | null
          member_ids?: string[] | null
          title?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_date: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_date: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean
          category: Database["public"]["Enums"]["habit_category"] | null
          completed: boolean
          created_at: string
          description: string | null
          id: string
          is_deleted: boolean
          last_completed_date: string | null
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
          last_completed_date?: string | null
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
          last_completed_date?: string | null
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
      projects: {
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
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          project_id: string | null
          tagged_users: string[] | null
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
          project_id?: string | null
          tagged_users?: string[] | null
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
          project_id?: string | null
          tagged_users?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          weekly_output_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
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
          linked_goal_ids: string[] | null
          original_due_date: string | null
          progress: number
          project_id: string | null
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
          linked_goal_ids?: string[] | null
          original_due_date?: string | null
          progress?: number
          project_id?: string | null
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
          linked_goal_ids?: string[] | null
          original_due_date?: string | null
          progress?: number
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_outputs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
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
      calculate_habit_streak: {
        Args: { habit_id_param: string; user_id_param: string }
        Returns: number
      }
      get_filtered_users_for_role: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          user_position: string
          user_status: string
        }[]
      }
      get_habits_for_date: {
        Args: { target_date: string; user_id_param: string }
        Returns: {
          archived: boolean
          category: string
          completed: boolean
          created_at: string
          description: string
          id: string
          is_deleted: boolean
          name: string
          streak: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      toggle_habit_completion: {
        Args: {
          habit_id_param: string
          is_completed: boolean
          target_date: string
          user_id_param: string
        }
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
