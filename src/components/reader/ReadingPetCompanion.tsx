"use client";

import React, { useState, useEffect } from "react";
import { CATALOG_ITEMS, InventoryItem } from "@/types/inventory";
import { getUserEquippedCosmetics } from "@/lib/inventoryStorage";
import { Sparkles, MessageCircle, X, ChevronUp, ChevronDown } from "lucide-react";

interface ReadingPetCompanionProps {
  userId?: string;
  chapterTitle?: string;
}

const PET_QUOTES: Record<string, string[]> = {
  pet_ink_dragon: [
    "¡Siente el fuego de este capítulo! 🔥",
    "¡Menudo giro en la historia! 🐉",
    "¡Sigue leyendo, humano, la tinta no debe secarse!",
    "¡Ese diálogo fue legendario!",
  ],
  pet_astral_cat: [
    "Miau... este párrafo me fascinó ✨",
    "*ronronea suavemente mientras lees* 🐾",
    "¡Las estrellas predicen un gran final de capítulo!",
    "Un capítulo más antes de dormir, ¿sí? 🌙",
  ],
  pet_paper_slime: [
    "¡Squee! ¡Amo el aroma a historias frescas! 📜",
    "*da saltitos emocionados sobre el papel*",
    "¡Esto está muy bueno, pasa al siguiente! 💨",
    "¡Te acompaño en cada letra! ❤️",
  ],
};

export function ReadingPetCompanion({ userId }: ReadingPetCompanionProps) {
  const [pet, setPet] = useState<InventoryItem | null>(null);
  const [quote, setQuote] = useState<string>("");
  const [showQuote, setShowQuote] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;

    const loadPet = () => {
      const cosmetics = getUserEquippedCosmetics(userId);
      if (!cosmetics.petId) {
        setPet(null);
        return;
      }
      const found = CATALOG_ITEMS.find((c) => c.id === cosmetics.petId);
      if (found && found.type === "pet") {
        setPet(found as InventoryItem);
      } else {
        setPet(null);
      }
    };

    loadPet();
    window.addEventListener("ficnation_cosmetics_updated", loadPet);
    return () => window.removeEventListener("ficnation_cosmetics_updated", loadPet);
  }, [userId]);

  const triggerQuote = () => {
    if (!pet) return;
    const quotes = PET_QUOTES[pet.id] || ["¡Qué buena lectura! ✨", "¡Sigue adelante! 📖"];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
    setShowQuote(true);
    setTimeout(() => setShowQuote(false), 4500);
  };

  if (!pet) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-none select-none">
      {/* Bocadillo de Diálogo de la Mascota */}
      {showQuote && !isMinimized && (
        <div className="mb-2 p-3 max-w-[200px] rounded-2xl border text-xs shadow-xl backdrop-blur-xl bg-black/80 text-purple-200 border-purple-500/40 pointer-events-auto animate-fade-in-scale relative">
          <p className="font-semibold text-[11px] leading-tight">{quote}</p>
          <div className="absolute -bottom-2 right-6 w-3 h-3 bg-black/80 border-r border-b border-purple-500/40 rotate-45" />
        </div>
      )}

      {/* Mascota Interactiva */}
      <div className="flex items-center gap-1 pointer-events-auto">
        {!isMinimized ? (
          <div
            onClick={triggerQuote}
            className="group relative flex items-center justify-center w-14 h-14 rounded-2xl border shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all fic-card bg-purple-950/40"
            style={{ borderColor: "var(--border-primary)" }}
            title={`Tu mascota: ${pet.name} (Haz clic para interactuar)`}
          >
            <span className="text-3xl animate-bounce-gentle filter drop-shadow-md">
              {pet.icon}
            </span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-2 rounded-full border shadow-md fic-card-secondary hover:scale-105 transition-all text-xs"
            title="Mostrar mascota acompañante"
          >
            <span className="text-base">{pet.icon}</span>
          </button>
        )}

        {/* Botón Minimizar */}
        {!isMinimized && (
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Minimizar mascota"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
