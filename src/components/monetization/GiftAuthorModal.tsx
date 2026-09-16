"use client";

import React, { useState } from "react";
import {
  X,
  Coins,
  Sparkles,
  Send,
  Heart,
  Plus,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { FicImage } from "@/components/ui/FicImage";

export interface GiftOption {
  id: string;
  name: string;
  coins: number;
  usd: number;
  icon: string;
  tag: string;
  gradient: string;
  borderGlow: string;
}

export const VIRTUAL_GIFTS: GiftOption[] = [
  {
    id: "coffee",
    name: "Café de Autor",
    coins: 25,
    usd: 0.25,
    icon: "☕",
    tag: "Impulso",
    gradient: "from-amber-600/20 to-yellow-600/10",
    borderGlow: "hover:border-amber-500/50",
  },
  {
    id: "quill",
    name: "Pluma Dorada",
    coins: 100,
    usd: 1.00,
    icon: "✒️",
    tag: "Popular",
    gradient: "from-yellow-500/20 to-amber-500/10",
    borderGlow: "hover:border-yellow-500/50",
  },
  {
    id: "grimoire",
    name: "Grimorio Arcano",
    coins: 250,
    usd: 2.50,
    icon: "📖",
    tag: "Mágico",
    gradient: "from-purple-600/20 to-indigo-600/10",
    borderGlow: "hover:border-purple-500/50",
  },
  {
    id: "crown",
    name: "Corona Cósmica",
    coins: 500,
    usd: 5.00,
    icon: "👑",
    tag: "Gran Apoyo",
    gradient: "from-amber-500/20 to-rose-500/10",
    borderGlow: "hover:border-rose-500/50",
  },
  {
    id: "diamond",
    name: "Diamante Supremo",
    coins: 1000,
    usd: 10.00,
    icon: "💎",
    tag: "Mecenas VIP",
    gradient: "from-cyan-500/20 to-blue-600/10",
    borderGlow: "hover:border-cyan-500/50",
  },
];

interface GiftAuthorModalProps {
  isOpen: boolean;
  onClose: () => void;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  storyId?: string;
  storyTitle?: string;
  onOpenRecharge?: () => void;
}

export function GiftAuthorModal({
  isOpen,
  onClose,
  author,
  storyId,
  storyTitle,
  onOpenRecharge,
}: GiftAuthorModalProps) {
  const { user, sendTip } = useAuth();
  const [selectedGift, setSelectedGift] = useState<GiftOption>(VIRTUAL_GIFTS[1]); // Pluma Dorada por defecto
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [dedicationMessage, setDedicationMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [successResult, setSuccessResult] = useState<{ amount: number; giftName: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCoins = user?.coins ?? 0;
  const targetAmount = isCustomMode ? Number(customAmount) || 0 : selectedGift.coins;
  const hasEnoughCoins = currentCoins >= targetAmount && targetAmount > 0;
  const isSelfDonation = user?.id && user.id === author.id;

  const handleSendGift = async () => {
    if (!user) {
      setErrorMessage("Debes iniciar sesión para apoyar al autor.");
      return;
    }
    if (isSelfDonation) {
      setErrorMessage("No puedes enviarte donaciones a ti mismo.");
      return;
    }
    if (targetAmount <= 0) {
      setErrorMessage("Por favor selecciona o ingresa una cantidad válida de FicCoins.");
      return;
    }
    if (!hasEnoughCoins) {
      setErrorMessage("No tienes suficientes FicCoins. La compra y recarga de monedas está actualmente en fase de planeación.");
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const giftName = isCustomMode ? `Donación de ${targetAmount} FicCoins` : selectedGift.name;
      const giftIcon = isCustomMode ? "🪙" : selectedGift.icon;

      const res = await sendTip(
        author.id,
        targetAmount,
        giftName,
        giftIcon,
        dedicationMessage.trim(),
        storyId,
        storyTitle
      );

      if (res.success) {
        setSuccessResult({
          amount: targetAmount,
          giftName: giftName,
        });
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Ocurrió un error al procesar el regalo. Inténtalo de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setSuccessResult(null);
    setErrorMessage(null);
    setDedicationMessage("");
    setIsCustomMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-scale">
      <div
        className="w-full max-w-lg rounded-3xl border fic-card shadow-2xl overflow-hidden relative"
        style={{ borderColor: "var(--border-primary)" }}
      >
        {/* Cabecera del Modal */}
        <div className="p-6 pb-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border-primary)" }}>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl border flex items-center justify-center shadow-sm"
              style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
            >
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500/30" />
            </div>
            <div>
              <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                Enviar Regalo al Autor
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Apoya la dedicación y creatividad de <strong style={{ color: "var(--text-primary)" }}>{author.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl border fic-card-secondary hover:scale-105 transition-all cursor-pointer"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Pantalla de Éxito */}
        {successResult ? (
          <div className="p-8 text-center space-y-5">
            <div className="h-20 w-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xl animate-bounce">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                ¡Regalo Entregado con Éxito!
              </span>
              <h3 className="text-xl sm:text-2xl font-black pt-2" style={{ color: "var(--text-primary)" }}>
                Has enviado {successResult.giftName}
              </h3>
              <p className="text-xs sm:text-sm max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
                {author.name} ha recibido tu donación de <strong>{successResult.amount} FicCoins</strong> ($
                {(successResult.amount / 100).toFixed(2)} USD) en su saldo de creador retirable.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="px-8 py-3 rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-all cursor-pointer fic-btn-primary"
            >
              Cerrar y Continuar
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Cartel Informativo: Sistema Monetario en Planeación */}
            <div className="p-3.5 rounded-2xl border bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300 flex items-start gap-2.5 text-[11px] leading-relaxed">
              <span className="text-sm">🚧</span>
              <div>
                <strong className="block font-bold">Sistema Monetario en Planeación</strong>
                <span style={{ color: "var(--text-secondary)" }}>
                  La compra y recarga oficial de FicCoins está actualmente en fase de desarrollo. Próximamente podrás adquirir monedas para enviar regalos.
                </span>
              </div>
            </div>

            {/* Tarjeta del Autor Destinatario */}
            <div
              className="p-3.5 rounded-2xl border fic-card-secondary flex items-center justify-between gap-3"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 rounded-2xl overflow-hidden border shrink-0" style={{ borderColor: "var(--border-primary)" }}>
                  <FicImage
                    src={author.avatar || "/default-avatar.svg"}
                    alt={author.name}
                    fallbackType="avatar"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{author.name}</h4>
                  <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>@{author.username}</p>
                </div>
              </div>

              {/* Saldo Actual del Usuario */}
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Tus FicCoins</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="font-mono font-black text-sm" style={{ color: "var(--text-primary)" }}>
                    {currentCoins.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de Regalos Virtuales */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                  Selecciona tu Regalo
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  className="text-[11px] font-bold text-amber-500 hover:underline cursor-pointer"
                >
                  {isCustomMode ? "Ver regalos predeterminados" : "Ingresar cantidad personalizada"}
                </button>
              </div>

              {isCustomMode ? (
                <div className="space-y-2 p-4 rounded-2xl border fic-card-secondary" style={{ borderColor: "var(--border-primary)" }}>
                  <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                    Cantidad de FicCoins a donar (100 FicCoins = $1.00 USD para el autor):
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="10"
                        max="50000"
                        step="10"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Ej. 150"
                        className="w-full rounded-xl border fic-input px-4 py-2.5 text-sm font-mono font-bold focus:outline-none"
                      />
                      <Coins className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-2 rounded-xl border fic-card" style={{ borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                      ≈ ${((Number(customAmount) || 0) / 100).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {VIRTUAL_GIFTS.map((gift) => {
                    const isSelected = selectedGift.id === gift.id;
                    return (
                      <button
                        key={gift.id}
                        type="button"
                        onClick={() => setSelectedGift(gift)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                          isSelected
                            ? "border-amber-500 ring-2 ring-amber-500/30 shadow-md bg-gradient-to-b from-amber-500/15 to-transparent"
                            : `fic-card-secondary ${gift.borderGlow} hover:scale-[1.02]`
                        }`}
                        style={{ borderColor: isSelected ? undefined : "var(--border-primary)" }}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{gift.icon}</span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-black/20" style={{ color: "var(--text-badge)" }}>
                            {gift.tag}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{gift.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs font-mono font-black text-amber-500">{gift.coins}</span>
                            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                              (${gift.usd.toFixed(2)})
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mensaje de Dedicatoria Opcional */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                Mensaje de Apoyo (Opcional)
              </label>
              <textarea
                rows={2}
                maxLength={250}
                value={dedicationMessage}
                onChange={(e) => setDedicationMessage(e.target.value)}
                placeholder="¡Gran historia! Gracias por tu dedicación y talento..."
                className="w-full rounded-2xl border fic-input p-3 text-xs placeholder:opacity-40 focus:outline-none resize-none"
              />
            </div>

            {/* Mensaje de Error si no hay saldo o falla */}
            {errorMessage && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-medium flex items-center gap-2 animate-fade-in-scale">
                <span className="text-sm">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Disclaimer Legal */}
            <div className="p-3 rounded-xl border fic-card-secondary flex items-start gap-2 text-[10px] leading-relaxed" style={{ borderColor: "var(--border-primary)", color: "var(--text-muted)" }}>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Blindaje Legal:</strong> Las donaciones y regalos son reconocimientos voluntarios dirigidos al autor. No constituyen una compra comercial ni pago por acceso a obras con derechos de autor protegidos.
              </span>
            </div>

            {/* Botón de Enviar Regalo */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-full text-xs font-bold border fic-card-secondary hover:opacity-85 transition-all cursor-pointer"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSendGift}
                disabled={isSending || targetAmount <= 0}
                className="flex-2 py-3 rounded-full text-xs font-extrabold shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer fic-btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  Enviar Regalo ({targetAmount.toLocaleString()} FicCoins)
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
