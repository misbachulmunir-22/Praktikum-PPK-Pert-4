import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}