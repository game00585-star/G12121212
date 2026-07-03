import React from "react";

export function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.25 12s3.5-6.25 9.75-6.25S21.75 12 21.75 12 18.25 18.25 12 18.25 2.25 12 2.25 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.9A9.3 9.3 0 0 1 12 5.75C18.25 5.75 21.75 12 21.75 12a17 17 0 0 1-3.1 3.85" />
      <path d="M6.5 6.9A17.4 17.4 0 0 0 2.25 12S5.75 18.25 12 18.25c1.45 0 2.73-.34 3.84-.84" />
      <path d="M9.88 9.88A3 3 0 0 0 14.12 14.12" />
    </svg>
  );
}

export default function PasswordVisibilityButton({ open, onClick }) {
  return (
    <button
      type="button"
      className="password-eye-button"
      onClick={onClick}
      aria-label={open ? "Hide password" : "Show password"}
      title={open ? "ซ่อนรหัส" : "ดูรหัส"}
    >
      <EyeIcon open={open} />
    </button>
  );
}
