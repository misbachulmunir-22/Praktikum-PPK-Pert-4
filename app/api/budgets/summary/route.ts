import { getSessionUser } from "@/lib/auth";
import { getBudgetSummary, periodFromSearchParams } from "@/lib/budget";
import { NextResponse } from "next/server";

// FR-11: Budget Summary -> budget, total pengeluaran, dan sisa budget pada bulan yang dipilih
// GET /api/budgets/summary?month=9&year=2026   (tanpa parameter = bulan berjalan)
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda belum login atau sesi telah berakhir." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = periodFromSearchParams(searchParams);

    if (!period) {
      return NextResponse.json(
        { error: "Bulan harus 1-12 dan tahun harus berupa angka yang valid." },
        { status: 400 }
      );
    }

    // Semua query di getBudgetSummary dibatasi userId dari sesi (data antar pengguna terpisah)
    const summary = await getBudgetSummary(user.id, period);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Budget summary error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil ringkasan budget." },
      { status: 500 }
    );
  }
}
