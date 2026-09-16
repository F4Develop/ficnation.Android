"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, User, Check, X, Edit3, HelpCircle } from "lucide-react";

interface ReaderInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  storyTitle: string;
  initialName?: string;
  onSaveName: (name: string, lastName?: string) => void;
}

// Claves de almacenamiento por historia
export function getStoredReaderName(storyId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      localStorage.getItem(`ficnation_tn_name_${storyId}`) ||
      localStorage.getItem("ficnation_global_tn_name") ||
      ""
    );
  } catch {
    return "";
  }
}

export function getStoredReaderLastName(storyId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      localStorage.getItem(`ficnation_tn_lastname_${storyId}`) ||
      localStorage.getItem("ficnation_global_tn_lastname") ||
      ""
    );
  } catch {
    return "";
  }
}

export function saveStoredReaderName(storyId: string, name: string, lastName: string = "") {
  if (typeof window === "undefined") return;
  try {
    if (name.trim()) {
      localStorage.setItem(`ficnation_tn_name_${storyId}`, name.trim());
      localStorage.setItem("ficnation_global_tn_name", name.trim());
    }
    if (lastName.trim()) {
      localStorage.setItem(`ficnation_tn_lastname_${storyId}`, lastName.trim());
      localStorage.setItem("ficnation_global_tn_lastname", lastName.trim());
    }
    window.dispatchEvent(
      new CustomEvent("ficnation_tn_updated", {
        detail: { storyId, name: name.trim(), lastName: lastName.trim() },
      })
    );
  } catch {}
}

/**
 * Reemplaza comandos de T/N y variantes en el texto por el nombre limpio del lector sin efectos ni etiquetas HTML.
 */
export function replaceTnCommands(
  text: string,
  readerName: string,
  readerLastName: string = ""
): string {
  if (!text) return "";
  const nameToUse = readerName.trim() || "T/N";
  const lastNameToUse = readerLastName.trim() || "T/A";

  let replaced = text;

  // 1. Reemplazo de Nombre Completo: T/N T/A o [T/N] [T/A]
  replaced = replaced.replace(
    /\[?(?:T\/N|t\/n|TN|tn|Y\/N|y\/n|YN|yn)\]?\s+\[?(?:T\/A|t\/a|TA|ta|Y\/A|y\/a|YA|ya)\]?/gi,
    `${nameToUse} ${lastNameToUse}`
  );

  // 2. Reemplazo de Nombre Principal con corchetes o paréntesis: [T/N], (T/N), [y/n], etc.
  replaced = replaced.replace(
    /\[(?:T\/N|t\/n|TN|tn|Y\/N|y\/n|YN|yn)\]|\((?:T\/N|t\/n|TN|tn|Y\/N|y\/n|YN|yn)\)/gi,
    nameToUse
  );

  // 3. Variantes con barra como palabra completa: T/N, t/n, Y/N, y/n
  replaced = replaced.replace(/\b(?:T\/N|t\/n|Y\/N|y\/n)\b/gi, nameToUse);

  // 4. Variantes continuas como palabra completa: TN, tn, Tn, YN, yn
  replaced = replaced.replace(/\b(?:TN|tn|Tn|YN|yn|Yn)\b/g, nameToUse);

  // 5. Reemplazo de Apellido (T/A, t/a, Y/A, y/a)
  replaced = replaced.replace(
    /\[(?:T\/A|t\/a|TA|ta|Y\/A|y\/a|YA|ya)\]|\((?:T\/A|t\/a|TA|ta|Y\/A|y\/a|YA|ya)\)/gi,
    lastNameToUse
  );
  replaced = replaced.replace(/\b(?:T\/A|t\/a|Y\/A|y\/a)\b/gi, lastNameToUse);

  return replaced;
}

export function ReaderInsertModal({
  isOpen,
  onClose,
  storyId,
  storyTitle,
  initialName = "",
  onSaveName,
}: ReaderInsertModalProps) {
  const [name, setName] = useState(initialName);
  const [lastName, setLastName] = useState("");
  const [showLastName, setShowLastName] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedName = getStoredReaderName(storyId);
      const storedLastName = getStoredReaderLastName(storyId);
      setName(storedName || initialName || "");
      setLastName(storedLastName || "");
      if (storedLastName) setShowLastName(true);
    }
  }, [isOpen, storyId, initialName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || "T/N";
    const finalLastName = lastName.trim();
    saveStoredReaderName(storyId, finalName, finalLastName);
    onSaveName(finalName, finalLastName);
    onClose();
  };

  const handleUseDefault = () => {
    saveStoredReaderName(storyId, "T/N", "T/A");
    onSaveName("T/N", "T/A");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl border fic-card p-6 shadow-2xl relative overflow-hidden animate-fade-in-scale"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-primary)",
          color: "var(--text-primary)",
        }}
      >
        {/* Glow decorativo de fondo */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 relative z-10 pb-4 border-b" style={{ borderColor: "var(--border-primary)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-purple-400">
                Protagonista Interactivo
              </span>
              <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                ¡Tú eres el Protagonista!
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explicación */}
        <div className="py-4 space-y-2 relative z-10 text-xs" style={{ color: "var(--text-secondary)" }}>
          <p className="leading-relaxed">
            Esta historia tiene como personaje principal al lector (<strong>T/N</strong>). Introduce el nombre con el que deseas que los personajes se dirijan a ti.
          </p>
          <div className="p-3 rounded-2xl border text-[11px] font-mono fic-card-secondary" style={{ borderColor: "var(--border-primary)" }}>
            <span className="text-purple-400 font-bold">Vista previa:</span> &quot;¡Hola, <span className="text-purple-300 font-bold underline">{name.trim() || "T/N"}</span>! Te estábamos esperando.&quot;
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span>Tu Nombre de Protagonista (T/N):</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Maikol, Alex, Ren, Maya..."
              className="w-full rounded-2xl border fic-input px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-inner"
              maxLength={30}
            />
          </div>

          {/* Opción para agregar Apellido (T/A) */}
          {showLastName ? (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                Apellido Opcional (T/A):
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. Sterling, Rivera, Ackerman..."
                className="w-full rounded-2xl border fic-input px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-inner"
                maxLength={30}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLastName(true)}
              className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors font-medium flex items-center gap-1"
            >
              <span>+ Agregar apellido de protagonista (T/A)</span>
            </button>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleUseDefault}
              className="flex-1 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all hover:bg-white/5 text-zinc-400 hover:text-white text-center"
              style={{ borderColor: "var(--border-primary)" }}
            >
              Mantener &quot;T/N&quot;
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-extrabold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg fic-btn-primary"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar y Leer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Botón en el header del lector para cambiar el nombre T/N en cualquier momento
 */
export function ReaderInsertHeaderButton({
  storyId,
  currentName,
  onClick,
}: {
  storyId: string;
  currentName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 fic-card-secondary shadow-xs"
      style={{ borderColor: "var(--border-primary)" }}
      title="Personalizar tu nombre de protagonista en este fanfic (T/N)"
    >
      <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
      <span className="hidden sm:inline" style={{ color: "var(--text-muted)" }}>Protagonista:</span>
      <span className="text-purple-400 max-w-[90px] truncate">{currentName || "T/N"}</span>
      <Edit3 className="w-2.5 h-2.5 text-zinc-400 ml-0.5" />
    </button>
  );
}
