"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Bookmark,
  BookmarkCheck,
  Star,
  Eye,
  BookOpen,
  Play,
  Heart,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Download,
  HardDriveDownload,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { type Story } from "@/data/mockStories";
import { MobileReaderView } from "../leer/page";
import {
  hasUserVotedStory,
  toggleStoryVote,
  recordUniqueStoryView,
} from "@/lib/storyInteractions";
import {
  downloadStoryForOffline,
  isStoryDownloadedOffline,
  removeOfflineStory,
} from "@/lib/offlineStorage";

export interface MobileStoryDetailProps {
  storyId?: string;
  onBack?: () => void;
  onReadStory?: (storyId: string, chapter: number) => void;
}

export function MobileStoryDetailView({
  storyId: propStoryId,
  onBack,
  onReadStory,
}: MobileStoryDetailProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const storyId = propStoryId || searchParams?.get("id") || "";

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"capitulos" | "sinopsis">("capitulos");
  const [isSaved, setIsSaved] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votesCount, setVotesCount] = useState(0);
  const [readsCount, setReadsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [readingChapter, setReadingChapter] = useState<number | null>(null);

  // Estado Offline
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState("");

  // Comprobar si ya está descargada
  useEffect(() => {
    if (storyId) {
      setIsDownloaded(isStoryDownloadedOffline(storyId));
    }
  }, [storyId]);

  const handleDownloadStory = async () => {
    if (isDownloading || !storyId) return;
    setIsDownloading(true);
    setDownloadPercent(10);
    setDownloadStatusText("Iniciando descarga...");

    const res = await downloadStoryForOffline(storyId, (pct, status) => {
      setDownloadPercent(pct);
      setDownloadStatusText(status);
    });

    setIsDownloading(false);
    if (res.success) {
      setIsDownloaded(true);
    }
  };

  const handleRemoveDownload = () => {
    if (!storyId) return;
    removeOfflineStory(storyId);
    setIsDownloaded(false);
  };

  useEffect(() => {
    if (!storyId) {
      setIsLoading(false);
      return;
    }

    async function fetchStoryDetails() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: storyData, error: storyErr } = await supabase
          .from("stories")
          .select(`
            id,
            title,
            synopsis,
            cover_url,
            genre,
            tags,
            reads_count,
            votes_count,
            is_completed,
            author_id,
            profiles!author_id (
              id,
              name,
              username,
              avatar_url
            )
          `)
          .eq("id", storyId)
          .maybeSingle();

        if (!storyErr && storyData) {
          const profile = storyData.profiles as any;
          const rawVotes = Number(storyData.votes_count ?? 0);
          const rawReads = Math.max(Number(storyData.reads_count ?? 0), rawVotes);

          setStory({
            id: storyData.id,
            title: storyData.title,
            synopsis: storyData.synopsis || "",
            coverImage: storyData.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
            author: {
              name: profile?.name || profile?.username || "Autor FicNation",
              username: profile?.username ? `@${profile.username}` : "@autor",
              avatar: profile?.avatar_url || "/logo.jpg",
              id: storyData.author_id,
            },
            genre: storyData.genre || "Fantasía",
            tags: Array.isArray(storyData.tags) ? storyData.tags : [],
            chapters: 1,
            reads: String(rawReads),
            votes: String(rawVotes),
            completed: storyData.is_completed || false,
          });
          setVotesCount(rawVotes);
          setReadsCount(rawReads);
        }

        // Cargar estado de voto real
        hasUserVotedStory(storyId, user?.id).then((voted) => {
          setHasVoted(voted);
        });

        // Cargar lista de capítulos reales desde la base de datos
        const { data: chData } = await supabase
          .from("chapters")
          .select("id, chapter_number, title, word_count, created_at, is_published")
          .eq("story_id", storyId)
          .order("chapter_number", { ascending: true });

        if (chData && chData.length > 0) {
          const publishedChapters = chData.filter((c) => c.is_published !== false);
          setChapters(
            publishedChapters.map((c) => ({
              id: c.id,
              number: c.chapter_number,
              title: c.title || `Capítulo ${c.chapter_number}`,
              words: c.word_count || 1200,
              date: new Date(c.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              }),
            }))
          );
        } else {
          setChapters([]);
        }
      } catch (err) {
        console.error("Error al consultar historia en Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStoryDetails();

    // 3. Revisar si el usuario ya la tiene guardada en su biblioteca
    if (user?.id) {
      const supabase = createClient();
      supabase
        .from("library_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("story_id", storyId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setIsSaved(true);
        });
    } else {
      try {
        const library = JSON.parse(localStorage.getItem("ficnation_library") || "[]");
        setIsSaved(library.some((item: any) => item.id === storyId || item.storyId === storyId));
      } catch {}
    }
  }, [storyId, user?.id]);

  // Escuchar eventos globales en tiempo real
  useEffect(() => {
    const handleVoted = (e: any) => {
      if (e.detail?.storyId === storyId) {
        if (e.detail.newCount !== undefined) {
          setVotesCount(Number(e.detail.newCount));
          setStory((prev) => (prev ? { ...prev, votes: String(e.detail.newCount) } : prev));
        }
        if (e.detail.hasVoted !== undefined) {
          setHasVoted(Boolean(e.detail.hasVoted));
        }
      }
    };
    const handleViewed = (e: any) => {
      if (e.detail?.storyId === storyId && e.detail.readsCount !== undefined) {
        setReadsCount(Number(e.detail.readsCount));
        setStory((prev) => (prev ? { ...prev, reads: String(e.detail.readsCount) } : prev));
      }
    };

    window.addEventListener("ficnation_story_voted", handleVoted);
    window.addEventListener("ficnation_story_viewed", handleViewed);
    return () => {
      window.removeEventListener("ficnation_story_voted", handleVoted);
      window.removeEventListener("ficnation_story_viewed", handleViewed);
    };
  }, [storyId]);

  const handleToggleSave = async () => {
    if (!story) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      const library = JSON.parse(localStorage.getItem("ficnation_library") || "[]");
      let nextLibrary;
      if (!nextSaved) {
        nextLibrary = library.filter((item: any) => item.id !== story.id && item.storyId !== story.id);
      } else {
        nextLibrary = [...library, { ...story, storyId: story.id }];
      }
      localStorage.setItem("ficnation_library", JSON.stringify(nextLibrary));

      if (user?.id) {
        const supabase = createClient();
        if (nextSaved) {
          await supabase.from("library_entries").upsert({
            user_id: user.id,
            story_id: story.id,
            current_chapter: 1,
            progress_percent: 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,story_id" });
        } else {
          await supabase.from("library_entries").delete().eq("user_id", user.id).eq("story_id", story.id);
        }
      }
    } catch {}
  };

  const handleToggleVote = async () => {
    if (!story) return;
    const targetAuthorId = (story.author as any)?.id || (story as any).author_id;
    const { hasVoted: nextVoted, newCount } = await toggleStoryVote({
      storyId: story.id,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
      storyTitle: story.title,
      authorId: targetAuthorId,
      currentCount: votesCount,
    });

    setHasVoted(nextVoted);
    setVotesCount(newCount);
    setStory((prev) => (prev ? { ...prev, votes: String(newCount) } : prev));
  };

  const handleShare = () => {
    if (navigator.share && story) {
      navigator.share({
        title: story.title,
        text: `Lee "${story.title}" en FicNation`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-purple-300 font-bold">Cargando historia de la base de datos...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <BookOpen className="w-12 h-12 text-purple-400 opacity-60" />
        <h2 className="text-lg font-bold">Historia no encontrada</h2>
        <p className="text-xs text-slate-400">La obra seleccionada no está disponible en la base de datos.</p>
        <button
          onClick={handleBack}
          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 active:scale-95 transition-transform"
        >
          Volver
        </button>
      </div>
    );
  }

  const currentStory = story;
  const authorName = typeof currentStory.author === "string" ? currentStory.author : currentStory.author?.name || "Autor FicNation";

  const handleRead = (chapterNum: number) => {
    if (onReadStory && currentStory.id) {
      onReadStory(currentStory.id, chapterNum);
    } else {
      setReadingChapter(chapterNum);
    }
  };

  if (readingChapter !== null && currentStory.id) {
    return (
      <MobileReaderView
        storyId={currentStory.id}
        chapterNumber={readingChapter}
        onBack={() => setReadingChapter(null)}
        onNavigateChapter={(nextCh) => setReadingChapter(nextCh)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-20 select-none animate-screen-enter">
      {/* ════════════ 1. TOP BAR DE NAVEGACIÓN ════════════ */}
      <div className="sticky top-0 z-40 bg-[#070a12]/80 backdrop-blur-xl px-4 h-14 flex items-center justify-between border-b border-white/5">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Detalles de Obra
        </span>

        <button
          onClick={handleShare}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all"
          aria-label="Compartir"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <main className="flex-1 space-y-6">
        {/* ════════════ 2. HERO PORTADA Y DETALLES PRINCIPALES ════════════ */}
        <section className="relative px-4 pt-4">
          <div className="flex gap-4 items-start">
            {/* Portada destacada con marco */}
            <div className="relative aspect-[3/4] w-28 sm:w-32 rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/30 border border-white/15 shrink-0 bg-slate-800">
              <img
                src={currentStory?.coverImage || "/placeholder-book.png"}
                alt={currentStory?.title || "FicNation"}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Datos de la historia */}
            <div className="space-y-1.5 flex-1 min-w-0">
              {currentStory?.genre && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {currentStory.genre}
                </span>
              )}

              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                {currentStory?.title}
              </h1>

              <p className="text-xs text-purple-300 font-semibold flex items-center gap-1">
                <span>Por {authorName}</span>
                <CheckCircle2 className="w-3.5 h-3.5 fill-purple-400 text-[#070a12]" />
              </p>

              {/* Métricas rápidas */}
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {currentStory?.votes || "4.9"}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  {currentStory?.reads || "1.2k"}
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  {chapters.length || currentStory?.chapters || 1} caps
                </span>
              </div>
            </div>
          </div>

          {/* Botones de acción principales */}
          <div className="flex items-center gap-2.5 pt-4">
            <button
              onClick={() => handleRead(1)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Empezar a Leer</span>
            </button>

            <button
              onClick={handleToggleSave}
              className={`p-3 rounded-2xl border transition-all active:scale-95 ${
                isSaved
                  ? "bg-purple-600/20 border-purple-500 text-purple-300"
                  : "bg-white/5 border-white/10 text-slate-300"
              }`}
              title={isSaved ? "Guardado en biblioteca" : "Guardar en biblioteca"}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5 text-purple-400" /> : <Bookmark className="w-5 h-5" />}
            </button>

            <button
              onClick={handleToggleVote}
              className={`p-3 rounded-2xl border transition-all active:scale-95 ${
                hasVoted
                  ? "bg-pink-600/20 border-pink-500 text-pink-400"
                  : "bg-white/5 border-white/10 text-slate-300"
              }`}
              title="Votar por esta historia"
            >
              <Heart className={`w-5 h-5 ${hasVoted ? "fill-pink-500 text-pink-500" : ""}`} />
            </button>
          </div>

          {/* Tarjeta de Descarga Offline */}
          <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-[#070a12] border border-purple-500/20 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isDownloaded
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-purple-600/20 border-purple-500/40 text-purple-400"
              }`}>
                <HardDriveDownload className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {isDownloaded ? "Disponible sin conexión (Offline)" : "Lectura Offline"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {isDownloaded
                    ? "Todos los capítulos guardados"
                    : isDownloading
                    ? downloadStatusText
                    : "Descarga la obra para leer sin internet"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isDownloaded ? (
                <>
                  <span className="text-[11px] font-extrabold text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Listo</span>
                  </span>
                  <button
                    onClick={handleRemoveDownload}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
                    title="Eliminar descarga"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDownloadStory}
                  disabled={isDownloading}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 ${
                    isDownloading
                      ? "bg-purple-600 text-white animate-download-pulse"
                      : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30"
                  }`}
                >
                  {isDownloading ? (
                    <span>{downloadPercent}%</span>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ════════════ 3. PESTAÑAS: CAPÍTULOS / SINOPSIS ════════════ */}
        <section className="px-4 space-y-4">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("capitulos")}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                activeTab === "capitulos"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Capítulos ({chapters.length})
            </button>
            <button
              onClick={() => setActiveTab("sinopsis")}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                activeTab === "sinopsis"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Sinopsis & Info
            </button>
          </div>

          {/* Vista: Lista de Capítulos */}
          {activeTab === "capitulos" && (
            <div className="space-y-2">
              {chapters.length > 0 ? (
                chapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => handleRead(ch.number)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 active:scale-[0.99] transition-all text-left"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-100 truncate">
                        {ch.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span suppressHydrationWarning>{ch.words?.toLocaleString()} palabras</span>
                        <span>•</span>
                        <span>{ch.date}</span>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                      <Play className="w-3 h-3 fill-purple-300 ml-0.5" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-xs font-bold text-slate-300">Aún no hay capítulos publicados</p>
                  <p className="text-[11px] text-slate-500">El autor aún no ha subido capítulos a esta obra en la base de datos.</p>
                </div>
              )}
            </div>
          )}

          {/* Vista: Sinopsis & Detalles */}
          {activeTab === "sinopsis" && (
            <div className="space-y-4 p-1">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Sinopsis
                </h4>
                <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">
                  {currentStory?.synopsis || "Sin sinopsis disponible."}
                </p>
              </div>

              {/* Etiquetas / Tags */}
              {currentStory?.tags && currentStory.tags.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Etiquetas
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentStory.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function MobileStoryDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070a12] flex items-center justify-center text-purple-400">Cargando historia...</div>}>
      <MobileStoryDetailView />
    </Suspense>
  );
}
