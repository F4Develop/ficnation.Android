"use client";

import React, { useState } from "react";
import { Sparkles, Box, Shield, Zap, Lock, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { addItemToUserInventory, equipUserItem } from "@/lib/inventoryStorage";
import { CATALOG_ITEMS, InventoryItem } from "@/types/inventory";

export function RelicGachaMinigame() {
  const { user, spendCoins, addXp } = useAuth();
  const [openingChest, setOpeningChest] = useState<"normal" | "legendary" | null>(null);
  const [revealedItem, setRevealedItem] = useState<InventoryItem | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleOpenChest = async (type: "normal" | "legendary", cost: number) => {
    if (!user || isAnimating) return;

    if (cost > 0) {
      const ok = await spendCoins(cost, `Apertura de Cofre ${type === "legendary" ? "Legendario" : "Astral"}`);
      if (!ok) {
        alert("No tienes suficientes FicCoins para abrir este cofre.");
        return;
      }
    }

    setOpeningChest(type);
    setIsAnimating(true);
    setRevealedItem(null);

    setTimeout(() => {
      // Filtrar catálogo por rarezas según cofre
      let eligibleItems = CATALOG_ITEMS;
      if (type === "legendary") {
        eligibleItems = CATALOG_ITEMS.filter((i) => i.rarity === "epico" || i.rarity === "legendario" || i.rarity === "mitico");
      }

      const randomItem = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];
      const result = addItemToUserInventory(user.id, randomItem.id, 1);

      // Si es poción de XP o monedas, dar bono
      if (randomItem.id === "potion_xp_large") {
        addXp(500, "Bono de Cofre");
      }

      setIsAnimating(false);
      setRevealedItem(result.addedItem);
    }, 2800);
  };

  const handleEquipItem = () => {
    if (!user || !revealedItem) return;
    equipUserItem(user.id, revealedItem.id);
    setRevealedItem(null);
    setOpeningChest(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      {/* Encabezado */}
      <div className="text-center space-y-1.5 max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold bg-pink-500/10 border-pink-500/30 text-pink-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Minijuego Mensual #2</span>
        </div>
        <h3 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
          📦 Cofres & Invocación de Reliquias
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Abre cofres del evento para invocar marcos celestiales, coronas de oro imperial y títulos de prestigio para tu perfil.
        </p>
      </div>

      {/* Selector de Cofres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {/* 1. Cofre Astral Estándar */}
        <div className="p-5 rounded-3xl border fic-card relative overflow-hidden flex flex-col items-center text-center space-y-4 shadow-xl hover:scale-102 transition-all group" style={{ borderColor: "var(--border-primary)" }}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-600 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
            <span className="text-4xl">🎁</span>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
              Cofre Astral Común
            </h4>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Contiene pociones de XP, títulos de rol y marcos de sakura o neón.
            </p>
          </div>

          <div className="w-full pt-2">
            <button
              type="button"
              disabled={isAnimating}
              onClick={() => handleOpenChest("normal", 40)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white shadow-md transition-all hover:scale-105 disabled:opacity-50 fic-btn-primary flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🪙 Abrir (40 FicCoins)</span>
            </button>
          </div>
        </div>

        {/* 2. Cofre de Reliquia Mítica */}
        <div className="p-5 rounded-3xl border relative overflow-hidden flex flex-col items-center text-center space-y-4 shadow-2xl hover:scale-102 transition-all group border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-purple-950/20">
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider">
            Recomendado
          </div>

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-pink-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
            <span className="text-4xl">👑</span>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-amber-300">
              Cofre de Reliquia Mítica
            </h4>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Garantiza marcos legendarios como <strong>Corona de Oro</strong> o <strong>Aura Cósmica</strong>.
            </p>
          </div>

          <div className="w-full pt-2">
            <button
              type="button"
              disabled={isAnimating}
              onClick={() => handleOpenChest("legendary", 100)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-lg transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🪙 Abrir Mítico (100 FicCoins)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═════════ ANIMACIÓN Y REVELACIÓN DE APERTURA ═════════ */}
      {isAnimating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in">
          <div className="relative flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-[0_0_80px_rgba(234,179,8,0.7)] animate-bounce">
              <span className="text-6xl animate-pulse">✨</span>
            </div>
            <p className="text-base font-black text-white tracking-widest uppercase animate-pulse">
              Invocando Reliquia del Evento...
            </p>
          </div>
        </div>
      )}

      {/* ═════════ POPUP DEL ÍTEM REVELADO ═════════ */}
      {revealedItem && !isAnimating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="max-w-sm w-full p-6 rounded-3xl border shadow-2xl text-center space-y-4 animate-fade-in-scale fic-card" style={{ borderColor: "var(--border-primary)" }}>
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-2xl">
              <span className="text-5xl">{revealedItem.icon}</span>
            </div>

            <div className="space-y-1">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                revealedItem.rarity === "mitico"
                  ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
                  : revealedItem.rarity === "legendario"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
              }`}>
                {revealedItem.rarity.toUpperCase()}
              </span>
              <h4 className="text-xl font-black pt-1" style={{ color: "var(--text-primary)" }}>
                {revealedItem.name}
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {revealedItem.description}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {(revealedItem.type === "frame" || revealedItem.type === "title") && (
                <button
                  type="button"
                  onClick={handleEquipItem}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white fic-btn-primary shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  ⚡ Equipar Ahora
                </button>
              )}
              <button
                type="button"
                onClick={() => setRevealedItem(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border fic-card-secondary hover:opacity-80 transition-all cursor-pointer"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
              >
                🎒 Guardar en Inventario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
