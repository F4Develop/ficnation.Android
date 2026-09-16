"use client";

import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Headphones,
  Sparkles,
  ChevronDown,
  Music,
} from "lucide-react";
import {
  ambientEngine,
  SOUNDSCAPES,
  type SoundscapeType,
} from "@/lib/ambientAudio";

export function AmbientAudioPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SoundscapeType | null>(null);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    return () => {
      if (ambientEngine) {
        ambientEngine.stop();
      }
    };
  }, []);

  const togglePlayTrack = (trackId: SoundscapeType) => {
    if (!ambientEngine) return;
    if (currentTrack === trackId && isPlaying) {
      ambientEngine.stop();
      setIsPlaying(false);
      setCurrentTrack(null);
    } else {
      ambientEngine.play(trackId);
      setCurrentTrack(trackId);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (ambientEngine) {
      ambientEngine.setVolume(val);
    }
  };

  const handleStopAll = () => {
    if (ambientEngine) {
      ambientEngine.stop();
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  };

  return (
    <div className="relative">
      {/* Botón Disparador en la Barra de Lectura */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
          isPlaying
            ? "bg-purple-600/30 border-purple-500 text-purple-200 ring-2 ring-purple-500/40 shadow-sm"
            : "fic-card-secondary hover:scale-105"
        }`}
        style={{ borderColor: isPlaying ? undefined : "var(--border-primary)" }}
        title="Música de ambiente & Efectos sonoros inmersivos"
      >
        <Headphones className={`w-3.5 h-3.5 ${isPlaying ? "animate-pulse text-purple-400" : ""}`} />
        <span className="hidden sm:inline">
          {isPlaying
            ? SOUNDSCAPES.find((s) => s.id === currentTrack)?.name || "Ambiente Activo"
            : "Ambiente"}
        </span>
        {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
      </button>

      {/* Menú Desplegable de Pistas */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-3xl border fic-card p-4 shadow-2xl z-50 animate-fade-in-scale space-y-3"
          style={{ borderColor: "var(--border-primary)", background: "var(--bg-card)" }}
        >
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-black tracking-wide uppercase" style={{ color: "var(--text-primary)" }}>
                Sonidos de Ambiente
              </h4>
            </div>
            {isPlaying && (
              <button
                type="button"
                onClick={handleStopAll}
                className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
              >
                Silenciar
              </button>
            )}
          </div>

          {/* Control de Volumen */}
          <div className="flex items-center gap-2.5 px-1 py-1 rounded-xl bg-black/20">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-purple-950/40 rounded-lg"
            />
            <span className="text-[10px] font-mono text-purple-300 shrink-0 w-7 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Lista de Paisajes Sonoros */}
          <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
            {SOUNDSCAPES.map((sc) => {
              const active = currentTrack === sc.id && isPlaying;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => togglePlayTrack(sc.id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all cursor-pointer group ${
                    active
                      ? "bg-purple-600/25 border-purple-500 ring-1 ring-purple-400/50 shadow-xs scale-[1.01]"
                      : "fic-card-secondary hover:scale-[1.01]"
                  }`}
                  style={{ borderColor: active ? undefined : "var(--border-primary)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl select-none shrink-0">{sc.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                          {sc.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0">
                          {sc.tag}
                        </span>
                      </div>
                      <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                        {sc.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {active ? (
                      <div className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-xs">
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-purple-500/20 flex items-center justify-center transition-colors">
                        <Play className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 ml-0.5" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[9px] text-center opacity-60 font-mono" style={{ color: "var(--text-muted)" }}>
            Generado en tiempo real sin pausas ni descargas
          </p>
        </div>
      )}
    </div>
  );
}
