# School Inventory (Laravel + Sanctum + MySQL + React + Tailwind)

Folder ini adalah **paket file aplikasi untuk digabungkan ke project Laravel**, bukan project Laravel mandiri. File backend, migration, seeder, frontend, route, dan tes fitur ada di folder ini.

## 1. Persyaratan dan instalasi

Gunakan project Laravel baru (Laravel 11/12 atau versi yang kompatibel dengan struktur aplikasi kamu), lalu jalankan:

```bash
composer create-project laravel/laravel school-inventory
cd school-inventory
php artisan install:api
```

Salin isi folder paket ini ke folder project Laravel dengan struktur folder yang sama. Saat diminta, timpa file yang memang disediakan paket ini. Pastikan migration bawaan Laravel untuk tabel `users` tetap ada. Perintah `install:api` memasang Laravel Sanctum dan menyiapkan route API.

Atur `.env` (contoh MySQL):

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inventaris_sekolah
DB_USERNAME=root
DB_PASSWORD=

# Ganti kredensial demo sebelum dipakai di lingkungan nyata.
INVENTORY_ADMIN_EMAIL=admin@sekolah.test
INVENTORY_ADMIN_PASSWORD=admin12345
INVENTORY_PETUGAS_EMAIL=petugas@sekolah.test
INVENTORY_PETUGAS_PASSWORD=petugas12345
```

Buat database `inventaris_sekolah` di MySQL/phpMyAdmin, kemudian jalankan:

```bash
php artisan optimize:clear
php artisan migrate --seed
php artisan route:list --path=api
```

Jalankan server:

```bash
php artisan serve
```

Untuk frontend, pasang dependency yang dipakai:

```bash
npm install react react-dom react-router-dom axios
npm install -D @vitejs/plugin-react tailwindcss @tailwindcss/vite
npm run dev
```

Buka `http://127.0.0.1:8000`. Untuk build produksi, jalankan `npm run build` setelah dependency Vite/Laravel yang disediakan project Laravel terpasang.

## 2. Akun demo hasil seeder

| Role | Email | Password awal |
|---|---|---|
| Admin | `admin@sekolah.test` | `admin12345` |
| Petugas | `petugas@sekolah.test` | `petugas12345` |

Akun demo hanya untuk instalasi lokal/pengujian. **Ganti password dan email default sebelum aplikasi dipakai sungguhan atau dipublikasikan.** Nilainya dapat diatur lewat variabel `INVENTORY_ADMIN_*` dan `INVENTORY_PETUGAS_*` pada `.env` sebelum menjalankan `migrate --seed`. Untuk database lama, migration pengaman menurunkan semua akun menjadi `petugas` dan hanya mempertahankan email yang ditetapkan pada `INVENTORY_ADMIN_EMAIL` sebagai admin. Seeder kemudian membuat akun admin tersebut jika belum ada. Atur email admin yang benar di `.env` sebelum migrasi jika bukan `admin@sekolah.test`.

Seeder aman dijalankan ulang: data kategori/barang contoh tidak diduplikasi, dan password pengguna yang sudah ada tidak ditimpa ulang. Role akun seed akan diselaraskan menjadi role yang ditentukan.

## 3. Pembagian role dan authorization

Authorization dilaksanakan di **backend pada setiap route API**, bukan hanya menyembunyikan tombol pada React. Semua endpoint selain `/api/login` membutuhkan token Sanctum dan role valid (`admin` atau `petugas`). Middleware `EnsureRole` dipanggil langsung sebagai class middleware pada route, sehingga tidak memerlukan pendaftaran alias manual di `bootstrap/app.php` atau `app/Http/Kernel.php`.

| Fitur | Admin | Petugas |
|---|:---:|:---:|
| Login, dashboard, lihat barang | Ya | Ya |
| Tambah dan edit barang | Ya | Ya |
| Hapus barang | Ya | Tidak |
| Lihat kategori | Ya | Ya |
| Tambah, edit, hapus kategori | Ya | Tidak |
| Catat peminjaman dan pengembalian | Ya | Ya |
| Lihat riwayat barang | Ya | Ya |
| Lihat/unduh rekap laporan | Ya | Ya |

Role default di migration adalah `petugas` (prinsip least privilege), bukan admin. Migration tambahan menurunkan role akun lama menjadi `petugas` untuk menutup celah dari versi awal yang memakai default `admin`, lalu hanya mempertahankan email admin yang dikonfigurasi sebagai `admin`; seeder membuat akun itu bila belum ada. Jalankan `php artisan migrate --seed` agar akun admin siap dipakai. Akun dengan role kosong/tidak dikenal ditolak saat login dan tidak lolos middleware. Jika perlu menambah akun staf setelah seeding, buat melalui proses administrasi server yang tepercaya dan tetapkan `role` hanya ke `admin` atau `petugas`; jangan menerima field role dari form publik.

## 4. Endpoint API

Semua endpoint kecuali `POST /api/login` memerlukan header:

```http
Authorization: Bearer <token>
Accept: application/json
```

| Method | URL | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/login` | Publik, rate limited | Login admin/petugas |
| GET | `/api/me` | Admin, Petugas | Profil pengguna login |
| POST | `/api/logout` | Admin, Petugas | Hapus token aktif |
| GET | `/api/items` | Admin, Petugas | Daftar/pencarian/filter barang |
| POST | `/api/items` | Admin, Petugas | Tambah barang |
| GET | `/api/items/{id}` | Admin, Petugas | Detail barang |
| PUT/PATCH | `/api/items/{id}` | Admin, Petugas | Edit barang |
| DELETE | `/api/items/{id}` | Admin | Hapus (soft delete) |
| GET | `/api/categories` | Admin, Petugas | Daftar kategori |
| GET | `/api/categories/{id}` | Admin, Petugas | Detail kategori |
| POST/PUT/PATCH/DELETE | `/api/categories...` | Admin | Kelola kategori |
| GET/POST | `/api/loans` | Admin, Petugas | Daftar/catat peminjaman |
| GET | `/api/loans/{id}` | Admin, Petugas | Detail peminjaman |
| POST | `/api/loans/{id}/return` | Admin, Petugas | Proses pengembalian |
| GET | `/api/histories` | Admin, Petugas | Riwayat barang |
| GET | `/api/reports/summary` | Admin, Petugas | Ringkasan dashboard |
| GET | `/api/reports/inventory` | Admin, Petugas | Rekap inventaris |
| GET | `/api/reports/loans` | Admin, Petugas | Rekap peminjaman |

Percobaan petugas mengakses endpoint admin menghasilkan HTTP `403`. Permintaan tanpa login menghasilkan HTTP `401`.

## 5. Konsistensi stok dan riwayat

- Stok hanya dapat dipinjam dari jumlah kondisi baik yang belum dipinjam.
- Perubahan jumlah baik tidak boleh membuat stok lebih kecil daripada jumlah yang sedang dipinjam.
- Baris barang dikunci saat stok diedit atau peminjaman dibuat untuk mencegah race condition.
- Pengembalian mengunci transaksi peminjaman dan barang, lalu memeriksa ulang status di dalam transaksi. Ini mencegah pengembalian ganda mengubah stok dua kali.
- Jumlah yang kembali rusak dipindahkan dari `quantity_good` ke `quantity_damaged`.
- Penghapusan barang memakai soft delete agar data dan relasi riwayat/peminjaman tetap dapat ditelusuri.

## 6. Menjalankan tes

Setelah project Laravel lengkap dan dependency Composer terpasang, jalankan:

```bash
php artisan test --filter=InventoryAuthorizationTest
```

Tes mencakup endpoint tanpa login, pembatasan petugas, hak admin, dan perilaku seeder yang tidak mengatur ulang password akun yang sudah ada.

## 7. Catatan deployment

- Gunakan HTTPS di server produksi.
- Jangan gunakan kredensial demo.
- Batasi akses database dan jangan commit file `.env`.
- Jalankan `npm run build` untuk asset produksi.
- Sesuaikan konfigurasi backup database dan kebijakan retensi riwayat sesuai aturan sekolah.
- Paket ini tidak menyertakan skeleton Laravel, `composer.json`, `artisan`, `.env`, atau `package.json` dari project dasar. Karena itu, migration, seeder, API, dan tes harus dijalankan setelah file paket digabung ke project Laravel lengkap.
