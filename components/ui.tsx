"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-500 text-white hover:bg-accent-600 shadow-sm focus-visible:ring-accent-500",
  secondary:
    "bg-navy-900 text-white hover:bg-navy-800 shadow-sm focus-visible:ring-navy-900",
  ghost:
    "bg-transparent text-navy-900 hover:bg-steel-100 focus-visible:ring-steel-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
};

export function Button({
  variant = "primary",
  className = "",
  loading = false,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }
>(function Input({ label, hint, error, className = "", id, ...props }, ref) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      {label && (
        <span className="text-sm font-medium text-navy-900">{label}</span>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-steel-400 shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 disabled:bg-steel-50 ${
          error ? "border-red-400" : "border-steel-200"
        } ${className}`}
        {...props}
      />
      {hint && !error && <span className="block text-xs text-steel-500">{hint}</span>}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    hint?: string;
    error?: string;
  }
>(function Textarea({ label, hint, error, className = "", id, ...props }, ref) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      {label && (
        <span className="text-sm font-medium text-navy-900">{label}</span>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-steel-400 shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 disabled:bg-steel-50 ${
          error ? "border-red-400" : "border-steel-200"
        } ${className}`}
        {...props}
      />
      {hint && !error && <span className="block text-xs text-steel-500">{hint}</span>}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    hint?: string;
    error?: string;
  }
>(function Select({ label, hint, error, className = "", id, children, ...props }, ref) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      {label && (
        <span className="text-sm font-medium text-navy-900">{label}</span>
      )}
      <select
        ref={ref}
        id={inputId}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-navy-900 shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 disabled:bg-steel-50 ${
          error ? "border-red-400" : "border-steel-200"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <span className="block text-xs text-steel-500">{hint}</span>}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export function Alert({
  variant = "error",
  children,
}: {
  variant?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-steel-200 bg-steel-50 text-navy-800",
  };
  return (
    <div
      role="alert"
      className={`rounded-lg border px-3.5 py-3 text-sm ${styles[variant]}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-steel-100 text-steel-700",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-900",
    danger: "bg-red-100 text-red-800",
    info: "bg-sky-100 text-sky-900",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-steel-300 border-t-accent-500 ${className}`}
      aria-hidden
    />
  );
}
