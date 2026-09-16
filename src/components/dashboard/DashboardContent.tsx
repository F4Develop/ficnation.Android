"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  Compass,
  Shield,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Users,
  Play,
  Coins,
  DollarSign,
  X,
  CheckCircle2,
  Zap,
  Flame,
  Heart,
  Tag,
  BookmarkCheck,
  Megaphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePresence } from "@/context/PresenceContext";
import { useSettings } from "@/context/SettingsContext";
import { type Story } from "@/data/mockStories";
import { StoryCard } from "@/components/stories/StoryCard";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { createClient } from "@/lib/supabase/client";
import { FicImage } from "@/components/ui/FicImage";
import {
  getContinueReadingStories,
  getReadingStreak,
  type ReadingProgressEntry,
  type ReadingStreakData,
} from "@/lib/readingProgress";
import {
  isUserVerified,
  getEmergencyBanner,
  type EmergencyBannerData,
  checkIsAdmin,
} from "@/lib/adminAuth";

const POPULAR_GENRES = [
  {
    id: "fantasia",
    name: "Fantasía",
    tag: "Magia & Isekai",
    desc: "Reinos arcanos, invocaciones y mundos sin límite.",
    gradient: "from-purple-900/60 via-indigo-900/40 to-purple-950/70",
    border: "border-purple-500/30 hover:border-purple-500/70",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    icon: Sparkles,
  },
  {
    id: "anime",
    name: "Anime / Fanfic",
    tag: "Crossovers & Canon",
    desc: "Tus personajes y universos favoritos en nuevas tramas.",
    gradient: "from-amber-900/60 via-red-900/40 to-orange-950/70",
    border: "border-amber-500/30 hover:border-amber-500/70",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    icon: Flame,
  },
  {
    id: "romance",
    name: "Romance",
    tag: "Pasión & Lazos",
    desc: "Encuentros predestinados, drama y química irresistible.",
    gradient: "from-rose-900/60 via-pink-900/40 to-rose-950/70",
    border: "border-rose-500/30 hover:border-rose-500/70",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    icon: Heart,
  },
  {
    id: "scifi",
    name: "Ciencia Ficción",
    tag: "Cósmico & Cyberpunk",
    desc: "Inteligencia artificial, galaxias lejanas y futuros distópicos.",
    gradient: "from-cyan-900/60 via-blue-900/40 to-cyan-950/70",
    border: "border-cyan-500/30 hover:border-cyan-500/70",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    icon: Zap,
  },
  {
    id: "slice_of_life",
    name: "Slice of Life",
    tag: "Calidez & Amistad",
    desc: "Historias reconfortantes, comedia y crecimiento personal.",
    gradient: "from-emerald-900/60 via-teal-900/40 to-emerald-950/70",
    border: "border-emerald-500/30 hover:border-emerald-500/70",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    icon: BookOpen,
  },
  {
    id: "aventura",
    name: "Aventura",
    tag: "Exploración & Peligro",
    desc: "Travesías épicas, misterios antiguos y desafíos extremos.",
    gradient: "from-blue-900/60 via-indigo-900/40 to-slate-950/70",
    border: "border-blue-500/30 hover:border-blue-500/70",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    icon: Compass,
  },
];

const DEFAULT_COMMUNITY_MEMBERS = [
  {
    id: "f4-creator",
    name: "F4",
    username: "f4",
    avatar: "/default-avatar.svg",
    level: 6,
    levelTitle: "Creador",
    isVerified: true,
    isCreator: true,
  },
  {
    id: "just-g-author",
    name: "Just_G",
    username: "just_g",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    level: 3,
    levelTitle: "Escritor Errante",
    isVerified: true,
    isCreator: false,
  },
  {
    id: "marjos-author",
    name: "Marjos04",
    username: "marjos04",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    level: 2,
    levelTitle: "Aprendiz de Letras",
    isVerified: false,
    isCreator: false,
  },
  {
    id: "raecher-author",
    name: "Raecher Sterling2",
    username: "raecher2",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    level: 4,
    levelTitle: "Forjador de Historias",
    isVerified: false,
    isCreator: false,
  },
];

export default function DashboardContent() {
  const { user } = useAuth();
  const { isUserOnline } = usePresence();
  const { t } = useSettings();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Estado de Usuarios Recientes de Comunidad (Inicializado de forma idéntica para SSR y Cliente)
  const [communityUsers, setCommunityUsers] = useState<any[]>(DEFAULT_COMMUNITY_MEMBERS);

  // Estado de lecturas en progreso
  const [readingList, setReadingList] = useState<ReadingProgressEntry[]>([]);
  const [recommendedStories, setRecommendedStories] = useState<any[]>([]);
  const [allCatalogStories, setAllCatalogStories] = useState<Story[]>([]);

  // Estado de Racha de Lectura Real
  const [streakData, setStreakData] = useState<ReadingStreakData>({
    streak: 1,
    todayChaptersCount: 0,
    dailyGoal: 3,
    lastReadDate: "",
  });

  // Banner de Emergencia / Anuncio Global de Administración
  const [emergencyBanner, setEmergencyBannerState] = useState<EmergencyBannerData>({
    isActive: false,
    message: "",
    type: "info",
  });

  // Referencia y control para el carrusel de recomendados
  const recommendedScrollRef = useRef<HTMLDivElement>(null);

  const scrollRecommended = (direction: "left" | "right") => {
    if (recommendedScrollRef.current) {
      const scrollAmount = direction === "left" ? -460 : 460;
      recommendedScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Estado y control para el carrusel de Todas las Historias creadas
  const [allCreatedStories, setAllCreatedStories] = useState<Story[]>([]);
  const allStoriesScrollRef = useRef<HTMLDivElement>(null);

  const scrollAllStories = (direction: "left" | "right") => {
    if (allStoriesScrollRef.current) {
      const scrollAmount = direction === "left" ? -680 : 680;
      allStoriesScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Pestaña de género seleccionada para la vitrina interactiva
  const [selectedGenreTab, setSelectedGenreTab] = useState<string>("Todos");
  const genreStoriesScrollRef = useRef<HTMLDivElement>(null);

  const scrollGenreStories = (direction: "left" | "right") => {
    if (genreStoriesScrollRef.current) {
      const scrollAmount = direction === "left" ? -680 : 680;
      genreStoriesScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient();
        
        // 1. Cargar historias publicadas desde Supabase (solo aquellas con is_published: true)
        let dbStoriesList: any[] = [];
        try {
          const { data: dbStories, error } = await supabase
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
              is_published,
              created_at,
              author_id,
              profiles!author_id (
                id,
                name,
                username,
                avatar_url
              ),
              chapters (id, is_published)
            `)
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(100);

          if (!error && dbStories && dbStories.length > 0) {
            dbStoriesList = dbStories;
          } else {
            // Intento alternativo directo: consultar historias publicadas y enriquecer con profiles por author_id
            const { data: fallbackStories } = await supabase
              .from("stories")
              .select("*")
              .eq("is_published", true)
              .order("created_at", { ascending: false })
              .limit(100);

            if (fallbackStories && fallbackStories.length > 0) {
              const authorIds = Array.from(
                new Set(fallbackStories.map((s: any) => s.author_id).filter(Boolean))
              );
              let profileMap: Record<string, any> = {};
              if (authorIds.length > 0) {
                const { data: profilesData } = await supabase
                  .from("profiles")
                  .select("id, name, username, avatar_url")
                  .in("id", authorIds);
                if (profilesData) {
                  profilesData.forEach((p: any) => {
                    profileMap[p.id] = p;
                  });
                }
              }

              dbStoriesList = fallbackStories.map((s: any) => ({
                ...s,
                profiles: profileMap[s.author_id] || null,
              }));
            }
          }
        } catch {
          // Fallback de red
        }

        let list: Story[] = [];

        // Leer datos locales de apoyo (votos del usuario y taller)
        let localVotedIds: string[] = [];
        let localList: any[] = [];
        let localProfile: any = {};
        if (typeof window !== "undefined") {
          try {
            localVotedIds = JSON.parse(localStorage.getItem("ficnation_story_votes") || "[]");
            const rawUserStories = localStorage.getItem("ficnation_user_stories");
            const rawStories = localStorage.getItem("ficnation_stories");
            localList = [
              ...(rawUserStories ? JSON.parse(rawUserStories) : []),
              ...(rawStories ? JSON.parse(rawStories) : []),
            ];
            localProfile = JSON.parse(localStorage.getItem("ficnation_cached_profile") || "{}");
          } catch {}
        }

        if (dbStoriesList.length > 0) {
          list = dbStoriesList
            .filter((s: any) => {
              if (s.is_published === false) return false;
              const pubChaps = (s.chapters || []).filter((c: any) => c.is_published !== false).length;
              const localMatch = localList.find((l: any) => l.id === s.id);
              const totalChaps = Math.max(pubChaps, Number(localMatch?.publishedChaptersCount ?? (localMatch?.status === "borrador" ? 0 : localMatch?.chaptersCount ?? 0)));
              return pubChaps > 0 || totalChaps > 0 || (s.chapters === undefined && Number(s.chapters_count || 0) > 0);
            })
            .map((s: any) => {
              const localMatch = localList.find((l: any) => l.id === s.id);
              const userHasVoted = localVotedIds.includes(s.id);
              const isCurrentUser = Boolean(user?.id && s.author_id === user.id);

              const rawVotes = Math.max(
                Number(s.votes_count || 0),
                Number(localMatch?.votesCount || localMatch?.votes || 0),
                userHasVoted ? 1 : 0
              );

              // Una obra con votos ha tenido que ser vista al menos tantas veces como estrellas recibió
              const rawReads = Math.max(
                Number(s.reads_count || 0),
                Number(localMatch?.readsCount || localMatch?.reads || 0),
                rawVotes
              );

              // Sincronizar en DB en segundo plano si la historia tenía menos vistas que estrellas
              if (s.id && rawReads > Number(s.reads_count || 0)) {
                supabase.from("stories").update({ reads_count: rawReads }).eq("id", s.id).then();
              }

              const pubChaps = (s.chapters || []).filter((c: any) => c.is_published !== false).length;
              const rawChapters = Math.max(
                pubChaps,
                Number(localMatch?.publishedChaptersCount ?? (localMatch?.status === "borrador" ? 0 : localMatch?.chaptersCount ?? localMatch?.chapters?.length ?? 0))
              );

              const authorProfile = s.profiles;
              const authorName =
                authorProfile?.name ||
                (isCurrentUser ? user?.name : null) ||
                localProfile?.name ||
                s.author_name ||
                "Autor";

              const authorUsername =
                authorProfile?.username ||
                (isCurrentUser ? user?.username : null) ||
                localProfile?.username ||
                s.author_username ||
                "autor";

              const authorAvatar =
                authorProfile?.avatar_url ||
                (isCurrentUser ? user?.avatar : null) ||
                localProfile?.avatar ||
                s.author_avatar ||
                "/default-avatar.svg";

              return {
                id: s.id,
                title: s.title || "Historia sin título",
                synopsis: s.synopsis || "",
                genre: s.genre || "Fantasía",
                tags: Array.isArray(s.tags) ? s.tags : [],
                coverImage: s.cover_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
                reads: String(rawReads),
                votes: String(rawVotes),
                chapters: rawChapters,
                completed: Boolean(s.is_completed),
                status: s.is_completed ? "completa" : "en_desarrollo",
                author: {
                  id: s.author_id || (isCurrentUser ? user?.id : undefined),
                  name: authorName,
                  username: authorUsername,
                  avatar: authorAvatar,
                  isVerified: isUserVerified(authorUsername) || isUserVerified(s.author_id),
                },
              };
            });
        }

        // 2. Unir creaciones locales que no estén en la base de datos (solo publicadas y con capítulos)
        localList.forEach((lu: any) => {
          const isPub = lu.isPublished === true || lu.is_published === true;
          const chapCount = Number(lu.publishedChaptersCount ?? (lu.status === "borrador" ? 0 : lu.chaptersCount ?? lu.chapters?.length ?? 0));
          if (lu && lu.id && isPub && chapCount > 0 && lu.status !== "borrador" && !list.some((s) => s.id === lu.id)) {
            const userHasVoted = localVotedIds.includes(lu.id);
            const rawVotes = Math.max(Number(lu.votesCount ?? lu.votes ?? 0), userHasVoted ? 1 : 0);
            const rawReads = Math.max(Number(lu.readsCount ?? lu.reads ?? 0), rawVotes);
            list.unshift({
              id: lu.id,
              title: lu.title || "Historia",
              synopsis: lu.synopsis || "",
              genre: lu.genre || "Fantasía",
              tags: Array.isArray(lu.tags) ? lu.tags : [],
              coverImage: lu.coverUrl || lu.coverImage || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
              reads: String(rawReads),
              votes: String(rawVotes),
              chapters: chapCount,
              completed: lu.status === "completa" || Boolean(lu.is_completed),
              status: lu.status || (lu.is_completed ? "completa" : "en_desarrollo"),
              author: {
                id: lu.author?.id || user?.id,
                name: lu.author?.name || localProfile.name || "Tú",
                username: lu.author?.username || localProfile.username || "autor",
                avatar: lu.author?.avatar || localProfile.avatar || "/default-avatar.svg",
                isVerified: isUserVerified(lu.author?.username || localProfile.username || user?.username),
              },
            });
          }
        });

        if (list.length > 0) {
          setAllCreatedStories(list);
          setAllCatalogStories(list);
          const popularList = [...list].sort(
            (a, b) => (Number(b.reads) + Number(b.votes)) - (Number(a.reads) + Number(a.votes))
          );
          setRecommendedStories(popularList);
        }
      } catch {
        // Fallback
      }
    }

    // Inicializar racha de lectura real
    setStreakData(getReadingStreak());

    loadDashboardData();

    // Cargar lecturas en curso (Continuar Leyendo)
    async function loadContinueReading() {
      try {
        const continueStories = await getContinueReadingStories(user?.id);
        setReadingList(continueStories);
      } catch {}
    }

    loadContinueReading();

    // Escuchar eventos en tiempo real cuando el usuario lee o cambia de capítulo
    const handleReadingUpdated = () => {
      loadContinueReading();
    };

    const handleStoryVoted = (e: any) => {
      if (e.detail?.storyId) {
        setRecommendedStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId ? { ...s, votes: String(e.detail.newCount) } : s
          )
        );
        setAllCreatedStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId ? { ...s, votes: String(e.detail.newCount) } : s
          )
        );
      }
    };

    const handleStoryViewed = (e: any) => {
      if (e.detail?.storyId) {
        setRecommendedStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId ? { ...s, reads: String(e.detail.readsCount) } : s
          )
        );
        setAllCreatedStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId ? { ...s, reads: String(e.detail.readsCount) } : s
          )
        );
      }
    };

    const handleStreakChange = () => {
      setStreakData(getReadingStreak());
    };

    if (typeof window !== "undefined") {
      window.addEventListener("ficnation_reading_updated", handleReadingUpdated);
      window.addEventListener("ficnation_reading_updated", handleStreakChange);
      window.addEventListener("ficnation_streak_updated", handleStreakChange);
      window.addEventListener("ficnation_story_voted", handleStoryVoted);
      window.addEventListener("ficnation_story_viewed", handleStoryViewed);
      window.addEventListener("storage", handleReadingUpdated);
    }

    // Cargar caché local inmediatamente en cliente sin causar hydration mismatch
    try {
      const cached = localStorage.getItem("ficnation_community_cached");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCommunityUsers(parsed);
        }
      }
    } catch {}

    // Cargar autores recientes de Supabase en background sin bloquear
    async function loadRecentCommunity() {
      try {
        const supabase = createClient();
        const { data: dbProfiles, error } = await supabase
          .from("profiles")
          .select("id, name, username, avatar_url, xp, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && dbProfiles && dbProfiles.length > 0) {
          const formatted = dbProfiles.map((p) => {
            const uName = p.username || p.name?.toLowerCase().replace(/\s+/g, "_") || p.id;
            const xpVal = Number(p.xp || 0);
            const lvl = Math.max(1, Math.floor(Math.sqrt(xpVal / 100)) + 1);
            const isCreator = checkIsAdmin({ username: uName, name: p.name });
            const isVerified = isUserVerified(uName) || isUserVerified(p.id);

            return {
              id: p.id,
              name: p.name || "Autor",
              username: uName,
              avatar: p.avatar_url || "/default-avatar.svg",
              level: lvl,
              levelTitle: isCreator ? "Creador" : lvl > 3 ? "Escritor Errante" : "Iniciado",
              isVerified,
              isCreator,
            };
          });

          setCommunityUsers(formatted);
          if (typeof window !== "undefined") {
            localStorage.setItem("ficnation_community_cached", JSON.stringify(formatted));
          }
        }
      } catch {
        // Ignora errores de conexión
      }
    }

    loadRecentCommunity();

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("ficnation_reading_updated", handleReadingUpdated);
        window.removeEventListener("ficnation_reading_updated", handleStreakChange);
        window.removeEventListener("ficnation_streak_updated", handleStreakChange);
        window.removeEventListener("ficnation_story_voted", handleStoryVoted);
        window.removeEventListener("ficnation_story_viewed", handleStoryViewed);
        window.removeEventListener("storage", handleReadingUpdated);
      }
    };
  }, [user?.id]);

  // Separar la última lectura (cuadro grande) de las demás lecturas
  const primaryReading = readingList.length > 0 ? readingList[0] : null;
  const secondaryReadings = readingList.length > 1 ? readingList.slice(1, 4) : [];

  // Filtrado dinámico de historias por género seleccionado
  const genreFilteredStories = selectedGenreTab === "Todos"
    ? recommendedStories
    : recommendedStories.filter((s) => {
        const g = (s.genre || "").toLowerCase();
        if (selectedGenreTab === "Anime / Fanfic") {
          return g.includes("anime") || g.includes("fanfic");
        }
        return g.includes(selectedGenreTab.toLowerCase());
      });

  // Etiquetas populares calculadas 100% dinámicas de las historias reales cargadas
  const popularTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    allCatalogStories.forEach((story) => {
      if (Array.isArray(story.tags)) {
        story.tags.forEach((t) => {
          const cleanTag = t.trim().replace(/^#/, "");
          if (cleanTag && cleanTag.length > 1) {
            tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
          }
        });
      }
      if (story.genre && story.genre !== "Todos") {
        tagCounts[story.genre] = (tagCounts[story.genre] || 0) + 1;
      }
    });

    const sorted = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count: String(count) }));

    return sorted;
  }, [allCatalogStories]);

  return (
    <div className="flex flex-col gap-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-20">
      <div className="space-y-8">
        {/* Banner de Emergencia / Anuncio Global de Administración */}
        {emergencyBanner.isActive && emergencyBanner.message && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 p-4 shadow-lg flex items-center justify-between gap-4 animate-fade-in text-xs font-bold text-amber-200">
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
              <span>{emergencyBanner.message}</span>
            </div>
            {emergencyBanner.actionText && (
              <Link
                href={emergencyBanner.actionUrl || "#"}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] shadow-sm transition-all shrink-0"
              >
                {emergencyBanner.actionText}
              </Link>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* 1. BANNER CINEMÁTICO PANORÁMICO                            */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden rounded-3xl min-h-[260px] sm:min-h-[300px] flex items-center shadow-xl border border-purple-500/20 dark:border-white/10 animate-hero-entrance group">
          {/* Arte de fondo panorámico */}
          <div className="absolute inset-0 z-0">
            <FicImage
              src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80"
              alt="FicNation Cinematic Universe"
              fallbackType="cover"
              className="w-full h-full object-cover object-center scale-100 group-hover:scale-105 transition-transform duration-1000"
            />
          </div>

          {/* Degradado cinemático para legibilidad perfecta */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 sm:via-black/70 to-black/30 sm:to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl pointer-events-none z-10" />

          {/* Contenido en primer plano */}
          <div className="relative z-20 p-6 sm:p-10 lg:p-12 max-w-2xl text-left space-y-4">
            {/* Badges superiores */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>UNIVERSO LITERARIO FICNATION</span>
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 font-bold backdrop-blur-md">
                v2.4 Live
              </span>
            </div>

            {/* Título Principal */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight flex items-center gap-2.5 flex-wrap">
                <span>¡Hola de vuelta,</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-300">
                  {user?.name || "Creador"}
                </span>
                <span>!</span>
                <VerifiedBadge size="md" variant={checkIsAdmin(user) ? "creator" : "verified"} />
              </h1>

              <p className="text-xs sm:text-sm text-zinc-200 font-medium max-w-lg leading-relaxed drop-shadow-sm">
                Historias sin límite, universos infinitos. Explora miles de obras creadas por la comunidad o da vida a tu propio relato en el taller.
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/explorar"
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-black bg-gradient-to-r from-amber-400 via-pink-400 to-purple-300 hover:scale-105 transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-black" />
                <span>Explorar Catálogo</span>
              </Link>

              <Link
                href="/escribir"
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:scale-105 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span>Escribir Historia</span>
              </Link>

              <Link
                href="/eventos"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold text-purple-300 hover:text-white transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Evento: Battle City</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* 2. GRID PRINCIPAL: 8 COLS (LECTURAS + CATÁLOGO) + 4 COLS   */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-body-entrance">
          
          {/* ───── COLUMNA PRINCIPAL (8 COLS): LECTURAS Y RECOMENDADOS ───── */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Bloque Continuar Leyendo */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border shadow-xs" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{t("dashboard.continueReading")}</h2>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t("dashboard.continueReadingSubtitle")}</p>
                  </div>
                </div>

                <Link
                  href="/biblioteca"
                  className="text-xs font-semibold hover:opacity-80 transition-opacity flex items-center gap-1"
                  style={{ color: "var(--text-badge)" }}
                >
                  <span>{t("dashboard.myLibraryLink")}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {primaryReading ? (
                <div className="space-y-4">
                  {/* Tarjeta Hero de la Última Lectura */}
                  <div
                    className="rounded-3xl border fic-card p-5 sm:p-6 shadow-md relative overflow-hidden flex flex-col sm:flex-row gap-5 items-center sm:items-start group transition-all"
                    style={{ background: "var(--reading-hero-bg)", borderColor: "var(--reading-hero-border)" }}
                  >
                    {/* Portada */}
                    <div className="relative h-44 w-28 sm:h-52 sm:w-36 rounded-2xl overflow-hidden shadow-md shrink-0 border" style={{ borderColor: "var(--border-primary)" }}>
                      <FicImage
                        src={primaryReading.coverUrl || primaryReading.coverImage || (primaryReading as any).cover_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80"}
                        alt={primaryReading.title}
                        fallbackType="cover"
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                      <span
                        className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold border backdrop-blur-md z-10"
                        style={{ background: "var(--reading-badge-bg)", color: "var(--reading-badge-text)", borderColor: "var(--reading-badge-border)" }}
                      >
                        En Curso
                      </span>
                    </div>

                    {/* Info y Progreso */}
                    <div className="flex flex-col justify-between flex-1 h-full space-y-3 w-full">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-badge)" }}>
                          {primaryReading.genre || "Fantasía"}
                        </span>
                        <h3 className="text-base sm:text-lg font-extrabold line-clamp-1 transition-colors" style={{ color: "var(--reading-hero-title)" }}>
                          {primaryReading.title}
                        </h3>
                        <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--reading-hero-synopsis)" }}>
                          {primaryReading.synopsis || "Una cautivadora travesía a través de reinos olvidados y secretos arcanos."}
                        </p>
                      </div>

                      {/* Barra de Progreso y Capítulo */}
                      <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--border-primary)" }}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                            <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                            Capítulo {primaryReading.currentChapter ?? (primaryReading as any).current_chapter ?? 1}
                          </span>
                          <span className="font-mono font-bold" style={{ color: "var(--text-badge)" }}>
                            {primaryReading.progressPercent ?? (primaryReading as any).progress_percent ?? 10}%
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--reading-progress-track)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${primaryReading.progressPercent ?? (primaryReading as any).progress_percent ?? 10}%`, background: "var(--reading-progress-fill)" }}
                          />
                        </div>
                      </div>

                      {/* Botón Reanudar */}
                      <Link
                        href={`/leer?storyId=${primaryReading.storyId || primaryReading.id}&chapter=${primaryReading.currentChapter ?? (primaryReading as any).current_chapter ?? 1}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl py-2 px-5 text-xs font-bold shadow-md hover:scale-[1.01] transition-all fic-btn-primary w-full sm:w-auto self-start"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Reanudar Cap. {primaryReading.currentChapter ?? (primaryReading as any).current_chapter ?? 1}</span>
                      </Link>
                    </div>
                  </div>

                  {/* Otras Lecturas Secundarias */}
                  {secondaryReadings.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {secondaryReadings.map((story) => {
                        const sChapter = story.currentChapter ?? (story as any).current_chapter ?? 1;
                        const sProgress = story.progressPercent ?? (story as any).progress_percent ?? 10;
                        const sId = story.storyId || story.id;
                        const sCover = story.coverUrl || story.coverImage || (story as any).cover_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80";

                        return (
                          <div
                            key={sId}
                            className="p-3 rounded-2xl border fic-card-secondary transition-all flex items-center gap-3 group shadow-xs hover:scale-[1.01]"
                          >
                            <div className="relative h-12 w-9 rounded-xl overflow-hidden shrink-0 border" style={{ borderColor: "var(--border-primary)" }}>
                              <img
                                src={sCover}
                                alt={story.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                                {story.title}
                              </h4>
                              <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                                Cap. {sChapter} • {sProgress}%
                              </p>
                            </div>

                            <Link
                              href={`/leer?storyId=${sId}&chapter=${sChapter}`}
                              className="p-1.5 rounded-xl fic-card hover:scale-105 transition-transform shrink-0"
                              title="Reanudar"
                            >
                              <Play className="w-3 h-3 fill-current" style={{ color: "var(--text-badge)" }} />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Estado Vacío */
                <div className="flex flex-col items-center justify-center text-center p-8 rounded-3xl border fic-card-secondary space-y-3 min-h-[200px]">
                  <BookOpen className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>No tienes lecturas en progreso</h3>
                  <p className="text-xs max-w-sm" style={{ color: "var(--text-muted)" }}>
                    Encuentra historias en nuestro catálogo para comenzar a leer hoy mismo.
                  </p>
                  <Link
                    href="/explorar"
                    className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold shadow-sm hover:scale-105 transition-all fic-btn-primary"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Explorar Catálogo</span>
                  </Link>
                </div>
              )}
            </section>

            {/* Bloque Recomendados para Ti (Carrusel Horizontal) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border shadow-xs" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Recomendados para ti</h2>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Historias populares seleccionadas para tu gusto</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Flechas de Navegación del Carrusel */}
                  {recommendedStories.length > 0 && (
                    <div className="flex items-center gap-1.5 mr-1">
                      <button
                        type="button"
                        onClick={() => scrollRecommended("left")}
                        className="p-1.5 rounded-xl border fic-card-secondary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                        style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                        aria-label="Anterior"
                        title="Desplazar a la izquierda"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollRecommended("right")}
                        className="p-1.5 rounded-xl border fic-card-secondary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                        style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                        aria-label="Siguiente"
                        title="Desplazar a la derecha"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <Link
                    href="/explorar"
                    className="text-xs font-semibold hover:opacity-80 transition-opacity flex items-center gap-1"
                    style={{ color: "var(--text-badge)" }}
                  >
                    <span>Ver todo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {recommendedStories.length > 0 ? (
                <div
                  ref={recommendedScrollRef}
                  className="flex items-stretch gap-3.5 overflow-x-auto scroll-smooth pb-3 pt-1 px-1 snap-x snap-mandatory"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {recommendedStories.map((story) => (
                    <div
                      key={story.id}
                      className="shrink-0 snap-start"
                      style={{ width: "220px", minWidth: "220px", maxWidth: "220px" }}
                    >
                      <StoryCard story={story} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 rounded-3xl border fic-card-secondary text-xs" style={{ color: "var(--text-muted)" }}>
                  Cargando recomendaciones del catálogo...
                </div>
              )}
            </section>

          </div>

          {/* ───── COLUMNA LATERAL (4 COLS): COMUNIDAD ACTIVA ───── */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Widget: Comunidad de Autores Activos */}
            <div className="rounded-3xl border fic-card p-4 sm:p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t("dashboard.activeCommunity")}</h3>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{t("dashboard.authorsOnline")}</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border fic-card-secondary" style={{ color: "var(--text-badge)" }}>
                  {communityUsers.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {communityUsers.length > 0 ? (
                  communityUsers.map((member) => {
                    const isOnline = isUserOnline(member.id) || isUserOnline(member.username) || Boolean(member.isCreator);
                    return (
                      <Link
                        key={member.id}
                        href={`/usuario?id=${member.username || member.id}`}
                        className="flex items-center justify-between p-2 rounded-2xl border fic-card-secondary hover:scale-[1.01] hover:border-purple-500/40 transition-all group shadow-xs"
                        style={{ borderColor: "var(--border-primary)" }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Avatar con presencia */}
                          <div className="relative shrink-0">
                            <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-purple-500/30 group-hover:ring-purple-500 transition-all">
                              <FicImage
                                src={member.avatar}
                                alt={member.name}
                                fallbackType="avatar"
                              />
                            </div>
                            {isOnline && (
                              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center z-10">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-2 ring-white dark:ring-black"></span>
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate group-hover:text-purple-400 transition-colors flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                                <span>{member.name}</span>
                                {member.isVerified && (
                                  <VerifiedBadge
                                    size="xs"
                                    variant={member.isCreator ? "creator" : "verified"}
                                  />
                                )}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border shrink-0" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                                Nv. {member.level}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono truncate" style={{ color: "var(--text-muted)" }}>
                              @{member.username}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    Cargando comunidad...
                  </div>
                )}
              </div>

              <div className="pt-2 border-t text-center" style={{ borderColor: "var(--border-primary)" }}>
                <Link
                  href="/explorar"
                  className="text-[11px] font-bold text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1"
                >
                  <span>Explorar creadores</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Widget: Racha de Lectura & Hábitos (DATOS REALES) */}
            <div className="rounded-3xl border fic-card p-4 sm:p-5 shadow-md space-y-3.5">
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-500">
                    <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Racha de Lectura</h3>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Hábito literario activo</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  🔥 {streakData.streak} {streakData.streak === 1 ? "día" : "días"}
                </span>
              </div>

              {/* Meta de hoy */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Capítulos de hoy</span>
                  <span className="font-mono text-purple-400 font-bold">
                    {streakData.todayChaptersCount} / {streakData.dailyGoal}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-black/15 dark:bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((streakData.todayChaptersCount / Math.max(1, streakData.dailyGoal)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] leading-relaxed pt-1" style={{ color: "var(--text-muted)" }}>
                  {streakData.todayChaptersCount >= streakData.dailyGoal
                    ? "¡Meta diaria cumplida! Tu racha está protegida y has ganado XP de lector 🔥"
                    : `¡Lee ${Math.max(1, streakData.dailyGoal - streakData.todayChaptersCount)} capítulo(s) más hoy para mantener tu racha encendida y ganar XP!`}
                </p>
              </div>
            </div>

            {/* Widget: Etiquetas Populares (DINÁMICO CON DATOS REALES) */}
            <div className="rounded-3xl border fic-card p-4 sm:p-5 shadow-md space-y-3.5">
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border bg-purple-500/10 border-purple-500/30 text-purple-400">
                    <Tag className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Etiquetas Populares</h3>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Temas en catálogo</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {popularTags.length > 0 ? (
                  popularTags.map((item) => (
                    <Link
                      key={item.tag}
                      href={`/explorar?search=${encodeURIComponent(item.tag)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium border fic-card-secondary hover:border-purple-500/50 hover:text-purple-400 transition-all shadow-xs"
                      style={{ borderColor: "var(--border-primary)" }}
                    >
                      <span>#{item.tag}</span>
                      <span className="text-[9px] font-mono text-stone-400">({item.count})</span>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 italic py-2">
                    Las etiquetas se actualizarán con las obras del catálogo.
                  </p>
                )}
              </div>
            </div>

          </aside>

        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIONES EXPANDIDAS A ANCHO COMPLETO (DESPUÉS DE ETIQUETAS) */}
        {/* ══════════════════════════════════════════════════════════ */}

        {/* NOVEDADES: TODAS LAS HISTORIAS CREADAS (ANCHO COMPLETO) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border shadow-xs" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Todas las Historias</h2>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Todas las obras y universos creados en la plataforma</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {allCreatedStories.length > 0 && (
                <div className="flex items-center gap-1.5 mr-1">
                  <button
                    type="button"
                    onClick={() => scrollAllStories("left")}
                    className="p-1.5 rounded-xl border fic-card-secondary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                    style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                    aria-label="Anterior"
                    title="Desplazar a la izquierda"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollAllStories("right")}
                    className="p-1.5 rounded-xl border fic-card-secondary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                    style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                    aria-label="Siguiente"
                    title="Desplazar a la derecha"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <Link
                href="/explorar"
                className="text-xs font-semibold hover:opacity-80 transition-opacity flex items-center gap-1"
                style={{ color: "var(--text-badge)" }}
              >
                <span>Ver todo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {allCreatedStories.length > 0 ? (
            <div
              ref={allStoriesScrollRef}
              className="flex items-stretch gap-3.5 overflow-x-auto scroll-smooth pb-3 pt-1 px-1 snap-x snap-mandatory"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {allCreatedStories.map((story) => (
                <div
                  key={story.id}
                  className="shrink-0 snap-start"
                  style={{ width: "220px", minWidth: "220px", maxWidth: "220px" }}
                >
                  <StoryCard story={story} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 rounded-3xl border fic-card-secondary text-xs" style={{ color: "var(--text-muted)" }}>
              Cargando todas las historias creadas...
            </div>
          )}
        </section>

        {/* 3. BENTO DE GÉNEROS Y MUNDOS POPULARES (ANCHO COMPLETO) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border shadow-xs" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Mundos & Géneros</h2>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Explora universos literarios según tu estado de ánimo</p>
              </div>
            </div>

            <Link
              href="/explorar"
              className="text-xs font-semibold hover:opacity-80 transition-opacity flex items-center gap-1"
              style={{ color: "var(--text-badge)" }}
            >
              <span>Explorar todos</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Grid Bento de Géneros en ancho completo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {POPULAR_GENRES.map((g) => {
              const Icon = g.icon;
              return (
                <Link
                  key={g.id}
                  href={`/explorar?genre=${encodeURIComponent(g.name)}`}
                  className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br ${g.gradient} ${g.border}`}
                >
                  <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border backdrop-blur-md ${g.badge}`}>
                        <Icon className="w-3 h-3" />
                        <span>{g.tag}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                        {g.name}
                      </h3>
                      <p className="text-[11px] text-white/70 line-clamp-2 mt-0.5 leading-snug">
                        {g.desc}
                      </p>
                    </div>
                  </div>

                  {/* Brillo sutil en hover */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* 4. VITRINA INTERACTIVA DE HISTORIAS POR GÉNERO (ANCHO COMPLETO) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border shadow-xs" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Historias por Categoría</h2>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Filtra y descubre sin salir del dashboard</p>
              </div>
            </div>

            {/* Flechas de navegación para la vitrina */}
            {genreFilteredStories.length > 0 && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => scrollGenreStories("left")}
                  className="p-1.5 rounded-xl border fic-card-secondary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                  style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                  aria-label="Anterior"
                  title="Desplazar a la izquierda"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollGenreStories("right")}
                  className="p-1.5 rounded-xl border fic-card-secondary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                  style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                  aria-label="Siguiente"
                  title="Desplazar a la derecha"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Pestañas de selección de género */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {["Todos", "Anime / Fanfic", "Fantasía", "Romance", "Slice of Life", "Ciencia Ficción", "Aventura"].map((tab) => {
              const isActive = selectedGenreTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedGenreTab(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? "fic-btn-primary text-white shadow-md scale-105"
                      : "fic-card-secondary hover:opacity-80"
                  }`}
                  style={{
                    borderColor: isActive ? "transparent" : "var(--border-primary)",
                    color: isActive ? "#ffffff" : "var(--text-muted)",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Historias filtradas */}
          {genreFilteredStories.length > 0 ? (
            <div
              ref={genreStoriesScrollRef}
              className="flex items-stretch gap-3.5 overflow-x-auto scroll-smooth pb-3 pt-1 px-1 snap-x snap-mandatory"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {genreFilteredStories.map((story) => (
                <div
                  key={story.id}
                  className="shrink-0 snap-start"
                  style={{ width: "220px", minWidth: "220px", maxWidth: "220px" }}
                >
                  <StoryCard story={story} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 rounded-3xl border fic-card-secondary space-y-3" style={{ borderColor: "var(--border-primary)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Aún no hay historias publicadas en <strong>{selectedGenreTab}</strong>.
              </p>
              <Link
                href="/escribir"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-white shadow-sm fic-btn-primary hover:scale-105 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>¡Sé el primer autor en escribir aquí!</span>
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL DETALLES DE LA NUEVA ACTUALIZACIÓN (RELEASE NOTES)   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-scale">
          <div
            className="w-full max-w-2xl rounded-3xl border fic-card p-6 sm:p-8 shadow-2xl space-y-6 max-h-[88vh] overflow-y-auto"
            style={{ borderColor: "var(--border-primary)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border-primary)" }}>
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center border shadow-xs bg-purple-500/10 border-purple-500/20 text-purple-400">
                  <Sparkles className="w-6 h-6 animate-pulse text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>
                      Notas de la Nueva Actualización
                    </h3>
                    <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300">
                      v2.4 Live
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Economía de creadores, regalos, retiros desde $5 USD y rediseño de perfil.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-2 rounded-full border fic-card-secondary hover:scale-105 transition-all cursor-pointer"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {/* Listado de Novedades por Categorías */}
            <div className="space-y-4 text-xs">

              {/* 1. Economía & Donaciones */}
              <div className="p-4.5 rounded-2xl border space-y-2.5 fic-card-secondary" style={{ borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                  <Coins className="w-4 h-4" />
                  <span>1. Sistema de FicCoins y Regalos a Autores</span>
                </div>
                <ul className="space-y-1.5 pl-6 list-disc" style={{ color: "var(--text-secondary)" }}>
                  <li><strong>Moneda Interna (En Planeación):</strong> Planes diseñados desde <strong>$0.50 hasta $100.00 USD</strong> (100 FicCoins = $1.00 USD) con bonificaciones de hasta +30% extra que estarán disponibles próximamente.</li>
                  <li><strong>Regalos Virtuales:</strong> Apoya a tus autores favoritos enviando <em>Café de Autor, Pluma Dorada, Grimorio Arcano, Corona Cósmica</em> o montos personalizados con dedicatorias de ánimo.</li>
                  <li><strong>Puntos de Donación:</strong> Disponible al final de cada capítulo y en el perfil público de los escritores.</li>
                </ul>
              </div>

              {/* 2. Retiros con Umbral $5 USD */}
              <div className="p-4.5 rounded-2xl border space-y-2.5 fic-card-secondary" style={{ borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>2. Centro de Creadores y Retiros ($5.00 USD Mínimo)</span>
                </div>
                <ul className="space-y-1.5 pl-6 list-disc" style={{ color: "var(--text-secondary)" }}>
                  <li><strong>Umbral Accesible:</strong> Retira tus ganancias a partir de solo <strong>$5.00 USD (500 FicCoins ganadas)</strong>.</li>
                  <li><strong>Múltiples Métodos:</strong> Cobro disponible vía <strong>PayPal</strong>, <strong>Transferencia Bancaria Directa (CLABE/IBAN)</strong> y <strong>Cripto (USDT TRC20)</strong>.</li>
                  <li><strong>Seguimiento en Vivo:</strong> Barra de progreso hacia tu meta de retiro e historial de solicitudes con estados en tiempo real (Pendiente, Pagado, Rechazado).</li>
                </ul>
              </div>

              {/* 3. Rediseño del Perfil de Usuario */}
              <div className="p-4.5 rounded-2xl border space-y-2.5 fic-card-secondary" style={{ borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>3. Rediseño Maestro de Perfil e Identidad</span>
                </div>
                <ul className="space-y-1.5 pl-6 list-disc" style={{ color: "var(--text-secondary)" }}>
                  <li><strong>Portada Panorámica Cine:</strong> Mayor altura visual, degradados estilizados y botón de portada con contraste reforzado.</li>
                  <li><strong>Avatar Flotante + Estado Activo:</strong> Indicador verde de conexión en tiempo real con efecto pulsante en la esquina de la foto de perfil.</li>
                  <li><strong>Contador Minimalista:</strong> Indicador privado <code>[🪙 0 (+)]</code> en el perfil para abrir la Billetera sin recargar la pantalla.</li>
                  <li><strong>Espaciado Armonioso:</strong> Distribución espaciosa y sin saturación entre biografía, métricas, niveles de XP e insignias.</li>
                </ul>
              </div>

              {/* 4. Blindaje Legal & Rendimiento */}
              <div className="p-4.5 rounded-2xl border space-y-2.5 fic-card-secondary" style={{ borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>4. Blindaje Legal, Estabilidad y Mejoras</span>
                </div>
                <ul className="space-y-1.5 pl-6 list-disc" style={{ color: "var(--text-secondary)" }}>
                  <li><strong>100% Legal para Fanfiction:</strong> Modelo de donación voluntaria general sin muros de pago en historias protegidas por copyright.</li>
                  <li><strong>Sincronización Cliente Óptima:</strong> Carga directa en el navegador para eliminar advertencias de hidratación de raíz.</li>
                  <li><strong>Notificaciones Automáticas:</strong> Alertas instantáneas al recibir regalos o actualizaciones en el estado de tus retiros.</li>
                </ul>
              </div>

            </div>

            {/* Footer con Acciones Rápidas */}
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border-primary)" }}>
              <Link
                href="/avatar"
                onClick={() => setIsUpdateModalOpen(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:scale-105 transition-all fic-btn-primary"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Explorar Mi Billetera</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border fic-card-secondary hover:scale-105 transition-all cursor-pointer"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
