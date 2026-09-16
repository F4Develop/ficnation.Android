"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  Lock,
  Bell,
  Check,
  Ghost,
  Moon,
  Skull,
  Calendar,
  Backpack,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function HallowFicEvent() {
  const { user } = useAuth();
  const [isNotified, setIsNotified] = useState(false);

  // Cuenta regresiva hacia el 1 de Octubre de 2026
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 23, hours: 3, minutes: 45, seconds: 12 });

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`ficnation_hallowfic_notified_${user.id}`);
      if (saved === "true") setIsNotified(true);
    }

    const targetDate = new Date("2026-10-01T00:00:00Z").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [user]);

  const handleToggleNotify = () => {
    const nextState = !isNotified;
    setIsNotified(nextState);
    if (user) {
      localStorage.setItem(`ficnation_hallowfic_notified_${user.id}`, nextState ? "true" : "false");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ════════════ CABECERA GÓTICA HALLOWFIC ════════════ */}
      <div
        className="p-6 sm:p-10 rounded-3xl border relative overflow-hidden bg-gradient-to-br from-[#12061f] via-[#1a0a2a] to-black shadow-2xl"
        style={{ borderColor: "rgba(168, 85, 247, 0.3)" }}
      >
        {/* Destellos y niebla decorativa */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-2xl">
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3.5 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center gap-1.5 shadow-sm">
              <span>🎃</span>
              <span>Próximamente • Octubre 2026</span>
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Temporada de Halloween
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>HallowFic</span>
              <span className="text-3xl text-orange-400">🎃👑</span>
            </h1>
            <p className="text-sm text-purple-200/90 font-serif italic">
              "Cuando el velo entre mundos se desvanezca en la noche de Octubre, las sombras coronarán el trono de los relatos prohibidos..."
            </p>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed pt-1">
              Prepárate para el evento literario más oscuro y emocionante del año. Fics de terror, misterio psicológico, búsqueda de caramelos encantados en capítulos y cosméticos góticos exclusivos que solo estarán disponibles por tiempo limitado.
            </p>
          </div>

          {/* ════════════ CUENTA REGRESIVA EN VIVO ════════════ */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Cuenta Regresiva para el Estreno:</span>
            </span>

            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md">
              {[
                { label: "Días", value: timeLeft.days },
                { label: "Horas", value: timeLeft.hours },
                { label: "Minutos", value: timeLeft.minutes },
                { label: "Segundos", value: timeLeft.seconds },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 sm:p-4 rounded-2xl bg-black/60 border border-purple-500/30 text-center shadow-lg backdrop-blur-md"
                >
                  <span className="text-xl sm:text-2xl font-black font-mono text-orange-400">
                    {String(item.value).padStart(2, "0")}
                  </span>
                  <p className="text-[9px] sm:text-[10px] uppercase font-mono text-zinc-400 mt-0.5">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Botón de Pre-registro / Notificación */}
          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleToggleNotify}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                isNotified
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                  : "bg-gradient-to-r from-orange-600 to-amber-600 text-black hover:scale-102 font-black"
              }`}
            >
              {isNotified ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>¡Suscrito! Te avisaremos al estrenar</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Notificarme al Iniciar HallowFic</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ════════════ TEASER DE ACTIVIDADES ESPERADAS ════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-3xl border fic-card space-y-2 shadow-sm" style={{ borderColor: "var(--border-primary)" }}>
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-xl">
            🕯️
          </div>
          <h3 className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
            Concurso de Fics de Terror
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Escribe relatos oscuros, creepypastas, romance gótico o suspenso. Los autores más destacados ganarán premios en FicCoins y medallas conmemorativas.
          </p>
        </div>

        <div className="p-5 rounded-3xl border fic-card space-y-2 shadow-sm" style={{ borderColor: "var(--border-primary)" }}>
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl">
            🍬
          </div>
          <h3 className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
            Truco o Trato Literario
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Encuentra caramelos mágicos y calabazas escondidas al final de los capítulos que leas durante todo el mes para canjear en la Tienda Maldita.
          </p>
        </div>

        <div className="p-5 rounded-3xl border fic-card space-y-2 shadow-sm" style={{ borderColor: "var(--border-primary)" }}>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-xl">
            🦇
          </div>
          <h3 className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
            Cripta de Cosméticos Míticos
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Desbloquea marcos de calaveras góticas, auras de fuego fatuo y la legendaria mascota Murciélago Espectral que te acompañará al leer.
          </p>
        </div>

      </div>

      {/* ════════════ RECOMPENSAS SECRETAS BLOQUEADAS ════════════ */}
      <div className="p-6 sm:p-8 rounded-3xl border fic-card space-y-5 shadow-xl" style={{ borderColor: "var(--border-primary)" }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-400" />
            <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
              Colección Secreta HallowFic (Edición Limitada)
            </h3>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Estos objetos solo podrán obtenerse durante el mes de Octubre en los minijuegos y desafíos de la Cripta.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: "Marco Corona de Bruja",
              type: "Marco de Avatar",
              rarity: "Legendario",
              icon: "🧙‍♀️",
              teaser: "Sombras y fuego fatuo púrpura alrededor de tu perfil.",
            },
            {
              name: "Aura Fuego Espectral",
              type: "Aura & FX",
              rarity: "Épico",
              icon: "🔥",
              teaser: "Llamas verdes de ectoplasma que flotan a tu alrededor.",
            },
            {
              name: "Murciélago de la Cripta",
              type: "Mascota Acompañante",
              rarity: "Mítico",
              icon: "🦇",
              teaser: "Aletea a tu lado en la oscuridad mientras devoras historias.",
            },
            {
              name: "Título: HallowFic 2026",
              type: "Título Honorífico",
              rarity: "Épico",
              icon: "🎃",
              teaser: "Distinción naranja brillante que atestigua tu reinado otoñal.",
            },
          ].map((secret, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border bg-black/30 border-purple-500/20 text-center space-y-3 relative overflow-hidden group hover:border-orange-500/40 transition-colors"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-3xl shadow-inner relative">
                <span className="opacity-40 filter blur-[1px]">{secret.icon}</span>
                <span className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl text-orange-400">
                  <Lock className="w-5 h-5" />
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-orange-400">
                  {secret.rarity} • {secret.type}
                </span>
                <h4 className="text-xs font-black text-white">{secret.name}</h4>
                <p className="text-[10px] text-zinc-400 leading-snug">{secret.teaser}</p>
              </div>

              <span className="block text-[10px] font-mono text-purple-300/70 border-t border-white/5 pt-1.5">
                🔒 Se desbloquea en Octubre
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
