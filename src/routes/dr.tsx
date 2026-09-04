import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Plus, Send, Activity } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, type VehicleStatus } from "@/components/StatusBadge";
import { PhotoBukti } from "@/components/PhotoBukti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  BUCKET,
  catatAktivitas,
  hapusFotoKedaluwarsa,
  useActivity,
  useRealtimeSync,
  useVehicles,
  type Vehicle,
} from "@/lib/vehicles";
import {
  formatPlat,
  formatRupiah,
  formatTanggal,
  hitungJumlahHari,
  parseRupiahInput,
  todayISO,
  waktuRelatif,
} from "@/lib/format";

export const Route = createFileRoute("/dr")({
  head: () => ({
    meta: [
      { title: "Halaman Dr — Pencatatan Kendaraan | Gadai Motor Dr. Cel" },
      {
        name: "description",
        content:
          "Pencatatan unit gadai motor oleh Dr: tanggal masuk, jenis kendaraan, plat nomor, nominal pokok, jumlah hari, dan bukti foto.",
      },
      { property: "og:title", content: "Halaman Dr — Pencatatan Kendaraan" },
      {
        property: "og:description",
        content: "Data grid kendaraan gadai, input unit baru, dan pengiriman laporan ke Cel.",
      },
    ],
  }),
  component: () => (
    <AppShell requireRole="dr" active="Dashboard">
      <DrPage />
    </AppShell>
  ),
});

function DrPage() {
  const { username } = useAuth();
  const queryClient = useQueryClient();
  const { data: vehicles = [], isLoading } = useVehicles();
  const { data: logs = [] } = useActivity();
  useRealtimeSync();

  // Retensi otomatis: bersihkan foto yang usianya lebih dari 3 bulan.
  useEffect(() => {
    if (vehicles.length === 0) return;
    hapusFotoKedaluwarsa(vehicles).then((n) => {
      if (n > 0) {
        queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        toast.info(`${n} foto bukti lama dihapus otomatis (retensi 3 bulan).`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles.length]);

  const totalPokok = useMemo(
    () => vehicles.reduce((s, v) => s + Number(v.nominal_pokok), 0),
    [vehicles],
  );
  const totalParkir = useMemo(
    () => vehicles.reduce((s, v) => s + Number(v.jasa_parkir), 0),
    [vehicles],
  );

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Total Unit" value={`${vehicles.length}`} suffix="Unit" />
        <StatCard
          label="Aktif Berjalan"
          value={`${vehicles.filter((v) => v.status !== "Lunas").length}`}
          suffix="Item"
          accent
        />
        <StatCard label="Nominal Pokok" value={formatRupiah(totalPokok)} />
        <StatCard label="Jasa Parkir" value={formatRupiah(totalParkir)} accent />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
        <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider">Monitoring Unit</h2>
          <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-bold uppercase text-success-foreground">
            Live
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-secondary/50">
                {[
                  "Tgl Masuk",
                  "Jenis Kendaraan",
                  "Plat Nomor",
                  "Tahun",
                  "Pokok",
                  "Jasa Parkir",
                  "Hari",
                  "Status",
                  "Bukti",
                  "Kirim",
                ].map((h) => (
                  <th
                    key={h}
                    className="border border-border px-3 py-2 text-[10px] font-bold uppercase tracking-tight text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={10} className="border border-border p-6 text-center text-xs text-muted-foreground">
                    Memuat data…
                  </td>
                </tr>
              )}
              {!isLoading && vehicles.length === 0 && (
                <tr>
                  <td colSpan={10} className="border border-border p-6 text-center text-xs text-muted-foreground">
                    Belum ada kendaraan tercatat. Tambahkan unit pertama di bawah.
                  </td>
                </tr>
              )}
              {vehicles.map((v) => (
                <tr key={v.id} className="transition-colors hover:bg-secondary/50">
                  <td className="whitespace-nowrap border border-border px-3 py-2.5 font-mono text-[11px]">
                    {formatTanggal(v.tanggal_masuk)}
                  </td>
                  <td className="whitespace-nowrap border border-border px-3 py-2.5 text-[11px] font-semibold">
                    {v.jenis_kendaraan}
                  </td>
                  <td className="whitespace-nowrap border border-border px-3 py-2.5 font-mono text-[11px] font-bold">
                    {v.plat_nomor}
                  </td>
                  <td className="border border-border px-3 py-2.5 text-center font-mono text-[11px]">
                    {v.tahun}
                  </td>
                  <td className="whitespace-nowrap border border-border px-3 py-2.5 text-right font-mono text-[11px]">
                    {formatRupiah(v.nominal_pokok)}
                  </td>
                  <td className="whitespace-nowrap border border-border px-3 py-2.5 text-right font-mono text-[11px]">
                    {formatRupiah(v.jasa_parkir)}
                  </td>
                  <td className="border border-border px-3 py-2.5 text-center text-[11px] font-medium">
                    {hitungJumlahHari(v.tanggal_masuk)}
                  </td>
                  <td className="border border-border px-3 py-2.5 text-center">
                    <StatusBadge status={v.status as VehicleStatus} />
                  </td>
                  <td className="border border-border px-2 py-2.5">
                    <PhotoBukti path={v.photo_path} alt={`Bukti ${v.plat_nomor}`} className="size-10" />
                  </td>
                  <td className="border border-border px-2 py-2.5 text-center">
                    <KirimLaporanDialog vehicle={v} username={username ?? "omdru"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FormInputKendaraan username={username ?? "omdru"} />

      <section id="aktivitas" className="scroll-mt-24">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="size-3.5 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wide">Riwayat Aktivitas</h2>
        </div>
        <div className="space-y-2">
          {logs.length === 0 && (
            <p className="rounded-lg border border-dashed border-border bg-card p-4 text-center text-[11px] text-muted-foreground">
              Belum ada aktivitas tercatat.
            </p>
          )}
          {logs.slice(0, 8).map((log) => (
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

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-panel">
      <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className={accent ? "text-base font-bold text-primary" : "text-base font-bold"}>
        {value}
        {suffix && <span className="ml-1 text-[10px] font-normal text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}

function FormInputKendaraan({ username }: { username: string }) {
  const queryClient = useQueryClient();
  const [jenis, setJenis] = useState("");
  const [plat, setPlat] = useState("");
  const [tahun, setTahun] = useState("");
  const [tanggal, setTanggal] = useState(todayISO());
  const [pokok, setPokok] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [proses, setProses] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!jenis.trim() || !plat.trim() || !tahun || !pokok) {
      toast.error("Lengkapi jenis kendaraan, plat nomor, tahun, dan nominal pokok.");
      return;
    }
    setProses(true);
    try {
      let photoPath: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
        if (upErr) throw upErr;
        photoPath = path;
      }

      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          jenis_kendaraan: jenis.trim(),
          plat_nomor: formatPlat(plat).trim(),
          tahun: parseInt(tahun, 10),
          tanggal_masuk: tanggal,
          nominal_pokok: parseRupiahInput(pokok),
          photo_path: photoPath,
          photo_uploaded_at: photoPath ? new Date().toISOString() : null,
        })
        .select()
        .single();
      if (error) throw error;

      await catatAktivitas({
        username,
        role: "dr",
        action: "menambahkan unit baru",
        detail: `${jenis.trim()} • ${formatPlat(plat).trim()} • ${formatRupiah(parseRupiahInput(pokok))}`,
        vehicleId: data.id,
      });

      toast.success("Kendaraan berhasil dicatat.");
      setJenis("");
      setPlat("");
      setTahun("");
      setPokok("");
      setFile(null);
      setTanggal(todayISO());
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan data.");
    } finally {
      setProses(false);
    }
  }

  return (
    <section id="input" className="scroll-mt-24 rounded-xl bg-navy p-4 text-navy-foreground shadow-panel">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold">Input Unit Baru</h3>
          <p className="text-[10px] text-navy-foreground/60">Pastikan foto bukti terlampir jelas</p>
        </div>
        <div className="rounded-lg bg-primary/20 p-2">
          <Plus className="size-4 text-primary" />
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Jenis Kendaraan">
            <input
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              placeholder="Honda Beat"
              className="w-full bg-transparent text-xs font-bold placeholder:text-navy-foreground/30 focus:outline-none"
            />
          </Field>
          <Field label="Plat Nomor">
            <input
              value={plat}
              onChange={(e) => setPlat(formatPlat(e.target.value))}
              placeholder="B 1234 XYZ"
              className="w-full bg-transparent text-xs font-bold uppercase placeholder:text-navy-foreground/30 focus:outline-none"
            />
          </Field>
          <Field label="Tahun">
            <input
              value={tahun}
              inputMode="numeric"
              onChange={(e) => setTahun(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="2023"
              className="w-full bg-transparent text-xs font-bold placeholder:text-navy-foreground/30 focus:outline-none"
            />
          </Field>
          <Field label="Tanggal Masuk">
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full bg-transparent text-xs font-bold focus:outline-none"
            />
          </Field>
        </div>

        <Field label="Nominal Pokok">
          <input
            value={pokok ? formatRupiah(parseRupiahInput(pokok)) : ""}
            inputMode="numeric"
            onChange={(e) => setPokok(e.target.value)}
            placeholder="Rp 1.500.000"
            className="w-full bg-transparent text-xs font-bold placeholder:text-navy-foreground/30 focus:outline-none"
          />
        </Field>

        <label className="grid aspect-[16/9] w-full cursor-pointer place-items-center rounded-lg border border-dashed border-navy-foreground/20 bg-navy-foreground/5 transition-colors hover:bg-navy-foreground/10">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="text-center">
            <Upload className="mx-auto mb-2 size-4 text-navy-foreground/40" />
            <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-navy-foreground/40">
              {file ? file.name : "Unggah Bukti Foto"}
            </span>
            <p className="mt-1 text-[8px] text-navy-foreground/30">
              Terhapus otomatis setelah 3 bulan
            </p>
          </div>
        </label>

        <Button type="submit" disabled={proses} className="w-full font-bold uppercase tracking-widest">
          {proses ? "Menyimpan…" : "Simpan Kendaraan"}
        </Button>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-navy-foreground/10 bg-navy-foreground/5 p-2">
      <span className="mb-1 block text-[9px] font-bold uppercase text-navy-foreground/40">
        {label}
      </span>
      {children}
    </div>
  );
}

function KirimLaporanDialog({ vehicle, username }: { vehicle: Vehicle; username: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tujuan, setTujuan] = useState<"Jasa Parkir" | "Tebus">("Jasa Parkir");
  const [nominal, setNominal] = useState("");
  const [proses, setProses] = useState(false);

  async function kirim() {
    setProses(true);
    try {
      if (tujuan === "Jasa Parkir") {
        const tambahan = parseRupiahInput(nominal);
        if (tambahan <= 0) {
          toast.error("Isi nominal jasa parkir terlebih dahulu.");
          setProses(false);
          return;
        }
        const total = Number(vehicle.jasa_parkir) + tambahan;
        const { error } = await supabase
          .from("vehicles")
          .update({
            jasa_parkir: total,
            status: "Jasa Parkir",
            dikirim_ke_cel: true,
            dikonfirmasi_cel: false,
            dikonfirmasi_at: null,
          })
          .eq("id", vehicle.id);
        if (error) throw error;
        await catatAktivitas({
          username,
          role: "dr",
          action: "mengirim laporan Jasa Parkir ke Cel",
          detail: `${vehicle.jenis_kendaraan} • ${vehicle.plat_nomor} • +${formatRupiah(tambahan)} (kumulatif ${formatRupiah(total)})`,
          vehicleId: vehicle.id,
        });
      } else {
        const { error } = await supabase
          .from("vehicles")
          .update({
            status: "Lunas",
            dikirim_ke_cel: true,
            dikonfirmasi_cel: false,
            dikonfirmasi_at: null,
          })
          .eq("id", vehicle.id);
        if (error) throw error;
        await catatAktivitas({
          username,
          role: "dr",
          action: "mengirim laporan Tebus ke Cel",
          detail: `${vehicle.jenis_kendaraan} • ${vehicle.plat_nomor} • status menjadi Lunas`,
          vehicleId: vehicle.id,
        });
      }
      toast.success("Laporan terkirim ke Cel.");
      setNominal("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim laporan.");
    } finally {
      setProses(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label={`Kirim laporan ${vehicle.plat_nomor}`}
          className="inline-flex size-7 items-center justify-center rounded-md border border-border text-primary transition-colors hover:bg-secondary"
        >
          <Send className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            Kirim Laporan — {vehicle.plat_nomor}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-secondary p-3 text-[11px]">
            <p className="font-semibold">{vehicle.jenis_kendaraan}</p>
            <p className="text-muted-foreground">
              Pokok {formatRupiah(vehicle.nominal_pokok)} • Jasa parkir saat ini{" "}
              {formatRupiah(vehicle.jasa_parkir)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Tujuan Laporan
            </Label>
            <Select value={tujuan} onValueChange={(v) => setTujuan(v as "Jasa Parkir" | "Tebus")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Jasa Parkir">Jasa Parkir (kumulatif)</SelectItem>
                <SelectItem value="Tebus">Tebus (status jadi Lunas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tujuan === "Jasa Parkir" && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Nominal Jasa Parkir
              </Label>
              <Input
                value={nominal ? formatRupiah(parseRupiahInput(nominal)) : ""}
                inputMode="numeric"
                onChange={(e) => setNominal(e.target.value)}
                placeholder="Rp 50.000"
              />
              <p className="text-[10px] text-muted-foreground">
                Ditambahkan ke total jasa parkir unit ini secara kumulatif.
              </p>
            </div>
          )}

          <Button onClick={kirim} disabled={proses} className="w-full font-bold">
            {proses ? "Mengirim…" : "Kirim ke Cel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
