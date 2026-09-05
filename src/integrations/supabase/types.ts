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
      activity_logs: {
        Row: {
          action: string
          actor_id: string
          actor_role: Database["public"]["Enums"]["app_role"]
          actor_username: string
          created_at: string
          detail: string | null
          id: string
          vehicle_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string
          actor_role: Database["public"]["Enums"]["app_role"]
          actor_username: string
          created_at?: string
          detail?: string | null
          id?: string
          vehicle_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_role?: Database["public"]["Enums"]["app_role"]
          actor_username?: string
          created_at?: string
          detail?: string | null
          id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      pengajuan_nominal: {
        Row: {
          archived_at: string | null
          catatan: string | null
          created_at: string
          diajukan_oleh: string
          diajukan_username: string
          diputuskan_at: string | null
          diputuskan_oleh: string | null
          id: string
          nominal: number
          status: Database["public"]["Enums"]["pengajuan_status"]
          tanggal_kirim: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          archived_at?: string | null
          catatan?: string | null
          created_at?: string
          diajukan_oleh?: string
          diajukan_username: string
          diputuskan_at?: string | null
          diputuskan_oleh?: string | null
          id?: string
          nominal: number
          status?: Database["public"]["Enums"]["pengajuan_status"]
          tanggal_kirim?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          archived_at?: string | null
          catatan?: string | null
          created_at?: string
          diajukan_oleh?: string
          diajukan_username?: string
          diputuskan_at?: string | null
          diputuskan_oleh?: string | null
          id?: string
          nominal?: number
          status?: Database["public"]["Enums"]["pengajuan_status"]
          tanggal_kirim?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengajuan_nominal_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          username?: string
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
      vehicles: {
        Row: {
          catatan: string | null
          created_at: string
          created_by: string
          dikirim_ke_cel: boolean
          dikonfirmasi_at: string | null
          dikonfirmasi_cel: boolean
          id: string
          jasa_parkir: number
          jenis_kendaraan: string
          nominal_pokok: number
          photo_path: string | null
          photo_uploaded_at: string | null
          plat_nomor: string
          status: Database["public"]["Enums"]["vehicle_status"]
          tahun: number
          tanggal_kirim: string | null
          tanggal_masuk: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          created_by?: string
          dikirim_ke_cel?: boolean
          dikonfirmasi_at?: string | null
          dikonfirmasi_cel?: boolean
          id?: string
          jasa_parkir?: number
          jenis_kendaraan: string
          nominal_pokok?: number
          photo_path?: string | null
          photo_uploaded_at?: string | null
          plat_nomor: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          tahun: number
          tanggal_kirim?: string | null
          tanggal_masuk?: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          created_by?: string
          dikirim_ke_cel?: boolean
          dikonfirmasi_at?: string | null
          dikonfirmasi_cel?: boolean
          id?: string
          jasa_parkir?: number
          jenis_kendaraan?: string
          nominal_pokok?: number
          photo_path?: string | null
          photo_uploaded_at?: string | null
          plat_nomor?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          tahun?: number
          tanggal_kirim?: string | null
          tanggal_masuk?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      putuskan_pengajuan: {
        Args: { _pengajuan_id: string; _setujui: boolean }
        Returns: {
          archived_at: string | null
          catatan: string | null
          created_at: string
          diajukan_oleh: string
          diajukan_username: string
          diputuskan_at: string | null
          diputuskan_oleh: string | null
          id: string
          nominal: number
          status: Database["public"]["Enums"]["pengajuan_status"]
          tanggal_kirim: string
          updated_at: string
          vehicle_id: string
        }
        SetofOptions: {
          from: "*"
          to: "pengajuan_nominal"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "dr" | "cel"
      pengajuan_status: "menunggu" | "disetujui" | "ditolak"
      vehicle_status: "Pending" | "Jasa Parkir" | "Lunas"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["dr", "cel"],
      pengajuan_status: ["menunggu", "disetujui", "ditolak"],
      vehicle_status: ["Pending", "Jasa Parkir", "Lunas"],
    },
  },
} as const
