import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { AppRole } from "@/lib/auth";

export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];

export const BUCKET = "bukti-foto";
export const RETENSI_HARI = 90; // 3 bulan

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("tanggal_masuk", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Vehicle[];
    },
  });
}

export function useActivity(limit = 40) {
  return useQuery({
    queryKey: ["activity_logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as ActivityLog[];
    },
  });
}

/** Sinkronisasi real-time: setiap perubahan Dr langsung terlihat oleh Cel. */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("drcel-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs" }, () => {
        queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export async function catatAktivitas(params: {
  username: string;
  role: AppRole;
  action: string;
  detail?: string;
  vehicleId?: string | null;
}) {
  await supabase.from("activity_logs").insert({
    actor_username: params.username,
    actor_role: params.role,
    action: params.action,
    detail: params.detail ?? null,
    vehicle_id: params.vehicleId ?? null,
  });
}

export async function getSignedPhotoUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/** Kebijakan retensi: hapus otomatis foto bukti yang usianya lebih dari 3 bulan. */
export async function hapusFotoKedaluwarsa(vehicles: Vehicle[]) {
  const batas = Date.now() - RETENSI_HARI * 86400000;
  const kedaluwarsa = vehicles.filter(
    (v) => v.photo_path && v.photo_uploaded_at && new Date(v.photo_uploaded_at).getTime() < batas,
  );
  if (kedaluwarsa.length === 0) return 0;
  await supabase.storage.from(BUCKET).remove(kedaluwarsa.map((v) => v.photo_path as string));
  for (const v of kedaluwarsa) {
    await supabase
      .from("vehicles")
      .update({ photo_path: null, photo_uploaded_at: null })
      .eq("id", v.id);
  }
  return kedaluwarsa.length;
}
