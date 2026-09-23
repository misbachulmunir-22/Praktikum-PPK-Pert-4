import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda belum login atau sesi telah berakhir." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const transactionId = parseInt(id, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: "ID Transaksi tidak valid." },
        { status: 400 }
      );
    }

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existingTransaction || existingTransaction.userId !== user.id) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    const { title, amount, type, category, description, date } = await request.json();

    if (!title || !amount || !type) {
      return NextResponse.json(
        { error: "Judul, jumlah uang, dan jenis transaksi wajib diisi." },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Jumlah uang harus berupa angka positif." },
        { status: 400 }
      );
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        title: title.trim(),
        amount: parsedAmount,
        type: type as TransactionType,
        category: category?.trim() || "Lainnya",
        description: description?.trim() || null,
        date: date ? new Date(date) : existingTransaction.date,
      },
    });

    return NextResponse.json({
      message: "Transaksi berhasil diperbarui.",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui transaksi." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda belum login atau sesi telah berakhir." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const transactionId = parseInt(id, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: "ID Transaksi tidak valid." },
        { status: 400 }
      );
    }

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existingTransaction || existingTransaction.userId !== user.id) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return NextResponse.json({
      message: "Transaksi berhasil dihapus.",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus transaksi." },
      { status: 500 }
    );
  }
}
