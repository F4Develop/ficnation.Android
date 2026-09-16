"use client";

import React, { useState, useEffect, useRef } from "react";
import { Smile, Sparkles } from "lucide-react";

export const REACTION_EMOJIS = [
  { emoji: "🔥", label: "Épico", color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/40" },
  { emoji: "💔", label: "Dolor", color: "from-rose-500/20 to-purple-500/20 text-rose-400 border-rose-500/40" },
  { emoji: "😱", label: "Impacto", color: "from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/40" },
  { emoji: "🤣", label: "Risa", color: "from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/40" },
  { emoji: "💀", label: "Tensión", color: "from-zinc-500/20 to-slate-500/20 text-zinc-300 border-zinc-500/40" },
  { emoji: "❤️", label: "Amor", color: "from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/40" },
];

export type ParagraphReactionsMap = Record<number, Record<string, number>>;
export type UserReactionsMap = Record<number, string[]>;

export function getStoredChapterReactions(
  storyId: string,
  chapterNumber: number | string
): ParagraphReactionsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`ficnation_p_reactions_${storyId}_ch_${chapterNumber}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getStoredUserReactions(
  storyId: string,
  chapterNumber: number | string
): UserReactionsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`ficnation_user_p_reactions_${storyId}_ch_${chapterNumber}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

interface ParagraphReactionProps {
  paragraphIndex: number;
  reactions: Record<string, number>;
  userReactions: string[];
  onToggleReaction: (paragraphIndex: number, emoji: string) => void;
}

export function ParagraphReactionWidget({
  paragraphIndex,
  reactions = {},
  userReactions = [],
  onToggleReaction,
}: ParagraphReactionProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    if (isPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPickerOpen]);

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return (
    <div className="relative inline-flex items-center gap-1.5 mt-1 select-none flex-wrap">
      {/* Botón Flotante para Abrir el Selector de Reacción */}
      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold transition-all hover:scale-105 cursor-pointer ${
            totalReactions > 0
              ? "fic-card-secondary hover:border-purple-500/40"
              : "opacity-40 hover:opacity-100 fic-card-secondary"
          }`}
          style={{ borderColor: "var(--border-primary)" }}
          title="Reaccionar a este párrafo"
        >
          <Smile className="w-3 h-3 text-purple-400" />
          <span className="text-[10px] text-zinc-400">+</span>
        </button>

        {/* Picker Flotante de Emojis */}
        {isPickerOpen && (
          <div
            className="absolute left-0 bottom-full mb-1.5 z-40 flex items-center gap-1 p-1.5 rounded-2xl border shadow-xl backdrop-blur-2xl animate-fade-in-scale"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-primary)",
            }}
          >
            {REACTION_EMOJIS.map(({ emoji, label }) => {
              const hasVoted = userReactions.includes(emoji);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onToggleReaction(paragraphIndex, emoji);
                    setIsPickerOpen(false);
                  }}
                  className={`p-1.5 rounded-xl text-base transition-all hover:scale-125 cursor-pointer flex flex-col items-center group relative ${
                    hasVoted ? "bg-purple-500/20 ring-1 ring-purple-500" : "hover:bg-white/10"
                  }`}
                  title={label}
                >
                  <span>{emoji}</span>
                  <span className="text-[8px] font-bold text-zinc-400 opacity-0 group-hover:opacity-100 absolute -top-5 whitespace-nowrap bg-black/80 px-1 rounded pointer-events-none transition-opacity">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Badges de Reacciones Activas */}
      {Object.entries(reactions).map(([emoji, count]) => {
        if (count <= 0) return null;
        const hasVoted = userReactions.includes(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggleReaction(paragraphIndex, emoji)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold transition-all hover:scale-105 cursor-pointer shadow-xs ${
              hasVoted
                ? "bg-purple-500/25 border-purple-500/60 text-purple-300 ring-1 ring-purple-500/40"
                : "fic-card-secondary hover:border-purple-500/40 text-zinc-300"
            }`}
            style={!hasVoted ? { borderColor: "var(--border-primary)" } : {}}
            title={hasVoted ? "Quitar tu reacción" : `Reaccionar con ${emoji}`}
          >
            <span>{emoji}</span>
            <span className="text-[10px] font-mono">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
