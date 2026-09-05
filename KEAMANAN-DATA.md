# Keamanan Data Klien — Gadai Motor Dr. Cel

Aplikasi ini berjalan di stack Lovable (TanStack Start + Lovable Cloud/Supabase),
bukan Next.js/Vercel. Padanan konsep yang Anda sebutkan:

| Permintaan (Next.js/Vercel) | Padanan di aplikasi ini |
| --- | --- |
| Server Actions / API Routes | `createServerFn` + Supabase RPC dengan RLS |
| ISR / SSR revalidasi | TanStack Query + Realtime (invalidasi otomatis saat data berubah) |
| Vercel Environment Variables | Secrets & environment Lovable Cloud (tidak ada di repo) |
| Deploy via GitHub → Vercel | Tombol Publish (kode saja; database & storage terpisah total) |

## 1. Diagram alur data klien

```text
Input pengguna (browser)
        |
        v
Validasi UI  ->  Optimistic update (cache sementara di memori browser)
        |
        v
Supabase Data API / RPC  ->  RLS + CHECK constraint + SECURITY DEFINER
        |                         (gagal -> UI rollback + pesan error)
        v
Database Postgres (satu-satunya sumber kebenaran)
        |
        +--> Realtime -> semua perangkat menampilkan data terbaru
        |
Media  --> Bucket privat "bukti-foto" (di luar repo) -> signed URL saat ditampilkan
```

Tidak ada titik di mana data klien tersimpan di kode/repo: tidak ada seed data,
tidak ada JSON konten, tidak ada file media klien di `public/`. Yang ada di repo
hanya kode, logo aplikasi, dan file SQL struktur (bukan isi data).

## 2. Yang sudah diterapkan

- **Database sebagai sumber tunggal.** Semua teks (kendaraan, nominal, status,
  tanggal kirim, pengajuan nominal) dibaca/ditulis lewat database. Tidak ada
  hardcode data klien di komponen.
- **Mutasi tervalidasi server.** Setiap tulis melewati RLS berbasis role
  (`dr` / `cel`) dan `has_role()`. Persetujuan nominal memakai fungsi database
  `putuskan_pengajuan()` — satu transaksi: status berubah **dan** nominal pokok
  bertambah, sehingga tidak pernah setengah jadi. Hanya Dr yang boleh menyetujui.
- **Optimistic update + rollback.** Kirim nominal dan konfirmasi nominal
  memperbarui tampilan seketika; bila database menolak, tampilan dikembalikan ke
  kondisi sebelumnya dan muncul pesan error.
- **Proteksi operasi destruktif.** Tabel pengajuan tidak punya izin hapus sama
  sekali (tidak ada GRANT DELETE); penghapusan hanya berupa penandaan arsip
  (`archived_at`). Tabel utama hanya bisa dihapus oleh role Dr.
- **Isolasi storage.** Media klien berada di bucket privat `bukti-foto`
  (terpisah dari aset aplikasi di `src/assets`), dengan batas ukuran 10 MB dan
  akses lewat signed URL, bukan path relatif/base64.
- **Environment.** Kunci koneksi diinjeksi runtime oleh Lovable Cloud
  (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` di
  server; `VITE_SUPABASE_*` di browser). Service role key tidak pernah masuk
  kode klien. Bila Anda men-deploy sendiri ke Vercel, isi variabel yang sama di
  Project Settings → Environment Variables (Production terpisah dari Preview).

## 3. Checklist pre-deploy (jalankan setiap kali sebelum publish/push)

1. Tidak ada data klien nyata di kode: cari kata kunci plat nomor/nominal di
   `src/` — hasil harus kosong (hanya contoh placeholder).
2. Tidak ada file media klien baru di `public/` atau `src/assets/`.
3. Tidak ada `DROP TABLE`, `TRUNCATE`, atau `DELETE FROM` tanpa filter pada
   migrasi baru.
4. Migrasi baru bersifat aditif (tambah kolom/tabel), bukan mengubah tipe atau
   menghapus kolom yang berisi data.
5. Tidak ada kunci rahasia tertulis di kode (hanya publishable key yang boleh).
6. Login sebagai Dr dan sebagai Cel di preview; pastikan data lama tetap tampil.
7. Uji satu siklus: Cel kirim nominal → Dr konfirmasi → nominal pokok bertambah.
8. Uji gagal: matikan koneksi sebentar, pastikan tampilan kembali (rollback) dan
   muncul pesan error.
9. Pastikan upload foto masih bisa dibuka (signed URL valid).
10. Catat versi/commit terakhir yang sehat untuk kebutuhan rollback.

## 4. Prosedur rollback (aman untuk data)

1. Kode dan data terpisah: mengembalikan kode **tidak** menyentuh database atau
   storage sama sekali.
2. Di Lovable: buka riwayat versi, pilih versi terakhir yang sehat, klik Restore,
   lalu Publish ulang.
3. Bila memakai GitHub/Vercel: `git revert <commit>` lalu push — jangan
   `git reset --hard` pada branch produksi. Atau pilih deployment sebelumnya di
   Vercel dan klik "Promote to Production".
4. Jangan menjalankan migrasi "rollback" yang menghapus kolom. Bila kolom baru
   tidak dipakai versi lama, biarkan kolomnya tetap ada (aditif = aman).
5. Setelah rollback, jalankan ulang langkah 6–9 pada checklist di atas.

## 5. Auto-cleanup

- Retensi foto bukti 3 bulan dijalankan sebagai proses terpisah, bukan saat
  deploy.
- Pengajuan nominal memakai soft delete (`archived_at`); hard delete tidak
  tersedia lewat aplikasi dan hanya bisa dilakukan lewat pekerjaan terjadwal
  dengan izin khusus setelah masa tenggang.

## 6. Konfirmasi

Tidak ada operasi destruktif (drop/truncate/delete massal) di dalam kode yang
akan di-deploy. Semua perubahan skema terakhir bersifat menambah tabel, fungsi,
dan kebijakan akses baru.
