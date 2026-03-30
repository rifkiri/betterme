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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      active_pomodoro_sessions: {
        Row: {
          completed_break_sessions: number
          completed_work_sessions: number
          created_at: string
          current_pause_time: string | null
          current_session_type: string
          current_start_time: string | null
          current_time_remaining: number | null
          id: string
          is_card_visible: boolean
          is_floating_visible: boolean
          long_break_duration: number
          session_id: string
          session_status: string
          sessions_until_long_break: number
          short_break_duration: number
          task_id: string | null
          task_title: string | null
          updated_at: string
          user_id: string
          work_duration: number
        }
        Insert: {
          completed_break_sessions?: number
          completed_work_sessions?: number
          created_at?: string
          current_pause_time?: string | null
          current_session_type?: string
          current_start_time?: string | null
          current_time_remaining?: number | null
          id?: string
          is_card_visible?: boolean
          is_floating_visible?: boolean
          long_break_duration?: number
          session_id: string
          session_status?: string
          sessions_until_long_break?: number
          short_break_duration?: number
          task_id?: string | null
          task_title?: string | null
          updated_at?: string
          user_id: string
          work_duration?: number
        }
        Update: {
          completed_break_sessions?: number
          completed_work_sessions?: number
          created_at?: string
          current_pause_time?: string | null
          current_session_type?: string
          current_start_time?: string | null
          current_time_remaining?: number | null
          id?: string
          is_card_visible?: boolean
          is_floating_visible?: boolean
          long_break_duration?: number
          session_id?: string
          session_status?: string
          sessions_until_long_break?: number
          short_break_duration?: number
          task_id?: string | null
          task_title?: string | null
          updated_at?: string
          user_id?: string
          work_duration?: number
        }
        Relationships: []
      }
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_assignments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_assignments_user_id_fkey"
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
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          created_date?: string
          goal_id: string
          id?: string
          notification_type: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          created_date?: string
          goal_id?: string
          id?: string
          notification_type?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_notifications_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          external_key_result_id: string | null
          external_key_result_title: string | null
          external_objective_id: string | null
          external_objective_title: string | null
          id: string
          is_deleted: boolean
          last_external_sync_at: string | null
          lead_ids: string[] | null
          member_ids: string[] | null
          progress: number
          subcategory: string | null
          title: string
          unit: string
          updated_at: string
          user_id: string
          visibility: string | null
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
          external_key_result_id?: string | null
          external_key_result_title?: string | null
          external_objective_id?: string | null
          external_objective_title?: string | null
          id?: string
          is_deleted?: boolean
          last_external_sync_at?: string | null
          lead_ids?: string[] | null
          member_ids?: string[] | null
          progress?: number
          subcategory?: string | null
          title: string
          unit?: string
          updated_at?: string
          user_id: string
          visibility?: string | null
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
          external_key_result_id?: string | null
          external_key_result_title?: string | null
          external_objective_id?: string | null
          external_objective_title?: string | null
          id?: string
          is_deleted?: boolean
          last_external_sync_at?: string | null
          lead_ids?: string[] | null
          member_ids?: string[] | null
          progress?: number
          subcategory?: string | null
          title?: string
          unit?: string
          updated_at?: string
          user_id?: string
          visibility?: string | null
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
          archived: boolean | null
          category: Database["public"]["Enums"]["habit_category"] | null
          completed: boolean | null
          created_at: string
          description: string | null
          id: string
          is_deleted: boolean | null
          last_completed_date: string | null
          linked_goal_id: string | null
          name: string
          streak: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          category?: Database["public"]["Enums"]["habit_category"] | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          last_completed_date?: string | null
          linked_goal_id?: string | null
          name: string
          streak?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          category?: Database["public"]["Enums"]["habit_category"] | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          last_completed_date?: string | null
          linked_goal_id?: string | null
          name?: string
          streak?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          api_endpoint: string
          api_key_encrypted: string | null
          created_at: string | null
          id: string
          integration_type: string
          is_connected: boolean | null
          last_sync_at: string | null
          sync_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_endpoint: string
          api_key_encrypted?: string | null
          created_at?: string | null
          id?: string
          integration_type?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          sync_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_endpoint?: string
          api_key_encrypted?: string | null
          created_at?: string | null
          id?: string
          integration_type?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          sync_settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      integration_sync_logs: {
        Row: {
          connection_id: string | null
          created_at: string | null
          error_message: string | null
          external_id: string
          id: string
          internal_id: string | null
          sync_direction: string | null
          sync_status: string | null
          sync_type: string
          synced_at: string | null
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          external_id: string
          id?: string
          internal_id?: string | null
          sync_direction?: string | null
          sync_status?: string | null
          sync_type: string
          synced_at?: string | null
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          external_id?: string
          id?: string
          internal_id?: string | null
          sync_direction?: string | null
          sync_status?: string | null
          sync_type?: string
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
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
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          break_number: number | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number
          id: string
          interrupted: boolean | null
          pomodoro_number: number | null
          session_id: string | null
          session_status: string | null
          session_type: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          break_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes: number
          id?: string
          interrupted?: boolean | null
          pomodoro_number?: number | null
          session_id?: string | null
          session_status?: string | null
          session_type: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          break_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          interrupted?: boolean | null
          pomodoro_number?: number | null
          session_id?: string | null
          session_status?: string | null
          session_type?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          has_changed_password: boolean | null
          id: string
          last_login: string | null
          manager_id: string | null
          name: string
          position: string | null
          role: string
          temporary_password: string | null
          updated_at: string
          user_status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          has_changed_password?: boolean | null
          id: string
          last_login?: string | null
          manager_id?: string | null
          name: string
          position?: string | null
          role?: string
          temporary_password?: string | null
          updated_at?: string
          user_status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          has_changed_password?: boolean | null
          id?: string
          last_login?: string | null
          manager_id?: string | null
          name?: string
          position?: string | null
          role?: string
          temporary_password?: string | null
          updated_at?: string
          user_status?: string | null
        }
        Relationships: []
      }
      task_pomodoro_stats: {
        Row: {
          break_duration_total: number
          break_sessions_count: number
          created_at: string
          last_break_session_at: string | null
          last_work_session_at: string | null
          task_id: string
          updated_at: string
          user_id: string
          work_duration_total: number
          work_sessions_count: number
        }
        Insert: {
          break_duration_total?: number
          break_sessions_count?: number
          created_at?: string
          last_break_session_at?: string | null
          last_work_session_at?: string | null
          task_id: string
          updated_at?: string
          user_id: string
          work_duration_total?: number
          work_sessions_count?: number
        }
        Update: {
          break_duration_total?: number
          break_sessions_count?: number
          created_at?: string
          last_break_session_at?: string | null
          last_work_session_at?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
          work_duration_total?: number
          work_sessions_count?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean | null
          completed_date: string | null
          created_date: string
          deleted_date: string | null
          description: string | null
          due_date: string | null
          id: string
          is_deleted: boolean | null
          is_moved: boolean | null
          original_due_date: string | null
          priority: string | null
          tagged_users: string[] | null
          title: string
          updated_at: string
          user_id: string
          visibility: string | null
          weekly_output_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_date?: string | null
          created_date?: string
          deleted_date?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_deleted?: boolean | null
          is_moved?: boolean | null
          original_due_date?: string | null
          priority?: string | null
          tagged_users?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          visibility?: string | null
          weekly_output_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_date?: string | null
          created_date?: string
          deleted_date?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_deleted?: boolean | null
          is_moved?: boolean | null
          original_due_date?: string | null
          priority?: string | null
          tagged_users?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string | null
          weekly_output_id?: string | null
        }
        Relationships: []
      }
      weekly_outputs: {
        Row: {
          completed_date: string | null
          created_date: string
          deleted_date: string | null
          description: string | null
          due_date: string | null
          id: string
          is_deleted: boolean | null
          is_moved: boolean | null
          linked_goal_id: string | null
          original_due_date: string | null
          progress: number | null
          title: string
          updated_at: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          completed_date?: string | null
          created_date?: string
          deleted_date?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_deleted?: boolean | null
          is_moved?: boolean | null
          linked_goal_id?: string | null
          original_due_date?: string | null
          progress?: number | null
          title: string
          updated_at?: string
          user_id: string
          visibility?: string | null
        }
        Update: {
          completed_date?: string | null
          created_date?: string
          deleted_date?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_deleted?: boolean | null
          is_moved?: boolean | null
          linked_goal_id?: string | null
          original_due_date?: string | null
          progress?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_outputs_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_goal_assignment: {
        Args: {
          p_assigned_by: string
          p_goal_id: string
          p_role: string
          p_self_assigned?: boolean
          p_user_id: string
        }
        Returns: undefined
      }
      create_goal_notification: {
        Args: {
          p_goal_id: string
          p_notification_type: string
          p_role: string
          p_user_id: string
        }
        Returns: undefined
      }
      get_all_users_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          has_changed_password: boolean
          id: string
          last_login: string
          name: string
          role: string
          temporary_password: string
          user_position: string
          user_status: string
        }[]
      }
      get_filtered_users_for_role: {
        Args: never
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
          linked_goal_id: string
          name: string
          streak: number
        }[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      toggle_habit_completion: {
        Args: {
          habit_id_param: string
          is_completed: boolean
          target_date: string
          user_id_param: string
        }
        Returns: undefined
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
        | "mental"
        | "relationship"
        | "social"
        | "spiritual"
        | "wealth"
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
        "mental",
        "relationship",
        "social",
        "spiritual",
        "wealth",
      ],
    },
  },
} as const
