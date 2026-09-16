"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Check,
  Copy,
  AlertTriangle,
  Wand2,
  Palette,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  submitCommunitySuggestion,
  OFFICIAL_SUPPORT_EMAIL,
  type SuggestionCategory,
} from "@/lib/suggestions";

const CATEGORIES: { id: SuggestionCategory; label: string; icon: React.ElementType }[] = [
  { id: "feature", label: "Nueva Función", icon: Sparkles },
  { id: "editor", label: "Editor & Fics", icon: Wand2 },
  { id: "design", label: "Diseño & UI", icon: Palette },
  { id: "bug", label: "Reporte de Error", icon: AlertTriangle },
  { id: "general", label: "Opinión General", icon: MessageSquare },
];

export function SuggestionsCard() {
  const { user, addXp } = useAuth();

  const [category, setCategory] = useState<SuggestionCategory>("feature");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(OFFICIAL_SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);

    try {
      await submitCommunitySuggestion({
        userId: user?.id,
        userName: user?.name || "Usuario de FicNation",
        userEmail: user?.email || "",
        category,
        subject: subject.trim(),
        message: message.trim(),
      });

      // Otorgar XP al usuario
      addXp(20, "Sugerencia enviada");

      setIsSuccess(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative rounded-3xl border fic-card p-5 sm:p-6 shadow-sm overflow-hidden"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
    >
      <div className="space-y-4">
        
        {/* Encabezado Compacto */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5" style={{ borderColor: "var(--border-primary)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-xs shrink-0 border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
              <Mail className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Buzón de Sugerencias & Feedback
                </h3>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold border text-amber-500 bg-amber-500/10"
                  style={{ borderColor: "rgba(245, 158, 11, 0.3)" }}
                >
                  +20 XP
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Envía tus ideas, peticiones o mejoras directamente al equipo oficial.
              </p>
            </div>
          </div>

          {/* Botón rápido para copiar email de soporte */}
          <button
            type="button"
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-mono transition-all self-start sm:self-auto cursor-pointer fic-card-secondary hover:scale-105"
            style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}
            title="Copiar correo oficial de soporte"
          >
            <span style={{ color: "var(--text-muted)" }}>{OFFICIAL_SUPPORT_EMAIL}</span>
            {copiedEmail ? (
              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
            ) : (
              <Copy className="w-3 h-3 opacity-60 shrink-0" style={{ color: "var(--text-badge)" }} />
            )}
          </button>
        </div>

        {/* Mensaje de Éxito Compacto */}
        {isSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs text-emerald-600 dark:text-emerald-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>¡Sugerencia registrada con éxito! Ganaste <strong>+20 XP</strong>.</span>
            </div>
            <button
              onClick={() => setIsSuccess(false)}
              className="text-emerald-500 hover:opacity-75 font-bold text-xs cursor-pointer px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Formulario Compacto */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* Pills de Categoría Compactas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-wrap">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
                    isSelected
                      ? "fic-btn-primary shadow-xs scale-105 text-white"
                      : "fic-card-secondary opacity-75 hover:opacity-100"
                  }`}
                  style={!isSelected ? { background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Fila con Asunto y Detalles */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            
            {/* Input Asunto */}
            <div className="md:col-span-5">
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Título o idea (ej: Modo oscuro para leer, música...)"
                className="w-full h-full min-h-[42px] rounded-2xl border fic-input px-3.5 py-2.5 text-xs font-medium placeholder:opacity-40 focus:outline-none transition-all"
                style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Textarea Mensaje */}
            <div className="md:col-span-7">
              <textarea
                rows={2}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Cuéntanos brevemente los detalles de tu idea o sugerencia..."
                className="w-full rounded-2xl border fic-input px-3.5 py-2 text-xs placeholder:opacity-40 focus:outline-none resize-none leading-relaxed transition-all"
                style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
              />
            </div>

          </div>

          {/* Barra Inferior: Remitente Automático + Botón de Envío */}
          <div className="flex items-center justify-between gap-3 pt-1 text-xs">
            <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
              Enviando como <strong style={{ color: "var(--text-primary)" }}>{user?.name || "Lector Anónimo"}</strong>
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !message.trim()}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold shadow-sm hover:scale-105 transition-all disabled:opacity-50 cursor-pointer fic-btn-primary text-white shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Sugerencia</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
