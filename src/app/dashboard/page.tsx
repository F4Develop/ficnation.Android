"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  BookOpen,
  Star,
  Play,
  ChevronRight,
  Zap,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Clock,
  Award,
  Bell,
  Radio,
  ChevronLeft,
} from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MobileStoryCard } from "@/components/mobile/MobileStoryCard";
import { useAuth } from "@/context/AuthContext";
import { type Story } from "@/data/mockStories";
import { createClient } from "@/lib/supabase/client";
import {
  getReadingStreak,
  getContinueReadingStories,
  type ReadingProgressEntry,
  type ReadingStreakData,
} from "@/lib/readingProgress";

const GENRES = [
  "Todos",
  "Fantasía",
  "Anime / Fanfic",
  "Romance",
  "Isekai",
  "Ciencia Ficción",
  "Misterio & Thriller",
  "Slice of Life",
];

interface CommunityAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
  isVerified: boolean;
}

interface AnnouncementBanner {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
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
    ctaText: "Explorar Novedades",
    ctaHref: "/explorar",
    icon: "🚀",
    gradientBg: "from-purple-950/80 via-indigo-950/60 to-[#070a12]",
  },
  {
    id: "banner-2",
    badge: "EVENTO DE AUTORES",
    badgeColor: "from-amber-500 to-orange-500",
    title: "Torneo de Fanfics & Obras",
    description: "Escribe tu nuevo capítulo esta semana y compite por premios de hasta 5,000 monedas.",
    ctaText: "Escribir Ahora",
    ctaHref: "/escribir",
    icon: "🏆",
    gradientBg: "from-amber-950/70 via-purple-950/50 to-[#070a12]",
  },
  {
    id: "banner-3",
    badge: "COMUNIDAD & CLUB",
    badgeColor: "from-emerald-500 to-teal-500",
    title: "Historias Originales Cada Día",
    description: "Descubre universos creados por autores hispanos y apoya con votos y comentarios.",
    ctaText: "Ver Biblioteca",
    ctaHref: "/biblioteca",
    icon: "✨",
    gradientBg: "from-emerald-950/60 via-slate-950/60 to-[#070a12]",
  },
];

export default function MobileDashboardPage() {
  const { user } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [stories, setStories] = useState<Story[]>([]);
  const [authors, setAuthors] = useState<CommunityAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [continueReadingList, setContinueReadingList] = useState<ReadingProgressEntry[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // 1. Cargar Continuar Leyendo desde el almacenamiento local
  useEffect(() => {
    try {
      getContinueReadingStories(user?.id).then((inProgress) => {
        setContinueReadingList(inProgress);
      });
    } catch {}
  }, [user?.id]);

  // 2. Temporizador para el carrusel de anuncios y noticias
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % DASHBOARD_ANNOUNCEMENTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // 3. Cargar Historias y Autores directamente desde Supabase
  useEffect(() => {
    async function loadDatabaseData() {
      setIsLoading(true);
      try {
        const supabase = createClient();

        // Consultar historias publicadas
        const { data: dbStories, error: storiesError } = await supabase
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
          .limit(40);

        if (!storiesError && dbStories) {
          const mapped: Story[] = dbStories
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
                  isVerified: true,
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

        // Consultar autores activos de la base de datos
        const { data: dbProfiles } = await supabase
          .from("profiles")
          .select("id, name, username, avatar_url, bio, role")
          .not("username", "is", null)
          .order("created_at", { ascending: false })
          .limit(10);

        if (dbProfiles && dbProfiles.length > 0) {
          setAuthors(
            dbProfiles.map((p: any) => ({
              id: p.id,
              name: p.name || p.username || "Autor",
              username: p.username ? `@${p.username}` : "@autor",
              avatar: p.avatar_url || "/logo.jpg",
              role: p.bio ? p.bio.slice(0, 24) : (p.role === "writer" ? "Escritor" : "Autor de la Comunidad"),
              isVerified: true,
            }))
          );
        }
      } catch (err) {
        console.error("Error al cargar datos de Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDatabaseData();
  }, []);

  const featuredStory = stories.length > 0 ? stories[0] : null;
  // Tendencias ordenadas por votos / popularidad
  const popularStories = useMemo(() => {
    return [...stories].sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0)).slice(0, 10);
  }, [stories]);

  // Novedades recién publicadas
  const recentStories = useMemo(() => {
    return stories.slice(0, 10);
  }, [stories]);

  const activeContinue = continueReadingList[0] || null;

  const filteredStories = useMemo(() => {
    if (selectedGenre === "Todos") return stories.length > 1 ? stories.slice(1) : stories;
    return stories.filter(
      (s) =>
        s.genre?.toLowerCase().includes(selectedGenre.toLowerCase()) ||
        selectedGenre.toLowerCase().includes(s.genre?.toLowerCase() || "")
    );
  }, [stories, selectedGenre]);

  const activeBanner = DASHBOARD_ANNOUNCEMENTS[currentBannerIndex];

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-24 select-none">
      {/* ════════════ 1. CABECERA MÓVIL SUPERIOR ════════════ */}
      <MobileHeader />

      <main className="flex-1 space-y-6 pt-2">
        
        {/* ════════════ 2. BANNER DE NOTICIAS, NOVEDADES Y ACTUALIZACIONES ════════════ */}
        <section className="px-4">
          <div className={`relative overflow-hidden rounded-3xl p-4 bg-gradient-to-br ${activeBanner.gradientBg} border border-purple-500/25 shadow-xl transition-all duration-500`}>
            {/* Destellos de fondo */}
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-32 h-32 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide text-white bg-gradient-to-r ${activeBanner.badgeColor} shadow-xs`}>
                    {activeBanner.badge}
                  </span>
                  <span className="text-xs">{activeBanner.icon}</span>
                </div>

                <h2 className="text-sm sm:text-base font-black text-white leading-snug truncate">
                  {activeBanner.title}
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {activeBanner.description}
                </p>
              </div>

              {/* Botón de Acción del Banner */}
              <Link
                href={activeBanner.ctaHref}
                className="shrink-0 self-center px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 text-white text-xs font-bold flex items-center gap-1 shadow-md backdrop-blur-md transition-all"
              >
                <span>{activeBanner.ctaText}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Paginación con Puntos Interactivos */}
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

        {/* Estado de Carga */}
        {isLoading && (
          <section className="px-4 py-8 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-purple-300 font-bold">Cargando mundos e historias...</p>
          </section>
        )}

        {/* ════════════ 3. CONTINUAR LEYENDO (Si hay lectura activa) ════════════ */}
        {!isLoading && activeContinue ? (
          <section className="px-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Continuar Leyendo</span>
              </h3>
              <Link href="/biblioteca" className="text-[11px] text-purple-400 font-bold">
                Ver biblioteca
              </Link>
            </div>

            <Link
              href={`/leer?storyId=${activeContinue.storyId}&chapter=${activeContinue.currentChapter || 1}`}
              className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/25 border border-purple-500/30 shadow-md active:scale-[0.99] transition-all"
            >
              <div className="w-12 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                <img
                  src={activeContinue.coverUrl || activeContinue.coverImage || "/placeholder-book.png"}
                  alt={activeContinue.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs font-bold text-white truncate">{activeContinue.title}</p>
                <div className="flex items-center gap-2 text-[11px] text-purple-300 font-medium">
                  <span>Capítulo {activeContinue.currentChapter || 1}</span>
                  <span>•</span>
                  <span>{activeContinue.progressPercent || 50}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                    style={{ width: `${Math.min(Math.max(activeContinue.progressPercent || 20, 5), 100)}%` }}
                  />
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-600/30">
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </div>
            </Link>
          </section>
        ) : null}

        {/* Estado Vacío de la Base de Datos (Si no hay historias publicadas aún) */}
        {!isLoading && stories.length === 0 && (
          <section className="px-4 py-8">
            <div className="p-6 rounded-3xl bg-white/5 border border-purple-500/20 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Base de datos lista</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  No hay historias publicadas todavía en la base de datos. ¡Sé el primer autor en publicar una obra!
                </p>
              </div>
              <Link
                href="/escribir"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
              >
                <span>Publicar Primera Historia</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* ════════════ 4. HERO BANNER: HISTORIA DESTACADA DE LA SEMANA ════════════ */}
        {!isLoading && featuredStory && (
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

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/leer?storyId=${featuredStory.id}&chapter=1`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Empezar a Leer</span>
                  </Link>

                  <Link
                    href={`/historia?id=${featuredStory.id}`}
                    className="flex items-center justify-center p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white active:scale-95 transition-all"
                    title="Ver detalles"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ════════════ 5. CARRUSEL: TOP TENDENCIAS & MÁS POPULARES (CON RANKINGS) ════════════ */}
        {!isLoading && popularStories.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                  <span>Top Tendencias</span>
                </h3>
                <p className="text-[10px] text-slate-400">Las historias más votadas y leídas</p>
              </div>
              <Link
                href="/explorar"
                className="text-xs text-purple-400 font-bold flex items-center gap-0.5 active:scale-95"
              >
                <span>Ver todo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex gap-3.5 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory">
              {popularStories.map((story, idx) => (
                <div key={story.id} className="snap-start">
                  <MobileStoryCard story={story} variant="portrait" rank={idx + 1} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════════════ 6. SELECTOR DE GÉNEROS RÁPIDOS ════════════ */}
        {!isLoading && stories.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                <span>Explorar por Género</span>
              </h3>
            </div>
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
        )}

        {/* ════════════ 7. CARRUSEL: RECIÉN PUBLICADAS Y ACTUALIZADAS ════════════ */}
        {!isLoading && recentStories.length > 0 && (
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
                  <MobileStoryCard story={story} variant="portrait" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════════════ 8. COMUNIDAD & AUTORES DESTACADOS (De Supabase) ════════════ */}
        {!isLoading && authors.length > 0 && (
          <section className="px-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Autores de la Comunidad</span>
                </h3>
                <p className="text-[10px] text-slate-400">Creadores destacados en FicNation</p>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {authors.map((author) => (
                <div
                  key={author.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/5 border border-white/10 shrink-0 min-w-[170px]"
                >
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-purple-600 p-0.5 shrink-0">
                    <img src={author.avatar} alt={author.name} className="w-full h-full object-cover rounded-[10px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                      <span>{author.name}</span>
                      <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0 fill-purple-400 text-[#070a12]" />
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{author.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════════════ 9. FEED VERTICAL: RECOMENDADAS & NOVEDADES ════════════ */}
        {!isLoading && filteredStories.length > 0 && (
          <section className="px-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-400" />
                <span>
                  {selectedGenre === "Todos" ? "Descubre Más Historias" : `Obras de ${selectedGenre}`}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400 font-bold">{filteredStories.length} obras</span>
            </div>

            <div className="space-y-3">
              {filteredStories.map((story) => (
                <MobileStoryCard key={story.id} story={story} variant="horizontal" />
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ════════════ 10. BARRA DE NAVEGACIÓN INFERIOR MÓVIL ════════════ */}
      <MobileBottomNav activeTab="home" />
    </div>
  );
}
