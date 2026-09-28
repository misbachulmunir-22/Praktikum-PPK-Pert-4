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

function bulanSekarang(): string {
  const bagian = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const tahun = bagian.find((item) => item.type === "year")?.value;
  const bulan = bagian.find((item) => item.type === "month")?.value;

  return `${tahun}-${bulan}`;
}

function rupiah(nilai: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

export default function MonthlyBudget() {
  const [periode, setPeriode] = useState(bulanSekarang);
  const [nominal, setNominal] = useState("");
  const [ringkasan, setRingkasan] = useState<Summary | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesanError, setPesanError] = useState("");
  const [pesanSukses, setPesanSukses] = useState("");
  const [versi, setVersi] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const [year, month] = periode.split("-").map(Number);

    async function ambilAnggaran() {
      try {
        const respons = await fetch(
          `/api/budget?year=${year}&month=${month}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data: Summary | { error: string } = await respons.json();

        if (!respons.ok) {
          throw new Error(
            "error" in data ? data.error : "Gagal memuat anggaran."
          );
        }

        if (!controller.signal.aborted && "status" in data) {
          setRingkasan(data);
          setNominal(data.status === "UNSET" ? "" : String(data.budget));
          setMemuat(false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setPesanError(
            error instanceof Error ? error.message : "Gagal memuat anggaran."
          );
          setMemuat(false);
        }
      }
    }

    void ambilAnggaran();

    return () => controller.abort();
  }, [periode, versi]);

  function gantiPeriode(nilai: string) {
    setPeriode(nilai);
    setRingkasan(null);
    setNominal("");
    setPesanError("");
    setPesanSukses("");
    setMemuat(true);
  }

  async function simpanAnggaran(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const [year, month] = periode.split("-").map(Number);
    setMenyimpan(true);
    setPesanError("");
    setPesanSukses("");

    try {
      const respons = await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          month,
          amount: Number(nominal),
        }),
      });

      const data: { error?: string } = await respons.json();

      if (!respons.ok) {
        throw new Error(data.error ?? "Gagal menyimpan anggaran.");
      }

      setPesanSukses("Anggaran berhasil disimpan.");
      setMemuat(true);
      setVersi((nilai) => nilai + 1);
    } catch (error) {
      setPesanError(
        error instanceof Error ? error.message : "Gagal menyimpan anggaran."
      );
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white">
      <h2 className="text-lg font-bold">Anggaran Bulanan</h2>

      <div className="mt-4">
        <label htmlFor="bulan-anggaran" className="block text-sm">
          Pilih bulan dan tahun
        </label>
        <input
          id="bulan-anggaran"
          type="month"
          min="2000-01"
          max="2100-12"
          value={periode}
          onChange={(event) => gantiPeriode(event.target.value)}
          className="mt-2 rounded-lg border border-slate-700 bg-slate-800 p-2"
        />
      </div>

      <form onSubmit={simpanAnggaran} className="mt-4 flex flex-wrap gap-2">
        <label htmlFor="nominal-anggaran" className="w-full text-sm">
          Tetapkan anggaran (Rp)
        </label>
        <input
          id="nominal-anggaran"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={nominal}
          onChange={(event) => setNominal(event.target.value)}
          disabled={memuat || menyimpan}
          placeholder="Contoh: 2000000"
          className="rounded-lg border border-slate-700 bg-slate-800 p-2"
        />
        <button
          type="submit"
          disabled={memuat || menyimpan}
          className="rounded-lg bg-indigo-600 px-4 py-2 disabled:opacity-50"
        >
          {menyimpan ? "Menyimpan..." : "Simpan Anggaran"}
        </button>
      </form>

      {pesanError && (
        <p role="alert" className="mt-3 text-sm text-rose-400">
          {pesanError}
        </p>
      )}

      {pesanSukses && (
        <p role="status" className="mt-3 text-sm text-emerald-400">
          {pesanSukses}
        </p>
      )}

      {memuat && (
        <p role="status" className="mt-4 text-sm text-slate-400">
          Memuat anggaran...
        </p>
      )}

      {!memuat && ringkasan && (
        <div className="mt-5 space-y-2 border-t border-slate-700 pt-4">
          <p>Anggaran: {rupiah(ringkasan.budget)}</p>
          <p>Total pengeluaran: {rupiah(ringkasan.totalExpense)}</p>
          <p>Sisa anggaran: {rupiah(ringkasan.remaining)}</p>

          {ringkasan.status !== "UNSET" && (
            <>
              <p>Terpakai: {ringkasan.percentage}%</p>
              <progress
                value={Math.min(ringkasan.percentage, 100)}
                max={100}
                className="w-full"
                aria-label="Persentase anggaran terpakai"
              />
            </>
          )}

          {ringkasan.status === "UNSET" && (
            <p role="status">Anggaran bulan ini belum diatur.</p>
          )}
          {ringkasan.status === "SAFE" && (
            <p role="status" className="text-emerald-400">
              Pengeluaran masih dalam batas aman.
            </p>
          )}
          {ringkasan.status === "WARNING" && (
            <p role="alert" className="text-amber-400">
              Peringatan: {ringkasan.percentage}% anggaran sudah terpakai.
            </p>
          )}
          {ringkasan.status === "OVER" && (
            <p role="alert" className="text-rose-400">
              Anggaran terlampaui sebesar {rupiah(-ringkasan.remaining)}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}