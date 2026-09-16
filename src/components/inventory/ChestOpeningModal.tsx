"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Check, Gift, ArrowRight } from "lucide-react";
import { InventoryItem } from "@/types/inventory";
import { equipUserItem } from "@/lib/inventoryStorage";

interface ChestOpeningModalProps {
  chestItem: InventoryItem;
  loot: InventoryItem[];
  userId: string;
  onClose: () => void;
}

export function ChestOpeningModal({
  chestItem,
  loot,
  userId,
  onClose,
}: ChestOpeningModalProps) {
  const [phase, setPhase] = useState<"opening" | "revealed">("opening");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("revealed");
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  const handleEquipOne = (item: InventoryItem) => {
    equipUserItem(userId, item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in select-none">
      <div
        className="max-w-md w-full p-6 sm:p-8 rounded-3xl border shadow-2xl text-center space-y-6 animate-fade-in-scale fic-card relative overflow-hidden"
        style={{ borderColor: "var(--border-primary)" }}
      >
        {phase === "opening" ? (
          <div className="py-8 space-y-6">
            <div className="relative mx-auto w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.6)] animate-bounce">
              <span className="text-6xl animate-pulse">{chestItem.icon}</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase tracking-wider text-amber-300 animate-pulse">
                Abriendo {chestItem.name}...
              </h3>
              <p className="text-xs text-zinc-400">
                ¡Canalizando la energía de las recompensas!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                ¡Botín Desbloqueado!
              </span>
              <h3 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
                Recompensas de {chestItem.name}
              </h3>
            </div>

            {/* Cuadrícula de Objetos Revelados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {loot.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="p-3.5 rounded-2xl border fic-card-secondary flex flex-col items-center text-center space-y-2 relative group"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <span className="text-3xl filter drop-shadow-sm">{item.icon}</span>
                  <div className="space-y-0.5">
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 rounded-full ${
                      item.rarity === "mitico"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : item.rarity === "legendario"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    }`}>
                      {item.rarity}
                    </span>
                    <p className="text-xs font-black truncate pt-0.5" style={{ color: "var(--text-primary)" }}>
                      {item.name}
                    </p>
                  </div>

                  {/* Botón Equipar si es cosmético */}
                  {item.type !== "consumable" && item.type !== "chest" && (
                    <button
                      type="button"
                      onClick={() => handleEquipOne(item)}
                      className="w-full py-1.5 px-2 rounded-xl text-[10px] font-bold text-white fic-btn-primary shadow-xs hover:scale-102 transition-all cursor-pointer"
                    >
                      ⚡ Equipar
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-5 rounded-2xl text-xs font-bold border fic-card-secondary hover:opacity-90 transition-all cursor-pointer"
              style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
            >
              🎒 Guardar en Inventario
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
