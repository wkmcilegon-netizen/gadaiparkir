import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, type VehicleStatus } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { catatAktivitas, useRealtimeSync, useVehicles } from "@/lib/vehicles";
import { formatRupiah, formatTanggal, hitungJumlahHari } from "@/lib/format";

export const Route = createFileRoute("/cel")({
  head: () => ({
    meta: [
      { title: "Halaman Cel — Konfirmasi Laporan | Gadai Motor Dr. Cel" },
      {
        name: "description",
        content:
          "Verifikasi dan konfirmasi laporan gadai motor dari Dr, lengkap dengan bukti foto dan riwayat aktivitas real-time.",
      },
      { property: "og:title", content: "Halaman Cel — Konfirmasi Laporan" },
      {
        property: "og:description",
        content: "Transparansi penuh atas setiap perubahan data yang dilakukan Dr.",
      },
    ],
  }),
  component: () => (
    <AppShell requireRole="cel" active="Konfirmasi">
      <CelPage />
    </AppShell>
  ),
});

function CelPage() {
  const { username } = useAuth();
  const queryClient = useQueryClient();
  const { data: vehicles = [], isLoading } = useVehicles();
  useRealtimeSync();

  const menunggu = vehicles.filter((v) => v.dikirim_ke_cel && !v.dikonfirmasi_cel);
  const selesai = vehicles.filter((v) => v.dikonfirmasi_cel);

  async function konfirmasi(id: string, label: string) {
    const { error } = await supabase
      .from("vehicles")
      .update({ dikonfirmasi_cel: true, dikonfirmasi_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await catatAktivitas({
      username: username ?? "Pecel",
      role: "cel",
      action: "mengonfirmasi laporan",
      detail: label,
      vehicleId: id,
    });
    toast.success("Laporan dikonfirmasi.");
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 shadow-panel">
          <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">
            Menunggu Konfirmasi
          </p>
          <p className="text-base font-bold text-warning">{menunggu.length} Laporan</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-panel">
          <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Dikonfirmasi</p>
          <p className="text-base font-bold text-success">{selesai.length} Laporan</p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Inbox className="size-3.5 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wide">Laporan Masuk dari Dr</h2>
        </div>

        {isLoading && <p className="text-xs text-muted-foreground">Memuat data…</p>}
        {!isLoading && menunggu.length === 0 && (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-[11px] text-muted-foreground">
            Tidak ada laporan yang menunggu konfirmasi.
          </p>
        )}

        <div className="space-y-3">
          {menunggu.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-3 shadow-panel">
              <div className="flex gap-3">
                <PhotoBukti
                  path={v.photo_path}
                  alt={`Bukti ${v.plat_nomor}`}
                  className="size-20 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold">{v.jenis_kendaraan}</p>
                      <p className="font-mono text-[11px] font-bold text-primary">{v.plat_nomor}</p>
                    </div>
                    <StatusBadge status={v.status as VehicleStatus} />
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <Row label="Tgl Masuk" value={formatTanggal(v.tanggal_masuk)} />
                    <Row label="Tahun" value={String(v.tahun)} />
                    <Row label="Pokok" value={formatRupiah(v.nominal_pokok)} />
                    <Row label="Jasa Parkir" value={formatRupiah(v.jasa_parkir)} />
                    <Row label="Jumlah Hari" value={`${hitungJumlahHari(v.tanggal_masuk)} hari`} />
                  </dl>
                </div>
              </div>
              <Button
                onClick={() =>
                  konfirmasi(v.id, `${v.jenis_kendaraan} • ${v.plat_nomor} • ${v.status}`)
                }
                className="mt-3 w-full font-bold"
              >
                <CheckCircle2 className="mr-1.5 size-4" /> Konfirmasi Laporan
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
        <div className="border-b border-border bg-secondary px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider">Seluruh Data Unit</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-secondary/50">
                {["Tgl Masuk", "Jenis", "Plat", "Pokok", "Jasa Parkir", "Hari", "Status"].map((h) => (
                  <th
                    key={h}
                    className="border border-border px-3 py-2 text-[10px] font-bold uppercase text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-secondary/50">
                  <td className="whitespace-nowrap border border-border px-3 py-2.5 font-mono text-[11px]">
                    {formatTanggal(v.tanggal_masuk)}
                  </td>
                  <td className="whitespace-nowrap border border-border px-3 py-2.5 text-[11px] font-semibold">
                    {v.jenis_kendaraan}
                  </td>
                  <td className="whitespace-nowrap border border-border px-3 py-2.5 font-mono text-[11px] font-bold">
                    {v.plat_nomor}
                  </td>
                  <td className="whitespace-nowrap border border-border px-3 py-2.5 text-right font-mono text-[11px]">
                    {formatRupiah(v.nominal_pokok)}
                  </td>
                  <td className="whitespace-nowrap border border-border px-3 py-2.5 text-right font-mono text-[11px]">
                    {formatRupiah(v.jasa_parkir)}
                  </td>
                  <td className="border border-border px-3 py-2.5 text-center text-[11px]">
                    {hitungJumlahHari(v.tanggal_masuk)}
                  </td>
                  <td className="border border-border px-3 py-2.5 text-center">
                    <StatusBadge status={v.status as VehicleStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="aktivitas" className="scroll-mt-24">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="size-3.5 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wide">Transparansi Aktivitas Dr</h2>
        </div>
        <div className="space-y-2">
          {logs.length === 0 && (
            <p className="rounded-lg border border-dashed border-border bg-card p-4 text-center text-[11px] text-muted-foreground">
              Belum ada aktivitas tercatat.
            </p>
          )}
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-border bg-card p-3">
              <p className="text-[11px] font-medium">
                <span className="font-bold">{log.actor_username}</span> {log.action}
              </p>
              {log.detail && <p className="mt-0.5 text-[10px] text-muted-foreground">{log.detail}</p>}
              <p className="mt-1 font-mono text-[9px] uppercase text-muted-foreground">
                {waktuRelatif(log.created_at)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono font-semibold">{value}</dd>
    </div>
  );
}
