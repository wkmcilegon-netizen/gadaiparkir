# Dr. Cel's Pawn

Buat aplikasi web profesional berstandar enterprise dengan tema "Gadai Motor Dr. Cel" menggunakan React, Tailwind CSS, TypeScript, dan shadcn/ui. Desain harus berkesan premium, bersih, modern, dengan palet warna korporat yang elegan. 

Aplikasi ini menggunakan sistem dua role terpisah (Halaman Dr dan Halaman Cel) dengan spesifikasi lengkap sebagai berikut:

1. Sistem Autentikasi & Keamanan (Login & Settings):

- Halaman Login terpusat atau terpisah dengan kredensial tetap yang tidak dapat diubah namanya:

  a. Role Dr: Username dikunci permanen "omdru", password default "123456".

  b. Role Cel: Username dikunci permanen "Pecel", password default "123456".

- Fitur Show / Hide Password: Pada semua input password (di halaman login maupun pengaturan), sediakan ikon mata (toggle visibility) agar teks password bisa disembunyikan atau ditampilkan.

- Halaman Pengaturan (Settings): Masing-masing role memiliki menu pengaturan untuk mengganti password mereka, dilengkapi validasi password lama, password baru, dan konfirmasi password baru.

2. Halaman Utama & Halaman Dr (Pencatatan Kendaraan):

- Tampilkan tabel utama (data grid) dengan pembatas sel (borders) yang rapi, bersih, dan mudah dibaca.

- Kolom Tabel Utama:

  a. Tanggal Masuk (Format: DD/MM/YYYY)

  b. Jenis Kendaraan (Contoh: Honda Beat, Yamaha NMAX, dll)

  c. Plat Nomor Kendaraan (Format kapital, misal: B 1234 XYZ)

  d. Tahun Kendaraan

  e. Nominal Pokok (Format Rupiah, misal: Rp 1.500.000)

  f. Jumlah Hari: Terisi otomatis secara dinamis dihitung berdasarkan selisih hari dari Tanggal Masuk hingga hari ini.

  g. Status: Badge dinamis (Pending, Jasa Parkir, atau Lunas).

- Fitur Input & Retensi Data: 

  - Dr dapat menginput data kendaraan baru dan melampirkan foto bukti.

  - Lampiran foto memiliki kebijakan retensi otomatis (auto-delete) jika usianya sudah melebihi 3 bulan.

  - Sediakan logo publik yang kompatibel dan terbaca sempurna saat di-deploy ke GitHub dan Vercel.

3. Logika Transaksi & Alur Status (Dr ke Cel):

- Saat Dr mengirimkan laporan beserta lampiran foto ke Cel, status akan berubah otomatis berdasarkan pilihan tujuan:

  a. Tujuan "Jasa Parkir": Nominal jasa parkir akan terisi dan bersifat kumulatif (terus bertambah secara otomatis jika ada transaksi dengan tujuan sama pada jenis motor dan plat nomor yang sama).

  b. Tujuan "Tebus": Status otomatis berubah menjadi "Lunas".

4. Halaman Cel (Konfirmasi & Transparansi):

- Halaman khusus bagi Cel untuk memverifikasi dan mengonfirmasi laporan dari Dr.

- Menyediakan transparansi penuh di mana Cel dapat melihat setiap perubahan, penambahan, atau aksi yang dilakukan oleh Dr secara real-time.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gadaiparkir.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/61cbed85-70a9-4f25-9d7e-1f95c9c88307).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
