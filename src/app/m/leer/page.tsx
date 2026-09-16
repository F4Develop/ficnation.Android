"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles,
  Type,
  Sun,
  Moon,
  Coffee,
  Check,
  RotateCcw,
  BookOpen,
  List,
  Star,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  Flame,
  Download,
  CloudOff,
  HardDriveDownload,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  hasUserVotedChapter,
  toggleChapterVote,
  recordUniqueStoryView,
  hasUserVotedStory,
} from "@/lib/storyInteractions";
import {
  getOfflineChapter,
  getOfflineStory,
  autoPrefetchNextChapters,
  downloadStoryForOffline,
  isStoryDownloadedOffline,
} from "@/lib/offlineStorage";

export type ThemeMode = "dark" | "sepia" | "light" | "oled";
export type FontSizeMode = "sm" | "base" | "lg" | "xl";
export type FontFamilyMode = "serif" | "sans" | "mono";

export interface MobileReaderProps {
  storyId?: string;
  chapterNumber?: number;
  onBack?: () => void;
  onNavigateChapter?: (chapter: number) => void;
}

interface ChapterMetadata {
  id: string;
  chapterNumber: number;
  title: string;
}

export function MobileReaderView({
  storyId: propStoryId,
  chapterNumber: propChapterNumber,
  onBack,
  onNavigateChapter,
}: MobileReaderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const storyId = propStoryId || searchParams?.get("storyId") || searchParams?.get("id") || "";
  const paramChapter = searchParams?.get("chapter") || searchParams?.get("capitulo");
  const initialChapter = propChapterNumber || (paramChapter ? parseInt(paramChapter, 10) : 1);

  const [currentChapter, setCurrentChapter] = useState(initialChapter);

  useEffect(() => {
    if (propChapterNumber && propChapterNumber !== currentChapter) {
      setCurrentChapter(propChapterNumber);
    }
  }, [propChapterNumber]);

  const [storyTitle, setStoryTitle] = useState("Historia");
  const [chapterTitle, setChapterTitle] = useState(`Capítulo ${currentChapter}`);
  const [rawContent, setRawContent] = useState("");
  const [isHtmlContent, setIsHtmlContent] = useState(false);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [totalChapters, setTotalChapters] = useState(1);
  const [chaptersList, setChaptersList] = useState<ChapterMetadata[]>([]);
  
  // Controles y personalización
  const [showControls, setShowControls] = useState(true);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showChaptersDrawer, setShowChaptersDrawer] = useState(false);
  const [fontSize, setFontSize] = useState<FontSizeMode>("base");
  const [fontFamily, setFontFamily] = useState<FontFamilyMode>("serif");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [lineHeight, setLineHeight] = useState<"normal" | "relaxed" | "loose">("relaxed");
  const [isLoading, setIsLoading] = useState(true);

  // Estado de descarga y modo offline
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState("");

  // Progreso de lectura
  const [scrollProgress, setScrollProgress] = useState(0);

  // Interacciones: Votos y Guardado
  const [hasVoted, setHasVoted] = useState(false);
  const [isSavedInLibrary, setIsSavedInLibrary] = useState(false);

  // Narrador de Voz (TTS)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Comprobar estado offline descargado
  useEffect(() => {
    if (storyId) {
      setIsDownloaded(isStoryDownloadedOffline(storyId));
    }
  }, [storyId]);

  // 1. Escuchar scroll para la barra de progreso
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(Math.max(current, 0), 100));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Cargar contenido del capítulo desde Supabase o Caché Offline
  useEffect(() => {
    if (!storyId) {
      setIsLoading(false);
      return;
    }

    async function loadChapterData() {
      setIsLoading(true);
      // Detener narrador de voz al cambiar de capítulo
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsSpeechPaused(false);
      }

      const isOfflineDevice = typeof navigator !== "undefined" && !navigator.onLine;

      try {
        // A) Intentar primero desde el Caché Offline si el dispositivo está sin internet
        if (isOfflineDevice) {
          const offlineStory = getOfflineStory(storyId);
          const offlineChap = getOfflineChapter(storyId, currentChapter);

          if (offlineStory && offlineChap) {
            setStoryTitle(offlineStory.title);
            setTotalChapters(offlineStory.totalChapters || offlineStory.chapters.length || 1);
            setChaptersList(
              offlineStory.chapters.map((c) => ({
                id: c.id,
                chapterNumber: c.chapterNumber,
                title: c.title,
              }))
            );
            setChapterTitle(offlineChap.title);
            setRawContent(offlineChap.content);
            setIsHtmlContent(offlineChap.isHtml);
            if (!offlineChap.isHtml) {
              setParagraphs(offlineChap.content.split("\n\n").filter(Boolean));
            }
            setIsOfflineMode(true);
            setIsLoading(false);
            window.scrollTo({ top: 0, behavior: "instant" });
            return;
          }
        }

        const supabase = createClient();

        // B) Cargar datos de la historia y lista de capítulos online
        const { data: sData } = await supabase
          .from("stories")
          .select(`
            title,
            chapters_count,
            chapters (id, chapter_number, title, is_published)
          `)
          .eq("id", storyId)
          .maybeSingle();

        if (sData) {
          setStoryTitle(sData.title || "Historia");
          const chList = Array.isArray(sData.chapters)
            ? sData.chapters
                .filter((c: any) => c.is_published !== false)
                .map((c: any) => ({
                  id: c.id,
                  chapterNumber: c.chapter_number,
                  title: c.title || `Capítulo ${c.chapter_number}`,
                }))
                .sort((a, b) => a.chapterNumber - b.chapterNumber)
            : [];

          setChaptersList(chList);
          setTotalChapters(chList.length > 0 ? chList.length : sData.chapters_count || 1);
        }

        // C) Cargar contenido exacto del capítulo
        const { data: chData } = await supabase
          .from("chapters")
          .select("id, title, content")
          .eq("story_id", storyId)
          .eq("chapter_number", currentChapter)
          .maybeSingle();

        if (chData && chData.content) {
          setChapterTitle(chData.title || `Capítulo ${currentChapter}`);
          const text = chData.content;
          setRawContent(text);

          const hasHtml = /<\/?[a-z][\s\S]*>/i.test(text);
          setIsHtmlContent(hasHtml);
          if (!hasHtml) {
            setParagraphs(text.split("\n\n").filter(Boolean));
          }
          setIsOfflineMode(false);

          // Precarga automática en segundo plano de los siguientes capítulos
          autoPrefetchNextChapters(storyId, currentChapter);
        } else {
          // Fallback a almacenamiento offline o local si no vino de la BD
          const offlineChap = getOfflineChapter(storyId, currentChapter);
          if (offlineChap && offlineChap.content) {
            setChapterTitle(offlineChap.title);
            setRawContent(offlineChap.content);
            setIsHtmlContent(offlineChap.isHtml);
            if (!offlineChap.isHtml) setParagraphs(offlineChap.content.split("\n\n").filter(Boolean));
            setIsOfflineMode(true);
          } else {
            let foundText = "";
            let foundChTitle = `Capítulo ${currentChapter}`;
            try {
              const localChapters = JSON.parse(localStorage.getItem(`ficnation_chapters_${storyId}`) || "[]");
              const localChap = localChapters.find((c: any) => c.chapterNumber === currentChapter);
              if (localChap && localChap.content) {
                foundChTitle = localChap.title || `Capítulo ${currentChapter}`;
                foundText = localChap.content;
              }
            } catch {}

            if (foundText) {
              setChapterTitle(foundChTitle);
              setRawContent(foundText);
              const hasHtml = /<\/?[a-z][\s\S]*>/i.test(foundText);
              setIsHtmlContent(hasHtml);
              if (!hasHtml) setParagraphs(foundText.split("\n\n").filter(Boolean));
            } else {
              setChapterTitle(`Capítulo ${currentChapter}`);
              setRawContent("<p>Este capítulo aún no cuenta con texto redactado por el autor.</p>");
              setIsHtmlContent(true);
            }
          }
        }

        // Registrar vista única real del capítulo
        recordUniqueStoryView({
          storyId,
          chapterNumber: currentChapter,
          userId: user?.id,
        });

        // Comprobar si ya ha votado este capítulo
        const voted = hasUserVotedChapter(storyId, currentChapter, user?.id);
        setHasVoted(voted);

        // Guardar progreso en Supabase si el usuario está autenticado
        if (user?.id) {
          await supabase.from("library_entries").upsert(
            {
              user_id: user.id,
              story_id: storyId,
              current_chapter: currentChapter,
              progress_percent: Math.round((currentChapter / (totalChapters || 1)) * 100),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,story_id" }
          );
        }

        // Guardar lectura reciente en localStorage
        try {
          localStorage.setItem(
            "ficnation_recent_read",
            JSON.stringify({
              storyId: storyId,
              chapter: currentChapter,
              progress: Math.round((currentChapter / (totalChapters || 1)) * 100),
              title: storyTitle,
            })
          );
        } catch {}
      } catch (err) {
        console.error("Error al cargar capítulo:", err);
        // Fallback de emergencia a caché offline
        const offlineStory = getOfflineStory(storyId);
        const offlineChap = getOfflineChapter(storyId, currentChapter);
        if (offlineChap) {
          setChapterTitle(offlineChap.title);
          setRawContent(offlineChap.content);
          setIsHtmlContent(offlineChap.isHtml);
          if (!offlineChap.isHtml) setParagraphs(offlineChap.content.split("\n\n").filter(Boolean));
          setIsOfflineMode(true);
        }
      } finally {
        setIsLoading(false);
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }

    loadChapterData();
  }, [storyId, currentChapter, user?.id]);

  // Manejador de descarga offline completa
  const handleDownloadOffline = async () => {
    if (isDownloading || !storyId) return;
    setIsDownloading(true);
    setDownloadPercent(10);
    setDownloadStatusText("Preparando descarga...");
    const res = await downloadStoryForOffline(storyId, (pct, msg) => {
      setDownloadPercent(pct);
      setDownloadStatusText(msg);
    });
    setIsDownloading(false);
    if (res.success) {
      setIsDownloaded(true);
    }
  };

  // Manejo de cambio de capítulos
  const goToChapter = (chapNum: number) => {
    if (chapNum < 1 || chapNum > totalChapters) return;
    setShowChaptersDrawer(false);
    if (onNavigateChapter) {
      onNavigateChapter(chapNum);
    } else {
      setCurrentChapter(chapNum);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // Votar por el capítulo / historia
  const handleVote = async () => {
    const { hasVoted: nextVoted } = await toggleChapterVote({
      storyId,
      chapterNumber: currentChapter,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
      storyTitle,
    });
    setHasVoted(nextVoted);
  };

  // Guardar en Biblioteca
  const handleToggleLibrary = async () => {
    setIsSavedInLibrary(!isSavedInLibrary);
    try {
      if (user?.id) {
        const supabase = createClient();
        if (!isSavedInLibrary) {
          await supabase.from("library_entries").insert({
            user_id: user.id,
            story_id: storyId,
            current_chapter: currentChapter,
          });
        }
      }
    } catch {}
  };

  // ════════════ NARRADOR DE VOZ (TTS) ════════════
  const handleToggleTTS = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Tu navegador no soporta el sintetizador de voz.");
      return;
    }

    const synth = window.speechSynthesis;

    if (isSpeaking) {
      if (isSpeechPaused) {
        synth.resume();
        setIsSpeechPaused(false);
      } else {
        synth.pause();
        setIsSpeechPaused(true);
      }
      return;
    }

    // Extraer texto plano eliminando etiquetas HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = rawContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";

    if (!plainText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = "es-ES";
    utterance.rate = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsSpeechPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsSpeechPaused(false);
    };

    synth.cancel();
    synth.speak(utterance);
    setIsSpeaking(true);
    setIsSpeechPaused(false);
  };

  const handleStopTTS = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsSpeechPaused(false);
  };

  // Clases según tema de color
  const getThemeClasses = () => {
    switch (theme) {
      case "sepia":
        return "bg-[#fbf0d9] text-[#3d2c1e]";
      case "light":
        return "bg-[#fafafa] text-[#1e293b]";
      case "oled":
        return "bg-[#000000] text-[#e2e8f0]";
      default:
        return "bg-[#070a12] text-[#e2e8f0]";
    }
  };

  // Clases según tamaño de fuente
  const getFontSizeClasses = () => {
    switch (fontSize) {
      case "sm":
        return "text-[14px]";
      case "lg":
        return "text-[18px]";
      case "xl":
        return "text-[21px]";
      default:
        return "text-[16px]";
    }
  };

  // Clases según tipografía
  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case "sans":
        return "font-sans";
      case "mono":
        return "font-mono";
      default:
        return "font-serif";
    }
  };

  // Clases según interlineado
  const getLineHeightClass = () => {
    switch (lineHeight) {
      case "normal":
        return "leading-normal";
      case "loose":
        return "leading-[2.2]";
      default:
        return "leading-[1.85]";
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClasses()} flex flex-col transition-colors duration-200 select-text relative`}>
      
      {/* ════════════ BARRA DE PROGRESO DE LECTURA ════════════ */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ════════════ 1. CABECERA FLOTANTE (Ocultable con tap) ════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        } bg-[#0b0f19]/95 backdrop-blur-xl border-b border-purple-500/20 pt-safe text-white shadow-xl`}
      >
        {isOfflineMode && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-3 py-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-300">
            <CloudOff className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Leyendo en Modo Offline (Caché Local)</span>
          </div>
        )}
        <div className="px-4 h-14 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Título de la historia y selector de capítulo */}
          <button
            onClick={() => setShowChaptersDrawer(true)}
            className="flex flex-col items-center max-w-[190px] px-2 py-0.5 rounded-lg active:scale-95 transition-all"
          >
            <span className="text-xs font-bold text-white truncate w-full text-center">
              {storyTitle}
            </span>
            <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
              <span>Capítulo {currentChapter} de {totalChapters}</span>
              <span className="text-[8px]">▼</span>
            </span>
          </button>

          {/* Botones de acción derecha: Narrador de voz + Ajustes */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleTTS}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${
                isSpeaking
                  ? "bg-purple-600 border-purple-500 text-white animate-pulse"
                  : "bg-white/5 border-white/10 text-purple-300 hover:text-white"
              }`}
              title={isSpeaking ? (isSpeechPaused ? "Reanudar audio" : "Pausar audio") : "Escuchar con voz"}
            >
              {isSpeaking ? (
                isSpeechPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-300 hover:text-white active:scale-95 transition-all"
              title="Ajustes de lectura"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ════════════ 2. REPRODUCTOR FLOTANTE DE TTS (SI ESTÁ ACTIVO) ════════════ */}
      {isSpeaking && (
        <div className="fixed top-16 left-4 right-4 z-40 bg-[#0d1222]/95 border border-purple-500/30 rounded-2xl p-3 flex items-center justify-between shadow-2xl backdrop-blur-md animate-in slide-in-from-top select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Narrador Activo</p>
              <p className="text-[10px] text-purple-300">
                {isSpeechPaused ? "Audio en pausa" : "Reproduciendo capítulo..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleTTS}
              className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold active:scale-95"
            >
              {isSpeechPaused ? "Reanudar" : "Pausar"}
            </button>
            <button
              onClick={handleStopTTS}
              className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════ 3. LIENZO DE LECTURA ════════════ */}
      <main
        onClick={() => setShowControls(!showControls)}
        className="flex-1 max-w-2xl mx-auto px-5 pt-22 pb-32 cursor-pointer w-full"
      >
        {/* Encabezado del Capítulo */}
        <div className="text-center space-y-2 mb-8 select-none">
          <p className="text-xs uppercase tracking-widest text-purple-400 font-extrabold">
            Capítulo {currentChapter}
          </p>
          <h1 className="text-xl sm:text-2xl font-black leading-tight">
            {chapterTitle}
          </h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto mt-3 rounded-full" />
        </div>

        {/* Cuerpo del Texto (Compatible con HTML de TipTap y Texto Plano) */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-purple-400 font-semibold">Cargando capítulo...</p>
          </div>
        ) : (
          <div
            ref={contentRef}
            className={`${getFontSizeClasses()} ${getFontFamilyClass()} ${getLineHeightClass()} tracking-normal`}
          >
            {isHtmlContent ? (
              <div
                className="prose prose-invert prose-purple max-w-none text-inherit leading-inherit"
                dangerouslySetInnerHTML={{ __html: rawContent }}
              />
            ) : (
              <div className="space-y-5">
                {paragraphs.map((p, idx) => (
                  <p key={idx} className="indent-4">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════ 4. TARJETA FINAL DE CAPÍTULO E INTERACCIONES ════════════ */}
        {!isLoading && (
          <div className="mt-16 pt-8 border-t border-white/10 space-y-6 select-none">
            
            {/* Voto y Guardado */}
            <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 text-center space-y-3">
              <p className="text-xs font-bold text-white">¿Te gustó este capítulo?</p>
              
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
                    hasVoted
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-white/5 border-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  <Star className={`w-4 h-4 ${hasVoted ? "fill-amber-400 text-amber-400" : ""}`} />
                  <span>{hasVoted ? "¡Votado!" : "Votar Historia"}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLibrary();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
                    isSavedInLibrary
                      ? "bg-purple-600/20 border-purple-500/40 text-purple-300"
                      : "bg-white/5 border-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSavedInLibrary ? "fill-purple-400 text-purple-400" : ""}`} />
                  <span>{isSavedInLibrary ? "En Biblioteca" : "Guardar"}</span>
                </button>
              </div>
            </div>

            {/* Navegación Anterior / Siguiente Capítulo */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToChapter(currentChapter - 1);
                }}
                disabled={currentChapter <= 1}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${
                  currentChapter <= 1
                    ? "opacity-30 border-white/5 cursor-not-allowed text-slate-500"
                    : "border-white/15 bg-white/5 text-slate-200 hover:border-purple-500/40"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Capítulo Anterior</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToChapter(currentChapter + 1);
                }}
                disabled={currentChapter >= totalChapters}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${
                  currentChapter >= totalChapters
                    ? "opacity-30 border-white/5 cursor-not-allowed text-slate-500"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/40 shadow-lg shadow-purple-600/30"
                }`}
              >
                <span>Siguiente Capítulo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ════════════ 5. DRAWER: AJUSTES DE PERSONALIZACIÓN DE LECTURA ════════════ */}
      {showSettingsDrawer && (
        <div
          onClick={() => setShowSettingsDrawer(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-auto bg-[#0b0f19] border-t border-purple-500/30 rounded-t-3xl p-5 space-y-5 text-white shadow-2xl animate-in slide-in-from-bottom"
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />

            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Ajustes de Lectura
              </h3>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Tamaño de Letra */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-medium">Tamaño de Fuente:</span>
              <div className="grid grid-cols-4 gap-2">
                {(["sm", "base", "lg", "xl"] as FontSizeMode[]).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                      fontSize === sz
                        ? "bg-purple-600 text-white border-purple-500 shadow-md"
                        : "bg-white/5 border-white/10 text-slate-300"
                    }`}
                  >
                    {sz === "sm" ? "14px" : sz === "base" ? "16px" : sz === "lg" ? "18px" : "21px"}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Tipografía */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-medium">Tipo de Letra:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFontFamily("serif")}
                  className={`py-2 rounded-xl text-xs font-serif font-bold border transition-all active:scale-95 ${
                    fontFamily === "serif"
                      ? "bg-purple-600 text-white border-purple-500 shadow-md"
                      : "bg-white/5 border-white/10 text-slate-300"
                  }`}
                >
                  Serif (Novela)
                </button>
                <button
                  onClick={() => setFontFamily("sans")}
                  className={`py-2 rounded-xl text-xs font-sans font-bold border transition-all active:scale-95 ${
                    fontFamily === "sans"
                      ? "bg-purple-600 text-white border-purple-500 shadow-md"
                      : "bg-white/5 border-white/10 text-slate-300"
                  }`}
                >
                  Sans (Moderna)
                </button>
                <button
                  onClick={() => setFontFamily("mono")}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 ${
                    fontFamily === "mono"
                      ? "bg-purple-600 text-white border-purple-500 shadow-md"
                      : "bg-white/5 border-white/10 text-slate-300"
                  }`}
                >
                  Mono
                </button>
              </div>
            </div>

            {/* Selector de Tema de Fondo */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-medium">Tema de Fondo:</span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setTheme("dark")}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 ${
                    theme === "dark"
                      ? "bg-purple-900/40 border-purple-500 text-white shadow-md"
                      : "bg-[#070a12] border-white/10 text-slate-400"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Noche</span>
                </button>
                <button
                  onClick={() => setTheme("oled")}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 ${
                    theme === "oled"
                      ? "bg-zinc-900 border-purple-500 text-white shadow-md"
                      : "bg-black border-white/10 text-slate-400"
                  }`}
                >
                  <span className="text-xs font-black">⚫</span>
                  <span>OLED</span>
                </button>
                <button
                  onClick={() => setTheme("sepia")}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 ${
                    theme === "sepia"
                      ? "border-amber-600 text-amber-900 bg-[#fbf0d9] shadow-md"
                      : "bg-[#fbf0d9]/80 border-amber-900/20 text-amber-800"
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Sepia</span>
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 ${
                    theme === "light"
                      ? "border-purple-600 text-slate-900 bg-white shadow-md"
                      : "bg-slate-200 border-slate-300 text-slate-700"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Día</span>
                </button>
              </div>
            </div>

            {/* Interlineado */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-medium">Interlineado:</span>
              <div className="grid grid-cols-3 gap-2">
                {(["normal", "relaxed", "loose"] as const).map((lh) => (
                  <button
                    key={lh}
                    onClick={() => setLineHeight(lh)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                      lineHeight === lh
                        ? "bg-purple-600 text-white border-purple-500 shadow-md"
                        : "bg-white/5 border-white/10 text-slate-300"
                    }`}
                  >
                    {lh === "normal" ? "Compacto" : lh === "relaxed" ? "Normal" : "Amplio"}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════════════ 6. DRAWER: LISTA RÁPIDA DE CAPÍTULOS ════════════ */}
      {showChaptersDrawer && (
        <div
          onClick={() => setShowChaptersDrawer(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-auto bg-[#0b0f19] border-t border-purple-500/30 rounded-t-3xl p-5 space-y-4 text-white shadow-2xl max-h-[75vh] flex flex-col animate-in slide-in-from-bottom"
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto shrink-0" />

            <div className="flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black text-white">Índice de Capítulos</h3>
                <p className="text-[11px] text-purple-300">{totalChapters} capítulos disponibles</p>
              </div>
              <button
                onClick={() => setShowChaptersDrawer(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Descarga Offline */}
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <HardDriveDownload className={`w-4 h-4 shrink-0 ${isDownloaded ? "text-emerald-400" : "text-purple-400"}`} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {isDownloaded ? "Historia Descargada Offline" : "Descargar para Leer Offline"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {isDownloaded ? "100% disponible sin conexión" : isDownloading ? downloadStatusText : "Guarda todos los capítulos"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadOffline}
                disabled={isDownloading || isDownloaded}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 flex items-center gap-1 ${
                  isDownloaded
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default"
                    : isDownloading
                    ? "bg-purple-600 text-white animate-download-pulse"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30"
                }`}
              >
                {isDownloaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Guardada</span>
                  </>
                ) : isDownloading ? (
                  <span>{downloadPercent}%</span>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar</span>
                  </>
                )}
              </button>
            </div>

            {/* Listado scrolleable */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {Array.from({ length: totalChapters }, (_, i) => i + 1).map((num) => {
                const isCurrent = num === currentChapter;
                const meta = chaptersList.find((c) => c.chapterNumber === num);
                const titleText = meta?.title || `Capítulo ${num}`;

                return (
                  <button
                    key={num}
                    onClick={() => goToChapter(num)}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-[0.98] ${
                      isCurrent
                        ? "bg-purple-600/20 border-purple-500 text-purple-300 shadow-md"
                        : "bg-white/[0.03] border-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-black w-6 text-center shrink-0 ${isCurrent ? "text-purple-400" : "text-slate-500"}`}>
                        {num}
                      </span>
                      <span className="text-xs font-bold truncate">
                        {titleText}
                      </span>
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] font-extrabold text-purple-400 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                        Leyendo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function MobileReaderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070a12] flex items-center justify-center text-purple-400 font-bold">Cargando lector...</div>}>
      <MobileReaderView />
    </Suspense>
  );
}
