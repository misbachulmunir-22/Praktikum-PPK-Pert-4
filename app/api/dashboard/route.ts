import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Ambil pengguna yang sedang login dari session
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda belum login atau sesi telah berakhir." },
        { status: 401 }
      );
    }

    // Ambil total pemasukan
    const income = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        userId: user.id,
        type: "INCOME",
      },
    });

    // Ambil total pengeluaran
    const expense = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        userId: user.id,
        type: "EXPENSE",
      },
    });

    const totalIncome = income._sum.amount ?? 0;
    const totalExpense = expense._sum.amount ?? 0;

    // Saldo = pemasukan - pengeluaran
    const balance = totalIncome - totalExpense;

    // Ambil 5 transaksi terbaru milik user
    const latestTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
      transactions: latestTransactions,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil data dashboard." },
      { status: 500 }
    );
  }
}