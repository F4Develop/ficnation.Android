"use client";

import { useState, useEffect, Suspense } from "react";
import { Sparkles, Flame, BookOpen, Star, Compass, ChevronRight, Play, Bookmark } from "lucide-react";
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

const GENRES = ["Todos", "Fantasía", "Romance", "Anime", "Isekai", "Ciencia Ficción", "Misterio", "Acción"];

export type MobileScreen =
  | { type: "home" }
  | { type: "explore" }
  | { type: "write" }
  | { type: "notifications" }
  | { type: "library" }
  | { type: "profile" }
  | { type: "story"; storyId: string }
  | { type: "reader"; storyId: string; chapter: number };

function MobileAppContainer() {
  const [screen, setScreen] = useState<MobileScreen>({ type: "home" });
  const [history, setHistory] = useState<MobileScreen[]>([{ type: "home" }]);

  const [stories, setStories] = useState<Story[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [recentRead, setRecentRead] = useState<{ storyId: string; chapter: number; progress: number; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          .limit(20);

        if (!error && data) {
          const mapped: Story[] = data
            .filter((s: any) => {
              // REGLA: Las historias sin capítulos deben estar en borradores y no mostrarse en el inicio
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

    // 3. Revisar si la URL trae algún parámetro inicial (ej: ?storyId=... o ?tab=...)
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
  }, []);

  // ════════════ ROUTER EN MEMORIA SEGÚN PANTALLA ACTIVA ════════════
  if (screen.type === "story") {
    return (
      <MobileStoryDetailView
        storyId={screen.storyId}
        onBack={goBack}
        onReadStory={(storyId, chapter) => navigateTo({ type: "reader", storyId, chapter })}
      />
    );
  }

  if (screen.type === "reader") {
    return (
      <MobileReaderView
        storyId={screen.storyId}
        chapterNumber={screen.chapter}
        onBack={goBack}
        onNavigateChapter={(chapter) => {
          setScreen({ type: "reader", storyId: screen.storyId, chapter });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

  if (screen.type === "explore") {
    return (
      <MobileExploreView
        onSelectStory={(storyId) => navigateTo({ type: "story", storyId })}
        onSelectTab={(tab) => navigateTo({ type: tab })}
      />
    );
  }

  if (screen.type === "library") {
    return (
      <MobileLibraryView
        onSelectStory={(storyId) => navigateTo({ type: "story", storyId })}
        onSelectTab={(tab) => navigateTo({ type: tab })}
      />
    );
  }

  if (screen.type === "profile") {
    return (
      <MobileProfileView
        onSelectTab={(tab) => navigateTo({ type: tab })}
      />
    );
  }

  if (screen.type === "notifications") {
    return (
      <MobileNotificationsView
        onSelectTab={(tab) => navigateTo({ type: tab })}
      />
    );
  }

  if (screen.type === "write") {
    return (
      <MobileWriterView
        onSelectTab={(tab) => navigateTo({ type: tab })}
      />
    );
  }

  // ════════════ PANTALLA PRINCIPAL: HOME FEED ════════════
  const featuredStory = stories.length > 0 ? stories[0] : null;
  const popularStories = stories.length > 1 ? stories.slice(1, 7) : stories;
  const filteredFeed = selectedGenre === "Todos"
    ? (stories.length > 1 ? stories.slice(1) : stories)
    : stories.filter((s) => s.genre?.toLowerCase() === selectedGenre.toLowerCase());

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-24 select-none">
      {/* Header fijo superior */}
      <MobileHeader onSearchClick={() => navigateTo({ type: "explore" })} />

      <main className="flex-1 space-y-6 pt-2">
        {/* ════════════ 1. HERO BANNER DESTACADO ════════════ */}
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

        {/* ════════════ 2. CONTINUAR LEYENDO (Si existe progreso) ════════════ */}
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

        {/* ════════════ 3. CARROUSEL: MÁS POPULARES ════════════ */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Populares de la Semana</span>
            </h3>
            <button
              onClick={() => navigateTo({ type: "explore" })}
              className="text-xs text-purple-400 font-semibold flex items-center gap-0.5 active:scale-95"
            >
              <span>Ver más</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
            {popularStories.map((story) => (
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

        {/* ════════════ 4. CHIPS DE GÉNEROS RÁPIDOS ════════════ */}
        <section className="space-y-2">
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
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

        {/* ════════════ 5. FEED VERTICAL: RECOMENDADAS ════════════ */}
        <section className="px-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>
                {selectedGenre === "Todos" ? "Nuevas Obras Recomendadas" : `Historias de ${selectedGenre}`}
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">
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
