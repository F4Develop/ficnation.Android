"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Heart,
  Sparkles,
  Shield,
  X,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export function Footer() {
  const { t } = useSettings();
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [activeRuleTab, setActiveRuleTab] = useState<"convivencia" | "contenido" | "autoria">("convivencia");

  return (
    <>
      <footer className="border-t fic-footer pt-14 pb-8 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          {/* ══════════════════ 1. COLUMNAS PRINCIPALES ══════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            
            {/* Columna 1: Marca y F4Studios */}
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl overflow-hidden shadow-sm group-hover:scale-105 transition-all shrink-0 border border-purple-500/20"
                  style={{ background: "#ffffff", boxShadow: "0 0 12px rgba(168, 85, 247, 0.25)" }}
                >
                  <img
                    src="/logo.jpg"
                    alt="FicNation Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-2xl font-black tracking-tight flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                  Fic<span className="font-black" style={{ color: "var(--logo-text-accent)" }}>Nation</span>
                  <Sparkles className="h-4 w-4 animate-pulse" style={{ color: "var(--logo-sparkle)" }} />
                </span>
              </Link>

              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {t("footer.brandDesc")}
              </p>

              {/* Badge Oficial F4Studios */}
              <div
                className="inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 border"
                style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}
              >
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                <p className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {t("footer.createdBy")} <span className="font-extrabold" style={{ color: "var(--text-primary)" }}>F4Studios</span>
                </p>
              </div>
            </div>

            {/* Columna 2: Navegación & Plataforma */}
            <div className="space-y-3.5 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Compass className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                <span>{t("footer.exploration")}</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/explorar" className="hover:opacity-80 transition-opacity flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                    <span>{t("footer.catalog")}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/escribir" className="hover:opacity-80 transition-opacity flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                    <span>{t("footer.writingWorkshop")}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/biblioteca" className="hover:opacity-80 transition-opacity flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                    <span>{t("footer.myLibrary")}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:opacity-80 transition-opacity flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                    <span>{t("footer.authorDashboard")}</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 3: Reglas y Directrices */}
            <div className="space-y-3.5 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Shield className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                <span>{t("footer.rules")}</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    onClick={() => {
                      setActiveRuleTab("convivencia");
                      setIsRulesOpen(true);
                    }}
                    className="hover:opacity-80 transition-opacity text-left flex items-center gap-1.5 cursor-pointer"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <CheckCircle2 className="w-3 h-3" style={{ color: "var(--text-badge)" }} />
                    <span>{t("footer.communityRules")}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveRuleTab("contenido");
                      setIsRulesOpen(true);
                    }}
                    className="hover:opacity-80 transition-opacity text-left flex items-center gap-1.5 cursor-pointer"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <CheckCircle2 className="w-3 h-3" style={{ color: "var(--text-badge)" }} />
                    <span>{t("footer.publishingGuidelines")}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveRuleTab("autoria");
                      setIsRulesOpen(true);
                    }}
                    className="hover:opacity-80 transition-opacity text-left flex items-center gap-1.5 cursor-pointer"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <CheckCircle2 className="w-3 h-3" style={{ color: "var(--text-badge)" }} />
                    <span>{t("footer.rightsAndOriginality")}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Columna 4: Contáctanos & Redes Sociales */}
            <div className="space-y-3.5 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t("footer.contactUs")}</span>
              </h4>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("footer.contactDesc")}
              </p>

              {/* Botones de Redes Sociales */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                
                {/* WhatsApp */}
                <a
                  href="https://wa.me/584221454748"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border px-3.5 py-2 transition-all shadow-xs group cursor-pointer hover:scale-105"
                  style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)", color: "#10b981" }}
                  title="WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.71 4.3 3.8 2.52 1.09 2.52.73 2.98.69.45-.04 1.47-.6 1.68-1.18.21-.59.21-1.09.15-1.19-.06-.11-.23-.17-.48-.3" />
                  </svg>
                  <span className="font-bold text-[11px]">WhatsApp</span>
                </a>


                {/* X (Twitter) */}
                <a
                  href="https://x.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border px-3.5 py-2 transition-all shadow-xs group cursor-pointer hover:scale-105"
                  style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                  title="X"
                >
                  <svg className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="font-bold text-[11px]">X</span>
                </a>

              </div>
            </div>

          </div>

          {/* ══════════════════ 2. BARRA DE COPYRIGHT Y AUTORÍA ══════════════════ */}
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left" style={{ borderColor: "var(--border-primary)", color: "var(--text-muted)" }}>
            <div className="space-y-1">
              <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
                © {new Date().getFullYear()} <span className="font-bold" style={{ color: "var(--text-primary)" }}>FicNation</span>. {t("footer.developedBy")} <span className="font-bold" style={{ color: "var(--text-badge)" }}>F4Studios</span>.
              </p>
              <p className="text-[11px]">
                {t("footer.allRightsReserved")}
              </p>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
              <span>{t("footer.madeWithHeart")}</span>
              <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 animate-pulse" />
              <span>{t("footer.andDigitalInk")}</span>
            </p>
          </div>

        </div>
      </footer>

      {/* ══════════════════ 3. MODAL DE REGLAS DE LA COMUNIDAD ══════════════════ */}
      {isRulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-2xl rounded-3xl border fic-card p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
          >
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border-primary)" }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-xs fic-btn-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>Reglas & Normas de FicNation</h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Garantizando una comunidad segura, creativa y respetuosa</p>
                </div>
              </div>

              <button
                onClick={() => setIsRulesOpen(false)}
                className="p-2 rounded-xl transition-colors cursor-pointer hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas de Reglas */}
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border-primary)" }}>
              <button
                onClick={() => setActiveRuleTab("convivencia")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeRuleTab === "convivencia"
                    ? "fic-btn-primary shadow-xs"
                    : "hover:opacity-80"
                }`}
                style={activeRuleTab !== "convivencia" ? { color: "var(--text-muted)" } : {}}
              >
                🤝 Convivencia
              </button>
              <button
                onClick={() => setActiveRuleTab("contenido")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeRuleTab === "contenido"
                    ? "fic-btn-primary shadow-xs"
                    : "hover:opacity-80"
                }`}
                style={activeRuleTab !== "contenido" ? { color: "var(--text-muted)" } : {}}
              >
                📖 Contenido & Publicación
              </button>
              <button
                onClick={() => setActiveRuleTab("autoria")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeRuleTab === "autoria"
                    ? "fic-btn-primary shadow-xs"
                    : "hover:opacity-80"
                }`}
                style={activeRuleTab !== "autoria" ? { color: "var(--text-muted)" } : {}}
              >
                ⚖️ Autoría & F4Studios
              </button>
            </div>

            {/* Contenido de la Pestaña */}
            <div className="space-y-4 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              
              {activeRuleTab === "convivencia" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl border space-y-1 fic-card-secondary" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                    <h5 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>1. Respeto Mutuo</h5>
                    <p>
                      FicNation es un espacio para creadores y lectores. No se tolerará acoso, discriminación, insultos ni conductas tóxicas en comentarios o reseñas.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl border space-y-1 fic-card-secondary" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                    <h5 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>2. Críticas Constructivas</h5>
                    <p>
                      Alentamos las opiniones honestas que ayuden a los autores a mejorar su narrativa, siempre desde el respeto y la empatía por el trabajo creativo ajeno.
                    </p>
                  </div>
                </div>
              )}

              {activeRuleTab === "contenido" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl border space-y-1 fic-card-secondary" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                    <h5 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>1. Etiquetado Correcto</h5>
                    <p>
                      Las historias que contengan temáticas maduras, violencia explícita o contenido sensible deben incluir las etiquetas correspondientes para orientar adecuadamente a los lectores.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl border space-y-1 fic-card-secondary" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                    <h5 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>2. Prohibición de Contenido Ilegal</h5>
                    <p>
                      Queda estrictamente prohibida la publicación de cualquier contenido que vulnere leyes reales o promueva actos dañinos.
                    </p>
                  </div>
                </div>
              )}

              {activeRuleTab === "autoria" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl border space-y-1 fic-card-secondary" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                    <h5 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>1. Derechos de los Autores</h5>
                    <p>
                      Cada escritor conserva la autoría total de sus historias y creaciones originales. Está prohibido el plagio o la copia no autorizada de manuscritos ajenos.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl border space-y-1 fic-card-secondary" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                    <h5 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>2. Proyecto F4Studios</h5>
                    <p>
                      FicNation es una plataforma desarrollada y mantenida por <strong>F4Studios</strong> para fomentar el talento literario y el entretenimiento digital libre.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer del Modal */}
            <div className="pt-3 border-t flex justify-end" style={{ borderColor: "var(--border-primary)" }}>
              <button
                onClick={() => setIsRulesOpen(false)}
                className="rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-md hover:scale-105 transition-all cursor-pointer fic-btn-primary"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
