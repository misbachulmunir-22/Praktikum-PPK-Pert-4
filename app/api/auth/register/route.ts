import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        {
          error:
            "Format email tidak valid. Gunakan format email yang benar (contoh: user@domain.com).",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "Email sudah terdaftar. Silakan gunakan email lain atau login.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        password: hashedPassword,
      },
    });

    await createSession(user.id);

    return NextResponse.json({
      message: "Registrasi akun berhasil.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      redirectTo: "/login",
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Gagal mendaftar akun. Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}