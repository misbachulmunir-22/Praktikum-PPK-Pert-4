"use client";

import { useEffect, useState } from "react";
import { BudgetForm, MONTH_NAMES } from "@/components/BudgetForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface BudgetSummaryData {
  period: { month: number; year: number };
  hasBudget: boolean;
  budget: number | null;
  totalExpense: number;
  remaining: number | null;
}

interface BudgetSummaryProps {
  /** Bulan (1-12) yang ditampilkan. Default: bulan berjalan. */
  month?: number;
  /** Tahun yang ditampilkan. Default: tahun berjalan. */
  year?: number;
  /** Ikut menyembunyikan nominal jika preferensi "sembunyikan saldo" aktif. */
  showAmounts?: boolean;
  /** Ubah nilai ini (mis. daftar transaksi) agar ringkasan diambil ulang. */
  refreshKey?: unknown;
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

// FR-11: Menampilkan budget, total pengeluaran, dan sisa budget pada bulan yang dipilih.
// FR-10: Tombol "Set Budget" membuka form untuk menetapkan budget bulanan.
export function BudgetSummary({
  month,
  year,
  showAmounts = true,
  refreshKey,
}: BudgetSummaryProps) {
  const now = new Date();
  const selectedMonth = month ?? now.getMonth() + 1;
  const selectedYear = year ?? now.getFullYear();

  const [data, setData] = useState<BudgetSummaryData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  // Ambil ringkasan budget setiap bulan/tahun berubah, transaksi berubah (refreshKey),
  // atau setelah budget disimpan (reloadCount).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/budgets/summary?month=${selectedMonth}&year=${selectedYear}`
        );
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(json.error || "Gagal memuat ringkasan budget.");
          return;
        }

        setError("");
        setData(json);
      } catch {
        if (!cancelled) setError("Gagal memuat ringkasan budget.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedMonth, selectedYear, refreshKey, reloadCount]);

  // Data dianggap valid hanya jika periodenya sama dengan yang sedang dipilih
  const current =
    data && data.period.month === selectedMonth && data.period.year === selectedYear
      ? data
      : null;
  const isLoading = current === null && !error;

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const money = (val: number | null) =>
    val === null ? "-" : showAmounts ? formatIDR(val) : "Rp ••••••••";

  const isOverBudget = current?.remaining != null && current.remaining < 0;

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">
            💼 Budget {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Ringkasan budget dan pengeluaran pada bulan ini.
          </p>
        </div>

        <Button onClick={() => setIsFormOpen(true)} className="text-xs">
          {current?.hasBudget ? "✏️ Ubah Budget" : "➕ Set Budget"}
        </Button>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✅ {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
          ⚠️ {error}
        </div>
      )}

      {isLoading ? (
        <p className="py-4 text-center text-xs text-slate-400">
          Memuat ringkasan budget...
        </p>
      ) : current && !current.hasBudget ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center">
          <p className="text-sm font-medium text-slate-300">
            Belum ada budget untuk bulan ini
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Klik &quot;Set Budget&quot; untuk menetapkan batas pengeluaran bulanan.
            Pengeluaran bulan ini: {money(current.totalExpense)}
          </p>
        </div>
      ) : current ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              Budget
            </p>
            <p className="mt-1 text-xl font-bold text-white">{money(current.budget)}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">
              Total Pengeluaran
            </p>
            <p className="mt-1 text-xl font-bold text-rose-400">
              {money(current.totalExpense)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              Sisa Budget
            </p>
            <p
              className={`mt-1 text-xl font-bold ${
                isOverBudget ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {money(current.remaining)}
            </p>
            {isOverBudget && (
              <p className="mt-1 text-[11px] text-rose-400">Melebihi budget</p>
            )}
          </div>
        </div>
      ) : null}

      {isFormOpen && (
        <BudgetForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          defaultMonth={selectedMonth}
          defaultYear={selectedYear}
          onSaved={(message) => {
            setIsFormOpen(false);
            setNotice(message);
            setReloadCount((c) => c + 1);
          }}
        />
      )}
    </Card>
  );
}
