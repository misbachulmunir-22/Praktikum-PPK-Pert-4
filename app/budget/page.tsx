"use client";

import { useEffect, useState, type FormEvent } from "react";

type Summary = {
  year: number;
  month: number;
  budget: number;
  totalExpense: number;
  remaining: number;
  percentage: number;
  status: "UNSET" | "SAFE" | "WARNING" | "OVER";
};

function getCurrentMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BudgetPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [amount, setAmount] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Memuat ringkasan ketika pengguna mengganti bulan.
  useEffect(() => {
    const controller = new AbortController();
    const [year, month] = selectedMonth.split("-").map(Number);

    async function loadSummary() {
      setLoading(true);
      setSummary(null);
      setAmount("");
      setError("");
      setMessage("");

      try {
        const response = await fetch(
          `/api/budget?year=${year}&month=${month}`,
          { cache: "no-store", signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Gagal memuat anggaran.");
        }

        if (!controller.signal.aborted) {
          setSummary(data);
          setAmount(data.status === "UNSET" ? "" : String(data.budget));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Gagal memuat anggaran."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (selectedMonth) {
      void loadSummary();
    }

    return () => controller.abort();
  }, [selectedMonth]);

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMonth) return;

    const [year, month] = selectedMonth.split("-").map(Number);

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const saveResponse = await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          month,
          amount: Number(amount),
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saveData.error ?? "Gagal menyimpan anggaran.");
      }

      // Ambil ulang ringkasan supaya indikator langsung diperbarui.
      const summaryResponse = await fetch(
        `/api/budget?year=${year}&month=${month}`,
        { cache: "no-store" }
      );

      const summaryData = await summaryResponse.json();

      if (!summaryResponse.ok) {
        throw new Error(
          summaryData.error ?? "Anggaran tersimpan, tetapi ringkasan gagal dimuat."
        );
      }

      setSummary(summaryData);
      setMessage("Anggaran berhasil disimpan.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan anggaran."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: "0 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Anggaran Bulanan</h1>
      <p>Pilih bulan untuk melihat anggaran dan pengeluaran akunmu.</p>

      <div style={{ margin: "24px 0" }}>
        <label htmlFor="selected-month">Bulan dan tahun</label>
        <br />
        <input
          id="selected-month"
          type="month"
          min="2000-01"
          max="2100-12"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
          style={{ padding: 10, marginTop: 8 }}
        />
      </div>

      <form onSubmit={saveBudget} style={{ marginBottom: 24 }}>
        <label htmlFor="budget-amount">Atur anggaran (Rp)</label>
        <br />
        <input
          id="budget-amount"
          type="number"
          min="0.01"
          max="999999999999"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Contoh: 3000000"
          required
          disabled={saving || loading || !selectedMonth}
          style={{ padding: 10, marginTop: 8, marginRight: 8 }}
        />
        <button
          type="submit"
          disabled={saving || loading || !selectedMonth}
          style={{ padding: 11, cursor: "pointer" }}
        >
          {saving ? "Menyimpan..." : "Simpan Anggaran"}
        </button>
      </form>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {message && <p role="status" style={{ color: "#15803d" }}>{message}</p>}
      {loading && <p>Memuat ringkasan...</p>}

      {!loading && summary && (
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h2>Ringkasan</h2>
          <p>Anggaran: <strong>{formatRupiah(summary.budget)}</strong></p>
          <p>
            Total pengeluaran:{" "}
            <strong>{formatRupiah(summary.totalExpense)}</strong>
          </p>
          <p>
            Sisa anggaran:{" "}
            <strong>{formatRupiah(summary.remaining)}</strong>
          </p>

          {summary.status !== "UNSET" && (
            <>
              <label htmlFor="budget-progress">
                Anggaran terpakai: {summary.percentage}%
              </label>
              <br />
              <progress
                id="budget-progress"
                value={Math.min(summary.percentage, 100)}
                max={100}
                style={{ width: "100%", height: 20, marginTop: 8 }}
              />
            </>
          )}

          {summary.status === "UNSET" && (
            <p role="status">Anggaran untuk bulan ini belum diatur.</p>
          )}
          {summary.status === "SAFE" && (
            <p role="status" style={{ color: "#15803d" }}>
              Pengeluaran masih dalam batas aman.
            </p>
          )}
          {summary.status === "WARNING" && (
            <p role="alert" style={{ color: "#b45309" }}>
              Peringatan: {summary.percentage}% anggaran sudah terpakai.
            </p>
          )}
          {summary.status === "OVER" && (
            <p role="alert" style={{ color: "#b91c1c" }}>
              Anggaran terlampaui sebesar{" "}
              {formatRupiah(-summary.remaining)}.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
