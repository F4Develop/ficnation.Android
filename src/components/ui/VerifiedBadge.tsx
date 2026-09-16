"use client";

import React from "react";

interface VerifiedBadgeProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "verified" | "creator";
  title?: string;
}

/**
 * Componente oficial de Insignia de Verificación de FicNation.
 * Muestra el sello celeste/azul con tilde blanca auténtico tipo Twitter/Instagram,
 * o el sello dorado para el Creador oficial (F4).
 */
export function VerifiedBadge({
  className = "",
  size = "sm",
  variant = "verified",
  title,
}: VerifiedBadgeProps) {
  const sizeClass = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  const isCreator = variant === "creator";
  const defaultTitle = isCreator ? "Creador Oficial de FicNation" : "Usuario Verificado de FicNation";

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none align-middle ${
        isCreator
          ? "text-amber-400 dark:text-amber-300 drop-shadow-[0_1px_4px_rgba(245,158,11,0.5)]"
          : "text-sky-500 dark:text-sky-400 drop-shadow-[0_1px_2px_rgba(14,165,233,0.35)]"
      } ${sizeClass} ${className}`}
      title={title || defaultTitle}
      aria-label={title || defaultTitle}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-full h-full"
      >
        {/* Sello de verificación con tilde blanca interna */}
        <path d="M22.5 12.5c0-1.58-.8-2.95-2-3.75.33-1.65-.2-3.37-1.47-4.64-1.27-1.27-2.99-1.8-4.64-1.47-.8-1.2-2.17-2-3.75-2s-2.95.8-3.75 2c-1.65-.33-3.37.2-4.64 1.47-1.27 1.27-1.8 2.99-1.47 4.64-1.2.8-2 2.17-2 3.75s.8 2.95 2 3.75c-.33 1.65.2 3.37 1.47 4.64 1.27 1.27 2.99 1.8 4.64 1.47.8 1.2 2.17 2 3.75 2s2.95-.8 3.75-2c1.65.33 3.37-.2 4.64-1.47 1.27-1.27 1.8-2.99 1.47-4.64 1.2-.8 2-2.17 2-3.75zm-11.87 3.79l-4.22-4.22 1.41-1.41 2.81 2.81 6.59-6.59 1.41 1.41-7.99 8.01z" />
      </svg>
    </span>
  );
}
