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
} from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MobileStoryCard } from "@/components/mobile/MobileStoryCard";
import { useAuth, calculateReaderLevel } from "@/context/AuthContext";
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

export default function MobileDashboardPage() {
  const { user } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [stories, setStories] = useState<Story[]>([]);
  const [authors, setAuthors] = useState<CommunityAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [continueReadingList, setContinueReadingList] = useState<ReadingProgressEntry[]>([]);
  const [streakData, setStreakData] = useState<ReadingStreakData>({
    streak: 0,
    todayChaptersCount: 0,
    dailyGoal: 3,
    lastReadDate: "",
  });

  const userName = user?.name || user?.username || "Lector";
  const userXp = user?.xp ?? 0;
  const userCoins = user?.coins ?? 0;
  const levelInfo = calculateReaderLevel(userXp);

  // 1. Cargar Racha y Continuar Leyendo desde el almacenamiento local
  useEffect(() => {
    try {
      const streak = getReadingStreak();
      setStreakData(streak);
      getContinueReadingStories(user?.id).then((inProgress) => {
        setContinueReadingList(inProgress);
      });
    } catch {}
  }, [user?.id]);

  // 2. Cargar Historias y Autores directamente desde Supabase
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
              // REGLA: Las historias que no tienen capítulos deben considerarse borradores
              // y NO mostrarse en el dashboard ni en explorar.
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
  const popularStories = stories.length > 1 ? stories.slice(1, 8) : stories;
  const activeContinue = continueReadingList[0] || null;

  const filteredStories = useMemo(() => {
    if (selectedGenre === "Todos") return stories.length > 1 ? stories.slice(1) : stories;
    return stories.filter(
      (s) =>
        s.genre?.toLowerCase().includes(selectedGenre.toLowerCase()) ||
        selectedGenre.toLowerCase().includes(s.genre?.toLowerCase() || "")
    );
  }, [stories, selectedGenre]);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-24 select-none">
      {/* ════════════ 1. CABECERA MÓVIL SUPERIOR ════════════ */}
      <MobileHeader />

      <main className="flex-1 space-y-6 pt-3">
        
        {/* ════════════ 2. PANEL PERSONALIZADO DEL LECTOR (HUD) ════════════ */}
        <section className="px-4">
          <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-purple-900/10 border border-purple-500/20 shadow-xl space-y-3.5">
            {/* Saludo con Avatar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-md shrink-0">
                  <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#070a12] flex items-center justify-center">
                    <img
                      src={user?.avatar || "/logo.jpg"}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-1.5">
                    <span>¡Hola, {userName}!</span>
                    <span className="text-sm">👋</span>
                  </h2>
                  <p className="text-[11px] text-purple-300 font-semibold">
                    {levelInfo.icon} Nivel {levelInfo.level} • {levelInfo.levelTitle}
                  </p>
                </div>
              </div>

              {/* Botón rápido a perfil */}
              <Link
                href="/perfil"
                className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 active:scale-95 transition-all"
              >
                Mi Perfil
              </Link>
            </div>

            {/* Métricas rápidas: Racha, Meta y Monedas */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10">
              <div className="p-2 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-slate-400 font-medium">Racha</p>
                <p className="text-xs font-black text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{streakData.streak} días</span>
                </p>
              </div>

              <div className="p-2 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-slate-400 font-medium">Meta Hoy</p>
                <p className="text-xs font-black text-purple-300 flex items-center justify-center gap-1 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>{streakData.todayChaptersCount}/{streakData.dailyGoal} caps</span>
                </p>
              </div>

              <div className="p-2 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-slate-400 font-medium">Monedas</p>
                <p className="text-xs font-black text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                  <span>🪙</span>
                  <span>{userCoins.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Estado de Carga */}
        {isLoading && (
          <section className="px-4 py-8 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-purple-300 font-bold">Conectando con la base de datos...</p>
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

        {/* ════════════ 5. CARROUSEL: MÁS POPULARES DE FICNATION ════════════ */}
        {!isLoading && popularStories.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Populares de la Semana</span>
              </h3>
              <Link
                href="/explorar"
                className="text-xs text-purple-400 font-semibold flex items-center gap-0.5 active:scale-95"
              >
                <span>Ver más</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory">
              {popularStories.map((story) => (
                <div key={story.id} className="snap-start">
                  <MobileStoryCard story={story} variant="portrait" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════════════ 6. SELECTOR DE GÉNEROS RÁPIDOS ════════════ */}
        {!isLoading && stories.length > 0 && (
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
        )}

        {/* ════════════ 7. COMUNIDAD & AUTORES DESTACADOS (De Supabase) ════════════ */}
        {!isLoading && authors.length > 0 && (
          <section className="px-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Autores de la Comunidad</span>
              </h3>
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

        {/* ════════════ 8. FEED VERTICAL: RECOMENDADAS & NOVEDADES ════════════ */}
        {!isLoading && filteredStories.length > 0 && (
          <section className="px-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>
                  {selectedGenre === "Todos" ? "Nuevas Obras en la Base de Datos" : `Historias de ${selectedGenre}`}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">{filteredStories.length} obras</span>
            </div>

            <div className="space-y-3">
              {filteredStories.map((story) => (
                <MobileStoryCard key={story.id} story={story} variant="horizontal" />
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ════════════ 9. BARRA DE NAVEGACIÓN INFERIOR MÓVIL ════════════ */}
      <MobileBottomNav activeTab="home" />
    </div>
  );
}

