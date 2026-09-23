import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, TransactionType } from "@prisma/client";
import crypto from "crypto";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding database for Mahasiswa Expense Tracker...");

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create test student user
  const user = await prisma.user.create({
    data: {
      name: "Budi Mahasiswa",
      email: "budi@students.undip.ac.id",
      password: hashPassword("password123"),
      transactions: {
        create: [
          {
            title: "Uang Saku Bulanan Orang Tua",
            amount: 2000000,
            type: TransactionType.INCOME,
            category: "Uang Saku",
            description: "Transfer bulanan dari orang tua",
            date: new Date("2026-09-01"),
          },
          {
            title: "Beasiswa Prestasi",
            amount: 1500000,
            type: TransactionType.INCOME,
            category: "Beasiswa",
            description: "Pencairan Beasiswa Tahap II",
            date: new Date("2026-09-05"),
          },
          {
            title: "Bayar Uang Kos Bulan September",
            amount: 750000,
            type: TransactionType.EXPENSE,
            category: "Sewa Kos / Tempat Tinggal",
            description: "Sewa kamar kos bulanan",
            date: new Date("2026-09-02"),
          },
          {
            title: "Beli Buku Referensi Kuliah",
            amount: 150000,
            type: TransactionType.EXPENSE,
            category: "Buku & Pendidikan",
            description: "Beli buku mata kuliah Pemrograman Web",
            date: new Date("2026-09-07"),
          },
          {
            title: "Makan & Minum Mingguan",
            amount: 350000,
            type: TransactionType.EXPENSE,
            category: "Makanan & Minuman",
            description: "Belanja makan minggu pertama",
            date: new Date("2026-09-10"),
          },
          {
            title: "Paket Data Internet",
            amount: 100000,
            type: TransactionType.EXPENSE,
            category: "Internet & Pulsa",
            description: "Isi kuota internet untuk tugas kuliah",
            date: new Date("2026-09-12"),
          },
        ],
      },
    },
  });

  console.log(`Seeded user successfully: ${user.name} (${user.email})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
