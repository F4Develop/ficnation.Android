"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Star,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2,
  Bookmark,
  Play,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Send,
  Check,
  Flame,
  Layers,
  Loader2,
  PenTool,
  CalendarClock,
  Lock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePresence } from "@/context/PresenceContext";
import { type Story } from "@/data/mockStories";
import { StoryCard } from "@/components/stories/StoryCard";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { isUserVerified, checkIsAdmin } from "@/lib/adminAuth";
import { createClient } from "@/lib/supabase/client";
import { FicImage } from "@/components/ui/FicImage";
import { sendNotification } from "@/lib/notifications";
import {
  hasUserVotedStory,
  toggleStoryVote,
  recordUniqueStoryView,
} from "@/lib/storyInteractions";

export interface StoryVolume {
  id: string;
  storyId?: string;
  title: string;
  description?: string;
  order: number;
}

interface ChapterSummary {
  id: string;
  number: number;
  title: string;
  words: number;
  date: string;
  reads: string;
  isPublished?: boolean;
  scheduledAt?: string | null;
  volumeId?: string | null;
  volumeTitle?: string | null;
}

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, addXp } = useAuth();
  const searchParams = useSearchParams();
  const storyId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || searchParams?.get("id") || "";

  const { isUserOnline } = usePresence();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"capitulos" | "sinopsis" | "resenas">("capitulos");
  const [isLoading, setIsLoading] = useState(true);

  // Estado de interactividad
  const [isSavedInLibrary, setIsSavedInLibrary] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votesCount, setVotesCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Lista de Capítulos Reales y Tomos
  const [chaptersList, setChaptersList] = useState<ChapterSummary[]>([]);
  const [storyVolumes, setStoryVolumes] = useState<StoryVolume[]>([]);
  const [collapsedVolumes, setCollapsedVolumes] = useState<Record<string, boolean>>({});

  // Estado del formulario de nueva reseña
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  // Historia cargada
  const [story, setStory] = useState<Story>({
    id: storyId,
    title: "Cargando historia...",
    synopsis: "",
    genre: "Fantasía",
    tags: [],
    coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
    reads: "0",
    votes: "0",
    chapters: 0,
    completed: false,
    status: "en_desarrollo",
    author: {
      name: "Autor",
      username: "autor",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    },
  });

  useEffect(() => {
    setMounted(true);

    // Cargar reseñas guardadas para esta historia
    if (typeof window !== "undefined") {
      try {
        const savedRev = localStorage.getItem(`ficnation_reviews_${storyId}`);
        if (savedRev) {
          setReviewsList(JSON.parse(savedRev));
        } else {
          setReviewsList([]);
        }
      } catch {
        setReviewsList([]);
      }
    }

    async function loadStoryFromSupabase() {
      if (!storyId) return;
      setIsLoading(true);

      try {
        const supabase = createClient();
        
        // 1. Cargar datos de la historia
        const { data: dbStory } = await supabase
          .from("stories")
          .select(`
            id,
            title,
            synopsis,
            genre,
            tags,
            cover_url,
            reads_count,
            votes_count,
            is_completed,
            author_id,
            age_rating,
            content_warnings,
            story_type,
            volumes,
            story_votes(count),
            story_views(count),
            profiles!author_id (
              id,
              name,
              username,
              avatar_url
            )
          `)
          .eq("id", storyId)
          .maybeSingle();

        if (dbStory) {
          const author = dbStory.profiles as any;
          const initialVotes = Number((dbStory as any).story_votes?.[0]?.count ?? dbStory.votes_count ?? 0);
          const initialReads = Math.max(
            Number((dbStory as any).story_views?.[0]?.count ?? dbStory.reads_count ?? 0),
            initialVotes
          );
          setVotesCount(initialVotes);
          setStory({
            id: dbStory.id,
            title: dbStory.title,
            synopsis: dbStory.synopsis,
            genre: dbStory.genre || "Fantasía",
            tags: dbStory.tags || ["Magia", "Aventura"],
            coverImage: dbStory.cover_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
            reads: String(initialReads),
            votes: String(initialVotes),
            chapters: 0,
            completed: dbStory.is_completed,
            status: dbStory.is_completed ? "completa" : "en_desarrollo",
            ageRating: dbStory.age_rating || "TP",
            contentWarnings: dbStory.content_warnings || [],
            storyType: dbStory.story_type || "tradicional",
            author: {
              name: author?.name || "Autor",
              username: author?.username || "autor",
              avatar: author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            },
          });

        }

        // Cargar estado de voto / estrella persistente
        hasUserVotedStory(storyId, user?.id).then((voted) => {
          setHasVoted(voted);
        });

        // 2. Cargar capítulos reales y tomos de esta historia
        const storyVols = (dbStory as any)?.volumes;
        if (storyVols && Array.isArray(storyVols)) {
          setStoryVolumes(storyVols);
        } else if (typeof window !== "undefined") {
          try {
            const savedVols = JSON.parse(localStorage.getItem(`ficnation_volumes_${storyId}`) || "[]");
            if (savedVols && savedVols.length > 0) setStoryVolumes(savedVols);
          } catch {}
        }

        const { data: dbChapters } = await supabase
          .from("chapters")
          .select("id, chapter_number, title, word_count, is_published, scheduled_at, volume_id, volume_title, created_at")
          .eq("story_id", storyId)
          .order("chapter_number", { ascending: true });

        if (dbChapters && dbChapters.length > 0) {
          const isAuthor = user?.id && (user.id === dbStory?.author_id);
          const filteredChapters = isAuthor
            ? dbChapters
            : dbChapters.filter((c: any) => c.is_published === true || (c.scheduled_at && new Date(c.scheduled_at).getTime() > Date.now()));

          setChaptersList(
            filteredChapters.map((c: any) => ({
              id: c.id,
              number: c.chapter_number,
              title: c.title,
              words: c.word_count || 0,
              date: new Date(c.created_at || Date.now()).toLocaleDateString("es-ES"),
              reads: "0",
              isPublished: c.is_published,
              scheduledAt: c.scheduled_at || null,
              volumeId: c.volume_id || null,
              volumeTitle: c.volume_title || null,
            }))
          );
        }

        // 3. Verificar si está en la biblioteca del usuario
        if (user) {
          const { data: libEntry } = await supabase
            .from("library_entries")
            .select("id")
            .eq("user_id", user.id)
            .eq("story_id", storyId)
            .maybeSingle();

          if (libEntry) {
            setIsSavedInLibrary(true);
          }
        } else if (typeof window !== "undefined") {
          try {
            const savedList = JSON.parse(localStorage.getItem("ficnation_library") || "[]");
            setIsSavedInLibrary(savedList.some((s: any) => s.id === storyId));
          } catch {}
        }

        // 4. Fallback de historia y capítulos creados por el autor en esta sesión / local
        if (typeof window !== "undefined") {
          try {
            if (!dbStory) {
              const localUserStories = JSON.parse(localStorage.getItem("ficnation_user_stories") || "[]");
              const localStory = localUserStories.find((s: any) => s.id === storyId);
              const localProfile = JSON.parse(localStorage.getItem("ficnation_cached_profile") || "{}");

              if (localStory) {
                const initialLocalReads = Number(localStory.readsCount || 0);
                const initialLocalVotes = Number(localStory.votesCount || 0);
                setVotesCount(initialLocalVotes);
                setStory({
                  id: localStory.id,
                  title: localStory.title,
                  synopsis: localStory.synopsis,
                  genre: localStory.genre || "Fantasía",
                  tags: localStory.tags || ["Aventura"],
                  coverImage: localStory.coverUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
                  reads: String(initialLocalReads),
                  votes: String(initialLocalVotes),
                  chapters: localStory.chaptersCount || 0,
                  completed: localStory.status === "completa",
                  status: localStory.status || "en_desarrollo",
                  ageRating: localStory.ageRating || "TP",
                  contentWarnings: localStory.contentWarnings || [],
                  storyType: localStory.storyType || "tradicional",
                  author: {
                    name: localProfile.name || "Autor",
                    username: localProfile.username || "autor",
                    avatar: localProfile.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                  },
                });
              }
            }

            if (!dbChapters || dbChapters.length === 0) {
              const localChapters = JSON.parse(localStorage.getItem(`ficnation_chapters_${storyId}`) || "[]");
              const localVols = JSON.parse(localStorage.getItem(`ficnation_volumes_${storyId}`) || "[]");
              if (localVols && localVols.length > 0) setStoryVolumes(localVols);

              if (localChapters && localChapters.length > 0) {
                setChaptersList(
                  localChapters.map((c: any) => ({
                    id: c.id,
                    number: c.chapterNumber,
                    title: c.title,
                    words: c.wordCount || 0,
                    date: c.updatedAt || new Date().toLocaleDateString("es-ES"),
                    reads: "0",
                    isPublished: c.isPublished,
                    scheduledAt: c.scheduledAt || null,
                    volumeId: c.volumeId || null,
                    volumeTitle: c.volumeTitle || null,
                  }))
                );
                setStory((prev) => (prev ? { ...prev, chapters: localChapters.length } : prev));
              }
            }
          } catch {}
        }

        // 5. Cargar reseñas de la historia desde Supabase
        const { data: dbReviews } = await supabase
          .from("reviews")
          .select(`
            id,
            rating,
            content,
            likes_count,
            created_at,
            user_id,
            profiles!user_id (
              name,
              username,
              avatar_url
            )
          `)
          .eq("story_id", storyId)
          .order("created_at", { ascending: false });

        if (dbReviews && dbReviews.length > 0) {
          setReviewsList(
            dbReviews.map((r: any) => ({
              id: r.id,
              author: r.profiles?.name || "Lector",
              username: r.profiles?.username || "lector",
              avatar: r.profiles?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
              rating: r.rating || 5,
              date: new Date(r.created_at).toLocaleDateString("es-ES"),
              comment: r.content,
              likes: r.likes_count || 0,
            }))
          );
        }
      } catch {
        // Fallback local en caso de error
        if (typeof window !== "undefined") {
          try {
            const localChapters = JSON.parse(localStorage.getItem(`ficnation_chapters_${storyId}`) || "[]");
            if (localChapters && localChapters.length > 0) {
              setChaptersList(
                localChapters.map((c: any) => ({
                  id: c.id,
                  number: c.chapterNumber,
                  title: c.title,
                  words: c.wordCount || 0,
                  date: c.updatedAt || new Date().toLocaleDateString("es-ES"),
                  reads: "0",
                }))
              );
            }
          } catch {}
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadStoryFromSupabase();
  }, [storyId, user]);

  // Escuchar eventos globales de votos y vistas
  useEffect(() => {
    const handleStoryVoted = (e: any) => {
      if (e.detail && e.detail.storyId === storyId) {
        setHasVoted(e.detail.hasVoted);
        setVotesCount(e.detail.newCount);
        setStory((prev) => ({ ...prev, votes: String(e.detail.newCount) }));
      }
    };
    const handleStoryViewed = (e: any) => {
      if (e.detail && e.detail.storyId === storyId) {
        setStory((prev) => ({ ...prev, reads: String(e.detail.readsCount) }));
      }
    };

    window.addEventListener("ficnation_story_voted", handleStoryVoted);
    window.addEventListener("ficnation_story_viewed", handleStoryViewed);
    return () => {
      window.removeEventListener("ficnation_story_voted", handleStoryVoted);
      window.removeEventListener("ficnation_story_viewed", handleStoryViewed);
    };
  }, [storyId]);

  // Manejador de Votos / Estrellas Persistentes
  const handleVote = async () => {
    const targetAuthorId = story.author?.id || (story as any).author_id;
    const { hasVoted: nextVoted, newCount } = await toggleStoryVote({
      storyId,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
      storyTitle: story.title,
      authorId: targetAuthorId,
      currentCount: votesCount,
    });

    setHasVoted(nextVoted);
    setVotesCount(newCount);
    setStory((prev) => ({ ...prev, votes: String(newCount) }));

    if (nextVoted) {
      addXp(15, "Estrella a historia");
    }
  };

  // Guardar en Biblioteca
  const handleToggleLibrary = async () => {
    const nextSaved = !isSavedInLibrary;
    setIsSavedInLibrary(nextSaved);

    try {
      const savedList = JSON.parse(localStorage.getItem("ficnation_library") || "[]");
      const index = savedList.findIndex((s: any) => s.id === storyId);

      if (nextSaved && index === -1) {
        savedList.unshift({
          id: story.id,
          storyId: story.id,
          title: story.title,
          coverImage: story.coverImage,
          genre: story.genre,
          author: story.author,
          synopsis: story.synopsis,
          reads: story.reads,
          votes: story.votes,
          chapters: story.chapters,
          completed: story.completed,
          status: "sin_iniciar",
          currentChapter: 1,
          totalChapters: chaptersList.length || 1,
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
            story_id: storyId,
            status: "guardado",
            current_chapter: 1,
            progress_percent: 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,story_id" });
        } else {
          await supabase.from("library_entries").delete().eq("user_id", user.id).eq("story_id", storyId);
        }
      }
    } catch {}

    const targetAuthorId = story.author?.id || (story as any).author_id;
    if (nextSaved && user && targetAuthorId) {
      // Otorgar XP al lector
      addXp(10, "Guardado en biblioteca");

      sendNotification({
        recipientId: targetAuthorId,
        actor: {
          id: user.id,
          name: user.name || "Usuario",
          avatar: user.avatar,
        },
        type: "library",
        storyId: story.id,
        storyTitle: story.title,
      });
    }
  };

  // Copiar Enlace
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Enviar Nueva Reseña
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const newReview = {
      id: `r-${Date.now()}`,
      author: user?.name || "Lector",
      username: user?.username || "lector",
      avatar: user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      rating: reviewRating,
      date: "Ahora mismo",
      comment: reviewText.trim(),
      likes: 1,
    };

    const nextReviews = [newReview, ...reviewsList];
    setReviewsList(nextReviews);
    if (typeof window !== "undefined") {
      localStorage.setItem(`ficnation_reviews_${storyId}`, JSON.stringify(nextReviews));
    }

    if (user && storyId) {
      try {
        const supabase = createClient();
        supabase.from("reviews").insert({
          story_id: storyId,
          user_id: user.id,
          rating: reviewRating,
          content: reviewText.trim(),
          likes_count: 0,
        }).then();
      } catch {}
    }

    // Otorgar XP por reseña
    addXp(20, "Publicación de reseña");

    const targetAuthorId = story.author?.id || (story as any).author_id;
    if (user && targetAuthorId) {
      sendNotification({
        recipientId: targetAuthorId,
        actor: {
          id: user.id,
          name: user.name || "Usuario",
          avatar: user.avatar,
        },
        type: "comment",
        storyId: story.id,
        storyTitle: story.title,
        customMessage: `${user.name || "Un lector"} dejó una reseña en tu historia "${story.title}".`,
      });
    }

    setReviewText("");
  };

  const status = story.status || (story.completed ? "completa" : "en_desarrollo");
  const statusBadge = {
    completa: { label: "Completa", class: "bg-emerald-950/90 text-emerald-300 border-emerald-500/50", icon: CheckCircle2 },
    en_desarrollo: { label: "En Desarrollo", class: "bg-cyan-950/90 text-cyan-300 border-cyan-500/50", icon: Clock },
    cancelada: { label: "Cancelada", class: "bg-rose-950/90 text-rose-300 border-rose-500/50", icon: AlertCircle },
    borrador: { label: "Borrador Privado", class: "bg-amber-950/90 text-amber-300 border-amber-500/50", icon: Clock },
  }[status] || { label: "En Desarrollo", class: "bg-cyan-950/90 text-cyan-300 border-cyan-500/50", icon: Clock };

  const StatusIcon = statusBadge.icon;

  return (
    <div className="flex flex-col gap-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-20">

      {/* Botón Volver */}
      <div className="flex items-center justify-between">
        <Link
          href="/explorar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </Link>
      </div>

      {/* ═══════════════════ 1. HERO HEADER CINEMÁTICO ═══════════════════ */}
      <div
        className="relative rounded-3xl border fic-card shadow-md overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
      >
        <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
          
          {/* Portada Tamaño Póster Real con soporte GIF y Shimmer */}
          <div className="relative w-48 sm:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-md shrink-0 border group" style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}>
            <FicImage
              src={story.coverImage}
              alt={story.title}
              fallbackType="cover"
              className="transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Badge de Estado flotante */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border backdrop-blur-md shadow-md ${statusBadge.class}`}>
                <StatusIcon className="w-3 h-3" />
                <span>{statusBadge.label}</span>
              </span>
            </div>
          </div>

          {/* Información y Acciones Principales */}
          <div className="flex flex-col justify-between flex-1 space-y-4 text-center md:text-left">
            
            <div className="space-y-2">
              {/* Género, Clasificación de Edad, Formato y Tags */}
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold border shadow-xs"
                  style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                >
                  {story.genre}
                </span>

                {/* Badge de Clasificación por Edad */}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-black border backdrop-blur-md shadow-sm ${
                    story.ageRating === "+18"
                      ? "bg-rose-950/90 text-rose-300 border-rose-500/70 shadow-rose-950/50"
                      : story.ageRating === "+16"
                      ? "bg-amber-950/90 text-amber-300 border-amber-500/60"
                      : story.ageRating === "+13"
                      ? "bg-cyan-950/90 text-cyan-300 border-cyan-500/60"
                      : "bg-emerald-950/90 text-emerald-300 border-emerald-500/60"
                  }`}
                >
                  {story.ageRating || "TP"}
                </span>

                {/* Badge de Formato */}
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold border fic-card-secondary"
                  style={{ color: "var(--text-badge)" }}
                >
                  {story.storyType === "interactiva" ? "🎮 Interactiva" : "📖 Tradicional"}
                </span>

                {story.tags.map((tag) => (
                  <span key={tag} className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Título Principal */}
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
                {story.title}
              </h1>

              {/* Avisos de Contenido (si existen) */}
              {story.contentWarnings && story.contentWarnings.length > 0 && (
                <div className="flex items-center justify-center md:justify-start gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1 mr-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Avisos de Contenido:</span>
                  </span>
                  {story.contentWarnings.map((cw) => (
                    <span
                      key={cw}
                      className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-200 shadow-xs"
                    >
                      {cw}
                    </span>
                  ))}
                </div>
              )}

              {/* Autor con Avatar GIF, Indicador de Presencia y enlace al Perfil */}
              <div className="flex items-center justify-center md:justify-start gap-2.5 pt-1">
                <Link
                  href={`/usuario?id=${story.author.username}`}
                  className="inline-flex items-center gap-2 group/author hover:opacity-100"
                >
                  <div className="relative h-7 w-7 rounded-full overflow-hidden border shadow-xs transition-all shrink-0" style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}>
                    <FicImage
                      src={story.author.avatar}
                      alt={story.author.name}
                      fallbackType="avatar"
                    />
                    {mounted && (isUserOnline(story.author.username) || ((story as any).author_id && isUserOnline((story as any).author_id))) && (
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                    )}
                  </div>
                  <span className="text-sm font-bold transition-colors flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                    <span>{story.author.name}</span>
                    {isUserVerified(story.author.username || (story as any).author_id) && (
                      <VerifiedBadge
                        size="xs"
                        variant={checkIsAdmin(story.author) ? "creator" : "verified"}
                      />
                    )}
                  </span>
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    @{story.author.username}
                  </span>
                  {mounted && (isUserOnline(story.author.username) || ((story as any).author_id && isUserOnline((story as any).author_id))) && (
                    <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      En línea
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Métricas Resumen */}
            <div className="flex items-center justify-center md:justify-start gap-6 py-2 border-y text-xs sm:text-sm font-medium" style={{ borderColor: "var(--border-primary)", color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                <strong className="font-bold" style={{ color: "var(--text-primary)" }}>{story.reads}</strong> Lecturas
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500/40" />
                <strong className="font-bold" style={{ color: "var(--text-primary)" }}>{votesCount}</strong> Votos
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                <strong className="font-bold" style={{ color: "var(--text-primary)" }}>{chaptersList.length}</strong> Capítulos
              </span>
            </div>

            {/* Botones de Acción Primarios */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              
              {/* Empezar a Leer */}
              {chaptersList.length > 0 ? (
                <Link
                  href={`/leer?storyId=${story.id}&chapter=1`}
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-xs sm:text-sm font-extrabold shadow-md hover:scale-105 transition-all fic-btn-primary"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Empezar a Leer (Cap. 1)</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-xs sm:text-sm font-bold cursor-not-allowed opacity-60 fic-card-secondary"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Sin capítulos publicados</span>
                </button>
              )}

              {/* Guardar en Biblioteca */}
              <button
                onClick={handleToggleLibrary}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  isSavedInLibrary
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-sm"
                    : "fic-card-secondary hover:scale-105"
                }`}
              >
                {isSavedInLibrary ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>En mi Biblioteca</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                    <span style={{ color: "var(--text-primary)" }}>Guardar</span>
                  </>
                )}
              </button>

              {/* Dar Estrella / Votar */}
              <button
                onClick={handleVote}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  hasVoted
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300 shadow-sm"
                    : "fic-card-secondary hover:scale-105"
                }`}
                title={hasVoted ? "Has votado esta historia (Haz clic para retirar estrella)" : "Dar una estrella a esta historia (+15 XP)"}
              >
                <Star className={`w-4 h-4 transition-transform ${hasVoted ? "fill-amber-500 text-amber-500 scale-110" : "text-amber-500"}`} />
                <span style={{ color: "var(--text-primary)" }}>{hasVoted ? "¡Estrella dada!" : "Dar Estrella"}</span>
              </button>

              {/* Compartir */}
              <button
                onClick={handleCopyLink}
                className="p-3 rounded-full border transition-all cursor-pointer fic-card-secondary hover:scale-105"
                title="Copiar enlace"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
              </button>

            </div>

          </div>

        </div>
      </div>

      {/* ═══════════════════ 2. PESTAÑAS DE CONTENIDO ═══════════════════ */}
      <div className="space-y-6">
        
        {/* Selector de Pestañas */}
        <div className="flex items-center gap-2 border-b pb-3 flex-wrap" style={{ borderColor: "var(--border-primary)" }}>
          <button
            onClick={() => setActiveTab("capitulos")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "capitulos"
                ? "fic-btn-primary shadow-sm"
                : "fic-card-secondary hover:opacity-85"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Índice de Capítulos ({chaptersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("sinopsis")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "sinopsis"
                ? "fic-btn-primary shadow-sm"
                : "fic-card-secondary hover:opacity-85"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Sinopsis y Ficha</span>
          </button>

          <button
            onClick={() => setActiveTab("resenas")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "resenas"
                ? "fic-btn-primary shadow-sm"
                : "fic-card-secondary hover:opacity-85"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Reseñas de Lectores ({reviewsList.length})</span>
          </button>
        </div>

        {/* ──────────────── CONTENIDO 1: ÍNDICE DE CAPÍTULOS ──────────────── */}
        {activeTab === "capitulos" && (
          <div className="space-y-4">
            {chaptersList.length > 0 ? (
              (() => {
                const renderChapterRow = (chapter: ChapterSummary) => {
                  const isScheduledFuture = !chapter.isPublished && !!chapter.scheduledAt && new Date(chapter.scheduledAt).getTime() > Date.now();
                  const isDraft = !chapter.isPublished && !isScheduledFuture;

                  if (isDraft) {
                    return (
                      <div
                        key={chapter.number}
                        className="flex items-center justify-between p-4 rounded-2xl border border-dashed transition-all shadow-xs fic-card-secondary opacity-85"
                        style={{ borderColor: "var(--border-primary)" }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-mono font-bold shrink-0 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          >
                            {chapter.number}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                                {chapter.title}
                              </h3>
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <span>Borrador Privado</span>
                              </span>
                            </div>
                            <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                              {chapter.words} palabras • Solo visible para ti como autor
                            </p>
                          </div>
                        </div>

                        <Link
                          href="/escribir"
                          className="px-3 py-1.5 rounded-xl border text-xs font-bold border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shrink-0 transition-colors"
                        >
                          Gestionar
                        </Link>
                      </div>
                    );
                  }

                  if (isScheduledFuture) {
                    return (
                      <div
                        key={chapter.number}
                        className="flex items-center justify-between p-4 rounded-2xl border border-dashed transition-all shadow-xs fic-card-secondary opacity-75 select-none"
                        style={{ borderColor: "var(--border-primary)" }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-mono font-bold shrink-0 border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-300"
                          >
                            {chapter.number}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                                {chapter.title}
                              </h3>
                              <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-300">
                                <CalendarClock className="w-3 h-3 text-purple-400" />
                                <span>Estreno: {new Date(chapter.scheduledAt!).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}</span>
                              </span>
                            </div>
                            <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                              {chapter.words} palabras • Próximo lanzamiento oficial
                            </p>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shrink-0" title="Capítulo programado">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={chapter.number}
                      href={`/leer?storyId=${story.id}&chapter=${chapter.number}`}
                      className="flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.01] shadow-xs group fic-card-secondary"
                      style={{ borderColor: "var(--border-primary)" }}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-mono font-bold transition-colors shrink-0"
                          style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                        >
                          {chapter.number}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold transition-colors truncate" style={{ color: "var(--text-primary)" }}>
                              {chapter.title}
                            </h3>
                            {chapter.volumeTitle && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-300">
                                <Layers className="w-2.5 h-2.5" />
                                <span>{chapter.volumeTitle}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                            {chapter.words} palabras • Publicado el {chapter.date}
                          </p>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl border transition-all fic-card shrink-0">
                        <Play className="w-3.5 h-3.5 fill-current" style={{ color: "var(--text-badge)" }} />
                      </div>
                    </Link>
                  );
                };

                // Si hay Tomos, renderizar agrupados por Tomo
                if (storyVolumes.length > 0) {
                  return (
                    <div className="space-y-6">
                      {storyVolumes.map((vol) => {
                        const isCollapsed = !!collapsedVolumes[vol.id];
                        const volChapters = chaptersList.filter((c) => c.volumeId === vol.id);
                        const volWords = volChapters.reduce((acc, c) => acc + (c.words || 0), 0);

                        return (
                          <div
                            key={vol.id}
                            className="rounded-3xl border overflow-hidden fic-card"
                            style={{ borderColor: "var(--border-primary)" }}
                          >
                            <button
                              type="button"
                              onClick={() => setCollapsedVolumes((prev) => ({ ...prev, [vol.id]: !prev[vol.id] }))}
                              className="w-full flex items-center justify-between gap-3 p-4 bg-purple-500/5 hover:bg-purple-500/10 transition-colors border-b border-purple-500/20 text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="p-1 rounded-lg text-purple-400">
                                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                                      {vol.title}
                                    </h3>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold">
                                      {volChapters.length} {volChapters.length === 1 ? "capítulo" : "capítulos"}
                                    </span>
                                    <span className="text-[10px] font-mono opacity-60" style={{ color: "var(--text-muted)" }}>
                                      {volWords.toLocaleString()} palabras
                                    </span>
                                  </div>
                                  {vol.description && (
                                    <p className="text-xs line-clamp-1 opacity-70 mt-0.5" style={{ color: "var(--text-muted)" }}>
                                      {vol.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>

                            {!isCollapsed && (
                              <div className="p-3.5 space-y-2.5">
                                {volChapters.length > 0 ? (
                                  volChapters.map((ch) => renderChapterRow(ch))
                                ) : (
                                  <p className="text-center py-6 text-xs opacity-60" style={{ color: "var(--text-muted)" }}>
                                    Próximamente se añadirán capítulos a este tomo.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Capítulos Sueltos si existen */}
                      {(() => {
                        const unassigned = chaptersList.filter((c) => !c.volumeId || !storyVolumes.some((v) => v.id === c.volumeId));
                        if (unassigned.length === 0) return null;

                        return (
                          <div
                            className="rounded-3xl border overflow-hidden fic-card"
                            style={{ borderColor: "var(--border-primary)" }}
                          >
                            <div className="p-4 bg-stone-500/5 border-b" style={{ borderColor: "var(--border-primary)" }}>
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-amber-500" />
                                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                  Capítulos Adicionales ({unassigned.length})
                                </h3>
                              </div>
                            </div>
                            <div className="p-3.5 space-y-2.5">
                              {unassigned.map((ch) => renderChapterRow(ch))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }

                // Lista directa sin tomos
                return <div className="space-y-2.5">{chaptersList.map((ch) => renderChapterRow(ch))}</div>;
              })()
            ) : (
              <div className="p-12 text-center rounded-3xl border space-y-2 fic-card-secondary">
                <BookOpen className="w-8 h-8 opacity-50 mx-auto" style={{ color: "var(--text-muted)" }} />
                <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Esta historia aún no tiene capítulos</h4>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>El autor publicará nuevos episodios próximamente.</p>
              </div>
            )}
          </div>
        )}

        {/* ──────────────── CONTENIDO 2: SINOPSIS Y DETALLES ──────────────── */}
        {activeTab === "sinopsis" && (
          <div className="p-6 sm:p-8 rounded-3xl border space-y-6 shadow-sm fic-card">
            <div className="space-y-2">
              <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>Sinopsis Completa</h3>
              <p className="text-xs sm:text-sm leading-relaxed max-w-3xl whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                {story.synopsis || "Sinopsis en redacción por el autor."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t text-xs" style={{ borderColor: "var(--border-primary)" }}>
              <div className="p-3.5 rounded-2xl border fic-card-secondary">
                <p style={{ color: "var(--text-muted)" }}>Género Literario</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{story.genre}</p>
              </div>
              <div className="p-3.5 rounded-2xl border fic-card-secondary">
                <p style={{ color: "var(--text-muted)" }}>Clasificación de Edad</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${
                    story.ageRating === "+18"
                      ? "bg-rose-950/90 text-rose-300 border-rose-500/60"
                      : story.ageRating === "+16"
                      ? "bg-amber-950/90 text-amber-300 border-amber-500/60"
                      : story.ageRating === "+13"
                      ? "bg-cyan-950/90 text-cyan-300 border-cyan-500/60"
                      : "bg-emerald-950/90 text-emerald-300 border-emerald-500/60"
                  }`}>
                    {story.ageRating || "TP"}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                    {story.ageRating === "+18" ? "Maduro / NSFW" : story.ageRating === "+16" ? "Jóvenes Adultos" : story.ageRating === "+13" ? "Adolescentes" : "Todo Público"}
                  </span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border fic-card-secondary">
                <p style={{ color: "var(--text-muted)" }}>Formato Narrativo</p>
                <p className="text-sm font-bold mt-0.5 capitalize" style={{ color: "var(--text-primary)" }}>
                  {story.storyType === "interactiva" ? "🎮 Interactiva" : "📖 Tradicional"}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl border fic-card-secondary">
                <p style={{ color: "var(--text-muted)" }}>Estado de Publicación</p>
                <p className="text-sm font-bold mt-0.5 capitalize" style={{ color: "var(--text-primary)" }}>{status.replace("_", " ")}</p>
              </div>
            </div>

            {story.contentWarnings && story.contentWarnings.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Advertencias & Avisos de Contenido</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {story.contentWarnings.map((cw) => (
                    <span
                      key={cw}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-700 dark:text-amber-200"
                    >
                      {cw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────────────── CONTENIDO 3: RESEÑAS Y COMENTARIOS ──────────────── */}
        {activeTab === "resenas" && (
          <div className="space-y-6">
            
            {/* Formulario para Dejar Reseña */}
            <form onSubmit={handleAddReview} className="p-5 rounded-3xl border space-y-3.5 shadow-sm fic-card">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Sparkles className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                Deja tu Reseña u Opinión
              </h3>

              {/* Selector de Estrellas */}
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Tu valoración:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${star <= reviewRating ? "fill-amber-500" : "opacity-30"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="¿Qué te pareció la historia? Deja un comentario constructivo para el autor..."
                className="w-full rounded-2xl border fic-input p-3 text-xs placeholder:opacity-40 focus:outline-none resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!reviewText.trim()}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer fic-btn-primary"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar Reseña</span>
                </button>
              </div>
            </form>

            {/* Listado de Reseñas */}
            <div className="space-y-3">
              {reviewsList.length > 0 ? (
                reviewsList.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 sm:p-5 rounded-2xl border fic-card-secondary space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/usuario?id=${review.username}`}
                        className="flex items-center gap-2.5 group/author"
                      >
                        <div className="relative h-7 w-7 rounded-full overflow-hidden border shadow-xs" style={{ borderColor: "var(--border-primary)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={review.avatar} alt={review.author} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold transition-colors" style={{ color: "var(--text-primary)" }}>
                            {review.author}
                          </h4>
                          <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>@{review.username}</p>
                        </div>
                      </Link>

                      {/* Estrellas */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed pl-9" style={{ color: "var(--text-secondary)" }}>
                      {review.comment}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pl-9" style={{ color: "var(--text-muted)" }}>
                      <span>{review.date}</span>
                      <span>{review.likes} personas les pareció útil</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-2xl border space-y-2 fic-card-secondary">
                  <MessageSquare className="w-8 h-8 opacity-40 mx-auto" style={{ color: "var(--text-muted)" }} />
                  <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Aún no hay reseñas para esta historia</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>¡Sé el primero en compartir tu opinión con el autor y la comunidad!</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
