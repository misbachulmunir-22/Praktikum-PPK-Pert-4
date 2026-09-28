import { getSessionUser } from "@/lib/auth";
import { parsePeriod, periodFromSearchParams } from "@/lib/budget";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_BUDGET = 1_000_000_000_000; // batas wajar agar tidak terjadi angka tak masuk akal

// FR-10: Lihat budget pada bulan & tahun tertentu (default: bulan berjalan)
// GET /api/budgets?month=9&year=2026
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

    // Selalu difilter berdasarkan userId dari sesi: pengguna hanya bisa melihat budget miliknya
    const budget = await prisma.monthlyBudget.findUnique({
      where: {
        userId_year_month: {
          userId: user.id,
          year: period.year,
          month: period.month,
        },
      },
    });

    return NextResponse.json({ period, budget });
  } catch (error) {
    console.error("Get budget error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data budget." },
      { status: 500 }
    );
  }
}

// FR-10: Set budget bulanan (buat baru, atau perbarui jika bulan & tahun tsb sudah punya budget)
// PUT /api/budgets   body: { month, year, amount }
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda belum login atau sesi telah berakhir." },
        { status: 401 }
      );
    }

    let body: { month?: unknown; year?: unknown; amount?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format data yang dikirim tidak valid." },
        { status: 400 }
      );
    }

    const period = parsePeriod(body.month, body.year);
    if (!period) {
      return NextResponse.json(
        { error: "Bulan harus 1-12 dan tahun harus berupa angka yang valid." },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);
    if (
      body.amount === undefined ||
      body.amount === null ||
      body.amount === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        { error: "Nominal budget harus berupa angka positif." },
        { status: 400 }
      );
    }

    if (amount > MAX_BUDGET) {
      return NextResponse.json(
        { error: "Nominal budget terlalu besar." },
        { status: 400 }
      );
    }

    // Satu pengguna hanya punya satu budget per (bulan, tahun) -> upsert pada unique key
    const budget = await prisma.monthlyBudget.upsert({
      where: {
        userId_year_month: {
          userId: user.id,
          year: period.year,
          month: period.month,
        },
      },
      update: { amount },
      create: {
        userId: user.id,
        year: period.year,
        month: period.month,
        amount,
      },
    });

    return NextResponse.json({
      message: "Budget bulanan berhasil disimpan.",
      budget,
    });
  } catch (error) {
    console.error("Set budget error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan budget." },
      { status: 500 }
    );
  }
}
