import { destroySession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ message: "Logout berhasil." });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Gagal logout." },
      { status: 500 }
    );
  }
}
