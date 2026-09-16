"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import {
  Sparkles,
  Flame,
  BookOpen,
  Star,
  Compass,
  ChevronRight,
  Play,
  Bookmark,
  Users,
  CheckCircle2,
} from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, type MobileTab } from "@/components/mobile/MobileBottomNav";
import { MobileStoryCard } from "@/components/mobile/MobileStoryCard";
import { MobileStoryDetailView } from "@/app/m/historia/page";
import { MobileReaderView } from "@/app/m/leer/page";
import { MobileExploreView } from "@/app/m/explorar/page";
import { MobileLibraryView } from "@/app/m/biblioteca/page";
import { MobileProfileView } from "@/app/m/perfil/page";
import { MobileWriterView } from "@/app/m/escribir/page";
import { MobileNotificationsView } from "@/app/m/notificaciones/page";
import { createClient } from "@/lib/supabase/client";
import { type Story } from "@/data/mockStories";

const GENRES = ["Todos", "Fantasía", "Romance", "Anime / Fanfic", "Isekai", "Ciencia Ficción", "Misterio", "Slice of Life"];

export type MobileScreen =
  | { type: "home" }
  | { type: "explore" }
  | { type: "write" }
  | { type: "notifications" }
  | { type: "library" }
  | { type: "profile" }
  | { type: "story"; storyId: string }
  | { type: "reader"; storyId: string; chapter: number };

interface AnnouncementBanner {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  ctaText: string;
  screenTarget: MobileScreen;
  icon: string;
  gradientBg: string;
}

const DASHBOARD_ANNOUNCEMENTS: AnnouncementBanner[] = [
  {
    id: "banner-1",
    badge: "ACTUALIZACIÓN V2.0",
    badgeColor: "from-purple-500 to-indigo-500",
    title: "¡FicNation Android Oficial!",
    description: "Modo de lectura offline, nuevo editor con tipografías y efectos de texto inmersivos.",
    ctaText: "Explorar",
    screenTarget: { type: "explore" },
    icon: "🚀",
    gradientBg: "from-purple-950/80 via-indigo-950/60 to-[#070a12]",
  },
  {
    id: "banner-2",
    badge: "EVENTO DE AUTORES",
    badgeColor: "from-amber-500 to-orange-500",
    title: "Torneo de Fanfics & Obras",
    description: "Escribe tu nuevo capítulo esta semana y compite por premios de hasta 5,000 monedas.",
    ctaText: "Escribir",
    screenTarget: { type: "write" },
    icon: "🏆",
    gradientBg: "from-amber-950/70 via-purple-950/50 to-[#070a12]",
  },
  {
    id: "banner-3",
    badge: "COMUNIDAD & CLUB",
    badgeColor: "from-emerald-500 to-teal-500",
    title: "Historias Originales Cada Día",
    description: "Descubre universos creados por autores hispanos y apoya con votos y comentarios.",
    ctaText: "Biblioteca",
    screenTarget: { type: "library" },
    icon: "✨",
    gradientBg: "from-emerald-950/60 via-slate-950/60 to-[#070a12]",
  },
];

function MobileAppContainer() {
  const [screen, setScreen] = useState<MobileScreen>({ type: "home" });
  const [history, setHistory] = useState<MobileScreen[]>([{ type: "home" }]);

  const [stories, setStories] = useState<Story[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [recentRead, setRecentRead] = useState<{ storyId: string; chapter: number; progress: number; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Navegación en memoria (0 recargas, compatible con botón atrás de Android)
  const navigateTo = (next: MobileScreen) => {
    setHistory((prev) => [...prev, next]);
    setScreen(next);
    if (typeof window !== "undefined") {
      window.history.pushState({ ficScreen: next }, "");
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else if (history.length > 1) {
      const nextHistory = [...history];
      nextHistory.pop();
      const prev = nextHistory[nextHistory.length - 1];
      setHistory(nextHistory);
      setScreen(prev);
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      setScreen({ type: "home" });
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.ficScreen) {
        setScreen(e.state.ficScreen);
      } else {
        setScreen({ type: "home" });
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Timer para el banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % DASHBOARD_ANNOUNCEMENTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // 1. Cargar historias reales de Supabase
  useEffect(() => {
    async function loadStories() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
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
            created_at,
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
          .limit(30);

        if (!error && data) {
          const mapped: Story[] = data
            .filter((s: any) => {
              const publishedChapters = Array.isArray(s.chapters)
                ? s.chapters.filter((c: any) => c.is_published !== false)
                : [];
              return publishedChapters.length > 0;
            })
            .map((s: any) => {
              const profile = s.profiles as any;
              const publishedChapters = Array.isArray(s.chapters)
                ? s.chapters.filter((c: any) => c.is_published !== false)
                : [];
              return {
                id: s.id,
                title: s.title,
                synopsis: s.synopsis || "",
                coverImage: s.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
                author: {
                  id: s.author_id,
                  name: profile?.name || profile?.username || "Autor FicNation",
                  username: profile?.username ? `@${profile.username}` : "@autor",
                  avatar: profile?.avatar_url || "/logo.jpg",
                },
                genre: s.genre || "Fantasía",
                tags: Array.isArray(s.tags) ? s.tags : [],
                chapters: publishedChapters.length,
                reads: String(s.reads_count ?? 0),
                votes: String(s.votes_count ?? 0),
                completed: s.is_completed || false,
              };
            });
          setStories(mapped);
        }
      } catch (err) {
        console.error("Error al cargar historias en m/page:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStories();

    // 2. Cargar progreso reciente de lectura
    try {
      const savedProgress = localStorage.getItem("ficnation_recent_read");
      if (savedProgress) {
        setRecentRead(JSON.parse(savedProgress));
      }
    } catch {}

    // 3. Escuchar actualizaciones de votos y lecturas en tiempo real
    const handleStoryVoted = (e: any) => {
      if (e.detail?.storyId) {
        setStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId ? { ...s, votes: String(e.detail.newCount) } : s
          )
        );
      }
    };

    const handleStoryViewed = (e: any) => {
      if (e.detail?.storyId) {
        setStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId ? { ...s, reads: String(e.detail.readsCount) } : s
          )
        );
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("ficnation_story_voted", handleStoryVoted);
      window.addEventListener("ficnation_story_viewed", handleStoryViewed);
    }

    // 4. Revisar si la URL trae algún parámetro inicial (ej: ?storyId=... o ?tab=...)
    try {
      const params = new URLSearchParams(window.location.search);
      const sId = params.get("storyId") || params.get("id");
      const ch = params.get("chapter");
      const tab = params.get("tab");

      if (sId && ch) {
        setScreen({ type: "reader", storyId: sId, chapter: parseInt(ch, 10) || 1 });
      } else if (sId) {
        setScreen({ type: "story", storyId: sId });
      } else if (tab === "explore" || tab === "library" || tab === "write" || tab === "profile") {
        setScreen({ type: tab });
      }
    } catch {}

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("ficnation_story_voted", handleStoryVoted);
        window.removeEventListener("ficnation_story_viewed", handleStoryViewed);
      }
    };
  }, []);

  // ════════════ ROUTER EN MEMORIA SEGÚN PANTALLA ACTIVA ════════════
  if (screen.type === "story") {
    return (
      <div key={`story-${screen.storyId}`} className="animate-screen-enter">
        <MobileStoryDetailView
          storyId={screen.storyId}
          onBack={goBack}
          onReadStory={(storyId, chapter) => navigateTo({ type: "reader", storyId, chapter })}
        />
      </div>
    );
  }

  if (screen.type === "reader") {
    return (
      <div key={`reader-${screen.storyId}-${screen.chapter}`} className="animate-screen-enter">
        <MobileReaderView
          storyId={screen.storyId}
          chapterNumber={screen.chapter}
          onBack={goBack}
          onNavigateChapter={(chapter) => {
            setScreen({ type: "reader", storyId: screen.storyId, chapter });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    );
  }

  if (screen.type === "explore") {
    return (
      <div key="explore-screen" className="animate-screen-enter">
        <MobileExploreView
          onSelectStory={(storyId) => navigateTo({ type: "story", storyId })}
          onSelectTab={(tab) => navigateTo({ type: tab })}
        />
      </div>
    );
  }

  if (screen.type === "library") {
    return (
      <div key="library-screen" className="animate-screen-enter">
        <MobileLibraryView
          onSelectStory={(storyId) => navigateTo({ type: "story", storyId })}
          onSelectTab={(tab) => navigateTo({ type: tab })}
        />
      </div>
    );
  }

  if (screen.type === "profile") {
    return (
      <div key="profile-screen" className="animate-screen-enter">
        <MobileProfileView
          onSelectTab={(tab) => navigateTo({ type: tab })}
        />
      </div>
    );
  }

  if (screen.type === "notifications") {
    return (
      <div key="notifications-screen" className="animate-screen-enter">
        <MobileNotificationsView
          onSelectTab={(tab) => navigateTo({ type: tab })}
        />
      </div>
    );
  }

  if (screen.type === "write") {
    return (
      <div key="write-screen" className="animate-screen-enter">
        <MobileWriterView
          onSelectTab={(tab) => navigateTo({ type: tab })}
        />
      </div>
    );
  }

  // ════════════ PANTALLA PRINCIPAL: HOME FEED ════════════
  const featuredStory = stories.length > 0 ? stories[0] : null;
  const popularStories = [...stories].sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0)).slice(0, 8);
  const recentStories = stories.slice(0, 8);
  const filteredFeed = selectedGenre === "Todos"
    ? (stories.length > 1 ? stories.slice(1) : stories)
    : stories.filter((s) => s.genre?.toLowerCase() === selectedGenre.toLowerCase());

  const activeBanner = DASHBOARD_ANNOUNCEMENTS[currentBannerIndex];

  return (
    <div key="home-screen" className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-24 select-none animate-screen-enter">
      {/* Header fijo superior */}
      <MobileHeader onSearchClick={() => navigateTo({ type: "explore" })} onProfileClick={() => navigateTo({ type: "profile" })} />

      <main className="flex-1 space-y-6 pt-2">

        {/* ════════════ 1. BANNER DINÁMICO DE NOTICIAS Y ACTUALIZACIONES ════════════ */}
        <section className="px-4">
          <div className={`relative overflow-hidden rounded-3xl p-4 bg-gradient-to-br ${activeBanner.gradientBg} border border-purple-500/25 shadow-xl transition-all duration-500`}>
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide text-white bg-gradient-to-r ${activeBanner.badgeColor} shadow-xs`}>
                    {activeBanner.badge}
                  </span>
                  <span className="text-xs">{activeBanner.icon}</span>
                </div>

                <h2 className="text-sm font-black text-white leading-snug truncate">
                  {activeBanner.title}
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {activeBanner.description}
                </p>
              </div>

              <button
                onClick={() => navigateTo(activeBanner.screenTarget)}
                className="shrink-0 self-center px-3 py-1.5 rounded-2xl bg-white/10 active:scale-95 border border-white/20 text-white text-xs font-bold flex items-center gap-1 shadow-md backdrop-blur-md transition-all"
              >
                <span>{activeBanner.ctaText}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Paginación con Puntos */}
            <div className="flex items-center justify-center gap-1.5 pt-3 mt-2 border-t border-white/10">
              {DASHBOARD_ANNOUNCEMENTS.map((b, idx) => (
                <button
                  key={b.id}
                  onClick={() => setCurrentBannerIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentBannerIndex
                      ? "w-6 bg-gradient-to-r from-purple-400 to-indigo-400"
                      : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Ver noticia ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ════════════ 2. HERO BANNER DESTACADO ════════════ */}
        {featuredStory && (
          <section className="px-4">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-[16/10] bg-slate-900">
              <img
                src={featuredStory.coverImage || "/placeholder-book.png"}
                alt={featuredStory.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070a12] via-[#070a12]/60 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm">
                    ✨ DESTACADA
                  </span>
                  <span className="text-[11px] font-semibold text-purple-300">
                    {featuredStory.genre}
                  </span>
                </div>

                <h2 className="text-lg font-black text-white leading-tight line-clamp-1">
                  {featuredStory.title}
                </h2>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {featuredStory.synopsis}
                </p>

                {/* Botones de acción directa con navegación en memoria */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => navigateTo({ type: "reader", storyId: featuredStory.id, chapter: 1 })}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Empezar a Leer</span>
                  </button>

                  <button
                    onClick={() => navigateTo({ type: "story", storyId: featuredStory.id })}
                    className="flex items-center justify-center p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white active:scale-95 transition-all"
                    title="Ver detalles"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ════════════ 3. CONTINUAR LEYENDO (Si existe progreso) ════════════ */}
        {recentRead && (
          <section className="px-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Continuar Leyendo</span>
              </h3>
            </div>
            <button
              onClick={() => navigateTo({ type: "reader", storyId: recentRead.storyId, chapter: recentRead.chapter || 1 })}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 active:scale-[0.99] transition-all text-left"
            >
              <div className="space-y-1 min-w-0 flex-1 pr-3">
                <p className="text-xs font-bold text-white truncate">
                  {recentRead.title || "Tu última historia"}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-purple-300">
                  <span>Capítulo {recentRead.chapter || 1}</span>
                  <span>•</span>
                  <span>{recentRead.progress || 50}% completado</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </div>
            </button>
          </section>
        )}

        {/* ════════════ 4. CARRUSEL: TOP TENDENCIAS (CON RANKING #1, #2, #3) ════════════ */}
        {popularStories.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                  <span>Top Tendencias</span>
                </h3>
                <p className="text-[10px] text-slate-400">Las historias más leídas de la semana</p>
              </div>
              <button
                onClick={() => navigateTo({ type: "explore" })}
                className="text-xs text-purple-400 font-bold flex items-center gap-0.5 active:scale-95"
              >
                <span>Ver todo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-3.5 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory">
              {popularStories.map((story, idx) => (
                <div key={story.id} className="snap-start">
                  <MobileStoryCard
                    story={story}
                    variant="portrait"
                    rank={idx + 1}
                    onSelectStory={(id) => navigateTo({ type: "story", storyId: id })}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════════════ 5. CHIPS DE GÉNEROS RÁPIDOS ════════════ */}
        <section className="space-y-2">
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
            {GENRES.map((genre) => {
              const isSelected = selectedGenre === genre;
              return (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </section>

        {/* ════════════ 6. CARRUSEL: RECIÉN PUBLICADAS ════════════ */}
        {recentStories.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Recién Salidas del Horno</span>
                </h3>
                <p className="text-[10px] text-slate-400">Nuevos capítulos y lanzamientos</p>
              </div>
            </div>

            <div className="flex gap-3.5 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory">
              {recentStories.map((story) => (
                <div key={story.id} className="snap-start">
                  <MobileStoryCard
                    story={story}
                    variant="portrait"
                    onSelectStory={(id) => navigateTo({ type: "story", storyId: id })}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════════════ 7. FEED VERTICAL: RECOMENDADAS ════════════ */}
        <section className="px-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>
                {selectedGenre === "Todos" ? "Descubre Más Historias" : `Obras de ${selectedGenre}`}
              </span>
            </h3>
            <span className="text-[11px] text-slate-400 font-bold">
              {filteredFeed.length} títulos
            </span>
          </div>

          <div className="space-y-3">
            {filteredFeed.map((story) => (
              <MobileStoryCard
                key={story.id}
                story={story}
                variant="horizontal"
                onSelectStory={(id) => navigateTo({ type: "story", storyId: id })}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Barra de navegación nativa inferior conectada al router */}
      <MobileBottomNav activeTab="home" onSelectTab={(tab) => navigateTo({ type: tab })} />
    </div>
  );
}

export default function MobileHomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070a12] flex items-center justify-center text-purple-400">Cargando FicNation...</div>}>
      <MobileAppContainer />
    </Suspense>
  );
}
