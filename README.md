
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

## 👥 Tim Pengembang

Proyek ini dikembangkan oleh 1 Project Manager dan 3 Programmer dengan pembagian modul:

| Programmer | Modul | Tanggung Jawab |
|---|---|---|
| Programmer 1 | Autentikasi & Sesi | Register, Login, Session, Cookie, Authorization, Logout |
| Programmer 2 | Dashboard & Layout | Dashboard, layout & komponen UI bersama |
| Programmer 3 | Manajemen Transaksi | CRUD transaksi & filter transaksi |

## 📄 Lisensi

Proyek ini dibuat untuk keperluan tugas mata kuliah.
