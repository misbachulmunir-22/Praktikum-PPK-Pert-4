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
