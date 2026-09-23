import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}