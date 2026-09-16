"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { getTranslation, type SupportedLanguage } from "@/lib/translations";

export type AppTheme = "dark" | "oled" | "light" | "sepia" | "neon" | "crimson";

interface SettingsContextType {
  isLowSpecMode: boolean;
  toggleLowSpecMode: () => void;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  ambientEffects: boolean;
  toggleAmbientEffects: () => void;
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
  appLanguage: SupportedLanguage;
  setAppLanguage: (lang: SupportedLanguage) => void;
  storyLanguage: "all" | "es" | "en" | "pt";
  setStoryLanguage: (lang: "all" | "es" | "en" | "pt") => void;
  allowMatureContent: boolean;
  setAllowMatureContent: (allow: boolean) => void;
  readerFontSize: "sm" | "base" | "lg" | "xl";
  setReaderFontSize: (size: "sm" | "base" | "lg" | "xl") => void;
  showOnlineStatus: boolean;
  setShowOnlineStatus: (show: boolean) => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  clearLocalCache: () => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const SettingsContext = createContext<SettingsContextType>({
  isLowSpecMode: false,
  toggleLowSpecMode: () => {},
  reducedMotion: false,
  toggleReducedMotion: () => {},
  ambientEffects: true,
  toggleAmbientEffects: () => {},
  appTheme: "dark",
  setAppTheme: () => {},
  appLanguage: "es",
  setAppLanguage: () => {},
  storyLanguage: "all",
  setStoryLanguage: () => {},
  allowMatureContent: true,
  setAllowMatureContent: () => {},
  readerFontSize: "base",
  setReaderFontSize: () => {},
  showOnlineStatus: true,
  setShowOnlineStatus: () => {},
  isSettingsOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
  clearLocalCache: () => {},
  t: (path: string) => path,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLowSpecMode, setIsLowSpecMode] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [ambientEffects, setAmbientEffects] = useState<boolean>(true);
  const [appTheme, setAppThemeState] = useState<AppTheme>("dark");
  const [appLanguage, setAppLanguageState] = useState<"es" | "en" | "pt">("es");
  const [storyLanguage, setStoryLanguageState] = useState<"all" | "es" | "en" | "pt">("all");
  const [allowMatureContent, setAllowMatureContentState] = useState<boolean>(true);
  const [readerFontSize, setReaderFontSizeState] = useState<"sm" | "base" | "lg" | "xl">("base");
  const [showOnlineStatus, setShowOnlineStatusState] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Función interna para añadir/quitar clase CSS de modo bajo recursos
  const applyLowSpecDOM = (enabled: boolean) => {
    if (typeof document !== "undefined") {
      if (enabled) {
        document.documentElement.classList.add("low-spec-mode");
        document.body.classList.add("low-spec-mode");
      } else {
        document.documentElement.classList.remove("low-spec-mode");
        document.body.classList.remove("low-spec-mode");
      }
    }
  };

  // Función interna para aplicar tema al DOM (dark, oled, light, sepia, neon, crimson)
  const applyThemeDOM = (theme: AppTheme) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const body = document.body;
      const themeClasses = [
        "theme-dark",
        "theme-cosmic",
        "theme-oled",
        "theme-light",
        "theme-sepia",
        "theme-neon",
        "theme-crimson",
        "dark",
        "light",
      ];
      themeClasses.forEach((cls) => {
        root.classList.remove(cls);
        body.classList.remove(cls);
      });

      if (theme === "light" || theme === "sepia") {
        root.classList.add(`theme-${theme}`, "light");
        body.classList.add(`theme-${theme}`, "light");
        root.classList.remove("dark");
        body.classList.remove("dark");
      } else {
        root.classList.add(`theme-${theme}`, "dark");
        body.classList.add(`theme-${theme}`, "dark");
        root.classList.remove("light");
        body.classList.remove("light");
      }

      root.setAttribute("data-theme", theme);
      body.setAttribute("data-theme", theme);
    }
  };

  // 1. Cargar preferencias guardadas al montar
  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = (localStorage.getItem("ficnation_app_theme") as AppTheme) || "dark";
      const validThemes: AppTheme[] = ["dark", "light", "sepia", "neon", "crimson", "oled"];
      const normalizedTheme = validThemes.includes(savedTheme) ? savedTheme : "dark";
      setAppThemeState(normalizedTheme);
      applyThemeDOM(normalizedTheme);

      const userKey = user ? `ficnation_low_spec_${user.id}` : null;
      const savedUserLowSpec = userKey ? localStorage.getItem(userKey) : null;
      const savedGlobalLowSpec = localStorage.getItem("ficnation_low_spec_mode");

      const shouldEnableLowSpec =
        savedUserLowSpec !== null
          ? savedUserLowSpec === "true"
          : savedGlobalLowSpec === "true";

      if (shouldEnableLowSpec) {
        setIsLowSpecMode(true);
        applyLowSpecDOM(true);
      }

      const savedMotion = localStorage.getItem("ficnation_reduced_motion");
      if (savedMotion === "true") setReducedMotion(true);

      const savedAmbient = localStorage.getItem("ficnation_ambient_effects");
      if (savedAmbient === "false") setAmbientEffects(false);

      const savedAppLang = localStorage.getItem("ficnation_app_language") as any;
      if (savedAppLang && ["es", "en", "pt"].includes(savedAppLang)) setAppLanguageState(savedAppLang);

      const savedStoryLang = localStorage.getItem("ficnation_story_language") as any;
      if (savedStoryLang && ["all", "es", "en", "pt"].includes(savedStoryLang)) setStoryLanguageState(savedStoryLang);

      const savedMature = localStorage.getItem("ficnation_mature_content");
      if (savedMature !== null) setAllowMatureContentState(savedMature === "true");

      const savedFontSize = localStorage.getItem("ficnation_reader_font_size") as any;
      if (savedFontSize && ["sm", "base", "lg", "xl"].includes(savedFontSize)) setReaderFontSizeState(savedFontSize);

      // Registrar Service Worker para capacidades PWA y lectura offline
      if (typeof window !== "undefined" && "serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("/sw.js").catch(() => {});
        });
      }

      const savedOnlineStatus = localStorage.getItem("ficnation_show_online_status");
      if (savedOnlineStatus !== null) setShowOnlineStatusState(savedOnlineStatus === "true");
    } catch {
      // Fallback
    }
  }, []);

  // 2. Sincronizar automáticamente cuando el usuario inicia sesión o cambia de cuenta activa
  useEffect(() => {
    if (user) {
      try {
        const userKey = `ficnation_low_spec_${user.id}`;
        const savedUserLowSpec = localStorage.getItem(userKey);

        if (savedUserLowSpec !== null) {
          const isEnabled = savedUserLowSpec === "true";
          setIsLowSpecMode(isEnabled);
          applyLowSpecDOM(isEnabled);
        } else {
          localStorage.setItem(userKey, isLowSpecMode ? "true" : "false");
        }
      } catch {
        // Fallback
      }
    }
  }, [user]);

  const toggleLowSpecMode = () => {
    setIsLowSpecMode((prev) => {
      const next = !prev;
      applyLowSpecDOM(next);
      try {
        localStorage.setItem("ficnation_low_spec_mode", next ? "true" : "false");
        if (user) {
          localStorage.setItem(`ficnation_low_spec_${user.id}`, next ? "true" : "false");
          try {
            const supabase = createClient();
            supabase.from("profiles").update({ low_spec_mode: next }).eq("id", user.id);
          } catch {}
        }
      } catch {}
      return next;
    });
  };

  const toggleReducedMotion = () => {
    setReducedMotion((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ficnation_reduced_motion", next ? "true" : "false");
      } catch {}
      return next;
    });
  };

  const toggleAmbientEffects = () => {
    setAmbientEffects((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ficnation_ambient_effects", next ? "true" : "false");
      } catch {}
      return next;
    });
  };

  const setAppTheme = (theme: AppTheme) => {
    const validThemes: AppTheme[] = ["dark", "light", "sepia", "neon", "crimson", "oled"];
    const targetTheme = validThemes.includes(theme) ? theme : "dark";
    setAppThemeState(targetTheme);
    applyThemeDOM(targetTheme);
    try {
      localStorage.setItem("ficnation_app_theme", targetTheme);
      if (user?.id) {
        localStorage.setItem(`ficnation_app_theme_${user.id}`, targetTheme);
        try {
          const supabase = createClient();
          supabase.from("profiles").update({ app_theme: targetTheme }).eq("id", user.id).then();
        } catch {}
      }
    } catch {}
  };

  const setAppLanguage = (lang: "es" | "en" | "pt") => {
    setAppLanguageState(lang);
    try {
      localStorage.setItem("ficnation_app_language", lang);
    } catch {}
  };

  const setStoryLanguage = (lang: "all" | "es" | "en" | "pt") => {
    setStoryLanguageState(lang);
    try {
      localStorage.setItem("ficnation_story_language", lang);
    } catch {}
  };

  const setAllowMatureContent = (allow: boolean) => {
    setAllowMatureContentState(allow);
    try {
      localStorage.setItem("ficnation_mature_content", allow ? "true" : "false");
    } catch {}
  };

  const setReaderFontSize = (size: "sm" | "base" | "lg" | "xl") => {
    setReaderFontSizeState(size);
    try {
      localStorage.setItem("ficnation_reader_font_size", size);
    } catch {}
  };

  const setShowOnlineStatus = (show: boolean) => {
    setShowOnlineStatusState(show);
    try {
      localStorage.setItem("ficnation_show_online_status", show ? "true" : "false");
    } catch {}
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  const clearLocalCache = () => {
    if (typeof window !== "undefined") {
      try {
        const lowSpec = localStorage.getItem("ficnation_low_spec_mode");
        const authUser = localStorage.getItem("ficnation_cached_user");
        const userLowSpec = user ? localStorage.getItem(`ficnation_low_spec_${user.id}`) : null;
        
        localStorage.clear();
        
        if (lowSpec) localStorage.setItem("ficnation_low_spec_mode", lowSpec);
        if (authUser) localStorage.setItem("ficnation_cached_user", authUser);
        if (user && userLowSpec) localStorage.setItem(`ficnation_low_spec_${user.id}`, userLowSpec);

        alert("Caché temporal optimizada con éxito.");
        window.location.reload();
      } catch {
        alert("Error al limpiar caché.");
      }
    }
  };

  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      return getTranslation(appLanguage, path, params);
    },
    [appLanguage]
  );

  return (
    <SettingsContext.Provider
      value={{
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
        openSettings,
        closeSettings,
        clearLocalCache,
        t,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useTranslation() {
  const { t, appLanguage, setAppLanguage } = useSettings();
  return { t, lang: appLanguage, setLang: setAppLanguage };
}
