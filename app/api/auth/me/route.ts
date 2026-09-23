import { getPreferences, getSessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getSessionUser();
    const preferences = await getPreferences();

    if (!user) {
      return NextResponse.json({ user: null, preferences }, { status: 401 });
    }

    return NextResponse.json({ user, preferences });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data sesi." },
      { status: 500 }
    );
  }
}
