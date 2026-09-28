"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const formatIDR = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMonth: number;
  defaultYear: number;
  onSaved: (message: string) => void;
}

// FR-10: Form untuk menetapkan nominal budget pada bulan dan tahun tertentu
export function BudgetForm({
  isOpen,
  onClose,
  defaultMonth,
  defaultYear,
  onSaved,
}: BudgetFormProps) {
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(String(defaultYear));
  const [amount, setAmount] = useState("");
  // undefined = sedang dicek, null = belum ada budget pada periode ini, number = budget yang sudah ada
  const [existing, setExisting] = useState<number | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parsedYear = Number(year);
  const isYearValid =
    year !== "" && Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100;

  // Setiap bulan/tahun berubah, cek apakah periode tsb sudah punya budget
  // supaya form otomatis terisi dan pengguna tahu bahwa ia sedang mengubah budget lama.
  useEffect(() => {
    if (!isYearValid) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/budgets?month=${month}&year=${parsedYear}`);
        const json = await res.json();
        if (cancelled || !res.ok) return;

        const current: number | null = json.budget ? json.budget.amount : null;
        setExisting(current);
        setAmount(current !== null ? String(current) : "");
      } catch {
        if (!cancelled) setExisting(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [month, parsedYear, isYearValid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = Number(amount);

    if (!isYearValid) {
      setError("Tahun harus berupa angka antara 2000 dan 2100.");
      return;
    }

    if (!amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Nominal budget harus berupa angka positif.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year: parsedYear, amount: parsedAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menyimpan budget.");
        return;
      }

      onSaved(`Budget ${MONTH_NAMES[month - 1]} ${parsedYear} berhasil disimpan.`);
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Budget Bulanan">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="budget-month"
              className="block text-sm font-medium text-slate-300"
            >
              Bulan
            </label>
            <select
              id="budget-month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="budget-year"
            label="Tahun"
            type="number"
            min={2000}
            max={2100}
            required
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>

        <Input
          id="budget-amount"
          label="Nominal Budget (Rp)"
          type="number"
          min={1}
          required
          placeholder="1500000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {isYearValid && existing !== undefined && (
          <p className="text-xs text-slate-400">
            {existing === null
              ? `Belum ada budget untuk ${MONTH_NAMES[month - 1]} ${parsedYear}. Budget baru akan dibuat.`
              : `Budget ${MONTH_NAMES[month - 1]} ${parsedYear} saat ini ${formatIDR(existing)}. Menyimpan akan memperbaruinya.`}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Menyimpan..." : existing ? "Perbarui Budget" : "Simpan Budget"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
