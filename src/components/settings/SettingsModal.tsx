"use client";

import React, { useState } from "react";
import {
  Zap,
  Sparkles,
  X,
  Gauge,
  Check,
  RefreshCw,
  Sliders,
  Globe,
  BookOpen,
  Shield,
  Eye,
  Type,
  Users,
  CheckCircle2,
  Palette,
  Sun,
  Moon,
} from "lucide-react";
import { useSettings, type AppTheme } from "@/context/SettingsContext";

const THEMES_LIST: {
  id: AppTheme;
  name: string;
  desc: string;
  previewColors: string[];
  tag: string;
  icon: string;
  disabled?: boolean;
}[] = [
  {
    id: "dark",
    name: "Noche Cósmica (Oscuro)",
    desc: "La identidad predeterminada de FicNation: atmósfera elegante, contraste cósmico y acentos violeta/fucsia.",
    previewColors: ["#080511", "#130a2a", "#9333ea", "#d946ef"],
    tag: "Predeterminado",
    icon: "🌌",
    disabled: false,
  },
  {
    id: "light",
    name: "Amanecer Radiante (Claro)",
    desc: "Superficies blancas inmaculadas, tipografía grafito de alta legibilidad y elegantes acentos azul zafiro (0% morado).",
    previewColors: ["#f1f5f9", "#ffffff", "#2563eb", "#0f172a"],
    tag: "Modo Claro",
    icon: "☀️",
    disabled: false,
  },
  {
    id: "sepia",
    name: "Papiro Imperial (Sepia)",
    desc: "Tonos pergamino cálidos, tinta café expreso y acentos ámbar dorado para máximo confort visual (0% morado).",
    previewColors: ["#f4ede2", "#fefcf7", "#d97706", "#291e14"],
    tag: "Lectura Cálida",
    icon: "📜",
    disabled: false,
  },
  {
    id: "neon",
    name: "Neón Ciberpunk (Synthwave)",
    desc: "Estética futurista con azul abisal profundo, cian láser fluorescente y acentos verde esmeralda (0% morado).",
    previewColors: ["#020914", "#08152b", "#06b6d4", "#10b981"],
    tag: "Futurista",
    icon: "⚡",
    disabled: false,
  },
  {
    id: "crimson",
    name: "Carmesí & Sangre (Gothic)",
    desc: "Atmósfera gótica profunda con resplandor rubí, sombras escarlata y elegantes acentos carmesí.",
    previewColors: ["#0a0206", "#1c0712", "#e11d48", "#f43f5e"],
    tag: "Gótico",
    icon: "🩸",
    disabled: false,
  },
  {
    id: "oled",
    name: "Carbono Puro (OLED)",
    desc: "Negro absoluto (#000000) de máxima pureza para ahorro de batería y contraste infinito.",
    previewColors: ["#000000", "#0e0e12", "#27272a", "#ffffff"],
    tag: "Ahorro Batería",
    icon: "🖤",
    disabled: false,
  },
];

export function SettingsModal() {
  const {
    isLowSpecMode,
    toggleLowSpecMode,
    reducedMotion,
    toggleReducedMotion,
    ambientEffects,
    toggleAmbientEffects,
    appTheme,
    setAppTheme,
    appLanguage,
    setAppLanguage,
    storyLanguage,
    setStoryLanguage,
    allowMatureContent,
    setAllowMatureContent,
    readerFontSize,
    setReaderFontSize,
    showOnlineStatus,
    setShowOnlineStatus,
    isSettingsOpen,
    closeSettings,
    clearLocalCache,
    t,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<"temas" | "rendimiento" | "idiomas" | "lectura" | "privacidad">("temas");

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in">
      
      {/* Contenedor del Modal */}
      <div
        className="relative w-full max-w-2xl rounded-3xl border fic-card p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
      >
        
        {/* ════════════ HEADER ════════════ */}
        <div className="flex items-center justify-between pb-4 border-b relative z-10 shrink-0" style={{ borderColor: "var(--border-primary)" }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-xs border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {t("settingsModal.title")}
              </h3>
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                {t("settingsModal.subtitle")}
              </p>
            </div>
          </div>

          <button
            onClick={closeSettings}
            className="p-2 rounded-xl transition-colors cursor-pointer hover:opacity-75"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ════════════ PESTAÑAS DE NAVEGACIÓN ════════════ */}
        <div className="flex items-center gap-1.5 border-b py-3 relative z-10 overflow-x-auto shrink-0" style={{ borderColor: "var(--border-primary)" }}>
          
          <button
            onClick={() => setActiveTab("temas")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "temas"
                ? "fic-btn-primary shadow-md text-white"
                : "hover:opacity-80"
            }`}
            style={activeTab !== "temas" ? { color: "var(--text-muted)" } : {}}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{t("settingsModal.tabThemes")}</span>
          </button>

          <button
            onClick={() => setActiveTab("rendimiento")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "rendimiento"
                ? "fic-btn-primary shadow-md text-white"
                : "hover:opacity-80"
            }`}
            style={activeTab !== "rendimiento" ? { color: "var(--text-muted)" } : {}}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t("settingsModal.tabPerformance")}</span>
          </button>

          <button
            onClick={() => setActiveTab("idiomas")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "idiomas"
                ? "fic-btn-primary shadow-md text-white"
                : "hover:opacity-80"
            }`}
            style={activeTab !== "idiomas" ? { color: "var(--text-muted)" } : {}}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t("settingsModal.tabLanguages")}</span>
          </button>

          <button
            onClick={() => setActiveTab("lectura")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "lectura"
                ? "fic-btn-primary shadow-md text-white"
                : "hover:opacity-80"
            }`}
            style={activeTab !== "lectura" ? { color: "var(--text-muted)" } : {}}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t("settingsModal.tabReading")}</span>
          </button>

          <button
            onClick={() => setActiveTab("privacidad")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "privacidad"
                ? "fic-btn-primary shadow-md text-white"
                : "hover:opacity-80"
            }`}
            style={activeTab !== "privacidad" ? { color: "var(--text-muted)" } : {}}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t("settingsModal.tabPrivacy")}</span>
          </button>
        </div>

        {/* ════════════ CUERPO DE OPCIONES ════════════ */}
        <div className="py-4 space-y-4 relative z-10 overflow-y-auto pr-1 flex-1 text-xs">
          
          {/* ══════ TAB 0: TEMAS VISUALES ══════ */}
          {activeTab === "temas" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Palette className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                  <span>{t("settingsModal.themeTitle")}</span>
                </h4>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("settingsModal.themeDesc")}
                </p>
              </div>

              {/* Banner informativo de temas activos */}
              <div className="p-3 rounded-2xl border flex items-center gap-2.5 text-xs fic-card-secondary" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                <Sparkles className="w-4 h-4 shrink-0" style={{ color: "var(--text-badge)" }} />
                <p className="leading-snug" style={{ color: "var(--text-secondary)" }}>
                  Están activos 4 temas perfeccionados: <strong>Noche Cósmica</strong>, <strong>Amanecer Radiante</strong>, <strong>Papiro Imperial (Sepia)</strong> y <strong>Neón Ciberpunk</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {THEMES_LIST.map((theme) => {
                  const isSelected = appTheme === theme.id;
                  const isDisabled = !!theme.disabled;

                  return (
                    <button
                      key={theme.id}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setAppTheme(theme.id)}
                      className={`relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all ${
                        isDisabled
                          ? "opacity-45 cursor-not-allowed select-none"
                          : isSelected
                          ? "shadow-md ring-2 ring-blue-500/40 cursor-pointer"
                          : "hover:scale-[1.01] cursor-pointer"
                      }`}
                      style={{
                        background: isSelected ? "var(--bg-card)" : "var(--bg-card-secondary)",
                        borderColor: isSelected ? "var(--border-hover)" : "var(--border-primary)",
                      }}
                    >
                      <div className="space-y-2">
                        {/* Header de la tarjeta de tema */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl select-none">{theme.icon}</span>
                            <span className="font-extrabold text-xs" style={{ color: isDisabled ? "var(--text-muted)" : "var(--text-primary)" }}>
                              {theme.name}
                            </span>
                          </div>

                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                            style={{
                              background: "var(--bg-subtle)",
                              borderColor: "var(--border-primary)",
                              color: "var(--text-badge)",
                            }}
                          >
                            {isDisabled ? "En desarrollo" : theme.tag}
                          </span>
                        </div>

                        {/* Descripción del tema */}
                        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          {theme.desc}
                        </p>
                      </div>

                      {/* Paleta de colores previa */}
                      <div className="flex items-center justify-between pt-3 mt-2 border-t" style={{ borderColor: "var(--border-primary)" }}>
                        <div className="flex items-center gap-1.5">
                          {theme.previewColors.map((col, idx) => (
                            <span
                              key={idx}
                              className={`h-4 w-4 rounded-full border border-black/10 dark:border-white/20 shadow-xs ${isDisabled ? "grayscale opacity-50" : ""}`}
                              style={{ backgroundColor: col }}
                            />
                          ))}
                        </div>

                        {isSelected && !isDisabled && (
                          <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--text-badge)" }}>
                            <Check className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </span>
                        )}

                        {isDisabled && (
                          <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--text-muted)" }}>
                            🔒 Desactivado
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════ TAB 1: RENDIMIENTO ══════ */}
          {activeTab === "rendimiento" && (
            <div className="space-y-3.5">
              
              {/* Modo Bajos Recursos */}
              <div
                className="p-4 rounded-2xl border transition-all"
                style={{
                  background: isLowSpecMode ? "var(--bg-subtle)" : "var(--bg-card-secondary)",
                  borderColor: isLowSpecMode ? "var(--border-hover)" : "var(--border-primary)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                      <h4 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                        {t("settingsModal.lowSpecTitle")}
                      </h4>
                      {isLowSpecMode && (
                        <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono" style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                          {t("settingsModal.lowSpecActive")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {t("settingsModal.lowSpecDesc")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={toggleLowSpecMode}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isLowSpecMode ? "bg-blue-600 dark:bg-purple-600" : "bg-slate-300 dark:bg-purple-900/60"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isLowSpecMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Animaciones Reducidas */}
              <div className="p-3.5 rounded-2xl border flex items-start justify-between gap-4" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                    <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{t("settingsModal.reducedMotionTitle")}</h4>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {t("settingsModal.reducedMotionDesc")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleReducedMotion}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    reducedMotion ? "bg-blue-600 dark:bg-fuchsia-600" : "bg-slate-300 dark:bg-purple-900/50"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      reducedMotion ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Luces y Nebulosas de Fondo */}
              <div className="p-3.5 rounded-2xl border flex items-start justify-between gap-4" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                    <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{t("settingsModal.ambientEffectsTitle")}</h4>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {t("settingsModal.ambientEffectsDesc")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleAmbientEffects}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    ambientEffects ? "bg-blue-600 dark:bg-fuchsia-600" : "bg-slate-300 dark:bg-purple-900/50"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      ambientEffects ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Limpieza de Caché */}
              <div className="pt-1">
                <button
                  onClick={clearLocalCache}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer fic-card-secondary hover:scale-[1.01]"
                  style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                >
                  <RefreshCw className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                  <span>{t("settingsModal.clearCacheButton")}</span>
                </button>
              </div>

            </div>
          )}

          {/* ══════ TAB 2: IDIOMAS & BÚSQUEDA ══════ */}
          {activeTab === "idiomas" && (
            <div className="space-y-4">
              
              {/* Idioma de la Plataforma */}
              <div className="p-4 rounded-2xl border space-y-3" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                    {t("settingsModal.interfaceLanguage")}
                  </h4>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("settingsModal.interfaceLanguageDesc")}
                </p>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {[
                    { id: "es", label: "Español", flag: "🇪🇸" },
                    { id: "en", label: "English", flag: "🇺🇸" },
                    { id: "pt", label: "Português", flag: "🇧🇷" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setAppLanguage(item.id as any)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        appLanguage === item.id
                          ? "fic-btn-primary shadow-md text-white"
                          : "fic-card hover:opacity-80"
                      }`}
                      style={appLanguage !== item.id ? { background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" } : {}}
                    >
                      <span>{item.flag}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Idioma Preferido de Historias */}
              <div className="p-4 rounded-2xl border space-y-3" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                    {t("settingsModal.storyLanguage")}
                  </h4>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("settingsModal.storyLanguageDesc")}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {[
                    { id: "all", label: t("settingsModal.allStories"), desc: t("settingsModal.allStoriesDesc") },
                    { id: "es", label: "Español", desc: "Español" },
                    { id: "en", label: "English", desc: "English" },
                    { id: "pt", label: "Português", desc: "Português" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setStoryLanguage(item.id as any)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        storyLanguage === item.id
                          ? "fic-btn-primary shadow-md text-white font-bold"
                          : "fic-card hover:opacity-80 font-medium"
                      }`}
                      style={storyLanguage !== item.id ? { background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" } : {}}
                    >
                      <span className="font-extrabold">{item.label}</span>
                      <span className="text-[10px] opacity-70">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ══════ TAB 3: LECTURA & FILTROS ══════ */}
          {activeTab === "lectura" && (
            <div className="space-y-4">
              
              {/* Filtro de Contenido Maduro */}
              <div className="p-4 rounded-2xl border flex items-start justify-between gap-4" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                    <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      {t("settingsModal.matureContentTitle")}
                    </h4>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {t("settingsModal.matureContentDesc")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAllowMatureContent(!allowMatureContent)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    allowMatureContent ? "bg-blue-600 dark:bg-fuchsia-600" : "bg-slate-300 dark:bg-purple-900/60"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      allowMatureContent ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Tamaño de Fuente Predeterminado */}
              <div className="p-4 rounded-2xl border space-y-3" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                    {t("settingsModal.readerFontSizeTitle")}
                  </h4>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("settingsModal.readerFontSizeDesc")}
                </p>

                <div className="grid grid-cols-4 gap-2.5 pt-1">
                  {[
                    { id: "sm", label: "Pequeño", size: "A-" },
                    { id: "base", label: "Normal", size: "A" },
                    { id: "lg", label: "Grande", size: "A+" },
                    { id: "xl", label: "Extra", size: "A++" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setReaderFontSize(item.id as any)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        readerFontSize === item.id
                          ? "fic-btn-primary shadow-md text-white font-bold"
                          : "fic-card hover:opacity-80"
                      }`}
                      style={readerFontSize !== item.id ? { background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" } : {}}
                    >
                      <span className="font-mono text-base font-bold">{item.size}</span>
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ══════ TAB 4: PRIVACIDAD & COMUNIDAD ══════ */}
          {activeTab === "privacidad" && (
            <div className="space-y-4">
              
              {/* Estado En Línea */}
              <div className="p-4 rounded-2xl border flex items-start justify-between gap-4" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      {t("settingsModal.onlineStatusTitle")}
                    </h4>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {t("settingsModal.onlineStatusDesc")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOnlineStatus(!showOnlineStatus)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showOnlineStatus ? "bg-emerald-500" : "bg-slate-300 dark:bg-purple-900/60"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      showOnlineStatus ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Información de Respaldo F4Studios */}
              <div className="p-4 rounded-2xl border space-y-1.5" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                <h5 className="font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                  <Shield className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                  <span>{t("settingsModal.dataSecurityTitle")}</span>
                </h5>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {t("settingsModal.dataSecurityDesc")}
                </p>
              </div>

            </div>
          )}

        </div>

        {/* ════════════ FOOTER ════════════ */}
        <div className="pt-4 border-t flex items-center justify-between text-xs relative z-10 shrink-0" style={{ borderColor: "var(--border-primary)", color: "var(--text-muted)" }}>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t("settingsModal.synced")}</span>
          </div>
          
          <button
            onClick={closeSettings}
            className="px-6 py-2.5 rounded-xl fic-btn-primary text-white font-extrabold text-xs shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            {t("settingsModal.saveAndClose")}
          </button>
        </div>

      </div>

    </div>
  );
}
