"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  BookOpen,
  User,
  Tag,
  Sparkles,
  Eye,
  Star,
  Compass,
  ChevronRight,
  Command,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { isUserVerified, checkIsAdmin } from "@/lib/adminAuth";
import { useStoryModal } from "@/context/StoryModalContext";

// Etiquetas y géneros populares predefinidos
const POPULAR_TAGS = [
  "Fantasía",
  "Romance",
  "Isekai",
  "Acción",
  "Aventura",
  "Ciencia Ficción",
  "Misterio",
  "Drama",
  "Magia",
  "Sobrenatural",
  "Cyberpunk",
  "Fanfiction",
  "Reencarnación",
  "Comedia",
  "Terror",
];

interface SearchStoryResult {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  coverImage: string;
  reads: number;
  votes: number;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  isVerified?: boolean;
  isCreator?: boolean;
}

interface SearchUserResult {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
  isCreator?: boolean;
}

interface NavbarSearchProps {
  isMobile?: boolean;
  onSelectResult?: () => void;
}

export function NavbarSearch({ isMobile = false, onSelectResult }: NavbarSearchProps) {
  const router = useRouter();
  const { openStoryModal } = useStoryModal();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "stories" | "users" | "tags">("all");
  const [isLoading, setIsLoading] = useState(false);

  const [storyResults, setStoryResults] = useState<SearchStoryResult[]>([]);
  const [userResults, setUserResults] = useState<SearchUserResult[]>([]);
  const [tagResults, setTagResults] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. ATAJO DE TECLADO: Ctrl + K o Cmd + K para enfocar la barra
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. CERRAR AL HACER CLIC AFUERA
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. MOTOR DE BÚSQUEDA MULTI-CATEGORÍA EN TIEMPO REAL
  const executeSearch = useCallback(async (searchTerm: string) => {
    const clean = searchTerm.trim().toLowerCase();
    if (!clean) {
      setStoryResults([]);
      setUserResults([]);
      setTagResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // A) BÚSQUEDA DE HISTORIAS EN SUPABASE Y LOCAL
      let matchedStories: SearchStoryResult[] = [];
      try {
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
            author_id,
            profiles!author_id (id, name, username, avatar_url),
            chapters (id, is_published)
          `)
          .eq("is_published", true)
          .or(`title.ilike.%${clean}%,synopsis.ilike.%${clean}%,genre.ilike.%${clean}%`)
          .limit(10);

        if (dbStories && dbStories.length > 0) {
          matchedStories = dbStories
            .filter((s: any) => {
              const pubChaps = (s.chapters || []).filter((c: any) => c.is_published !== false);
              return pubChaps.length > 0;
            })
            .map((s: any) => {
              const author = s.profiles;
              const authorUsername = author?.username || "autor";
              const authorName = author?.name || "Autor";
              const isCreator = checkIsAdmin({ username: authorUsername, name: authorName });
              const isVerified = isUserVerified(authorUsername) || isUserVerified(s.author_id);

              return {
                id: s.id,
                title: s.title || "Historia sin título",
                synopsis: s.synopsis || "",
                genre: s.genre || "Fantasía",
                coverImage: s.cover_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500",
                reads: Math.max(Number(s.reads_count || 0), Number(s.votes_count || 0)),
                votes: Number(s.votes_count || 0),
                authorName,
                authorUsername,
                authorAvatar: author?.avatar_url,
                isVerified,
                isCreator,
              };
            });
        }
      } catch {}

      // Incluir historias locales que coincidan (solo publicadas y con capítulos)
      if (typeof window !== "undefined") {
        try {
          const localUserStories = JSON.parse(localStorage.getItem("ficnation_user_stories") || "[]");
          const localCached = JSON.parse(localStorage.getItem("ficnation_cached_profile") || "{}");
          localUserStories.forEach((lu: any) => {
            const isPub = lu.isPublished === true || lu.is_published === true;
            const chapCount = Number(lu.publishedChaptersCount ?? (lu.status === "borrador" ? 0 : lu.chaptersCount ?? lu.chapters?.length ?? 0));
            if (
              lu &&
              lu.id &&
              isPub &&
              chapCount > 0 &&
              lu.status !== "borrador" &&
              !matchedStories.some((s) => s.id === lu.id) &&
              (lu.title?.toLowerCase().includes(clean) ||
                lu.genre?.toLowerCase().includes(clean) ||
                lu.synopsis?.toLowerCase().includes(clean))
            ) {
              const aUser = lu.author?.username || localCached.username || "autor";
              matchedStories.unshift({
                id: lu.id,
                title: lu.title || "Historia",
                synopsis: lu.synopsis || "",
                genre: lu.genre || "Fantasía",
                coverImage: lu.coverUrl || lu.coverImage || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500",
                reads: Math.max(Number(lu.readsCount || lu.reads || 0), Number(lu.votesCount || lu.votes || 0)),
                votes: Number(lu.votesCount || lu.votes || 0),
                authorName: lu.author?.name || localCached.name || "Tú",
                authorUsername: aUser,
                authorAvatar: lu.author?.avatar || localCached.avatar,
                isVerified: isUserVerified(aUser),
                isCreator: checkIsAdmin({ username: aUser }),
              });
            }
          });
        } catch {}
      }

      setStoryResults(matchedStories.slice(0, 5));

      // B) BÚSQUEDA DE USUARIOS / AUTORES
      let matchedUsers: SearchUserResult[] = [];
      try {
        const { data: dbProfiles } = await supabase
          .from("profiles")
          .select("id, name, username, avatar_url")
          .or(`name.ilike.%${clean}%,username.ilike.%${clean}%`)
          .limit(5);

        if (dbProfiles && dbProfiles.length > 0) {
          matchedUsers = dbProfiles.map((p: any) => {
            const uName = p.username || p.id;
            return {
              id: p.id,
              name: p.name || "Usuario",
              username: uName,
              avatar: p.avatar_url || "/default-avatar.svg",
              isVerified: isUserVerified(uName) || isUserVerified(p.id),
              isCreator: checkIsAdmin({ username: uName, name: p.name }),
            };
          });
        }
      } catch {}

      // Incluir perfil local si coincide
      if (typeof window !== "undefined") {
        try {
          const cachedProfile = JSON.parse(localStorage.getItem("ficnation_cached_profile") || "{}");
          if (
            cachedProfile.username &&
            !matchedUsers.some((u) => u.username === cachedProfile.username) &&
            (cachedProfile.name?.toLowerCase().includes(clean) ||
              cachedProfile.username?.toLowerCase().includes(clean))
          ) {
            matchedUsers.unshift({
              id: cachedProfile.id || "local",
              name: cachedProfile.name || "Tú",
              username: cachedProfile.username,
              avatar: cachedProfile.avatar || "/default-avatar.svg",
              isVerified: isUserVerified(cachedProfile.username),
              isCreator: checkIsAdmin(cachedProfile),
            });
          }
        } catch {}
      }

      setUserResults(matchedUsers.slice(0, 4));

      // C) BÚSQUEDA DE ETIQUETAS Y GÉNEROS
      const matchedTags = POPULAR_TAGS.filter((t) => t.toLowerCase().includes(clean));
      setTagResults(matchedTags.slice(0, 6));
    } catch {
      // Manejo silencioso
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce para optimizar consultas
  useEffect(() => {
    if (!query.trim()) {
      setStoryResults([]);
      setUserResults([]);
      setTagResults([]);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(query);
    }, 120);

    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  // Manejo de envío del formulario (Enter o búsqueda completa)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    if (onSelectResult) onSelectResult();
    router.push(`/explorar?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectStory = (story: SearchStoryResult) => {
    setIsOpen(false);
    if (onSelectResult) onSelectResult();
    router.push(`/historia?id=${story.id}`);
  };

  const handleSelectUser = (user: SearchUserResult) => {
    setIsOpen(false);
    if (onSelectResult) onSelectResult();
    router.push(`/usuario?id=${user.username}`);
  };

  const handleSelectTag = (tag: string) => {
    setIsOpen(false);
    if (onSelectResult) onSelectResult();
    router.push(`/explorar?genre=${encodeURIComponent(tag)}`);
  };

  const totalResults = storyResults.length + userResults.length + tagResults.length;

  return (
    <div ref={containerRef} suppressHydrationWarning className="relative w-full group">
      {/* BARRA DE ENTRADA */}
      <form onSubmit={handleSubmit} suppressHydrationWarning className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
          ) : (
            <Search className="h-4 w-4 opacity-50 group-focus-within:opacity-100 group-focus-within:text-purple-400 transition-all" style={{ color: "var(--text-muted)" }} />
          )}
        </div>

        <input
          ref={inputRef}
          suppressHydrationWarning
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={isMobile ? "Buscar historias, autores..." : "Buscar historias, autores, etiquetas..."}
          className="w-full rounded-full border fic-input py-2 pl-10 pr-16 text-sm placeholder:opacity-50 focus:outline-none transition-all shadow-xs"
        />

        {/* Botón de Limpiar (X) o Atajo Ctrl+K */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : mounted && !isMobile ? (
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/15 bg-white/5 text-[10px] font-mono text-zinc-400 select-none pointer-events-none">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          ) : null}
        </div>
      </form>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MENÚ DESPLEGABLE CON RESULTADOS VIVOS                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {isOpen && query.trim().length > 0 && (
        <div
          className={`absolute left-0 right-0 mt-2 z-50 rounded-3xl border fic-card p-3 shadow-2xl backdrop-blur-2xl animate-fade-in-scale overflow-hidden ${
            isMobile ? "max-h-[75vh]" : "max-h-[520px]"
          } overflow-y-auto`}
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-primary)",
            color: "var(--text-primary)",
          }}
        >
          {/* BARRA DE FILTROS POR CATEGORÍA */}
          <div className="flex items-center gap-1.5 pb-2.5 mb-2 border-b overflow-x-auto" style={{ borderColor: "var(--border-primary)" }}>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Todo ({totalResults})
            </button>

            {storyResults.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("stories")}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === "stories"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Historias ({storyResults.length})
              </button>
            )}

            {userResults.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === "users"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Autores ({userResults.length})
              </button>
            )}

            {tagResults.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("tags")}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === "tags"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Etiquetas ({tagResults.length})
              </button>
            )}
          </div>

          {/* SIN RESULTADOS */}
          {totalResults === 0 && !isLoading && (
            <div className="py-8 px-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                No encontramos resultados para &quot;{query}&quot;
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Intenta buscar por título de obra, nombre de autor o un género como Fantasía o Romance.
              </p>
              {/* Sugerencias de tags rápidos */}
              <div className="pt-2 flex items-center justify-center gap-1.5 flex-wrap">
                {POPULAR_TAGS.slice(0, 4).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold border hover:border-purple-500/50 hover:bg-purple-500/10 transition-all cursor-pointer"
                    style={{ borderColor: "var(--border-primary)", color: "var(--text-muted)" }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ════════════ SECCIÓN: HISTORIAS ════════════ */}
          {(activeTab === "all" || activeTab === "stories") && storyResults.length > 0 && (
            <div className="mb-3 space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-purple-400" />
                <span>Historias & Novelas</span>
              </div>

              {storyResults.map((story) => (
                <div
                  key={story.id}
                  onClick={() => handleSelectStory(story)}
                  className="group flex items-center gap-3 p-2 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer fic-card-secondary"
                  style={{ background: "var(--bg-card-secondary)" }}
                >
                  <div className="w-10 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-white/10 shadow-xs">
                    <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-extrabold truncate" style={{ color: "var(--text-primary)" }}>
                      {story.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <span className="truncate">por {story.authorName}</span>
                      {story.isVerified && (
                        <VerifiedBadge size="xs" variant={story.isCreator ? "creator" : "verified"} />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-zinc-400">
                      <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-purple-300">
                        {story.genre}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5" />
                        {story.reads}
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {story.votes}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-purple-400 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* ════════════ SECCIÓN: AUTORES / USUARIOS ════════════ */}
          {(activeTab === "all" || activeTab === "users") && userResults.length > 0 && (
            <div className="mb-3 space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <User className="w-3 h-3 text-sky-400" />
                <span>Autores & Creadores</span>
              </div>

              {userResults.map((usr) => (
                <div
                  key={usr.id}
                  onClick={() => handleSelectUser(usr)}
                  className="group flex items-center justify-between p-2 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer fic-card-secondary"
                  style={{ background: "var(--bg-card-secondary)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                      <img src={usr.avatar} alt={usr.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                        <span>{usr.name}</span>
                        {usr.isVerified && (
                          <VerifiedBadge size="xs" variant={usr.isCreator ? "creator" : "verified"} />
                        )}
                      </div>
                      <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                        @{usr.username}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-sky-400 flex items-center gap-1">
                    <span>Ver Perfil</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ════════════ SECCIÓN: ETIQUETAS & GÉNEROS ════════════ */}
          {(activeTab === "all" || activeTab === "tags") && tagResults.length > 0 && (
            <div className="mb-2 space-y-1.5">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-emerald-400" />
                <span>Géneros & Etiquetas</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap px-2">
                {tagResults.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSelectTag(t)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 cursor-pointer"
                    style={{
                      background: "var(--bg-card-secondary)",
                      borderColor: "var(--border-primary)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <Tag className="w-3 h-3 text-emerald-400" />
                    <span>#{t}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ════════════ PIE DE PÁGINA: BUSCAR EN EXPLORAR ════════════ */}
          <div className="pt-2 mt-2 border-t text-center" style={{ borderColor: "var(--border-primary)" }}>
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-extrabold transition-all hover:bg-purple-500/10 text-purple-400 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Ver todos los resultados para &quot;{query}&quot; en Explorar →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
