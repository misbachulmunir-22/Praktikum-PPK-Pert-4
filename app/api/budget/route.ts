import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function parsePeriod(yearValue: unknown, monthValue: unknown) {
  const year = Number(yearValue);
  const month = Number(monthValue);

  if (
    yearValue === null ||
    monthValue === null ||
    yearValue === "" ||
    monthValue === "" ||
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return { year, month };
}

// Mengambil anggaran dan total pengeluaran pada bulan yang dipilih.
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const period = parsePeriod(
      request.nextUrl.searchParams.get("year"),
      request.nextUrl.searchParams.get("month")
    );

    if (!period) {
      return NextResponse.json(
        { error: "Bulan atau tahun tidak valid." },
        { status: 400 }
      );
    }

    const { year, month } = period;
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const [budget, expenseResult] = await Promise.all([
      prisma.monthlyBudget.findUnique({
        where: {
          userId_year_month: {
            userId: user.id,
            year,
            month,
          },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: user.id,
          type: "EXPENSE",
          date: {
            gte: start,
            lt: end,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const budgetAmount = budget?.amount ?? 0;
    const totalExpense = expenseResult._sum.amount ?? 0;
    const remaining = budgetAmount - totalExpense;
    const percentage =
      budgetAmount > 0
        ? Math.round((totalExpense / budgetAmount) * 100)
        : 0;

    const status = !budget
      ? "UNSET"
      : totalExpense > budgetAmount
        ? "OVER"
        : percentage >= 80
          ? "WARNING"
          : "SAFE";

    return NextResponse.json({
      year,
      month,
      budget: budgetAmount,
      totalExpense,
      remaining,
      percentage,
      status,
    });
  } catch (error) {
    console.error("Get budget error:", error);
    return NextResponse.json(
      { error: "Gagal memuat anggaran." },
      { status: 500 }
    );
  }
}

// Membuat atau memperbarui anggaran pada bulan yang dipilih.
export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format JSON tidak valid." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Data anggaran tidak valid." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const period = parsePeriod(input.year, input.month);
    const amount = Number(input.amount);

    if (
      !period ||
      input.amount === null ||
      input.amount === "" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 999_999_999_999
    ) {
      return NextResponse.json(
        { error: "Bulan, tahun, atau nominal anggaran tidak valid." },
        { status: 400 }
      );
    }

    const budget = await prisma.monthlyBudget.upsert({
      where: {
        userId_year_month: {
          userId: user.id,
          year: period.year,
          month: period.month,
        },
      },
      create: {
        userId: user.id,
        year: period.year,
        month: period.month,
        amount,
      },
      update: {
        amount,
      },
    });

    return NextResponse.json({
      message: "Anggaran berhasil disimpan.",
      budget,
    });
  } catch (error) {
    console.error("Save budget error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan anggaran." },
      { status: 500 }
    );
  }
}