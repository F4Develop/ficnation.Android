"use client";

import React, { useState, useRef } from "react";
import { Sparkle, X, UploadCloud, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadToImgBB } from "@/lib/imgbb";
import type { UserProfile } from "@/context/AuthContext";

export const BANNER_PRESETS = [
  { name: "Nebulosa Púrpura", value: "from-purple-950 via-indigo-950 to-[#080511]" },
  { name: "Eclipse Neón", value: "from-fuchsia-950 via-purple-900 to-black" },
  { name: "Abismo Cósmico", value: "from-slate-950 via-purple-950 to-indigo-950" },
  { name: "Fuego Violeta", value: "from-purple-900 via-rose-950 to-zinc-950" },
  { name: "Ciberpunk Dark", value: "from-indigo-950 via-fuchsia-950 to-purple-950" },
];

interface BannerModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function BannerModal({ user, isOpen, onClose, onSuccess }: BannerModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const url = await uploadToImgBB(file);
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ banner_url: url, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      await onSuccess();
      onClose();
    } catch {
      // Ignorar o loguear
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelectPreset = async (presetValue: string) => {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ banner_url: presetValue, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    await onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-scale">
      <div
        className="w-full max-w-md rounded-3xl border fic-card p-6 shadow-2xl space-y-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
      >
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.gif"
          className="hidden"
          onChange={handleUploadBanner}
        />

        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
          <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Sparkle className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
            Personalizar Portada
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:opacity-100 opacity-60 cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subida personalizada a ImgBB */}
        <div className="p-4 rounded-2xl border fic-card-secondary space-y-2">
          <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <UploadCloud className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
            Subir Portada o GIF a ImgBB
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Elige cualquier imagen o GIF panorámico desde tu computadora.
          </p>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full mt-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 cursor-pointer fic-btn-primary text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Subiendo a ImgBB...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Seleccionar Archivo</span>
              </>
            )}
          </button>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>O elige un tema predeterminado:</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {BANNER_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset.value)}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  user.bannerUrl === preset.value
                    ? "border-blue-500 dark:border-fuchsia-500 fic-card-secondary shadow-md ring-2 ring-blue-500/20"
                    : "fic-card-secondary hover:scale-[1.01]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-r ${preset.value} border shadow-inner`} style={{ borderColor: "var(--border-primary)" }} />
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{preset.name}</span>
                </div>
                {user.bannerUrl === preset.value && (
                  <Check className="w-4 h-4 text-blue-500 dark:text-fuchsia-400" />
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
