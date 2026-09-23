import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";

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
    const filterType = searchParams.get("type"); // "INCOME", "EXPENSE", or null/all

    const whereCondition: { userId: number; type?: TransactionType } = {
      userId: user.id,
    };

    if (filterType === "INCOME" || filterType === "EXPENSE") {
      whereCondition.type = filterType as TransactionType;
    }

    // Fetch all user transactions to compute complete summary
    const allUserTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    allUserTransactions.forEach((t) => {
      if (t.type === "INCOME") {
        totalIncome += t.amount;
      } else if (t.type === "EXPENSE") {
        totalExpense += t.amount;
      }
    });

    const balance = totalIncome - totalExpense;

    // Filtered list for display
    const transactions = filterType
      ? allUserTransactions.filter((t) => t.type === filterType)
      : allUserTransactions;

    return NextResponse.json({
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
    });
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda belum login atau sesi telah berakhir." },
        { status: 401 }
      );
    }

    const { title, amount, type, category, description, date } = await request.json();

    if (!title || !amount || !type) {
      return NextResponse.json(
        { error: "Judul, jumlah uang, dan jenis transaksi wajib diisi." },
        { status: 400 }
      );
    }

    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json(
        { error: "Tipe transaksi harus PEMASUKAN (INCOME) atau PENGELUARAN (EXPENSE)." },
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

    const transaction = await prisma.transaction.create({
      data: {
        title: title.trim(),
        amount: parsedAmount,
        type: type as TransactionType,
        category: category?.trim() || "Lainnya",
        description: description?.trim() || null,
        date: date ? new Date(date) : new Date(),
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: "Transaksi berhasil ditambahkan.",
      transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "Gagal membuat transaksi baru." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda belum login atau sesi telah berakhir." },
        { status: 401 }
      );
    }


    const {
      id,
      title,
      amount,
      type,
      category,
      description,
      date,
    } = await request.json();



    if (!id) {
      return NextResponse.json(
        { error: "ID transaksi diperlukan." },
        { status: 400 }
      );
    }



    // Cek apakah transaksi milik user yang sedang login
    const existingTransaction =
      await prisma.transaction.findFirst({
        where: {
          id: Number(id),
          userId: user.id,
        },
      });



    if (!existingTransaction) {
      return NextResponse.json(
        {
          error:
            "Transaksi tidak ditemukan atau bukan milik Anda.",
        },
        {
          status: 403,
        }
      );
    }



    const updatedTransaction =
      await prisma.transaction.update({

        where: {
          id: Number(id),
        },


        data: {

          title: title.trim(),

          amount:
            parseFloat(amount),

          type:
            type as TransactionType,

          category:
            category?.trim() || "Lainnya",

          description:
            description?.trim() || null,

          date:
            date
              ? new Date(date)
              : existingTransaction.date,

        },

      });



    return NextResponse.json({

      message:
        "Transaksi berhasil diperbarui.",

      transaction:
        updatedTransaction,

    });



  } catch (error) {

    console.error(
      "Update transaction error:",
      error
    );


    return NextResponse.json(
      {
        error:
          "Gagal memperbarui transaksi.",
      },
      {
        status:500,
      }
    );

  }
}






export async function DELETE(request: Request) {

  try {

    const user =
      await getSessionUser();



    if (!user) {

      return NextResponse.json(

        {
          error:
          "Anda belum login atau sesi telah berakhir.",
        },

        {
          status:401,
        }

      );

    }



    const { id } =
      await request.json();



    if (!id) {

      return NextResponse.json(

        {
          error:
          "ID transaksi diperlukan.",
        },

        {
          status:400,
        }

      );

    }




    // Cek kepemilikan transaksi
    const transaction =
      await prisma.transaction.findFirst({

        where: {

          id: Number(id),

          userId:
          user.id,

        },

      });




    if (!transaction) {

      return NextResponse.json(

        {
          error:
          "Transaksi tidak ditemukan atau bukan milik Anda.",
        },

        {
          status:403,
        }

      );

    }




    await prisma.transaction.delete({

      where: {

        id:
        Number(id),

      },

    });





    return NextResponse.json({

      message:
      "Transaksi berhasil dihapus.",

    });



  } catch(error) {


    console.error(
      "Delete transaction error:",
      error
    );



    return NextResponse.json(

      {
        error:
        "Gagal menghapus transaksi.",
      },

      {
        status:500,
      }

    );


  }

}