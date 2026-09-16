"use client";

import React, { useState, useEffect } from "react";
import { CATALOG_ITEMS } from "@/types/inventory";
import { getUserEquippedCosmetics } from "@/lib/inventoryStorage";
import { FicImage } from "@/components/ui/FicImage";

interface UserAvatarWithFrameProps {
  src?: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  userId?: string;
  customFrameId?: string | null;
  customAuraId?: string | null;
  className?: string;
  showCrown?: boolean;
}

const SIZE_MAP = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
  "2xl": "w-28 h-28 text-3xl",
};

export function UserAvatarWithFrame({
  src,
  alt = "Usuario",
  size = "md",
  userId,
  customFrameId,
  customAuraId,
  className = "",
  showCrown = false,
}: UserAvatarWithFrameProps) {
  const [activeFrameId, setActiveFrameId] = useState<string | null>(customFrameId || null);
  const [activeAuraId, setActiveAuraId] = useState<string | null>(customAuraId || null);

  useEffect(() => {
    if (customFrameId !== undefined) {
      setActiveFrameId(customFrameId);
    }
    if (customAuraId !== undefined) {
      setActiveAuraId(customAuraId);
    }

    if (userId) {
      const cosmetics = getUserEquippedCosmetics(userId);
      if (customFrameId === undefined) setActiveFrameId(cosmetics.frameId);
      if (customAuraId === undefined) setActiveAuraId(cosmetics.auraId);

      const handleUpdate = () => {
        const updated = getUserEquippedCosmetics(userId);
        if (customFrameId === undefined) setActiveFrameId(updated.frameId);
        if (customAuraId === undefined) setActiveAuraId(updated.auraId);
      };

      window.addEventListener("ficnation_cosmetics_updated", handleUpdate);
      return () => window.removeEventListener("ficnation_cosmetics_updated", handleUpdate);
    }
  }, [userId, customFrameId, customAuraId]);

  const frameDefinition = CATALOG_ITEMS.find((i) => i.id === activeFrameId);
  const auraDefinition = CATALOG_ITEMS.find((i) => i.id === activeAuraId);

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      
      {/* ─── EFECTOS DE AURA VISUAL (PARTÍCULAS Y HALO) ─── */}
      {auraDefinition?.id === "aura_stars" && (
        <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-indigo-500/40 blur-md animate-pulse pointer-events-none" />
      )}
      {auraDefinition?.id === "aura_flames" && (
        <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-t from-red-600/50 via-amber-500/40 to-transparent blur-md animate-pulse pointer-events-none" />
      )}
      {auraDefinition?.id === "aura_sakura" && (
        <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-r from-pink-400/40 via-rose-300/30 to-pink-500/40 blur-md animate-pulse pointer-events-none" />
      )}
      {auraDefinition?.id === "aura_neon_matrix" && (
        <div className="absolute inset-0 -m-1 rounded-full bg-cyan-400/40 blur-md animate-pulse pointer-events-none" />
      )}
      {auraDefinition?.id === "aura_bubbles" && (
        <div className="absolute inset-0 -m-1 rounded-full bg-sky-400/30 blur-md pointer-events-none" />
      )}

      {/* ─── CONTENEDOR DE AVATAR Y MARCO ─── */}
      <div
        className={`relative z-10 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ${sizeClass} ${
          frameDefinition?.borderClass || ""
        } ${frameDefinition?.glowClass || ""}`}
      >
        <FicImage
          src={src || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
          alt={alt}
          fallbackType="avatar"
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      {/* ─── DETALLES DEL MARCO (CORONA / DESTELLES) ─── */}
      {(frameDefinition?.id === "frame_gold" || showCrown) && (
        <span
          className="absolute -top-2.5 -right-1 z-20 text-xs select-none pointer-events-none drop-shadow-md animate-bounce"
          title="Corona Imperial"
        >
          👑
        </span>
      )}

      {frameDefinition?.id === "frame_cosmic" && (
        <span
          className="absolute -top-1.5 -left-1 z-20 text-[11px] select-none pointer-events-none animate-pulse"
          title="Aura Cósmica"
        >
          ✨
        </span>
      )}

      {frameDefinition?.id === "frame_dragon" && (
        <span
          className="absolute -bottom-1 -right-1 z-20 text-[11px] select-none pointer-events-none"
          title="Llamas de Dragón"
        >
          🔥
        </span>
      )}

      {frameDefinition?.id === "frame_frost" && (
        <span
          className="absolute -top-1.5 -right-1 z-20 text-[10px] select-none pointer-events-none"
          title="Hielo Arcano"
        >
          ❄️
        </span>
      )}

      {/* Partículas de Aura flotantes */}
      {auraDefinition?.id === "aura_stars" && (
        <>
          <span className="absolute -top-1 -right-1 z-20 text-[9px] animate-ping pointer-events-none">⭐</span>
          <span className="absolute -bottom-1 -left-1 z-20 text-[9px] animate-pulse pointer-events-none">✨</span>
        </>
      )}
      {auraDefinition?.id === "aura_sakura" && (
        <span className="absolute -bottom-1.5 -right-1 z-20 text-[10px] animate-bounce pointer-events-none">🌸</span>
      )}
      {auraDefinition?.id === "aura_neon_matrix" && (
        <span className="absolute -top-1.5 -right-1 z-20 text-[10px] animate-pulse pointer-events-none">⚡</span>
      )}
      {auraDefinition?.id === "aura_bubbles" && (
        <span className="absolute -top-1 -left-1 z-20 text-[9px] animate-bounce pointer-events-none">🫧</span>
      )}
    </div>
  );
}
