import { prisma } from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes list
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/transactions");

  // Auth routes list (guest only)
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  const token = request.cookies.get("session_token")?.value;

  let isValidSession = false;

  if (token) {
    try {
      const session = await prisma.session.findUnique({
        where: { token },
        select: { expiresAt: true },
      });

      if (session && session.expiresAt > new Date()) {
        isValidSession = true;
      }
    } catch (error) {
      console.error("Session verification error:", error);
    }
  }

  // 11. Jika sesi tidak valid/kedaluwarsa pada rute terproteksi, pengguna diarahkan ke /login
  if (isProtectedRoute && !isValidSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Sesi tidak valid atau telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Jika pengguna sudah login dan mengakses /login atau /register, arahkan ke /dashboard
  if (isAuthRoute && isValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 11. Jika sesi valid, permintaan diteruskan
  return NextResponse.next();
}

// Next.js convention compatibility export
export const middleware = proxy;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/transactions/:path*",
    "/login",
    "/register",
  ],
};
