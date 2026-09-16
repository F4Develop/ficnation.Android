"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onSearchClick?: () => void;
  rightAction?: React.ReactNode;
}

export function MobileHeader({
  title,
  showBack,
  onBack,
  onHomeClick,
  onProfileClick,
  rightAction,
}: MobileHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f19]/90 backdrop-blur-xl border-b border-purple-500/15 pt-safe select-none shadow-sm">
      <div className="px-4 h-14 flex items-center justify-between">
      {/* Lado izquierdo: Botón Atrás o Título Solo Texto FicNation (Sin logo cuadrado) */}
      <div className="flex items-center gap-2.5">
        {showBack ? (
          <>
            <button
              onClick={onBack || (() => window.history.back())}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
              aria-label="Volver"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            {title && (
              <span className="text-base font-bold text-white truncate max-w-[190px] ml-1">
                {title}
              </span>
            )}
          </>
        ) : title ? (
          <span className="text-lg font-black text-white tracking-tight">
            {title}
          </span>
        ) : (
          <button
            onClick={onHomeClick || (() => router.push("/dashboard"))}
            className="flex items-center gap-1.5 active:scale-95 transition-transform text-left"
          >
            <span className="text-xl font-black tracking-tight text-white">
              Fic<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Nation</span>
            </span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          </button>
        )}
      </div>

      {/* Lado derecho: Botón con la Imagen de Perfil que lleva a /perfil */}
      <div className="flex items-center gap-2">
        {rightAction ? (
          rightAction
        ) : (
          <button
            onClick={onProfileClick || (() => router.push("/perfil"))}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500/35 hover:border-purple-400 bg-purple-950/40 p-0.5 shadow-md shadow-purple-900/30 active:scale-90 transition-all flex items-center justify-center shrink-0"
            aria-label="Mi Perfil"
            title="Ir a mi perfil"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || user.username || "Perfil"}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                {user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  </header>
  );
}
