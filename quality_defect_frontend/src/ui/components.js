import React from "react";
import clsx from "clsx";

// PUBLIC_INTERFACE
export function Card({ className, children }) {
  /** Elevated surface container. */
  return (
    <div className={clsx("rounded-xl bg-white shadow-card border border-gray-100", className)}>
      {children}
    </div>
  );
}

// PUBLIC_INTERFACE
export function Button({ variant = "primary", className, ...props }) {
  /** Button with variants: primary, secondary, ghost, danger. */
  const styles = {
    primary:
      "bg-ocean-primary text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-200",
    secondary:
      "bg-ocean-secondary text-white hover:bg-amber-500 focus:ring-2 focus:ring-amber-100",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-50 border border-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-100"
  };

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

// PUBLIC_INTERFACE
export function Input({ label, className, ...props }) {
  /** Text input with label. */
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium text-gray-700">{label}</div> : null}
      <input
        className={clsx(
          "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm",
          "focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
          className
        )}
        {...props}
      />
    </label>
  );
}

// PUBLIC_INTERFACE
export function Select({ label, className, children, ...props }) {
  /** Select with label. */
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium text-gray-700">{label}</div> : null}
      <select
        className={clsx(
          "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm",
          "focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

// PUBLIC_INTERFACE
export function Badge({ tone = "gray", children }) {
  /** Small status/severity badge. */
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700"
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
