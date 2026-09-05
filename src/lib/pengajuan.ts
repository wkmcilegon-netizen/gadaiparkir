import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Pengajuan = Database["public"]["Tables"]["pengajuan_nominal"]["Row"];
export const PENGAJUAN_KEY = ["pengajuan_nominal"] as const;

/** Sumber kebenaran tunggal: seluruh data pengajuan dibaca langsung dari database. */
export function usePengajuan() {
  return useQuery({
    queryKey: PENGAJUAN_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pengajuan_nominal")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Pengajuan[];
    },
  });
}

export function useRealtimePengajuan() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("pengajuan-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pengajuan_nominal" },
        () => {
          queryClient.invalidateQueries({ queryKey: PENGAJUAN_KEY });
          queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export type BuatPengajuanInput = {
  vehicleId: string;
  nominal: number;
  tanggalKirim: string;
  catatan: string | null;
  username: string;
};

/** Cel mengirim nominal. Optimistic update + rollback bila database menolak. */
export function useBuatPengajuan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BuatPengajuanInput) => {
      if (!Number.isFinite(input.nominal) || input.nominal <= 0) {
        throw new Error("Nominal harus lebih besar dari nol.");
      }
      const { data, error } = await supabase
        .from("pengajuan_nominal")
        .insert({
          vehicle_id: input.vehicleId,
          nominal: input.nominal,
          tanggal_kirim: input.tanggalKirim,
          catatan: input.catatan,
          diajukan_username: input.username,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Pengajuan;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: PENGAJUAN_KEY });
      const sebelumnya = queryClient.getQueryData<Pengajuan[]>(PENGAJUAN_KEY);
      const sementara = {
        id: `optimistic-${Date.now()}`,
        vehicle_id: input.vehicleId,
        nominal: input.nominal,
        catatan: input.catatan,
        status: "menunggu",
        tanggal_kirim: input.tanggalKirim,
        diajukan_oleh: "",
        diajukan_username: input.username,
        diputuskan_oleh: null,
        diputuskan_at: null,
        archived_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Pengajuan;
      queryClient.setQueryData<Pengajuan[]>(PENGAJUAN_KEY, [sementara, ...(sebelumnya ?? [])]);
      return { sebelumnya };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.sebelumnya) queryClient.setQueryData(PENGAJUAN_KEY, ctx.sebelumnya);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PENGAJUAN_KEY });
    },
  });
}

/**
 * Dr memutuskan pengajuan. Persetujuan dan penambahan nominal pokok dijalankan
 * satu transaksi di database (fungsi putuskan_pengajuan) agar tidak pernah inkonsisten.
 */
export function usePutuskanPengajuan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, setujui }: { id: string; setujui: boolean }) => {
      const { data, error } = await supabase.rpc("putuskan_pengajuan", {
        _pengajuan_id: id,
        _setujui: setujui,
      });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, setujui }) => {
      await queryClient.cancelQueries({ queryKey: PENGAJUAN_KEY });
      const sebelumnya = queryClient.getQueryData<Pengajuan[]>(PENGAJUAN_KEY);
      queryClient.setQueryData<Pengajuan[]>(PENGAJUAN_KEY, (lama) =>
        (lama ?? []).map((p) =>
          p.id === id ? { ...p, status: setujui ? "disetujui" : "ditolak" } : p,
        ),
      );
      return { sebelumnya };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.sebelumnya) queryClient.setQueryData(PENGAJUAN_KEY, ctx.sebelumnya);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PENGAJUAN_KEY });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

/** Soft delete: pengajuan hanya diarsipkan, tidak pernah dihapus fisik dari database. */
export async function arsipkanPengajuan(id: string) {
  const { error } = await supabase
    .from("pengajuan_nominal")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
