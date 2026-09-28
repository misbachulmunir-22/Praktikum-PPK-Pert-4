"use client";

import { useEffect, useState } from "react";
import { BudgetForm, MONTH_NAMES } from "@/components/BudgetForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface SetBudgetCardProps {
  /** Ikut menyembunyikan nominal jika preferensi "sembunyikan saldo" aktif. */
  showAmounts?: boolean;
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

// FR-10: Kartu di dashboard untuk menetapkan budget bulanan.
// Menampilkan budget bulan berjalan (jika ada) dan tombol untuk membuka form Set Budget.
export function SetBudgetCard({ showAmounts = true }: SetBudgetCardProps) {
  const [{ month, year }] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  // undefined = sedang dimuat, null = belum ada budget bulan ini
  const [budget, setBudget] = useState<number | null | undefined>(undefined);
  const [notice, setNotice] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
        const json = await res.json();
        if (cancelled || !res.ok) return;
        setBudget(json.budget ? json.budget.amount : null);
      } catch {
        if (!cancelled) setBudget(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [month, year, reloadCount]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <Card className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">
            💼 Budget {MONTH_NAMES[month - 1]} {year}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {budget === undefined
              ? "Memuat budget..."
              : budget === null
              ? "Belum ada budget untuk bulan ini."
              : `Budget bulan ini: ${showAmounts ? formatIDR(budget) : "Rp ••••••••"}`}
          </p>
        </div>

        <Button onClick={() => setIsFormOpen(true)} className="text-xs">
          {budget ? "✏️ Ubah Budget" : "➕ Set Budget"}
        </Button>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✅ {notice}
        </div>
      )}

      {isFormOpen && (
        <BudgetForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          defaultMonth={month}
          defaultYear={year}
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
