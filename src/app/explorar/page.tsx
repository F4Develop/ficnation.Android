"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MobileExplorePage from "@/app/m/explorar/page";
import {
  Search,
  Filter,
  Compass,
  Sparkles,
  SlidersHorizontal,
  PenTool,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  Shield,
  Check,
  RotateCcw,
  Tag,
  BookOpen,
  Flame,
} from "lucide-react";
import { type Story, type AgeRating, type OriginType } from "@/data/mockStories";
import { StoryCard } from "@/components/stories/StoryCard";
import { createClient } from "@/lib/supabase/client";

const EXPLORE_GENRES = [
  { name: "Todos", icon: "🌟" },
  { name: "Fantasía", icon: "🧙‍♂️" },
  { name: "Romance", icon: "💖" },
  { name: "Aventura", icon: "⚔️" },
  { name: "Acción & Shonen", icon: "💥" },
  { name: "Isekai", icon: "🌀" },
  { name: "Ciencia Ficción", icon: "🚀" },
  { name: "Misterio & Suspenso", icon: "🔍" },
  { name: "Terror / Sobrenatural", icon: "🌑" },
  { name: "Drama & Emocional", icon: "🎭" },
  { name: "Comedia & Humor", icon: "😂" },
  { name: "Slice of Life", icon: "☕" },
  { name: "Sobrenatural & Urbano", icon: "👁️" },
  { name: "Cyberpunk & Distopía", icon: "🤖" },
  { name: "Histórico & Época", icon: "📜" },
  { name: "Psicológico", icon: "🧠" },
  { name: "BL / Yaoi", icon: "👬" },
  { name: "GL / Yuri", icon: "👭" },
  { name: "Harem / Poliamor", icon: "👑" },
];

const POPULAR_EXPLORE_TAGS = [
  "magia",
  "romance_oscuro",
  "isekai",
  "enemigos_a_amantes",
  "venganza",
  "poderes_ocultos",
  "reencarnacion",
  "demonios",
  "apocalipsis",
  "vampiros",
  "jujutsu_kaisen",
  "naruto",
  "genshin_impact",
];

function ExplorarContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [originFilter, setOriginFilter] = useState<"todos" | "original" | "fanfic">("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | "en_desarrollo" | "completa">("todos");
  const [ageRatingFilter, setAgeRatingFilter] = useState<"todas" | "TP" | "+13" | "+16" | "+18">("todas");
  const [chapterLengthFilter, setChapterLengthFilter] = useState<"todos" | "corta" | "media" | "larga">("todos");
  const [readerInsertOnly, setReaderInsertOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"populares" | "novedades" | "votos" | "capitulos">("populares");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Leer parámetros de búsqueda desde la URL (?q=... o ?search=... o ?genre=... o ?tag=...)
  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("search") || searchParams.get("busqueda");
    const genre = searchParams.get("genre") || searchParams.get("genero");
    const tag = searchParams.get("tag") || searchParams.get("etiqueta");
    const origin = searchParams.get("origin") || searchParams.get("tipo");
    const status = searchParams.get("status") || searchParams.get("estado");

    if (q) setSearchQuery(q);
    if (genre) setSelectedGenre(genre);
    if (tag) setSearchQuery(tag);
    if (origin && (origin === "original" || origin === "fanfic")) setOriginFilter(origin);
    if (status && (status === "en_desarrollo" || status === "completa")) setStatusFilter(status);
  }, [searchParams]);

  useEffect(() => {
    async function loadCatalogStories() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: dbStories } = await supabase
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
            created_at,
            author_id,
            age_rating,
            story_type,
            profiles!author_id (
              id,
              name,
              username,
              avatar_url
            ),
            chapters (id, is_published),
            story_votes(count),
            story_views(count)
          `)
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        let loadedList: Story[] = [];

        if (dbStories && dbStories.length > 0) {
          loadedList = dbStories
            .filter((s: any) => {
              const publishedChapters = (s.chapters || []).filter((c: any) => c.is_published !== false);
              return publishedChapters.length > 0;
            })
            .map((s: any) => {
              const author = s.profiles;
              const publishedChapters = (s.chapters || []).filter((c: any) => c.is_published !== false);
              const tagsArray: string[] = Array.isArray(s.tags) ? s.tags : [];
              const isFanfic =
                tagsArray.some((t) => t.toLowerCase() === "fanfic" || t.toLowerCase() === "fanfiction") ||
                (s.genre || "").toLowerCase().includes("fanfic");

              return {
                id: s.id,
                title: s.title || "Historia sin título",
                synopsis: s.synopsis || "",
                genre: s.genre || "Fantasía",
                tags: tagsArray,
                coverImage: s.cover_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
                reads: String(Math.max(Number(s.reads_count || 0), Number(s.story_views?.[0]?.count || 0))),
                votes: String(Math.max(Number(s.votes_count || 0), Number(s.story_votes?.[0]?.count || 0))),
                chapters: publishedChapters.length,
                completed: s.is_completed,
                status: s.is_completed ? "completa" : "en_desarrollo",
                ageRating: (s.age_rating as AgeRating) || "TP",
                storyType: s.story_type || "tradicional",
                originType: (isFanfic ? "fanfic" : "original") as OriginType,
                author: {
                  name: author?.name || "Autor",
                  username: author?.username || "autor",
                  avatar: author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                },
              };
            });
        }

        // Cargar historias creadas localmente por el usuario para visibilidad inmediata (solo si están publicadas y con capítulos)
        if (typeof window !== "undefined") {
          try {
            const localUserStories = JSON.parse(localStorage.getItem("ficnation_user_stories") || "[]");
            const localCachedProfile = JSON.parse(localStorage.getItem("ficnation_cached_profile") || "{}");
            
            localUserStories.forEach((lu: any) => {
              const isPub = lu.isPublished === true || lu.is_published === true;
              const chapCount = Number(lu.publishedChaptersCount ?? (lu.status === "borrador" ? 0 : lu.chaptersCount ?? lu.chapters?.length ?? 0));
              if (isPub && chapCount > 0 && lu.status !== "borrador" && !loadedList.some((s) => s.id === lu.id)) {
                const tagsArray: string[] = Array.isArray(lu.tags) ? lu.tags : [];
                const isFanfic =
                  lu.originType === "fanfic" ||
                  tagsArray.some((t) => t.toLowerCase() === "fanfic" || t.toLowerCase() === "fanfiction") ||
                  (lu.genre || "").toLowerCase().includes("fanfic") ||
                  Boolean(lu.fandom);

                loadedList.unshift({
                  id: lu.id,
                  title: lu.title,
                  synopsis: lu.synopsis,
                  genre: lu.genre,
                  tags: tagsArray,
                  coverImage: lu.coverUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
                  reads: `${lu.readsCount || 0}`,
                  votes: `${lu.votesCount || 0}`,
                  chapters: chapCount,
                  completed: lu.status === "completa",
                  status: lu.status || "en_desarrollo",
                  ageRating: (lu.ageRating as AgeRating) || "TP",
                  storyType: lu.storyType || "tradicional",
                  originType: (isFanfic ? "fanfic" : "original") as OriginType,
                  fandom: lu.fandom,
                  author: {
                    name: localCachedProfile.name || "Tú",
                    username: localCachedProfile.username || "autor",
                    avatar: localCachedProfile.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                  },
                });
              }
            });
          } catch {}
        }

        if (loadedList.length > 0) {
          setStories(loadedList);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }

    loadCatalogStories();

    // Sincronización en tiempo real de votos y vistas
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

    window.addEventListener("ficnation_story_voted", handleStoryVoted);
    window.addEventListener("ficnation_story_viewed", handleStoryViewed);
    return () => {
      window.removeEventListener("ficnation_story_voted", handleStoryVoted);
      window.removeEventListener("ficnation_story_viewed", handleStoryViewed);
    };
  }, []);

  // Filtrado reactivo multidimensional
  const filteredStories = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();

    return stories.filter((story) => {
      // 1. Texto de búsqueda (Título, autor, sinopsis, etiquetas, género, fandom)
      if (cleanSearch) {
        const matchesTitle = story.title.toLowerCase().includes(cleanSearch);
        const matchesSynopsis = story.synopsis.toLowerCase().includes(cleanSearch);
        const matchesAuthor =
          story.author.name.toLowerCase().includes(cleanSearch) ||
          story.author.username.toLowerCase().includes(cleanSearch);
        const matchesTags = story.tags.some((t) => t.toLowerCase().includes(cleanSearch));
        const matchesGenre = story.genre.toLowerCase().includes(cleanSearch);
        const matchesFandom = story.fandom?.toLowerCase().includes(cleanSearch);

        if (!matchesTitle && !matchesSynopsis && !matchesAuthor && !matchesTags && !matchesGenre && !matchesFandom) {
          return false;
        }
      }

      // 2. Género
      if (selectedGenre !== "Todos") {
        const matchesGenre =
          story.genre.toLowerCase().includes(selectedGenre.toLowerCase()) ||
          story.tags.some((t) => t.toLowerCase().includes(selectedGenre.toLowerCase()));
        if (!matchesGenre) return false;
      }

      // 3. Origen (Original vs Fanfic)
      if (originFilter === "original") {
        if (story.originType === "fanfic") return false;
        if (story.tags.some((t) => t.toLowerCase() === "fanfic" || t.toLowerCase() === "fanfiction")) return false;
        if (story.genre.toLowerCase().includes("fanfic")) return false;
      } else if (originFilter === "fanfic") {
        const isFanfic =
          story.originType === "fanfic" ||
          story.tags.some((t) => t.toLowerCase() === "fanfic" || t.toLowerCase() === "fanfiction") ||
          story.genre.toLowerCase().includes("fanfic") ||
          Boolean(story.fandom);
        if (!isFanfic) return false;
      }

      // 4. Estado de Publicación
      if (statusFilter === "completa" && !story.completed && story.status !== "completa") {
        return false;
      }
      if (statusFilter === "en_desarrollo" && (story.completed || story.status === "completa")) {
        return false;
      }

      // 5. Clasificación por Edad
      if (ageRatingFilter !== "todas") {
        if ((story.ageRating || "TP") !== ageRatingFilter) {
          return false;
        }
      }

      // 6. Modo Lector Interactivo (T/N)
      if (readerInsertOnly) {
        const hasTN = story.tags.some((t) =>
          ["reader_insert", "tn_protagonist", "t/n", "y/n", "reader"].includes(t.toLowerCase())
        );
        if (!hasTN) return false;
      }

      // 7. Longitud de Capítulos
      if (chapterLengthFilter === "corta" && story.chapters >= 5) return false;
      if (chapterLengthFilter === "media" && (story.chapters < 5 || story.chapters > 20)) return false;
      if (chapterLengthFilter === "larga" && story.chapters <= 20) return false;

      return true;
    });
  }, [
    stories,
    searchQuery,
    selectedGenre,
    originFilter,
    statusFilter,
    ageRatingFilter,
    readerInsertOnly,
    chapterLengthFilter,
  ]);

  // Ordenamiento de resultados
  const sortedStories = useMemo(() => {
    return [...filteredStories].sort((a, b) => {
      if (sortBy === "populares") {
        return (Number(b.reads) || 0) - (Number(a.reads) || 0);
      }
      if (sortBy === "votos") {
        return (Number(b.votes) || 0) - (Number(a.votes) || 0);
      }
      if (sortBy === "capitulos") {
        return (b.chapters || 0) - (a.chapters || 0);
      }
      return 0; // "novedades": orden inicial
    });
  }, [filteredStories, sortBy]);

  // Conteo de filtros activos
  const specificFiltersCount = [
    originFilter !== "todos",
    statusFilter !== "todos",
    ageRatingFilter !== "todas",
    chapterLengthFilter !== "todos",
    readerInsertOnly,
  ].filter(Boolean).length;

  const totalActiveFilters = [
    searchQuery.trim().length > 0,
    selectedGenre !== "Todos",
    originFilter !== "todos",
    statusFilter !== "todos",
    ageRatingFilter !== "todas",
    chapterLengthFilter !== "todos",
    readerInsertOnly,
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedGenre("Todos");
    setOriginFilter("todos");
    setStatusFilter("todos");
    setAgeRatingFilter("todas");
    setChapterLengthFilter("todos");
    setReaderInsertOnly(false);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-20">
      
      {/* ════════════ HEADER COMPACTO ════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl flex items-center justify-center fic-btn-primary shadow-md shadow-purple-500/20 shrink-0">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                Explorar Historias
              </h1>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
                {sortedStories.length} obras
              </span>
            </div>
            <p className="text-xs leading-tight opacity-75" style={{ color: "var(--text-muted)" }}>
              Descubre historias originales y fanfics de la comunidad.
            </p>
          </div>
        </div>

        {/* Pestañas de Origen Compactas: Todos | ✨ Originales | ⚡ Fanfics */}
        <div className="flex items-center gap-1 p-1 rounded-2xl border shrink-0 fic-card-secondary self-start sm:self-auto" style={{ borderColor: "var(--border-primary)" }}>
          <button
            type="button"
            onClick={() => setOriginFilter("todos")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              originFilter === "todos"
                ? "fic-btn-primary shadow-xs font-extrabold text-white"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Todos</span>
          </button>
          <button
            type="button"
            onClick={() => setOriginFilter("original")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              originFilter === "original"
                ? "fic-btn-primary shadow-xs font-extrabold text-white"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span>✨</span>
            <span>Originales</span>
          </button>
          <button
            type="button"
            onClick={() => setOriginFilter("fanfic")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              originFilter === "fanfic"
                ? "fic-btn-primary shadow-xs font-extrabold text-white"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span>⚡</span>
            <span>Fanfics</span>
          </button>
        </div>
      </div>

      {/* ════════════ BARRA DE CONTROL COMPACTA & FLUIDA ════════════ */}
      <div
        className="rounded-2xl border fic-card p-2.5 sm:p-3 shadow-xs space-y-2 transition-all"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
      >
        {/* Fila Principal: Buscador + Selector de Orden + Botón Filtros */}
        <div className="flex items-center gap-2">
          
          {/* Input de Búsqueda ágil */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 opacity-50 text-purple-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, autor, fandom o etiquetas (#magia)..."
              className="w-full rounded-xl border fic-input py-1.5 sm:py-2 pl-9 pr-8 text-xs sm:text-sm placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Borrar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selector de Orden Compacto */}
          <div className="flex items-center gap-1.5 rounded-xl border fic-card-secondary px-2.5 py-1.5 text-xs shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              <option value="populares" className="fic-card">Más Populares</option>
              <option value="novedades" className="fic-card">Más Recientes</option>
              <option value="votos" className="fic-card">Mejor Calificadas</option>
              <option value="capitulos" className="fic-card">Más Capítulos</option>
            </select>
          </div>

          {/* Botón Filtros Específicos */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer shrink-0 hover:scale-105 ${
              showAdvancedFilters || specificFiltersCount > 0
                ? "bg-purple-500/20 text-purple-400 border-purple-500/40 ring-1 ring-purple-500/30"
                : "fic-card-secondary hover:border-purple-500/30"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtros</span>
            {specificFiltersCount > 0 && (
              <span className="h-4 w-4 rounded-full bg-purple-500 text-white text-[9px] font-black flex items-center justify-center">
                {specificFiltersCount}
              </span>
            )}
            {showAdvancedFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Carrusel de Géneros Compacto */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-0.5">
          {EXPLORE_GENRES.map((g) => {
            const isSelected = selectedGenre === g.name;
            return (
              <button
                key={g.name}
                type="button"
                onClick={() => setSelectedGenre(g.name)}
                className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 hover:scale-105 ${
                  isSelected
                    ? "fic-btn-primary shadow-xs font-black text-white ring-1 ring-purple-400/50 scale-[1.02]"
                    : "fic-card-secondary opacity-80 hover:opacity-100 hover:border-purple-500/30"
                }`}
              >
                <span className="text-xs">{g.icon}</span>
                <span className="text-[11px] sm:text-xs">{g.name}</span>
              </button>
            );
          })}
        </div>

        {/* Panel Desplegable de Filtros Específicos (Colapsable y ordenado) */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t space-y-3 animate-fade-in" style={{ borderColor: "var(--border-primary)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Filtro: Clasificación por Edad */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                  <Shield className="w-3 h-3 text-purple-400" />
                  <span>Clasificación por Edad</span>
                </label>
                <div className="flex items-center gap-1 flex-wrap">
                  {(["todas", "TP", "+13", "+16", "+18"] as const).map((rating) => {
                    const isSelected = ageRatingFilter === rating;
                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setAgeRatingFilter(rating)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                          isSelected
                            ? "fic-btn-primary text-white shadow-xs"
                            : "fic-card-secondary opacity-70 hover:opacity-100"
                        }`}
                      >
                        {rating === "todas" ? "Todas" : rating === "+18" ? "+18 🔞" : rating}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtro: Estado de Publicación */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Estado de la Obra</span>
                </label>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { id: "todos", label: "Todos" },
                    { id: "en_desarrollo", label: "En Desarrollo ⏳" },
                    { id: "completa", label: "Completadas ✅" },
                  ].map((s) => {
                    const isSelected = statusFilter === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStatusFilter(s.id as any)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                          isSelected
                            ? "fic-btn-primary text-white shadow-xs"
                            : "fic-card-secondary opacity-70 hover:opacity-100"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtro: Longitud / Cantidad de Capítulos */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                  <BookOpen className="w-3 h-3 text-pink-400" />
                  <span>Extensión</span>
                </label>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { id: "todos", label: "Cualquiera" },
                    { id: "corta", label: "< 5 caps" },
                    { id: "media", label: "5 - 20" },
                    { id: "larga", label: "+20 caps" },
                  ].map((len) => {
                    const isSelected = chapterLengthFilter === len.id;
                    return (
                      <button
                        key={len.id}
                        type="button"
                        onClick={() => setChapterLengthFilter(len.id as any)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                          isSelected
                            ? "fic-btn-primary text-white shadow-xs"
                            : "fic-card-secondary opacity-70 hover:opacity-100"
                        }`}
                      >
                        {len.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtro: Modo Lector T/N (Reader Insert) */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                  <span>🎭</span>
                  <span>Modo Interactivo</span>
                </label>
                <button
                  type="button"
                  onClick={() => setReaderInsertOnly(!readerInsertOnly)}
                  className={`w-full p-1.5 rounded-lg text-[10px] font-extrabold border transition-all flex items-center justify-between cursor-pointer ${
                    readerInsertOnly
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/50 ring-1 ring-purple-500/30"
                      : "fic-card-secondary opacity-70 hover:opacity-100"
                  }`}
                >
                  <span className="truncate">Solo Protagonista T/N</span>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    readerInsertOnly ? "bg-purple-500 border-purple-400 text-white" : "border-zinc-500/50"
                  }`}>
                    {readerInsertOnly && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              </div>

            </div>

            {/* Tendencias y Botón de Reset dentro del panel */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: "var(--border-primary)" }}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-purple-400" />
                  <span>Tendencias:</span>
                </span>
                {POPULAR_EXPLORE_TAGS.slice(0, 7).map((tag) => {
                  const isActive = searchQuery.toLowerCase() === tag.toLowerCase();
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(isActive ? "" : tag)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                        isActive
                          ? "bg-purple-500 text-white border-purple-400 font-bold"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-purple-500/40"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-purple-400 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer filtros</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Chips de Filtros Activos con eliminación rápida */}
      {totalActiveFilters > 0 && (
        <div className="flex items-center gap-2 flex-wrap -mt-2">
          <span className="text-xs font-mono font-bold text-zinc-400">Filtros activos:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <span>Búsqueda: &quot;{searchQuery}&quot;</span>
              <button type="button" onClick={() => setSearchQuery("")} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedGenre !== "Todos" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <span>Género: {selectedGenre}</span>
              <button type="button" onClick={() => setSelectedGenre("Todos")} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {originFilter !== "todos" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <span>Tipo: {originFilter === "fanfic" ? "Fanfiction" : "Original"}</span>
              <button type="button" onClick={() => setOriginFilter("todos")} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {statusFilter !== "todos" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <span>Estado: {statusFilter === "completa" ? "Completadas" : "En desarrollo"}</span>
              <button type="button" onClick={() => setStatusFilter("todos")} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {ageRatingFilter !== "todas" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <span>Edad: {ageRatingFilter}</span>
              <button type="button" onClick={() => setAgeRatingFilter("todas")} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {chapterLengthFilter !== "todos" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <span>Extensión: {chapterLengthFilter}</span>
              <button type="button" onClick={() => setChapterLengthFilter("todos")} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {readerInsertOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <span>Modo T/N</span>
              <button type="button" onClick={() => setReaderInsertOnly(false)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-purple-400 hover:underline font-bold ml-1 cursor-pointer"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          Mostrando <span className="font-bold" style={{ color: "var(--text-primary)" }}>{sortedStories.length}</span> {sortedStories.length === 1 ? "historia encontrada" : "historias encontradas"}
        </p>
      </div>

      {/* Stories Grid / Empty State */}
      {sortedStories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 sm:gap-6">
          {sortedStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-3xl border fic-card-secondary space-y-3">
          <Sparkles className="h-8 w-8 text-purple-400 animate-pulse" />
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {totalActiveFilters > 0
              ? "No encontramos historias con esos filtros"
              : "No hay historias publicadas todavía"}
          </h3>
          <p className="text-xs max-w-sm" style={{ color: "var(--text-muted)" }}>
            {totalActiveFilters > 0
              ? "Prueba cambiando las palabras clave, quitando filtros específicos o explorando otros géneros."
              : "¡Sé el primer autor en publicar una historia en FicNation desde el Taller de Escritura!"}
          </p>
          {totalActiveFilters > 0 ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold hover:scale-105 transition-transform shadow-md fic-btn-primary cursor-pointer text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ver todo el catálogo
            </button>
          ) : (
            <Link
              href="/escribir"
              className="mt-2 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold hover:scale-105 transition-transform shadow-md fic-btn-primary"
            >
              <PenTool className="w-3.5 h-3.5" />
              Publicar primera historia
            </Link>
          )}
        </div>
      )}

    </div>
  );
}

export default function ExplorarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-purple-400 font-bold">
          Cargando catálogo...
        </div>
      }
    >
      <MobileExplorePage />
    </Suspense>
  );
}
