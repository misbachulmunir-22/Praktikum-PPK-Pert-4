"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

export interface BudgetIndicatorProps {
  /**
   * Nominal target budget bulanan (dalam Rupiah)
   */
  budget: number;
  /**
   * Total pengeluaran yang telah dilakukan (dalam Rupiah)
   */
  totalExpense: number;
  /**
   * Status visibilitas nominal (mengikuti preferensi showBalance)
   */
  showAmount?: boolean;
  /**
   * Callback saat user mengubah nominal budget
   */
  onBudgetChange?: (newBudget: number) => void;
  /**
   * Label periode anggaran (misal: "Bulan Ini" atau nama bulan)
   */
  periodLabel?: string;
  /**
   * Tambahan kelas CSS
   */
  className?: string;
}

export type BudgetStatusType = "safe" | "warning" | "danger";

export interface BudgetStatusInfo {
  type: BudgetStatusType;
  label: string;
  badgeClass: string;
  barClass: string;
  textClass: string;
  borderClass: string;
  bgGlowClass: string;
  icon: string;
  message: string;
}

/**
 * Format angka ke format mata uang Rupiah (IDR)
 */
export const formatIDR = (val: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
};

/**
 * Helper function untuk menghitung persentase penggunaan budget
 */
export const calculateBudgetPercentage = (
  totalExpense: number,
  budget: number
): number => {
  if (!budget || budget <= 0) return 0;
  return (totalExpense / budget) * 100;
};

/**
 * Helper function untuk menentukan status penggunaan budget berdasarkan persentase
 * - Aman: 0% - 70%
 * - Waspada: > 70% - 100%
 * - Melebihi Budget: > 100%
 */
export const getBudgetStatusInfo = (
  percentage: number,
  overbudgetAmount: number = 0
): BudgetStatusInfo => {
  if (percentage > 100) {
    return {
      type: "danger",
      label: "Melebihi Budget",
      badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/40",
      barClass: "bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 shadow-rose-500/40",
      textClass: "text-rose-400",
      borderClass: "border-rose-500/30",
      bgGlowClass: "from-rose-950/20",
      icon: "🚨",
      message: `Perhatian! Pengeluaran telah melampaui batas anggaran sebesar ${formatIDR(
        overbudgetAmount
      )}. Disarankan segera hentikan pengeluaran yang tidak mendesak.`,
    };
  }

  if (percentage >= 70) {
    return {
      type: "warning",
      label: "Waspada (Mendekati Batas)",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/40",
      barClass: "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 shadow-amber-500/40",
      textClass: "text-amber-400",
      borderClass: "border-amber-500/30",
      bgGlowClass: "from-amber-950/20",
      icon: "⚠️",
      message: `Pengeluaran sudah mencapai ${percentage.toFixed(
        1
      )}% dari anggaran. Kendalikan pengeluaran harian Anda agar tidak melampaui batas.`,
    };
  }

  return {
    type: "safe",
    label: "Aman (Terkendali)",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
    barClass: "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-emerald-500/40",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    bgGlowClass: "from-emerald-950/20",
    icon: "✅",
    message: "Pengeluaran masih dalam batas aman. Pengelolaan keuangan Anda berjalan sangat baik!",
  };
};

export default function BudgetIndicator({
  budget,
  totalExpense,
  showAmount = true,
  onBudgetChange,
  periodLabel = "Bulan Ini",
  className = "",
}: BudgetIndicatorProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [inputBudget, setInputBudget] = useState(String(budget || ""));
  const [modalError, setModalError] = useState("");

  const percentage = calculateBudgetPercentage(totalExpense, budget);
  const remainingBudget = budget - totalExpense;
  const isOverbudget = totalExpense > budget;
  const overbudgetAmount = isOverbudget ? totalExpense - budget : 0;
  const progressWidth = Math.min(Math.max(percentage, 0), 100);

  const statusInfo = getBudgetStatusInfo(percentage, overbudgetAmount);

  const handleOpenEditModal = () => {
    setInputBudget(String(budget || ""));
    setModalError("");
    setIsEditModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(inputBudget);
    if (isNaN(parsed) || parsed <= 0) {
      setModalError("Nominal budget harus berupa angka lebih dari 0.");
      return;
    }

    if (onBudgetChange) {
      onBudgetChange(parsed);
    }
    setIsEditModalOpen(false);
  };

  return (
    <>
      <Card
        className={`relative overflow-hidden rounded-2xl border ${statusInfo.borderClass} bg-gradient-to-br ${statusInfo.bgGlowClass} via-slate-900 to-slate-900 p-5 sm:p-6 shadow-xl transition-all duration-300 ${className}`}
      >
        {/* Header Indikator */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-lg">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Indikator Penggunaan Budget</h3>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
                  {periodLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pantau persentase dan status penggunaan anggaran Anda secara real-time
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${statusInfo.badgeClass}`}
            >
              <span className="animate-pulse">{statusInfo.icon}</span>
              <span>{statusInfo.label}</span>
            </div>

            {onBudgetChange && (
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                title="Sesuaikan Target Budget"
              >
                ✏️ Atur Budget
              </button>
            )}
          </div>
        </div>

        {/* Persentase & Visual Progress Bar Section */}
        <div className="py-5 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Persentase Penggunaan
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl sm:text-4xl font-black ${statusInfo.textClass}`}>
                  {percentage.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">
                  terpakai dari target{" "}
                  <b className="text-slate-200">
                    {showAmount ? formatIDR(budget) : "Rp ••••••••"}
                  </b>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sisa Anggaran
              </span>
              <div
                className={`text-lg sm:text-xl font-bold mt-1 ${
                  remainingBudget >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {showAmount ? formatIDR(remainingBudget) : "Rp ••••••••"}
              </div>
            </div>
          </div>

          {/* Visual Progress Bar Track */}
          <div className="relative">
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800/90 p-0.5 border border-slate-700/60 shadow-inner">
              <div
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Persentase Penggunaan Budget"
                style={{ width: `${progressWidth}%` }}
                className={`h-full rounded-full transition-all duration-700 ease-out shadow ${statusInfo.barClass}`}
              />
            </div>

            {/* Threshold Markers */}
            <div className="relative mt-1.5 flex justify-between text-[10px] text-slate-500 font-medium">
              <span>0%</span>
              <span className="text-amber-400/80">⚠️ 70% (Batas Waspada)</span>
              <span className="text-rose-400/80">100% (Batas Maksimal)</span>
            </div>
          </div>
        </div>

        {/* Ringkasan Parameter Budget Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {/* Target Budget */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="block text-[11px] font-medium text-slate-400">Target Budget</span>
            <span className="text-sm font-bold text-white mt-0.5 block">
              {showAmount ? formatIDR(budget) : "Rp ••••••••"}
            </span>
          </div>

          {/* Total Pengeluaran */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="block text-[11px] font-medium text-slate-400">Total Pengeluaran</span>
            <span className="text-sm font-bold text-rose-400 mt-0.5 block">
              {showAmount ? formatIDR(totalExpense) : "Rp ••••••••"}
            </span>
          </div>

          {/* Sisa Anggaran */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="block text-[11px] font-medium text-slate-400">
              {remainingBudget >= 0 ? "Sisa Anggaran" : "Defisit Anggaran"}
            </span>
            <span
              className={`text-sm font-bold mt-0.5 block ${
                remainingBudget >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {showAmount ? formatIDR(remainingBudget) : "Rp ••••••••"}
            </span>
          </div>

          {/* Status Budget */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="block text-[11px] font-medium text-slate-400">Status Anggaran</span>
            <span className={`text-sm font-bold mt-0.5 block ${statusInfo.textClass}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Status Alert Banner */}
        <div
          className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed ${statusInfo.badgeClass}`}
        >
          <span className="text-sm leading-none mt-0.5">{statusInfo.icon}</span>
          <div>
            <span className="font-semibold">{statusInfo.label}: </span>
            <span className="opacity-90">{statusInfo.message}</span>
          </div>
        </div>
      </Card>

      {/* Modal Edit Target Budget */}
      {onBudgetChange && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Atur Target Budget Bulanan"
        >
          <form onSubmit={handleSaveBudget} className="space-y-4">
            <p className="text-xs text-slate-400">
              Tetapkan target nominal budget bulanan Anda untuk memantau batas pengeluaran secara
              akurat.
            </p>

            <Input
              id="budget-input"
              label="Nominal Target Budget (Rp)"
              type="number"
              min="1"
              step="10000"
              required
              placeholder="Contoh: 2000000"
              value={inputBudget}
              onChange={(e) => setInputBudget(e.target.value)}
              error={modalError}
            />

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <Button
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Target Budget
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
