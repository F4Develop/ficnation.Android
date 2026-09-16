"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  Play,
  Bookmark,
  BookOpen,
  Eye,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  Share2,
  Check,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import { useStoryModal } from "@/context/StoryModalContext";
import { usePresence } from "@/context/PresenceContext";
import { useAuth } from "@/context/AuthContext";
import { FicImage } from "@/components/ui/FicImage";
import { createClient } from "@/lib/supabase/client";
import { sendNotification } from "@/lib/notifications";
import {
  hasUserVotedStory,
  toggleStoryVote,
  recordUniqueStoryView,
} from "@/lib/storyInteractions";
import type { StoryStatus } from "@/data/mockStories";

interface ChapterPreview {
  id: string;
  number: number;
  title: string;
  words?: number;
}

export function StoryDetailModal() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedStory, isOpen, closeStoryModal } = useStoryModal();
  const { isUserOnline } = usePresence();

  const [chapters, setChapters] = useState<ChapterPreview[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isSavedInLibrary, setIsSavedInLibrary] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votesCount, setVotesCount] = useState(0);
  const [readsCount, setReadsCount] = useState(0);

  // Cargar capítulos de Supabase, verificar votos y registrar vista única
  useEffect(() => {
    if (!selectedStory || !isOpen) return;    const storyId = selectedStory.id;
    const currentVotes = Number(selectedStory.votes || 0);
    const currentReads = Number(selectedStory.reads || 0);
    setVotesCount(currentVotes);
    setReadsCount(currentReads);

    // Cargar conteos fiables desde la tabla stories y verificar voto del usuario
    const supabase = createClient();
    Promise.all([
      supabase.from("stories").select("votes_count, reads_count").eq("id", storyId).maybeSingle(),
      hasUserVotedStory(storyId, user?.id),
    ]).then(([{ data: storyData }, userVoted]) => {
      setHasVoted(userVoted);
      const dbVotes = storyData?.votes_count !== undefined && storyData?.votes_count !== null
        ? Number(storyData.votes_count)
        : currentVotes;
      const dbReads = storyData?.reads_count !== undefined && storyData?.reads_count !== null
        ? Number(storyData.reads_count)
        : currentReads;

      const finalVotes = Math.max(currentVotes, dbVotes, userVoted ? 1 : 0);
      const finalReads = Math.max(currentReads, dbReads, finalVotes);

      setVotesCount(finalVotes);
      setReadsCount(finalReads);
    });

    // Verificar si está guardada en la biblioteca
    try {
      const savedList = JSON.parse(localStorage.getItem("ficnation_library") || "[]");
      const exists = savedList.some((s: any) => s.id === selectedStory.id);
      setIsSavedInLibrary(exists);
    } catch {
      setIsSavedInLibrary(false);
    }

    async function loadChapters() {
      setIsLoadingChapters(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("chapters")
          .select("id, chapter_number, title, word_count, is_published")
          .eq("story_id", selectedStory!.id)
          .eq("is_published", true)
          .order("chapter_number", { ascending: true });

        if (data && data.length > 0) {
          setChapters(
            data.map((c: any) => ({
              id: c.id,
              number: c.chapter_number,
              title: c.title,
              words: c.word_count || 0,
            }))
          );
        } else {
          // Verificar si existen capítulos guardados localmente para esta historia
          let localChapters: any[] = [];
          try {
            const rawChaps = localStorage.getItem(`ficnation_chapters_${selectedStory!.id}`);
            if (rawChaps) {
              const parsed = JSON.parse(rawChaps);
              if (Array.isArray(parsed) && parsed.length > 0) {
                localChapters = parsed.filter((c: any) => c.isPublished !== false);
              }
            }

            if (localChapters.length === 0) {
              const rawUserStories = localStorage.getItem("ficnation_user_stories");
              if (rawUserStories) {
                const parsedStories = JSON.parse(rawUserStories);
                const foundStory = parsedStories.find((s: any) => s.id === selectedStory!.id);
                if (foundStory && Array.isArray(foundStory.chapters)) {
                  localChapters = foundStory.chapters.filter((c: any) => c.isPublished !== false);
                }
              }
            }
          } catch {}

          if (localChapters.length > 0) {
            setChapters(
              localChapters.map((c: any) => ({
                id: c.id || `chap-${c.number || c.chapterNumber || 1}`,
                number: c.number || c.chapterNumber || 1,
                title: c.title || `Capítulo ${c.number || c.chapterNumber || 1}`,
                words: c.words || c.wordCount || 0,
              }))
            );
          } else {
            setChapters([]);
          }
        }
      } catch {
        setChapters([]);
      } finally {
        setIsLoadingChapters(false);
      }
    }

    loadChapters();
  }, [selectedStory, isOpen, user?.id]);

  // Escuchar eventos globales de votos y vistas
  useEffect(() => {
    if (!selectedStory?.id) return;
    const storyId = selectedStory.id;

    const handleStoryVoted = (e: any) => {
      if (e.detail && e.detail.storyId === storyId) {
        if (e.detail.hasVoted !== undefined) setHasVoted(e.detail.hasVoted);
        if (e.detail.newCount !== undefined) setVotesCount(e.detail.newCount);
      }
    };
    const handleStoryViewed = (e: any) => {
      if (e.detail && e.detail.storyId === storyId && e.detail.readsCount !== undefined) {
        setReadsCount(e.detail.readsCount);
      }
    };

    window.addEventListener("ficnation_story_voted", handleStoryVoted);
    window.addEventListener("ficnation_story_viewed", handleStoryViewed);
    return () => {
      window.removeEventListener("ficnation_story_voted", handleStoryVoted);
      window.removeEventListener("ficnation_story_viewed", handleStoryViewed);
    };
  }, [selectedStory?.id]);

  // Manejador de Votos / Estrellas
  const handleVote = async () => {
    if (!selectedStory) return;
    const authorId = selectedStory.author?.id || (selectedStory as any).author_id;

    // Actualización optimista inmediata
    const nextVoted = !hasVoted;
    const nextCount = nextVoted ? votesCount + 1 : Math.max(0, votesCount - 1);
    setHasVoted(nextVoted);
    setVotesCount(nextCount);

    const { hasVoted: serverVoted, newCount } = await toggleStoryVote({
      storyId: selectedStory.id,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
      storyTitle: selectedStory.title,
      authorId,
      currentCount: votesCount,
    });
    setHasVoted(serverVoted);
    setVotesCount(newCount);
  };

  if (!isOpen || !selectedStory) return null;

  // Determinar estado de la historia
  let status: StoryStatus = "en_desarrollo";
  if (selectedStory.status) {
    status = selectedStory.status;
  } else if (selectedStory.completed) {
    status = "completa";
  }

  const statusConfig = {
    completa: {
      label: "Completa",
      badgeClass: "bg-emerald-950/90 text-emerald-300 border-emerald-500/50",
      icon: CheckCircle2,
      dotColor: "bg-emerald-400",
    },
    en_desarrollo: {
      label: "En Desarrollo",
      badgeClass: "bg-cyan-950/90 text-cyan-300 border-cyan-500/50",
      icon: Clock,
      dotColor: "bg-cyan-400 animate-pulse",
    },
    cancelada: {
      label: "Cancelada",
      badgeClass: "bg-rose-950/90 text-rose-300 border-rose-500/50",
      icon: AlertCircle,
      dotColor: "bg-rose-400",
    },
    borrador: {
      label: "Borrador",
      badgeClass: "bg-amber-950/90 text-amber-300 border-amber-500/50",
      icon: Clock,
      dotColor: "bg-amber-400",
    },
  }[status] || {
    label: "En Desarrollo",
    badgeClass: "bg-cyan-950/90 text-cyan-300 border-cyan-500/50",
    icon: Clock,
    dotColor: "bg-cyan-400 animate-pulse",
  };

  const StatusIcon = statusConfig.icon;

  // Comprobar si el autor está en línea
  const authorOnline = selectedStory.author?.username
    ? isUserOnline(selectedStory.author.username) || (selectedStory as any).author_id && isUserOnline((selectedStory as any).author_id)
    : false;

  // Toggle guardar en biblioteca
  const handleToggleLibrary = async () => {
    const nextSaved = !isSavedInLibrary;
    setIsSavedInLibrary(nextSaved);

    try {
      const savedList = JSON.parse(localStorage.getItem("ficnation_library") || "[]");
      const index = savedList.findIndex((s: any) => s.id === selectedStory.id);

      if (nextSaved && index === -1) {
        savedList.unshift({
          id: selectedStory.id,
          storyId: selectedStory.id,
          title: selectedStory.title,
          coverImage: selectedStory.coverImage,
          genre: selectedStory.genre,
          author: selectedStory.author,
          synopsis: selectedStory.synopsis,
          reads: selectedStory.reads,
          votes: selectedStory.votes,
          chapters: selectedStory.chapters,
          completed: selectedStory.completed,
          status: "sin_iniciar",
          currentChapter: 1,
          totalChapters: chapters.length || 1,
          progressPercent: 0,
          lastReadDate: new Date().toLocaleDateString("es-ES"),
        });
      } else if (!nextSaved && index >= 0) {
        savedList.splice(index, 1);
      }
      localStorage.setItem("ficnation_library", JSON.stringify(savedList));

      if (user) {
        const supabase = createClient();
        if (nextSaved) {
          await supabase.from("library_entries").upsert({
            user_id: user.id,
            story_id: selectedStory.id,
            status: "guardado",
            current_chapter: 1,
            progress_percent: 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,story_id" });
        } else {
          await supabase.from("library_entries").delete().eq("user_id", user.id).eq("story_id", selectedStory.id);
        }
      }
    } catch {}

    const authorId = selectedStory.author?.id || (selectedStory as any).author_id;
    if (nextSaved && user && authorId) {
      sendNotification({
        recipientId: authorId,
        actor: {
          id: user.id,
          name: user.name || "Usuario",
          avatar: user.avatar,
        },
        type: "library",
        storyId: selectedStory.id,
        storyTitle: selectedStory.title,
      });
    }
  };

  // Copiar enlace de la historia
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}/historia?id=${selectedStory.id}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Ir a leer
  const handleStartReading = (chapNumber: number = 1) => {
    closeStoryModal();
    router.push(`/leer?storyId=${selectedStory.id}&chapter=${chapNumber}`);
  };

  // Ir a la ficha completa
  const handleViewFullPage = () => {
    closeStoryModal();
    router.push(`/historia?id=${selectedStory.id}`);
  };

  // Ir al perfil del autor
  const handleViewAuthor = () => {
    closeStoryModal();
    const username = selectedStory.author?.username || "autor";
    router.push(`/usuario?id=${username}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in-scale">
      
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={closeStoryModal} />

      {/* Contenedor Principal del Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border fic-card shadow-2xl overflow-hidden flex flex-col z-10"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
      >
        
        {/* ════════════ HEADER CON BOTÓN CERRAR ════════════ */}
        <div className="absolute top-3 right-3 z-30">
          <button
            onClick={closeStoryModal}
            className="p-2 rounded-full border transition-all hover:scale-105 shadow-sm cursor-pointer fic-card-secondary"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* ════════════ CONTENIDO CON SCROLL INTERNO ════════════ */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* SECCIÓN SUPERIOR: PORTADA + DETALLES CLAVE */}
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
            
            {/* Portada Grande Vertical 2:3 */}
            <div className="relative w-36 sm:w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-md border shrink-0" style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}>
              <FicImage
                src={selectedStory.coverImage}
                alt={selectedStory.title}
                fallbackType="cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              {/* Badge de Estado sobre la portada */}
              <div className="absolute top-2.5 left-2.5">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold border backdrop-blur-md shadow-md ${statusConfig.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                  <span>{statusConfig.label}</span>
                </span>
              </div>
            </div>

            {/* Info Primaria */}
            <div className="flex-1 min-w-0 space-y-3">
              
              {/* Género & Clasificación de Edad */}
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span
                  className="rounded-full px-3 py-0.5 text-[10px] font-bold border"
                  style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                >
                  {selectedStory.genre}
                </span>

                {/* Badge de Clasificación por Edad */}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black border backdrop-blur-md ${
                    selectedStory.ageRating === "+18"
                      ? "bg-rose-950/90 text-rose-300 border-rose-500/70"
                      : selectedStory.ageRating === "+16"
                      ? "bg-amber-950/90 text-amber-300 border-amber-500/60"
                      : selectedStory.ageRating === "+13"
                      ? "bg-cyan-950/90 text-cyan-300 border-cyan-500/60"
                      : "bg-emerald-950/90 text-emerald-300 border-emerald-500/60"
                  }`}
                >
                  {selectedStory.ageRating || "TP"}
                </span>

                <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                  {selectedStory.chapters || chapters.length || 1} Capítulos
                </span>
              </div>

              {/* Título de la Historia */}
              <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight leading-snug" style={{ color: "var(--text-primary)" }}>
                {selectedStory.title}
              </h2>

              {/* Avisos de Contenido (si existen) */}
              {selectedStory.contentWarnings && selectedStory.contentWarnings.length > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mr-0.5">
                    <AlertCircle className="w-3 h-3" />
                    <span>Avisos:</span>
                  </span>
                  {selectedStory.contentWarnings.map((cw) => (
                    <span
                      key={cw}
                      className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300"
                    >
                      {cw}
                    </span>
                  ))}
                </div>
              )}

              {/* Autor con Avatar y Presencia */}
              <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-0.5">
                <button
                  onClick={handleViewAuthor}
                  className="inline-flex items-center gap-2 group hover:opacity-100 transition-all cursor-pointer"
                >
                  <div className="relative h-7 w-7 rounded-full overflow-hidden border shadow-xs shrink-0" style={{ borderColor: "var(--border-primary)" }}>
                    <FicImage
                      src={selectedStory.author?.avatar || "/default-avatar.svg"}
                      alt={selectedStory.author?.name || "Autor"}
                      fallbackType="avatar"
                    />
                    {authorOnline && (
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold transition-colors" style={{ color: "var(--text-primary)" }}>
                      {selectedStory.author?.name || "Autor"}
                    </p>
                    <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                      @{selectedStory.author?.username || "autor"} {authorOnline ? "• 🟢 En línea" : ""}
                    </p>
                  </div>
                </button>
              </div>

              {/* Métricas de Lectura */}
              <div className="flex items-center justify-center sm:justify-start gap-4 py-2 border-y text-xs font-mono" style={{ borderColor: "var(--border-primary)", color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1.5" title="Lecturas únicas">
                  <Eye className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                  <strong style={{ color: "var(--text-primary)" }}>{readsCount}</strong> lecturas
                </span>
                <span className="flex items-center gap-1.5" title="Votos / Estrellas">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/40" />
                  <strong style={{ color: "var(--text-primary)" }}>{votesCount}</strong> votos
                </span>
              </div>

            </div>

          </div>

          {/* SINOPSIS */}
          <div className="space-y-1.5 p-4 rounded-2xl border text-left fic-card-secondary">
            <h4 className="text-xs font-extrabold flex items-center gap-1.5 uppercase tracking-wider" style={{ color: "var(--text-badge)" }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sinopsis</span>
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed max-h-32 overflow-y-auto pr-1" style={{ color: "var(--text-secondary)" }}>
              {selectedStory.synopsis || "Sin descripción disponible para esta obra."}
            </p>
          </div>

          {/* ETIQUETAS / TAGS */}
          {selectedStory.tags && selectedStory.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 text-left">
              {selectedStory.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-xl border px-2.5 py-1 text-[10px] font-medium fic-card-secondary"
                  style={{ color: "var(--text-badge)" }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* LISTA RÁPIDA DE CAPÍTULOS */}
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                <span>Capítulos Disponibles</span>
              </h4>
              <span className="text-[10px] font-mono font-bold" style={{ color: "var(--text-badge)" }}>
                {chapters.length} publicados
              </span>
            </div>

            {isLoadingChapters ? (
              <div className="p-4 text-center text-xs animate-pulse" style={{ color: "var(--text-muted)" }}>
                Cargando índice de capítulos...
              </div>
            ) : chapters.length === 0 ? (
              <div className="p-3 text-center rounded-xl border text-xs fic-card-secondary" style={{ color: "var(--text-muted)" }}>
                Aún no se han publicado capítulos para esta historia.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {chapters.slice(0, 6).map((chap) => (
                  <button
                    key={chap.id}
                    onClick={() => handleStartReading(chap.number)}
                    className="flex items-center justify-between p-2.5 rounded-xl border transition-all text-left group cursor-pointer fic-card-secondary hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-6 w-6 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center shrink-0 border"
                        style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                      >
                        {chap.number}
                      </span>
                      <span className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {chap.title}
                      </span>
                    </div>
                    <Play className="w-3 h-3 opacity-60 group-hover:opacity-100 shrink-0" style={{ color: "var(--text-badge)" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ════════════ BARRA INFERIOR DE ACCIONES ════════════ */}
        <div className="p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3 relative z-20 fic-card" style={{ borderColor: "var(--border-primary)" }}>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Guardar en Biblioteca */}
            <button
              onClick={handleToggleLibrary}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isSavedInLibrary
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-sm"
                  : "fic-card-secondary hover:scale-105"
              }`}
            >
              {isSavedInLibrary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>En Biblioteca</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                  <span>Guardar</span>
                </>
              )}
            </button>

            {/* Dar Estrella / Votar */}
            <button
              onClick={handleVote}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                hasVoted
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40 shadow-sm"
                  : "fic-card-secondary hover:scale-105"
              }`}
              title={hasVoted ? "Has dado estrella (Haz clic para retirar)" : "Dar una estrella (+15 XP)"}
            >
              <Star className={`w-3.5 h-3.5 transition-transform ${hasVoted ? "fill-amber-500 text-amber-500 scale-110" : "text-amber-500"}`} />
              <span>{hasVoted ? "Votada" : "Estrella"}</span>
            </button>

            {/* Compartir */}
            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-xl border transition-all cursor-pointer fic-card-secondary hover:scale-105"
              title="Copiar enlace directo"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Ficha Completa */}
            <button
              onClick={handleViewFullPage}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer fic-card-secondary hover:scale-105"
            >
              <span style={{ color: "var(--text-primary)" }}>Ficha Completa</span>
              <ExternalLink className="w-3 h-3" style={{ color: "var(--text-badge)" }} />
            </button>

            {/* BOTÓN PRINCIPAL: EMPEZAR A LEER */}
            <button
              onClick={() => handleStartReading(1)}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-extrabold shadow-md hover:scale-105 transition-all cursor-pointer fic-btn-primary"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Empezar a Leer</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
