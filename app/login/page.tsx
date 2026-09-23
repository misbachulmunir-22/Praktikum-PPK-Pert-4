"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredSuccess = searchParams.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal.");
        setSubmitting(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Gagal menghubungkan ke server.");
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("budi@students.undip.ac.id");
    setPassword("password123");
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "budi@students.undip.ac.id",
          password: "password123",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Gagal login demo.");
      }
    } catch {
      setError("Gagal melakukan login demo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header Branding */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
          🎓 Dompet Mahasiswa
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Masuk ke Aplikasi
        </h1>
        <p className="text-sm text-slate-400">
          Masukkan email dan password Anda untuk membuka dashboard keuangan.
        </p>
      </div>

      {/* Card Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        {registeredSuccess && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 flex items-start gap-2">
            <span>✅</span>
            <span>Registrasi akun berhasil! Silakan masuk dengan email dan kata sandi Anda.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400 flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Mahasiswa / Kampus
            </label>
            <input
              type="email"
              required
              placeholder="budi@students.undip.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Kata Sandi (Password)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-600/30"
          >
            {submitting ? "Memverifikasi..." : "Masuk (Login)"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800 pt-4 space-y-3 text-center">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            ⚡ Login dengan Akun Demo (Budi Undip)
          </button>

          <p className="text-xs text-slate-400">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 underline">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-slate-100">
      <Suspense fallback={<div className="text-slate-400 text-xs">Memuat halaman login...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
