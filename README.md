## Pembagian SRS Programmer 
- Programmer 1 : Najib
- Programmer 2 : Misbach
- Programmer 3 : Putri


# momo ganteng
## Daftar Kebutuhan Fungsional

| ID | Nama Kebutuhan | Deskripsi | Aktor | Programmer |
|----|----------------|-----------|-------|------------|
| FR-01 | Registrasi Akun | Sistem menyediakan formulir registrasi dengan input nama, email, dan password. Email harus unik dan password disimpan dalam bentuk hash (bukan plain text). | Pengguna Baru | Programmer 1 |
| FR-02 | Login | Sistem memverifikasi kombinasi email dan password terhadap data pada basis data. Jika valid, sistem membuat sesi baru bagi pengguna. | Pengguna Terdaftar | Programmer 1 |
| FR-03 | Manajemen Sesi (Session) | Sistem mempertahankan status login pengguna selama sesi masih berlaku (belum kedaluwarsa) tanpa perlu login ulang di setiap permintaan halaman. | Sistem | Programmer 1 |
| FR-04 | Dashboard | Sistem menampilkan nama pengguna, saldo (total pemasukan dikurangi total pengeluaran), total pemasukan, total pengeluaran, dan daftar transaksi terbaru. | Pengguna Login | - |
| FR-05 | Manajemen Transaksi | Sistem memungkinkan pengguna menambah, melihat, mengubah, dan menghapus data transaksi (pemasukan/pengeluaran) miliknya sendiri. | Pengguna Login | Programmer 3 |
| FR-06 | Filter Transaksi | Sistem menyediakan filter riwayat transaksi berdasarkan jenis: seluruh transaksi, pemasukan saja, atau pengeluaran saja. | Pengguna Login | Programmer 3 |
| FR-07 | Cookie Referensi Pengguna | Sistem menyimpan minimal satu cookie yang menjadi referensi identitas sesi pengguna (session token) di sisi klien, bersifat HttpOnly. | Sistem | Programmer 2 |
| FR-08 | Otorisasi (Authorization) | Sistem memastikan setiap pengguna hanya dapat mengakses, mengubah, dan menghapus data transaksi miliknya sendiri (row-level ownership check) dan menolak akses ke rute terproteksi tanpa sesi valid. | Sistem | Programmer 2 |
| FR-09 | Logout | Sistem mengakhiri sesi pengguna, menghapus cookie sesi di sisi klien, dan mengarahkan pengguna kembali ke halaman login. | Pengguna Login | Programmer 2 |
| FR-10 | Set Budget Bulanan | User dapat menetapkan nominal budget untuk bulan dan tahun tertentu. | Pengguna Login | Programmer 1 |
| FR-11 | Budget Summary | Sistem menampilkan budget, total pengeluaran, dan sisa budget berdasarkan bulan yang dipilih. | Pengguna Login | Programmer 1 |
| FR-12 | Budget Indicator | Sistem menampilkan persentase dan status penggunaan budget. | Pengguna Login | Programmer 2 |
| FR-13 | Monthly Budget | User dapat memilih bulan/tahun untuk melihat budget dan penggunaan pada periode tersebut. | Pengguna Login | Programmer 3 |
| FR-14 | Budget Alert | Sistem memberikan peringatan ketika pengeluaran mendekati atau melebihi budget. | Sistem | Programmer 3 |

## Pembagian Programmer

| Programmer | Modul | FR yang Dikerjakan |
|------------|-------|--------------------|
| Programmer 1 | Registrasi, Login, Sesi & Set Budget | FR-01, FR-02, FR-03, FR-10, FR-11 |
| Programmer 2 | Cookie, Otorisasi, Logout & Budget Indicator | FR-07, FR-08, FR-09, FR-12 |
| Programmer 3 | Manajemen Transaksi, Filter & Monthly Budget | FR-05, FR-06, FR-13, FR-14 |

## Rincian Tugas

| Programmer | Tanggung Jawab |
|------------|----------------|
| Programmer 1 | FR-01 Registrasi, FR-02 Login, FR-03 Manajemen Sesi, FR-10 Set Budget Bulanan, dan FR-11 Budget Summary. Bertanggung jawab atas alur registrasi dan login, pembuatan sesi, serta penetapan dan ringkasan budget (budget, total pengeluaran, sisa budget). |
| Programmer 2 | FR-07 Cookie Referensi Pengguna, FR-08 Otorisasi, FR-09 Logout, dan FR-12 Budget Indicator. Bertanggung jawab atas cookie sesi (HttpOnly), middleware dan pembatasan akses berdasarkan user, proses logout, serta persentase dan status penggunaan budget. |
| Programmer 3 | FR-05 Manajemen Transaksi, FR-06 Filter Transaksi, FR-13 Monthly Budget, dan FR-14 Budget Alert. Bertanggung jawab atas CRUD dan validasi transaksi, filter Semua/Pemasukan/Pengeluaran, pengecekan kepemilikan transaksi, pemilihan bulan/tahun budget, serta peringatan saat pengeluaran mendekati atau melebihi budget. |

## 🗄️ Skema Database

**users**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| name | VARCHAR(100) | Nama pengguna |
| email | VARCHAR(150) UNIQUE | Email login |
| password_hash | VARCHAR(255) | Password terenkripsi |
| created_at | TIMESTAMP | Waktu akun dibuat |
| updated_at | TIMESTAMP | Waktu terakhir diperbarui |

**sessions**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| user_id | UUID / INTEGER (FK) | Relasi ke users |
| session_token | VARCHAR(255) UNIQUE | Nilai cookie referensi pengguna |
| expires_at | TIMESTAMP | Waktu kedaluwarsa sesi |
| created_at | TIMESTAMP | Waktu sesi dibuat |

**transactions**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| user_id | UUID / INTEGER (FK) | Relasi ke users |
| type | VARCHAR(10) | 'income' / 'expense' |
| amount | NUMERIC(15,2) | Nominal transaksi |
| description | VARCHAR(255) | Keterangan (opsional) |
| transaction_date | DATE | Tanggal transaksi |
| created_at | TIMESTAMP | Waktu data dibuat |
| updated_at | TIMESTAMP | Waktu terakhir diperbarui |

## 🚀 Instalasi & Menjalankan Proyek

1. **Clone repository**
```bash
   git clone https://github.com/username/xpends-tracker.git
   cd xpends-tracker
```

2. **Install dependencies**
```bash
   npm install
```

3. **Konfigurasi environment variable**

   Buat file `.env` di root proyek, sesuaikan dengan `.env.example`:
```env
   DATABASE_URL=postgresql://user:password@localhost:5432/xpends_tracker
   SESSION_SECRET=your_secret_key
```

4. **Migrasi database**
```bash
   npx prisma migrate dev
```
   *(sesuaikan perintah jika tim menggunakan tool migrasi lain)*

5. **Jalankan server pengembangan**
```bash
   npm run dev
```

6. Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📄 Lisensi

Proyek ini dibuat untuk keperluan tugas mata kuliah.

