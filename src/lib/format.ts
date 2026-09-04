export function formatRupiah(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

export function parseRupiahInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatTanggal(iso: string): string {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

export function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Selisih hari dari tanggal masuk sampai hari ini (dinamis). */
export function hitungJumlahHari(tanggalMasuk: string): number {
  const start = new Date(`${tanggalMasuk.split("T")[0]}T00:00:00`);
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000);
  return diff < 0 ? 0 : diff;
}

export function formatPlat(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, " ").trimStart();
}

export function waktuRelatif(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}
