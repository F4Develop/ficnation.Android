"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Swords,
  Ghost,
  Calendar,
  Backpack,
  ArrowRight,
  Flame,
  Check,
} from "lucide-react";
import { WaifuBattleEvent } from "@/components/events/WaifuBattleEvent";
import { HallowFicEvent } from "@/components/events/HallowFicEvent";

export type EventId = "waifu_battle" | "hallowfic";

interface EventItem {
  id: EventId;
  title: string;
  seasonText: string;
  badge: string;
  badgeColor: string;
  icon: string;
  shortDesc: string;
  isLive: boolean;
}

const EVENTS_LIST: EventItem[] = [
  {
    id: "waifu_battle",
    title: "Waifu Battle",
    seasonText: "Septiembre 2026",
    badge: "ACTIVO AHORA",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    icon: "⚔️",
    shortDesc: "Torneo 1v1, afinidad y recompensas directas a tu mochila.",
    isLive: true,
  },
  {
    id: "hallowfic",
    title: "HallowFic",
    seasonText: "Octubre 2026",
    badge: "PRÓXIMAMENTE",
    badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    icon: "🎃",
    shortDesc: "Festival literario gótico, concurso de terror y truco o trato.",
    isLive: false,
  },
];

export default function EventosPage() {
  const [selectedEventId, setSelectedEventId] = useState<EventId>("waifu_battle");

  const selectedEvent = EVENTS_LIST.find((e) => e.id === selectedEventId) || EVENTS_LIST[0];

  return (
    <div className="min-h-screen pb-28 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
      
      {/* ════════════ CABECERA DE LA PÁGINA ════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border-primary)" }}>
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Centro de Eventos de Temporada
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Participa en las actividades temáticas, vota en los torneos y gana cosméticos exclusivos.
            </p>
          </div>
        </div>

        <Link
          href="/inventario"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold border fic-btn-secondary hover:scale-102 transition-all self-start sm:self-auto"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <Backpack className="w-3.5 h-3.5 text-purple-400" />
          <span>Ver mi Mochila</span>
        </Link>
      </div>

      {/* ════════════ LAYOUT SPLIT: SIDEBAR IZQUIERDA + CONTENIDO DERECHO ════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── SIDEBAR IZQUIERDA: LISTA DE EVENTOS DISPONIBLES ─── */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
          
          <div className="p-4 rounded-3xl border fic-card space-y-3 shadow-md" style={{ borderColor: "var(--border-primary)" }}>
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Eventos del Mes</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border fic-badge" style={{ borderColor: "var(--border-primary)" }}>
                {EVENTS_LIST.length} Disponibles
              </span>
            </div>

            {/* Lista de Eventos */}
            <div className="space-y-2.5">
              {EVENTS_LIST.map((ev) => {
                const isSelected = selectedEventId === ev.id;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col space-y-2 relative group ${
                      isSelected
                        ? "fic-card-secondary ring-2 ring-purple-500 shadow-md scale-101"
                        : "fic-card hover:bg-white/5 hover:border-purple-500/40"
                    }`}
                    style={!isSelected ? { borderColor: "var(--border-primary)" } : {}}
                  >
                    {/* Fila superior: Icono, Título y Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl select-none">{ev.icon}</span>
                        <div>
                          <h3 className="text-xs font-black truncate" style={{ color: "var(--text-primary)" }}>
                            {ev.title}
                          </h3>
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                            {ev.seasonText}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider border shrink-0 ${ev.badgeColor}`}>
                        {ev.badge}
                      </span>
                    </div>

                    {/* Descripción corta */}
                    <p className="text-[11px] line-clamp-2 leading-snug" style={{ color: "var(--text-muted)" }}>
                      {ev.shortDesc}
                    </p>

                    {/* Indicador de selección */}
                    {isSelected && (
                      <div className="pt-1 flex items-center justify-end text-[10px] font-mono font-bold text-purple-400">
                        <span>Seleccionado &rarr;</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Tarjeta de Acceso Rápido al Inventario */}
          <div
            className="p-4 rounded-3xl border fic-card-secondary text-center space-y-2 shadow-xs hidden sm:block"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl">
              🎒
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black" style={{ color: "var(--text-primary)" }}>
                Tus Recompensas
              </h4>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Todos los cosméticos y premios ganados van directo a tu inventario.
              </p>
            </div>
            <Link
              href="/inventario"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold border fic-btn-secondary hover:scale-102 transition-all mt-1"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <span>Equipar Cosméticos</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </aside>

        {/* ─── PANEL DERECHO: CONTENIDO DEL EVENTO SELECCIONADO ─── */}
        <main className="lg:col-span-8 xl:col-span-9">
          {selectedEventId === "waifu_battle" && <WaifuBattleEvent />}
          {selectedEventId === "hallowfic" && <HallowFicEvent />}
        </main>

      </div>

    </div>
  );
}
