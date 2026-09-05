import { useState } from "react";
import { Check, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBuatPengajuan,
  usePengajuan,
  usePutuskanPengajuan,
  useRealtimePengajuan,
  type Pengajuan,
} from "@/lib/pengajuan";
import type { Vehicle } from "@/lib/vehicles";
import { formatRupiah, formatTanggal, parseRupiahInput, todayISO } from "@/lib/format";

function labelUnit(v: Vehicle | undefined) {
  return v ? `${v.jenis_kendaraan} • ${v.plat_nomor}` : "Unit tidak ditemukan";
}

function StatusPill({ status }: { status: Pengajuan["status"] }) {
  const cls =
    status === "disetujui"
      ? "bg-success text-success-foreground"
      : status === "ditolak"
        ? "bg-destructive text-destructive-foreground"
        : "bg-warning text-warning-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${cls}`}>
      {status}
    </span>
  );
}

/** Panel Cel: mengirim nominal tambahan untuk sebuah unit. */
export function KirimNominalPanel({
  vehicles,
  username,
}: {
  vehicles: Vehicle[];
  username: string;
}) {
  useRealtimePengajuan();
  const { data: daftar = [] } = usePengajuan();
  const buat = useBuatPengajuan();

  const [vehicleId, setVehicleId] = useState("");
  const [nominal, setNominal] = useState("");
  const [tanggal, setTanggal] = useState(todayISO());
  const [catatan, setCatatan] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const jumlah = parseRupiahInput(nominal);
    if (!vehicleId) {
      toast.error("Pilih unit kendaraan terlebih dahulu.");
      return;
    }
    if (jumlah <= 0) {
      toast.error("Isi nominal yang akan dikirim.");
      return;
    }
    try {
      await buat.mutateAsync({
        vehicleId,
        nominal: jumlah,
        tanggalKirim: tanggal,
        catatan: catatan.trim() ? catatan.trim() : null,
        username,
      });
      toast.success("Nominal dikirim. Menunggu konfirmasi Dr.");
      setNominal("");
      setCatatan("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim nominal — data dikembalikan.");
    }
  }

  return (
    <section className="space-y-3">
      <form
        onSubmit={submit}
        className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-panel"
      >
        <div className="flex items-center gap-2">
          <Send className="size-3.5 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wide">Kirim Nominal ke Dr</h2>
        </div>

        <Select value={vehicleId} onValueChange={setVehicleId}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Pilih unit kendaraan" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id} className="text-xs">
                {labelUnit(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Input
            value={nominal ? formatRupiah(parseRupiahInput(nominal)) : ""}
            inputMode="numeric"
            onChange={(e) => setNominal(e.target.value)}
            placeholder="Rp 500.000"
            className="text-xs font-bold"
          />
          <Input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="text-xs font-bold"
          />
        </div>

        <Input
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan (opsional)"
          className="text-xs"
        />

        <Button type="submit" disabled={buat.isPending} className="w-full font-bold">
          {buat.isPending ? "Mengirim…" : "Kirim Nominal"}
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
        <div className="border-b border-border bg-secondary px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider">Riwayat Kiriman Nominal</h2>
        </div>
        {daftar.length === 0 ? (
          <p className="p-6 text-center text-[11px] text-muted-foreground">
            Belum ada nominal yang dikirim.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {daftar.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold">
                    {labelUnit(vehicles.find((v) => v.id === p.vehicle_id))}
                  </p>
                  <p className="font-mono text-[11px] font-bold text-primary">
                    {formatRupiah(p.nominal)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatTanggal(p.tanggal_kirim)}
                    {p.catatan ? ` • ${p.catatan}` : ""}
                  </p>
                </div>
                <StatusPill status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Panel Dr: konfirmasi nominal kiriman Cel — nominal pokok bertambah saat disetujui. */
export function PengajuanMasukPanel({ vehicles }: { vehicles: Vehicle[] }) {
  useRealtimePengajuan();
  const { data: daftar = [] } = usePengajuan();
  const putuskan = usePutuskanPengajuan();
  const menunggu = daftar.filter((p) => p.status === "menunggu");

  async function jalankan(id: string, setujui: boolean) {
    try {
      await putuskan.mutateAsync({ id, setujui });
      toast.success(setujui ? "Nominal pokok bertambah." : "Kiriman ditolak.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses — data dikembalikan.");
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
        <h2 className="text-xs font-bold uppercase tracking-wider">Nominal Kiriman Cel</h2>
        <span className="rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold uppercase text-warning-foreground">
          {menunggu.length} Menunggu
        </span>
      </div>
      {menunggu.length === 0 ? (
        <p className="p-6 text-center text-[11px] text-muted-foreground">
          Tidak ada nominal yang menunggu konfirmasi.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {menunggu.map((p) => (
            <li key={p.id} className="space-y-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold">
                    {labelUnit(vehicles.find((v) => v.id === p.vehicle_id))}
                  </p>
                  <p className="font-mono text-sm font-bold text-primary">
                    {formatRupiah(p.nominal)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Dikirim {formatTanggal(p.tanggal_kirim)} oleh {p.diajukan_username}
                    {p.catatan ? ` • ${p.catatan}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 font-bold"
                  disabled={putuskan.isPending}
                  onClick={() => jalankan(p.id, true)}
                >
                  <Check className="mr-1 size-4" /> Konfirmasi
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-bold"
                  disabled={putuskan.isPending}
                  onClick={() => jalankan(p.id, false)}
                >
                  <X className="mr-1 size-4" /> Tolak
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
