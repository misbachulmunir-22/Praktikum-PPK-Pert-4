import { prisma } from "@/lib/prisma";

export interface BudgetPeriod {
  month: number; // 1 - 12
  year: number;
}

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

/**
 * Validasi bulan & tahun. Mengembalikan null jika tidak valid.
 * Bulan harus bilangan bulat 1-12, tahun bilangan bulat 2000-2100.
 */
export function parsePeriod(month: unknown, year: unknown): BudgetPeriod | null {
  const m = Number(month);
  const y = Number(year);

  if (!Number.isInteger(m) || m < 1 || m > 12) return null;
  if (!Number.isInteger(y) || y < MIN_YEAR || y > MAX_YEAR) return null;

  return { month: m, year: y };
}

/**
 * Baca ?month=&year= dari URL. Jika keduanya tidak dikirim,
 * dipakai bulan & tahun saat ini. Jika salah satu tidak valid, kembalikan null.
 */
export function periodFromSearchParams(searchParams: URLSearchParams): BudgetPeriod | null {
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  if (month === null && year === null) {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  return parsePeriod(month, year);
}

/**
 * Rentang tanggal satu bulan [start, end).
 * Tanggal transaksi disimpan sebagai tengah malam UTC (new Date("YYYY-MM-DD")),
 * sehingga batas bulan juga dihitung dengan UTC.
 */
export function getMonthRange({ month, year }: BudgetPeriod) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

/**
 * FR-11: ringkasan budget satu bulan milik satu pengguna.
 * - budget       : nominal budget bulan tsb (null jika belum ditetapkan)
 * - totalExpense : total pengeluaran (EXPENSE) pada bulan tsb
 * - remaining    : budget - totalExpense (negatif jika melebihi budget, null jika belum ada budget)
 */
export async function getBudgetSummary(userId: number, period: BudgetPeriod) {
  const { start, end } = getMonthRange(period);

  const [budget, expense] = await Promise.all([
    prisma.monthlyBudget.findUnique({
      where: {
        userId_year_month: { userId, year: period.year, month: period.month },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: start, lt: end },
      },
    }),
  ]);

  const totalExpense = expense._sum.amount ?? 0;
  const budgetAmount = budget ? budget.amount : null;

  return {
    period,
    hasBudget: budget !== null,
    budget: budgetAmount,
    totalExpense,
    remaining: budgetAmount === null ? null : budgetAmount - totalExpense,
  };
}

