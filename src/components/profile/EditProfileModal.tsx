"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Edit3,
  X,
  Check,
  UploadCloud,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadToImgBB } from "@/lib/imgbb";
import type { UserProfile } from "@/context/AuthContext";

export const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
];

interface EditProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function EditProfileModal({ user, isOpen, onClose, onSuccess }: EditProfileModalProps) {
  const [name, setName] = useState(user.name || "");
  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatar, setAvatar] = useState(user.avatar || AVATAR_PRESETS[0]);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatus(null);

    try {
      const url = await uploadToImgBB(file);
      setAvatar(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir la imagen a ImgBB";
      setStatus({ type: "error", text: msg });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      setStatus({ type: "error", text: "El nombre y el nombre de usuario son obligatorios." });
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const supabase = createClient();
      const sanitizedUsername = username.trim().toLowerCase().replace(/\s+/g, "_");

      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          username: sanitizedUsername,
          bio: bio.trim(),
          avatar_url: avatar.trim() || AVATAR_PRESETS[0],
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") {
          setStatus({ type: "error", text: "Ese nombre de usuario ya está en uso. Por favor elige otro." });
        } else {
          setStatus({ type: "error", text: error.message });
        }
        setIsSaving(false);
        return;
      }

      await onSuccess();
      setStatus({ type: "success", text: "¡Perfil actualizado con éxito!" });
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 700);
    } catch {
      setStatus({ type: "error", text: "Error al guardar los cambios." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-scale">
      <div
        className="w-full max-w-lg rounded-3xl border fic-card p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
      >
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.gif"
          className="hidden"
          onChange={handleFileUpload}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full border fic-card-secondary transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
        </button>

        <div className="space-y-1 pb-4 border-b" style={{ borderColor: "var(--border-primary)" }}>
          <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Edit3 className="w-5 h-5" style={{ color: "var(--text-badge)" }} />
            Editar Perfil
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Personaliza tu información pública, foto y descripción
          </p>
        </div>

        {status && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              status.type === "error"
                ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-200"
                : "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-200"
            }`}
          >
            {status.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          
          {/* Avatar Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
              <span>Foto de Perfil o GIF (ImgBB)</span>
              {isUploading && (
                <span className="flex items-center gap-1" style={{ color: "var(--text-badge)" }}>
                  <Loader2 className="w-3 h-3 animate-spin" /> Subiendo...
                </span>
              )}
            </label>
            
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 shrink-0" style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all fic-card-secondary hover:scale-[1.01] cursor-pointer"
                style={{ color: "var(--text-primary)" }}
              >
                <UploadCloud className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                <span>Subir Imagen o GIF</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(preset)}
                  className={`relative h-10 w-10 rounded-xl overflow-hidden shrink-0 transition-transform cursor-pointer ${
                    avatar === preset
                      ? "ring-2 ring-blue-500 dark:ring-fuchsia-500 scale-105"
                      : "opacity-70 hover:opacity-100 border"
                  }`}
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <input
              type="url"
              placeholder="O escribe una URL directa de imagen/GIF..."
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full rounded-xl border fic-input py-2 px-3 text-xs placeholder:opacity-40 focus:outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Nombre / Nickname */}
          <div className="space-y-1">
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              Nombre Completo / Nickname
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border fic-input py-2 px-3 text-sm placeholder:opacity-40 focus:outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
              placeholder="ej. Alexander Raven"
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              Nombre de usuario (@)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border fic-input py-2 pl-7 pr-3 text-sm placeholder:opacity-40 focus:outline-none font-mono"
                style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
                placeholder="usuario"
              />
            </div>
          </div>

          {/* Biografía */}
          <div className="space-y-1">
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              Descripción / Biografía
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border fic-input py-2 px-3 text-xs placeholder:opacity-40 focus:outline-none resize-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
              placeholder="Escribe algo sobre ti, tus géneros favoritos o tus historias..."
            />
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: "var(--border-primary)" }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2 text-xs font-semibold fic-card-secondary hover:opacity-80 cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="rounded-full px-6 py-2 text-xs font-bold shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer fic-btn-primary text-white"
            >
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
