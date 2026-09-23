"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
  description?: string | null;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

const CATEGORIES_INCOME = [
  "Uang Saku",
  "Beasiswa",
  "Gaji Part-Time",
  "Freelance",
  "Hadiah / Bonus",
  "Lainnya",
];

const CATEGORIES_EXPENSE = [
  "Makanan & Minuman",
  "Sewa Kos / Tempat Tinggal",
  "Buku & Pendidikan",
  "Transportasi",
  "Internet & Pulsa",
  "Hiburan & Rekreasi",
  "Kebutuhan Harian",
  "Lainnya",
];

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  // Dashboard states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [fetchingTransactions, setFetchingTransactions] = useState(false);

  // Form add/edit transaction states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [formCategory, setFormCategory] = useState("Makanan & Minuman");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Protect route & check auth session
  useEffect(() => {
    checkAuth();
  }, []);

  // Re-fetch transactions when filter changes or user changes
  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, filterType]);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setShowBalance(data.preferences?.showBalance ?? true);
      } else {
        // Protected route: Redirect to /login if unauthenticated
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setFetchingTransactions(true);
    try {
      const url =
        filterType === "ALL"
          ? "/api/transactions"
          : `/api/transactions?type=${filterType}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions || []);
        setSummary(
          data.summary || { totalIncome: 0, totalExpense: 0, balance: 0 }
        );
      }
    } catch (err) {
      console.error("Gagal memuat transaksi:", err);
    } finally {
      setFetchingTransactions(false);
    }
  };

const latestTransactions = transactions.slice(0, 5);

  const handleTogglePreference = async () => {
    const newValue = !showBalance;
    setShowBalance(newValue);
    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "show_balance", value: newValue }),
      });
    } catch (err) {
      console.error("Gagal mengupdate preferensi:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  const openFormForCreate = () => {
    setEditingTransaction(null);
    setFormTitle("");
    setFormAmount("");
    setFormType("EXPENSE");
    setFormCategory("Makanan & Minuman");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setFormError("");
    setIsFormOpen(true);
  };

  const openFormForEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormTitle(tx.title);
    setFormAmount(String(tx.amount));
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormDate(new Date(tx.date).toISOString().split("T")[0]);
    setFormDescription(tx.description || "");
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);

    try {
      const isEdit = !!editingTransaction;
      const url = isEdit
        ? `/api/transactions/${editingTransaction.id}`
        : "/api/transactions";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          amount: parseFloat(formAmount),
          type: formType,
          category: formCategory,
          date: formDate,
          description: formDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Gagal menyimpan transaksi.");
        return;
      }

      setIsFormOpen(false);
      fetchTransactions();
    } catch {
      setFormError("Gagal mengirim data transaksi.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTransactions();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus transaksi.");
      }
    } catch (err) {
      console.error("Gagal hapus transaksi:", err);
    }
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-400 font-medium text-xs">Memuat Dashboard Keuangan...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg shadow-md">
              💰
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">Expense Tracker</h1>
              <p className="text-xs text-slate-400">Dashboard Keuangan Mahasiswa</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-slate-300">{user.name}</span>
              <span className="text-[11px] text-slate-500">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 hover:border-rose-500/40"
            >
              Keluar (Logout)
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 space-y-6">
        {/* Welcome & Preference Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 p-5 shadow-lg">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Halo, {user.name}! 👋
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Berikut adalah ringkasan keuangan dan catatan transaksi pribadi Anda.
            </p>
          </div>

          {/* Cookie Preference Toggle */}
          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/60 text-xs">
            <span className="text-slate-300 font-medium">Tampilan Saldo:</span>
            <button
              onClick={handleTogglePreference}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600/30 px-3 py-1 font-semibold text-indigo-300 border border-indigo-500/40 transition hover:bg-indigo-600/50"
            >
              {showBalance ? "👁️ Tampilkan" : "🙈 Sembunyikan"}
            </button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Saldo Card */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/50 via-slate-900 to-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between text-indigo-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Saldo Saat Ini</span>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                TOTAL
              </span>
            </div>
            <div className="text-2xl font-black text-white sm:text-3xl">
              {showBalance ? formatIDR(summary.balance) : "Rp ••••••••"}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Status:{" "}
              {summary.balance >= 0 ? (
                <span className="text-emerald-400 font-medium">Surplus (Aman)</span>
              ) : (
                <span className="text-rose-400 font-medium">Defisit (Hemat!)</span>
              )}
            </p>
          </div>

          {/* Total Pemasukan Card */}
          <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Pemasukan</span>
              <span className="text-base">📈</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {showBalance ? formatIDR(summary.totalIncome) : "Rp ••••••••"}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Uang saku, beasiswa, freelance</p>
          </div>

          {/* Total Pengeluaran Card */}
          <div className="rounded-2xl border border-rose-500/20 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex items-center justify-between text-rose-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Pengeluaran</span>
              <span className="text-base">📉</span>
            </div>
            <div className="text-2xl font-bold text-rose-400">
              {showBalance ? formatIDR(summary.totalExpense) : "Rp ••••••••"}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Kos, makanan, buku, kuota</p>
          </div>
        </div>

        {/* Action & Filter Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-800 pt-6">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setFilterType("ALL")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filterType === "ALL"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Semua Transaksi
            </button>
            <button
              onClick={() => setFilterType("INCOME")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filterType === "INCOME"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🟢 Pemasukan
            </button>
            <button
              onClick={() => setFilterType("EXPENSE")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filterType === "EXPENSE"
                  ? "bg-rose-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🔴 Pengeluaran
            </button>
          </div>

          {/* Add Transaction Button */}
          <button
            onClick={openFormForCreate}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95"
          >
            <span>➕</span>
            <span>Tambah Transaksi Baru</span>
          </button>
        </div>

        {/* Transaction History List */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl">
          <div className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📋</span> Riwayat Transaksi Keuangan
            </h3>
            <span className="text-xs text-slate-400">
              {transactions.length} Transaksi Dicatat
            </span>
          </div>

          {fetchingTransactions ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Sedang memperbarui daftar transaksi...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="text-4xl">💸</div>
              <p className="text-sm text-slate-300 font-medium">Belum ada transaksi ditemukan</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Silakan klik tombol <b>"Tambah Transaksi Baru"</b> di atas untuk mulai mencatat keuangan Anda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {latestTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-800/40"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${
                        tx.type === "INCOME"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {tx.type === "INCOME" ? "↓" : "↑"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">{tx.title}</h4>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700">
                          {tx.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>📅 {new Date(tx.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}</span>
                        {tx.description && <span>• {tx.description}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                    <div
                      className={`text-sm font-bold ${
                        tx.type === "INCOME" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+ " : "- "}
                      {showBalance ? formatIDR(tx.amount) : "Rp ••••••••"}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openFormForEdit(tx)}
                        className="rounded-lg bg-slate-800 p-1.5 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
                        title="Edit Transaksi"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="rounded-lg bg-rose-500/10 p-1.5 text-xs text-rose-400 transition hover:bg-rose-500/20 border border-rose-500/20"
                        title="Hapus Transaksi"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL FORM TAMBAH / EDIT TRANSAKSI */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingTransaction ? "Edit Transaksi Keuangan" : "Tambah Transaksi Baru"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("INCOME");
                      setFormCategory(CATEGORIES_INCOME[0]);
                    }}
                    className={`rounded-xl py-2 text-xs font-bold transition border ${
                      formType === "INCOME"
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    🟢 PEMASUKAN (Income)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("EXPENSE");
                      setFormCategory(CATEGORIES_EXPENSE[0]);
                    }}
                    className={`rounded-xl py-2 text-xs font-bold transition border ${
                      formType === "EXPENSE"
                        ? "bg-rose-600 text-white border-rose-500"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    🔴 PENGELUARAN (Expense)
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Judul Transaksi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Uang Saku Bulanan / Makan Warteg"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Amount & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Jumlah (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="25000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {(formType === "INCOME" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan kecil mengenai transaksi ini..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
                >
                  {formSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Expense Tracker Mahasiswa &copy; 2026 • Kelola Keuangan Pribadi dengan Bijak
      </footer>
    </div>
  );
}
