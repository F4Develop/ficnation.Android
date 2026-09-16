"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MobileLibraryPage from "@/app/m/biblioteca/page";
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  Plus,
  Sparkles,
  Clock,
  Play,
  RotateCcw,
  Search,
  BookMarked,
  Layers,
  ArrowRight,
  Compass,
  Star,
  Eye,
  Flame,
  MoreVertical,
  Trash2,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStoryModal } from "@/context/StoryModalContext";
import { createClient } from "@/lib/supabase/client";
import { FicImage } from "@/components/ui/FicImage";

export interface LibraryItem {
  id: string;
  storyId: string;
  title: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  coverImage?: string;
  genre: string;
  tags?: string[];
  synopsis: string;
  status: "leyendo" | "sin_iniciar" | "terminadas";
  currentChapter: number;
  totalChapters: number;
  progressPercent: number;
  lastReadDate?: string;
  reads?: string;
  rating?: number;
}

export default function BibliotecaPage() {
  return <MobileLibraryPage />;
}

function LegacyDesktopBibliotecaPage() {
  const { user } = useAuth();
  const { openStoryModal } = useStoryModal();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"leyendo" | "sin_iniciar" | "terminadas">("leyendo");
  const [searchQuery, setSearchQuery] = useState("");

  // Estado de historias cargadas desde base de datos y local
  const [libraryStories, setLibraryStories] = useState<LibraryItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("ficnation_library") || "[]");
        return saved;
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    setMounted(true);

    async function loadUserLibrary() {
      // 1. Cargar desde localStorage primero
      let localList: LibraryItem[] = [];
      if (typeof window !== "undefined") {
        try {
          const saved = JSON.parse(localStorage.getItem("ficnation_library") || "[]");
          if (Array.isArray(saved) && saved.length > 0) {
            localList = saved;
            setLibraryStories(saved);
          }
        } catch {}
      }

      if (!user) return;

      try {
        const supabase = createClient();
        
        const { data: entries, error } = await supabase
          .from("library_entries")
          .select(`
            id,
            story_id,
            status,
            current_chapter,
            progress_percent,
            updated_at,
            stories!story_id (
              id,
              title,
              synopsis,
              genre,
              cover_url,
              author_id,
              profiles!author_id (
                id,
                name,
                username,
                avatar_url
              ),
              chapters (id)
            )
          `)
          .eq("user_id", user.id);

        if (entries && !error && entries.length > 0) {
          const formatted: LibraryItem[] = entries.map((item: any) => {
            const story = item.stories;
            const author = story?.profiles;

            let mappedStatus: "leyendo" | "sin_iniciar" | "terminadas" = "leyendo";
            if (item.status === "completado" || item.progress_percent >= 100) {
              mappedStatus = "terminadas";
            } else if (item.status === "guardado" || item.progress_percent === 0) {
              mappedStatus = "sin_iniciar";
            } else {
              mappedStatus = "leyendo";
            }

            return {
              id: item.story_id,
              storyId: item.story_id,
              title: story?.title || "Historia sin título",
              author: {
                name: author?.name || "Autor",
                username: author?.username || "autor",
                avatar: author?.avatar_url || "/default-avatar.svg",
              },
              coverImage: story?.cover_url,
              genre: story?.genre || "Fantasía",
              synopsis: story?.synopsis || "",
              status: mappedStatus,
              currentChapter: item.current_chapter || 1,
              totalChapters: story?.chapters?.length || 10,
              progressPercent: item.progress_percent || (mappedStatus === "terminadas" ? 100 : 10),
              lastReadDate: new Date(item.updated_at).toLocaleDateString("es-ES"),
            };
          });

          // Combinar con los locales
          const map = new Map<string, LibraryItem>();
          localList.forEach((s) => map.set(s.storyId || s.id, s));
          formatted.forEach((s) => map.set(s.storyId || s.id, s));

          const merged = Array.from(map.values());
          setLibraryStories(merged);
          if (typeof window !== "undefined") {
            localStorage.setItem("ficnation_library", JSON.stringify(merged));
          }
        }
      } catch {
        // Mantiene los datos de muestra si falla
      }
    }

    loadUserLibrary();

    // Escuchar actualizaciones en tiempo real
    const handleUpdated = () => {
      if (typeof window !== "undefined") {
        try {
          const saved = JSON.parse(localStorage.getItem("ficnation_library") || "[]");
          if (Array.isArray(saved)) {
            setLibraryStories(saved);
          }
        } catch {}
      }
    };

    const handleStoryVoted = (e: any) => {
      if (e.detail?.storyId) {
        setLibraryStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId || s.storyId === e.detail.storyId
              ? { ...s, rating: Number(e.detail.newCount) }
              : s
          )
        );
      }
    };

    const handleStoryViewed = (e: any) => {
      if (e.detail?.storyId) {
        setLibraryStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId || s.storyId === e.detail.storyId
              ? { ...s, reads: String(e.detail.readsCount) }
              : s
          )
        );
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("ficnation_reading_updated", handleUpdated);
      window.addEventListener("ficnation_story_voted", handleStoryVoted);
      window.addEventListener("ficnation_story_viewed", handleStoryViewed);
      window.addEventListener("storage", handleUpdated);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("ficnation_reading_updated", handleUpdated);
        window.removeEventListener("ficnation_story_voted", handleStoryVoted);
        window.removeEventListener("ficnation_story_viewed", handleStoryViewed);
        window.removeEventListener("storage", handleUpdated);
      }
    };
  }, [user]);

  // Cambiar de estado una historia en la UI y sincronizar
  const handleStatusChange = async (storyId: string, newStatus: "leyendo" | "sin_iniciar" | "terminadas") => {
    let updatedList: LibraryItem[] = [];
    setLibraryStories((prev) => {
      updatedList = prev.map((s) => {
        if (s.id === storyId || s.storyId === storyId) {
          const progressPercent = newStatus === "terminadas" ? 100 : newStatus === "sin_iniciar" ? 0 : Math.max(15, s.progressPercent);
          return { ...s, status: newStatus, progressPercent };
        }
        return s;
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("ficnation_library", JSON.stringify(updatedList));
        window.dispatchEvent(new Event("ficnation_reading_updated"));
      }

      return updatedList;
    });

    if (user) {
      try {
        const supabase = createClient();
        const dbStatus = newStatus === "terminadas" ? "completado" : newStatus === "sin_iniciar" ? "guardado" : "leyendo";
        const progressPercent = newStatus === "terminadas" ? 100 : newStatus === "sin_iniciar" ? 0 : 50;
        await supabase
          .from("library_entries")
          .update({
            status: dbStatus,
            progress_percent: progressPercent,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("story_id", storyId);
      } catch {}
    }
  };

  // Filtrado por estado de lectura y por búsqueda de texto
  const filteredStories = libraryStories.filter((story) => {
    const matchesTab = story.status === activeTab;
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.genre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Conteo de cada sección
  const counts = {
    leyendo: libraryStories.filter((s) => s.status === "leyendo").length,
    sin_iniciar: libraryStories.filter((s) => s.status === "sin_iniciar").length,
    terminadas: libraryStories.filter((s) => s.status === "terminadas").length,
  };

  return (
    <div className="flex flex-col gap-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-20">
      
      {/* ═══════════════════ 1. ENCABEZADO Y MÉTRICAS ═══════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6" style={{ borderColor: "var(--border-primary)" }}>
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Mi Biblioteca Personal
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
                Organiza tus obras en lectura activa, pendientes y libros finalizados
              </p>
            </div>
          </div>
        </div>

        {/* Acciones y Resumen */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border px-4 py-2 rounded-2xl backdrop-blur-md fic-card-secondary">
            <Layers className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              <strong className="font-extrabold" style={{ color: "var(--text-primary)" }}>{libraryStories.length}</strong> historias en colección
            </span>
          </div>

          <Link
            href="/explorar"
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold shadow-md hover:scale-105 transition-all fic-btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Descubrir más historias</span>
          </Link>
        </div>

      </div>

      {/* ═══════════════════ 2. PESTAÑAS POR SECCIÓN + BUSCADOR ═══════════════════ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Pestañas de Secciones */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border overflow-x-auto scrollbar-none shadow-md fic-card">
          
          {/* Pestaña: Leyendo */}
          <button
            onClick={() => setActiveTab("leyendo")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "leyendo"
                ? "fic-btn-primary shadow-sm"
                : "fic-card-secondary hover:opacity-85"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Leyendo ({counts.leyendo})</span>
          </button>

          {/* Pestaña: Sin Iniciar */}
          <button
            onClick={() => setActiveTab("sin_iniciar")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "sin_iniciar"
                ? "fic-btn-primary shadow-sm"
                : "fic-card-secondary hover:opacity-85"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Sin Iniciar ({counts.sin_iniciar})</span>
          </button>

          {/* Pestaña: Terminadas */}
          <button
            onClick={() => setActiveTab("terminadas")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "terminadas"
                ? "fic-btn-primary shadow-sm"
                : "fic-card-secondary hover:opacity-85"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Terminadas ({counts.terminadas})</span>
          </button>
        </div>

        {/* Buscador interno */}
        <div className="relative max-w-xs w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-3.5 w-3.5 opacity-50" style={{ color: "var(--text-muted)" }} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, autor o género..."
            className="w-full rounded-2xl border fic-input py-2.5 pl-9 pr-3 text-xs placeholder:opacity-40 focus:outline-none backdrop-blur-md"
          />
        </div>

      </div>

      {/* ═══════════════════ 3. DISEÑO DE TARJETAS DE BIBLIOTECA ═══════════════════ */}
      {filteredStories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <div
              key={story.id}
              className="group relative flex flex-col justify-between rounded-3xl border fic-card p-5 hover:scale-[1.01] transition-all duration-200 overflow-hidden shadow-sm"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
            >
              {/* Contenedor Superior (Portada + Datos) */}
              <div className="flex gap-4">
                
                {/* Portada con efecto de libro, soporte GIF y Shimmer */}
                <div
                  onClick={() =>
                    openStoryModal({
                      id: story.storyId || story.id,
                      title: story.title,
                      coverImage: story.coverImage || "",
                      genre: story.genre,
                      author: story.author,
                      synopsis: story.synopsis,
                      reads: story.reads || "0",
                      votes: "0",
                      chapters: story.totalChapters || 1,
                      tags: story.tags || [],
                      completed: story.status === "terminadas",
                    })
                  }
                  className="relative w-28 h-40 rounded-2xl overflow-hidden shadow-md shrink-0 border transition-all cursor-pointer"
                  style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}
                >
                  <FicImage
                    src={story.coverImage}
                    alt={story.title}
                    fallbackType="cover"
                    className="transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Insignia sobre la portada */}
                  <div className="absolute top-2 left-2 z-10">
                    {story.status === "leyendo" && (
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-extrabold border backdrop-blur-md" style={{ background: "rgba(0,0,0,0.75)", color: "#ffffff", borderColor: "rgba(255,255,255,0.2)" }}>
                        {story.progressPercent}%
                      </span>
                    )}
                    {story.status === "sin_iniciar" && (
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold border backdrop-blur-md" style={{ background: "rgba(0,0,0,0.75)", color: "#ffffff", borderColor: "rgba(255,255,255,0.2)" }}>
                        Nueva
                      </span>
                    )}
                    {story.status === "terminadas" && (
                      <span className="rounded-full bg-emerald-950/90 px-2 py-0.5 text-[9px] font-extrabold text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Leída
                      </span>
                    )}
                  </div>
                </div>

                {/* Info de la Historia */}
                <div className="flex flex-col justify-between flex-1 min-w-0 space-y-1.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-badge)" }}>
                      {story.genre}
                    </span>
                    
                    <h3
                      onClick={() =>
                        openStoryModal({
                          id: story.storyId || story.id,
                          title: story.title,
                          coverImage: story.coverImage || "",
                          genre: story.genre,
                          author: story.author,
                          synopsis: story.synopsis,
                          reads: story.reads || "0",
                          votes: "0",
                          chapters: story.totalChapters || 1,
                          tags: story.tags || [],
                          completed: story.status === "terminadas",
                        })
                      }
                      className="text-sm font-extrabold line-clamp-2 leading-snug transition-colors cursor-pointer"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {story.title}
                    </h3>
                    
                    <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {story.synopsis}
                    </p>
                  </div>

                  {/* Autor con Avatar y Link al Perfil */}
                  <div className="pt-1">
                    <Link
                      href={`/usuario/${story.author.username}`}
                      className="inline-flex items-center gap-2 group/author hover:opacity-100"
                    >
                      <div className="relative h-5 w-5 rounded-full overflow-hidden border shadow-xs transition-all" style={{ borderColor: "var(--border-primary)" }}>
                        <FicImage
                          src={story.author.avatar}
                          alt={story.author.name}
                          fallbackType="avatar"
                        />
                      </div>
                      <span className="text-[11px] font-semibold transition-colors truncate" style={{ color: "var(--text-secondary)" }}>
                        {story.author.name}
                      </span>
                    </Link>
                  </div>

                  {/* Métricas (Vistas y Rating) */}
                  <div className="flex items-center gap-3 text-[10px] font-medium pt-1" style={{ color: "var(--text-muted)" }}>
                    {story.reads && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" style={{ color: "var(--text-badge)" }} />
                        {story.reads}
                      </span>
                    )}
                    {story.rating && (
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-current text-amber-500" />
                        {story.rating}
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* Contenedor Inferior: Progreso y Botón de Acción Específico */}
              <div className="pt-4 mt-4 border-t space-y-3" style={{ borderColor: "var(--border-primary)" }}>
                
                {/* 1. SECCIÓN: LEYENDO */}
                {story.status === "leyendo" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                          <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                          Capítulo {story.currentChapter} de {story.totalChapters}
                        </span>
                        <span className="font-mono font-extrabold text-xs" style={{ color: "var(--text-badge)" }}>
                          {story.progressPercent}%
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--reading-progress-track)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${story.progressPercent}%`, background: "var(--reading-progress-fill)" }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/leer?storyId=${story.storyId}&chapter=${story.currentChapter}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl py-2.5 px-4 text-xs font-bold shadow-md hover:scale-[1.02] transition-all fic-btn-primary"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Continuar Leyendo</span>
                      </Link>

                      <button
                        onClick={() => handleStatusChange(story.id, "terminadas")}
                        className="p-2.5 rounded-2xl border transition-all cursor-pointer fic-card-secondary hover:scale-105"
                        title="Marcar como Terminada"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </button>
                    </div>
                  </>
                )}

                {/* 2. SECCIÓN: SIN INICIAR */}
                {story.status === "sin_iniciar" && (
                  <>
                    <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                        {story.totalChapters} capítulos listos
                      </span>
                      <span
                        className="text-[10px] px-2.5 py-0.5 rounded-full border font-bold"
                        style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                      >
                        En lista de espera
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/leer?storyId=${story.storyId}&chapter=1`}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border py-2.5 px-4 text-xs font-bold transition-all shadow-sm fic-card-secondary hover:scale-[1.02]"
                      >
                        <Play className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                        <span style={{ color: "var(--text-primary)" }}>Comenzar Primer Capítulo</span>
                      </Link>

                      <button
                        onClick={() => handleStatusChange(story.id, "leyendo")}
                        className="p-2.5 rounded-2xl border transition-all cursor-pointer fic-card-secondary hover:scale-105"
                        title="Mover a Leyendo"
                      >
                        <BookOpen className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                      </button>
                    </div>
                  </>
                )}

                {/* 3. SECCIÓN: TERMINADAS */}
                {story.status === "terminadas" && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-emerald-500 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completada al 100%
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                        {story.lastReadDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/leer?storyId=${story.storyId}&chapter=1`}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border py-2.5 px-4 text-xs font-bold transition-all fic-card-secondary hover:scale-[1.02]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                        <span style={{ color: "var(--text-primary)" }}>Volver a Leer la Historia</span>
                      </Link>

                      <button
                        onClick={() => handleStatusChange(story.id, "leyendo")}
                        className="p-2.5 rounded-2xl border transition-all cursor-pointer fic-card-secondary hover:scale-105"
                        title="Mover a Leyendo"
                      >
                        <BookOpen className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
                      </button>
                    </div>
                  </>
                )}

              </div>

            </div>
          ))}
        </div>
      ) : (
        /* ═══════════════════ 4. ESTADOS VACÍOS SEGÚN LA PESTAÑA ═══════════════════ */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-3xl border fic-card-secondary space-y-4 shadow-sm">
          
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xs" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
            {activeTab === "leyendo" && <BookOpen className="h-7 w-7" />}
            {activeTab === "sin_iniciar" && <BookMarked className="h-7 w-7" />}
            {activeTab === "terminadas" && <CheckCircle2 className="h-7 w-7 text-emerald-500" />}
          </div>

          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
              {activeTab === "leyendo" && "No tienes lecturas en progreso actualmente"}
              {activeTab === "sin_iniciar" && "No tienes historias guardadas sin iniciar"}
              {activeTab === "terminadas" && "Aún no has completado ninguna historia"}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {activeTab === "leyendo" && "Comienza a leer cualquier obra del catálogo para retomar tu progreso desde aquí."}
              {activeTab === "sin_iniciar" && "Guarda historias para leer más tarde mientras exploras las novedades de la comunidad."}
              {activeTab === "terminadas" && "Cuando leas el capítulo final de una novela, se moverá automáticamente a esta sección."}
            </p>
          </div>

          <Link
            href="/explorar"
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold shadow-md hover:scale-105 transition-all fic-btn-primary"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explorar Historias</span>
          </Link>
        </div>
      )}

    </div>
  );
}
