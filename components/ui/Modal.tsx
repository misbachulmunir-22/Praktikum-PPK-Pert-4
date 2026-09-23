"use client";

import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={`w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-white"
            >
              {title}
            </h2>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}