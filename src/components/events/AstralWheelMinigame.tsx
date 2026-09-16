"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Gift, Flame, Trophy, Coins, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { addItemToUserInventory, equipUserItem, getUserInventory, consumeUserItem } from "@/lib/inventoryStorage";
import { CATALOG_ITEMS, InventoryItem } from "@/types/inventory";

interface WheelSlice {
  id: string;
  catalogId: string;
  name: string;
  icon: string;
  color: string;
  textColor: string;
  type: "coins" | "xp" | "frame" | "title" | "ticket";
  amount?: number;
}

const WHEEL_SLICES: WheelSlice[] = [
  { id: "1", catalogId: "frame_cosmic", name: "Aura Cósmica", icon: "🌌", color: "#7c3aed", textColor: "#ffffff", type: "frame" },
  { id: "2", catalogId: "coins_pouch", name: "100 FicCoins", icon: "🪙", color: "#f59e0b", textColor: "#000000", type: "coins", amount: 100 },
  { id: "3", catalogId: "title_cosmic", name: "Viajero Cósmico", icon: "✨", color: "#ec4899", textColor: "#ffffff", type: "title" },
  { id: "4", catalogId: "potion_xp_large", name: "Poción +500 XP", icon: "🧪", color: "#3b82f6", textColor: "#ffffff", type: "xp", amount: 500 },
  { id: "5", catalogId: "frame_dragon", name: "Llamas de Dragón", icon: "🔥", color: "#ef4444", textColor: "#ffffff", type: "frame" },
  { id: "6", catalogId: "event_spin_ticket", name: "+1 Ticket Astral", icon: "🎫", color: "#10b981", textColor: "#ffffff", type: "ticket", amount: 1 },
  { id: "7", catalogId: "title_blade", name: "Espadachín", icon: "⚔️", color: "#6366f1", textColor: "#ffffff", type: "title" },
  { id: "8", catalogId: "potion_xp_small", name: "Frasco +150 XP", icon: "⚗️", color: "#8b5cf6", textColor: "#ffffff", type: "xp", amount: 150 },
];

export function AstralWheelMinigame() {
  const { user, addXp, addCoins } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<WheelSlice | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [availableTickets, setAvailableTickets] = useState(0);
  const [hasDailyFreeSpin, setHasDailyFreeSpin] = useState(true);

  // Cargar estado de tiradas diarias y tickets disponibles
  useEffect(() => {
    if (!user) return;
    const inv = getUserInventory(user.id);
    const ticketItem = inv.find((i) => i.id === "event_spin_ticket");
    setAvailableTickets(ticketItem?.quantity || 0);

    const lastSpinDate = localStorage.getItem(`ficnation_last_wheel_spin_${user.id}`);
    const today = new Date().toDateString();
    setHasDailyFreeSpin(lastSpinDate !== today);
  }, [user]);

  const handleSpin = () => {
    if (!user || isSpinning) return;

    if (!hasDailyFreeSpin && availableTickets <= 0) {
      alert("No tienes más tiradas disponibles hoy. ¡Consigue Tickets Astrales en TriviFic o espera a mañana!");
      return;
    }

    setIsSpinning(true);
    setWonPrize(null);

    // Consumir tirada diaria o ticket
    if (hasDailyFreeSpin) {
      localStorage.setItem(`ficnation_last_wheel_spin_${user.id}`, new Date().toDateString());
      setHasDailyFreeSpin(false);
    } else {
      consumeUserItem(user.id, "event_spin_ticket");
      setAvailableTickets((prev) => Math.max(0, prev - 1));
    }

    // Calcular premio aleatorio
    const randomIndex = Math.floor(Math.random() * WHEEL_SLICES.length);
    const selectedSlice = WHEEL_SLICES[randomIndex];

    const degreesPerSlice = 360 / WHEEL_SLICES.length;
    // 5 a 8 vueltas completas + alineación con el slice ganador
    const extraSpins = 360 * (5 + Math.floor(Math.random() * 3));
    const targetDegree = extraSpins + (360 - randomIndex * degreesPerSlice - degreesPerSlice / 2);

    setRotation((prev) => prev + targetDegree);

    // Esperar al final de la animación (4.5s)
    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(selectedSlice);
      setShowPrizeModal(true);

      // Entregar recompensa de forma reactiva
      if (selectedSlice.type === "xp" && selectedSlice.amount) {
        addXp(selectedSlice.amount, "Recompensa Ruleta Astral");
      } else if (selectedSlice.type === "coins" && selectedSlice.amount) {
        addCoins(selectedSlice.amount, "Premio de Ruleta Astral");
      }

      // Añadir ítem al inventario del usuario
      try {
        addItemToUserInventory(user.id, selectedSlice.catalogId, 1);
      } catch (err) {
        console.error("Error guardando premio en inventario:", err);
      }
    }, 4600);
  };

  const handleEquipPrize = () => {
    if (!user || !wonPrize) return;
    equipUserItem(user.id, wonPrize.catalogId);
    setShowPrizeModal(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      {/* Cabecera del Minijuego */}
      <div className="text-center space-y-1.5 max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold bg-purple-500/10 border-purple-500/30 text-purple-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Minijuego Mensual #1</span>
        </div>
        <h3 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
          🎡 La Ruleta Astral
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Pon a prueba tu fortuna estelar. Cada día obtienes <strong>1 tirada gratuita</strong> con la que puedes conseguir marcos exclusivos, títulos cósmicos o FicCoins.
        </p>
      </div>

      {/* Indicadores de Tiradas Disponibles */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <div className={`px-3 py-1 rounded-full border flex items-center gap-1.5 ${hasDailyFreeSpin ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" : "fic-card-secondary text-zinc-500"}`}>
          <span className={`w-2 h-2 rounded-full ${hasDailyFreeSpin ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
          <span>{hasDailyFreeSpin ? "1 Tirada Diaria Gratis Disponible" : "Tirada Diaria Ya Usada"}</span>
        </div>
        <div className="px-3 py-1 rounded-full border fic-card-secondary flex items-center gap-1.5 text-amber-400" style={{ borderColor: "var(--border-primary)" }}>
          <Gift className="w-3.5 h-3.5" />
          <span>{availableTickets} Tickets Astrales</span>
        </div>
      </div>

      {/* Contenedor de la Ruleta */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center select-none">
        {/* Marcador / Flecha Superior fija */}
        <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none drop-shadow-xl">
          <div className="w-5 h-7 bg-amber-400 border-2 border-white rounded-b-md transform rotate-180 shadow-lg" />
          <div className="w-2 h-2 bg-amber-300 rounded-full mt-0.5" />
        </div>

        {/* Disco Giratorio */}
        <div
          className="w-full h-full rounded-full border-4 border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.35)] relative overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? "transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1.0)" : "none",
          }}
        >
          {WHEEL_SLICES.map((slice, i) => {
            const angle = (360 / WHEEL_SLICES.length) * i;
            return (
              <div
                key={slice.id}
                className="absolute top-0 left-0 w-full h-full origin-center flex flex-col items-center justify-start pt-3"
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <div
                  className="absolute inset-0 origin-bottom"
                  style={{
                    clipPath: "polygon(50% 50%, 30% 0%, 70% 0%)",
                    backgroundColor: slice.color,
                    opacity: 0.9,
                  }}
                />
                <div
                  className="relative z-10 flex flex-col items-center gap-0.5 text-center pt-2"
                  style={{ color: slice.textColor }}
                >
                  <span className="text-xl filter drop-shadow">{slice.icon}</span>
                  <span className="text-[10px] font-black tracking-tight leading-tight max-w-[55px] drop-shadow line-clamp-1">
                    {slice.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón Central de Giro */}
        <button
          type="button"
          disabled={isSpinning || (!hasDailyFreeSpin && availableTickets <= 0)}
          onClick={handleSpin}
          className="absolute z-20 w-20 h-20 rounded-full border-4 border-white shadow-2xl flex flex-col items-center justify-center font-black transition-transform active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-tr from-purple-700 via-pink-600 to-amber-500 text-white hover:scale-105"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider font-extrabold">
            {isSpinning ? "..." : "GIRAR"}
          </span>
        </button>
      </div>

      {/* Botón de Tirada Accesible */}
      <div className="pt-2">
        <button
          type="button"
          disabled={isSpinning || (!hasDailyFreeSpin && availableTickets <= 0)}
          onClick={handleSpin}
          className="px-6 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed fic-btn-primary flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {isSpinning
              ? "Girando Ruleta..."
              : hasDailyFreeSpin
              ? "¡Usar Tirada Gratuita de Hoy!"
              : availableTickets > 0
              ? `Girar con Ticket Astral (${availableTickets} disponibles)`
              : "Sin Tiradas (Regresa mañana o consigue tickets)"}
          </span>
        </button>
      </div>

      {/* ═════════ MODAL DE RECOMPENSA OBTENIDA ═════════ */}
      {showPrizeModal && wonPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="max-w-sm w-full p-6 rounded-3xl border shadow-2xl text-center space-y-4 animate-fade-in-scale fic-card" style={{ borderColor: "var(--border-primary)" }}>
            <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-xl">
              <span className="text-4xl animate-bounce">{wonPrize.icon}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                ¡Premio Desbloqueado!
              </span>
              <h4 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>
                {wonPrize.name}
              </h4>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Se ha guardado automáticamente en tu <strong>Inventario</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {(wonPrize.type === "frame" || wonPrize.type === "title") && (
                <button
                  type="button"
                  onClick={handleEquipPrize}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white fic-btn-primary shadow-md hover:scale-105 transition-all"
                >
                  ⚡ Equipar Ahora
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPrizeModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border fic-card-secondary hover:opacity-80 transition-all cursor-pointer"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
              >
                🎒 Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
