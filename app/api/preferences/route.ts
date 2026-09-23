import { setPreference } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Key dan value wajib diisi." },
        { status: 400 }
      );
    }

    await setPreference(key, String(value));

    return NextResponse.json({
      message: "Preferensi berhasil diperbarui.",
      key,
      value,
    });
  } catch (error) {
    console.error("Preferences error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan preferensi." },
      { status: 500 }
    );
  }
}
