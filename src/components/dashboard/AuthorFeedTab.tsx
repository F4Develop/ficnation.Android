"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Send,
  Clock,
  ArrowRight,
  Play,
  Flame,
  UserPlus,
  UserCheck,
  Megaphone,
  MessageSquare,
  Eye,
  Star,
  CheckCircle2,
  Calendar,
  Layers,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePresence } from "@/context/PresenceContext";
import { FicImage } from "@/components/ui/FicImage";
import {
  getFollowingList,
  toggleFollowUser,
  checkIsFollowing,
  type FollowUserItem,
} from "@/lib/followService";
import { createClient } from "@/lib/supabase/client";

export interface FeedChapterRelease {
  id: string;
  storyId: string;
  storyTitle: string;
  storyCover: string;
  storyGenre: string;
  chapterNumber: number;
  chapterTitle: string;
  wordCount: number;
  volumeTitle?: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    level: number;
    levelTitle?: string;
  };
}

export interface AuthorBulletin {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorLevel: number;
  content: string;
  createdAt: string;
  likesCount?: number;
}

export function AuthorFeedTab() {
  const { user } = useAuth();
  const { isUserOnline } = usePresence();

  const [followingList, setFollowingList] = useState<FollowUserItem[]>([]);
  const [releases, setReleases] = useState<FeedChapterRelease[]>([]);
  const [bulletins, setBulletins] = useState<AuthorBulletin[]>([]);
  const [suggestedAuthors, setSuggestedAuthors] = useState<any[]>([]);
  const [followingStatusMap, setFollowingStatusMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Formulario de aviso de autor
  const [newBulletinText, setNewBulletinText] = useState("");
  const [isPostingBulletin, setIsPostingBulletin] = useState(false);
  const [bulletinSuccess, setBulletinSuccess] = useState(false);

  useEffect(() => {
    loadFeedData();

    const handleFollowChange = () => {
      loadFeedData();
    };

    window.addEventListener("ficnation_follow_changed", handleFollowChange);
    return () => {
      window.removeEventListener("ficnation_follow_changed", handleFollowChange);
    };
  }, [user?.id]);

  async function loadFeedData() {
    setIsLoading(true);
    try {
      const supabase = createClient();
      let followedUsers: FollowUserItem[] = [];

      if (user?.id) {
        followedUsers = await getFollowingList(user.id);
        setFollowingList(followedUsers);
      }

      // 1. Cargar Avisos de Autores (Bulletins)
      const storedBulletins: AuthorBulletin[] = [];
      try {
        const rawLocal = localStorage.getItem("ficnation_author_bulletins");
        if (rawLocal) {
          storedBulletins.push(...JSON.parse(rawLocal));
        }
      } catch {}

      // Si no hay avisos aún, proveer algunos iniciales de la comunidad
      if (storedBulletins.length === 0) {
        storedBulletins.push(
          {
            id: "b-1",
            authorId: "author-default-1",
            authorName: "Valeria Thorne",
            authorUsername: "valeriathorne",
            authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            authorLevel: 14,
            content: "¡Hola a todos mis lectores! Este viernes liberamos el clímax del Tomo 2. Habrá sorpresas y revelaciones que cambiarán todo el reino.",
            createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
            likesCount: 19,
          },
          {
            id: "b-2",
            authorId: "author-default-2",
            authorName: "Damián Cruz",
            authorUsername: "damian_fic",
            authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            authorLevel: 9,
            content: "Acabo de terminar la revisión del nuevo arco de ciencia ficción. Muchas gracias por las estrellas y el apoyo en los comentarios.",
            createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
            likesCount: 8,
          }
        );
      }
      setBulletins(storedBulletins);

      // 2. Cargar novedades de capítulos (Feed de Lanzamientos)
      const feedItems: FeedChapterRelease[] = [];

      // Cargar capítulos de Supabase con información de la historia y el autor
      const { data: dbChapters } = await supabase
        .from("chapters")
        .select(`
          id,
          story_id,
          chapter_number,
          title,
          word_count,
          volume_title,
          is_published,
          scheduled_at,
          created_at,
          stories!story_id (
            id,
            title,
            cover_url,
            genre,
            author_id,
            profiles!author_id (
              id,
              name,
              username,
              avatar_url,
              level,
              level_title
            )
          )
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (dbChapters && dbChapters.length > 0) {
        dbChapters.forEach((ch: any) => {
          const story = ch.stories;
          const author = story?.profiles;
          if (story && author) {
            feedItems.push({
              id: ch.id,
              storyId: story.id,
              storyTitle: story.title,
              storyCover: story.cover_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
              storyGenre: story.genre || "Fantasía",
              chapterNumber: ch.chapter_number,
              chapterTitle: ch.title,
              wordCount: ch.word_count || 0,
              volumeTitle: ch.volume_title,
              createdAt: ch.created_at,
              author: {
                id: author.id,
                name: author.name || "Autor",
                username: author.username || "autor",
                avatar: author.avatar_url || "/default-avatar.svg",
                level: author.level || 1,
                levelTitle: author.level_title || "Escritor",
              },
            });
          }
        });
      }

      // Cargar también capítulos locales creados en la sesión del usuario si los hay
      try {
        const localUserStories = JSON.parse(localStorage.getItem("ficnation_user_stories") || "[]");
        const localProfile = JSON.parse(localStorage.getItem("ficnation_cached_profile") || "{}");

        localUserStories.forEach((st: any) => {
          const localChaps = JSON.parse(localStorage.getItem(`ficnation_chapters_${st.id}`) || "[]");
          localChaps
            .filter((c: any) => c.isPublished)
            .forEach((c: any) => {
              if (!feedItems.some((fi) => fi.id === c.id)) {
                feedItems.unshift({
                  id: c.id,
                  storyId: st.id,
                  storyTitle: st.title,
                  storyCover: st.coverUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
                  storyGenre: st.genre || "Fantasía",
                  chapterNumber: c.chapterNumber,
                  chapterTitle: c.title,
                  wordCount: c.wordCount || 0,
                  volumeTitle: c.volumeTitle,
                  createdAt: c.createdAt || new Date().toISOString(),
                  author: {
                    id: user?.id || "local-author",
                    name: localProfile.name || user?.name || "Tú",
                    username: localProfile.username || user?.username || "tu_perfil",
                    avatar: localProfile.avatar || user?.avatar || "/default-avatar.svg",
                    level: user?.level || 1,
                    levelTitle: "Autor",
                  },
                });
              }
            });
        });
      } catch {}

      setReleases(feedItems);

      // 3. Cargar Sugerencias de Autores Populares
      const { data: dbSuggested } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url, bio, level, level_title")
        .neq("id", user?.id || "none")
        .order("level", { ascending: false })
        .limit(6);

      if (dbSuggested && dbSuggested.length > 0) {
        setSuggestedAuthors(dbSuggested);
        // Comprobar estado de seguimiento
        const map: Record<string, boolean> = {};
        for (const auth of dbSuggested) {
          map[auth.id] = await checkIsFollowing(user?.id, auth.id);
        }
        setFollowingStatusMap(map);
      }
    } catch {
      // Ignorar errores de red
    } finally {
      setIsLoading(false);
    }
  }

  // Publicar un nuevo aviso de autor
  const handlePostBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBulletinText.trim() || !user) return;

    setIsPostingBulletin(true);

    const newBulletin: AuthorBulletin = {
      id: `b-${Date.now()}`,
      authorId: user.id,
      authorName: user.name || "Autor",
      authorUsername: user.username || "autor",
      authorAvatar: user.avatar || "/default-avatar.svg",
      authorLevel: user.level || 1,
      content: newBulletinText.trim(),
      createdAt: new Date().toISOString(),
      likesCount: 1,
    };

    const updated = [newBulletin, ...bulletins];
    setBulletins(updated);

    try {
      localStorage.setItem("ficnation_author_bulletins", JSON.stringify(updated.slice(0, 50)));
    } catch {}

    setNewBulletinText("");
    setIsPostingBulletin(false);
    setBulletinSuccess(true);
    setTimeout(() => setBulletinSuccess(false), 3000);
  };

  // Alternar seguimiento a un autor sugerido
  const handleToggleFollow = async (targetUser: any) => {
    if (!user) return;
    const res = await toggleFollowUser({
      followerId: user.id,
      followingId: targetUser.id,
      actorName: user.name || "Usuario",
      actorAvatar: user.avatar,
    });

    setFollowingStatusMap((prev) => ({
      ...prev,
      [targetUser.id]: res.isFollowing,
    }));
  };

  // Filtrar si el usuario sigue a alguien o si mostramos lanzamientos globales de autores
  const followedReleases = releases.filter((r) =>
    followingList.some((f) => f.id === r.author.id) || r.author.id === user?.id
  );

  const displayReleases = followedReleases.length > 0 ? followedReleases : releases;
  const isViewingGlobalCommunity = followedReleases.length === 0;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* ══════════════════ 1. HEADER DEL FEED ══════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6" style={{ borderColor: "var(--border-primary)" }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Megaphone className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black" style={{ color: "var(--text-primary)" }}>
              Novedades en Vivo de Autores
            </h2>
          </div>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Lanzamientos de capítulos recién estrenados, noticias de creadores y anuncios de tu comunidad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full border fic-card-secondary" style={{ color: "var(--text-muted)" }}>
            Siguiendo a <strong style={{ color: "var(--text-primary)" }}>{followingList.length}</strong> {followingList.length === 1 ? "autor" : "autores"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ══════════════════ COLUMNA PRINCIPAL: FEED DE CAPÍTULOS & AVISOS (8 cols) ══════════════════ */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Caja para publicar aviso rápido de autor */}
          {user && (
            <div
              className="p-5 rounded-3xl border fic-card shadow-sm space-y-3"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0 border" style={{ borderColor: "var(--border-primary)" }}>
                  <FicImage src={user.avatar} alt={user.name || "Tú"} fallbackType="avatar" />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    Publicar Anuncio o Nota para tus Lectores
                  </h4>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Comparte noticias sobre tus historias, pausas o próximos estrenos
                  </p>
                </div>
              </div>

              <form onSubmit={handlePostBulletin} className="space-y-3 pt-1">
                <textarea
                  rows={2}
                  value={newBulletinText}
                  onChange={(e) => setNewBulletinText(e.target.value)}
                  placeholder="¿En qué capítulo estás trabajando? ¿Habrá nuevo estreno esta semana?..."
                  className="w-full rounded-2xl border p-3 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                />

                <div className="flex items-center justify-between pt-1">
                  {bulletinSuccess ? (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>¡Aviso publicado en el feed!</span>
                    </span>
                  ) : (
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      Visible para todos tus seguidores
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={!newBulletinText.trim() || isPostingBulletin}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md fic-btn-primary hover:scale-105 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publicar Aviso</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Banner si está mostrando lanzamientos globales por no tener seguidos aún */}
          {isViewingGlobalCommunity && (
            <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <p style={{ color: "var(--text-secondary)" }}>
                  Mostrando <strong>estrenos destacados de la comunidad</strong>. ¡Sigue autores para personalizar este feed con tus obras favoritas!
                </p>
              </div>
            </div>
          )}

          {/* LISTA DE LANZAMIENTOS DE CAPÍTULOS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Estrenos y Capítulos Recientes</span>
            </h3>

            {displayReleases.length > 0 ? (
              displayReleases.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl border fic-card hover:border-purple-500/40 transition-all shadow-xs group space-y-4"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  {/* Encabezado del Autor */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/usuario?id=${item.author.id}`} className="relative shrink-0 group-hover:scale-105 transition-transform">
                        <div className="h-10 w-10 rounded-full overflow-hidden border ring-2 ring-purple-500/20" style={{ borderColor: "var(--border-primary)" }}>
                          <FicImage src={item.author.avatar} alt={item.author.name} fallbackType="avatar" />
                        </div>
                        {isUserOnline(item.author.id) && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black"></span>
                        )}
                      </Link>

                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/usuario?id=${item.author.id}`}
                            className="text-xs font-bold hover:underline"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item.author.name}
                          </Link>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
                            Nv. {item.author.level}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                          @{item.author.username} • {new Date(item.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                      Capítulo Nuevo
                    </span>
                  </div>

                  {/* Tarjeta de la Obra y Capítulo */}
                  <div
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-2xl border fic-card-secondary"
                    style={{ borderColor: "var(--border-primary)" }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative h-16 w-12 rounded-xl overflow-hidden shadow-sm shrink-0 border" style={{ borderColor: "var(--border-primary)" }}>
                        <FicImage src={item.storyCover} alt={item.storyTitle} />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                          {item.storyGenre}
                        </span>
                        <Link
                          href={`/historia?id=${item.storyId}`}
                          className="text-xs sm:text-sm font-extrabold truncate block hover:underline"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.storyTitle}
                        </Link>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                            Capítulo {item.chapterNumber}: {item.chapterTitle}
                          </p>
                          {item.volumeTitle && (
                            <span className="text-[9px] font-mono px-2 py-0.2 rounded-md bg-purple-500/15 text-purple-400 font-bold border border-purple-500/20 flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              <span>{item.volumeTitle}</span>
                            </span>
                          )}
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                            • {item.wordCount} palabras
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/leer?storyId=${item.storyId}&chapter=${item.chapterNumber}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white fic-btn-primary hover:scale-105 transition-all shadow-md shrink-0 w-full sm:w-auto justify-center"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Leer Capítulo</span>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center rounded-3xl border fic-card-secondary space-y-3">
                <BookOpen className="w-8 h-8 opacity-40 mx-auto text-purple-400" />
                <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  No hay nuevos capítulos por ahora
                </h4>
                <p className="text-xs max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                  Tus autores favoritos publicarán nuevos episodios próximamente.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ══════════════════ COLUMNA LATERAL: PIZARRA DE AVISOS & SUGERIDOS (4 cols) ══════════════════ */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Pizarra de Comunicados Rápidos */}
          <div
            className="p-5 rounded-3xl border fic-card shadow-sm space-y-4"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-primary)" }}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Pizarra de Autores
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-purple-400">En Vivo</span>
            </div>

            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
              {bulletins.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl border fic-card-secondary space-y-2 text-xs transition-all hover:scale-[1.01]"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative h-7 w-7 rounded-full overflow-hidden border shrink-0" style={{ borderColor: "var(--border-primary)" }}>
                        <FicImage src={b.authorAvatar} alt={b.authorName} fallbackType="avatar" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-[11px] font-extrabold truncate" style={{ color: "var(--text-primary)" }}>
                          {b.authorName}
                        </h5>
                        <p className="text-[9px] font-mono truncate" style={{ color: "var(--text-muted)" }}>
                          @{b.authorUsername}
                        </p>
                      </div>
                    </div>

                    <span className="text-[9px] font-mono opacity-60" style={{ color: "var(--text-muted)" }}>
                      {new Date(b.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {b.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Autores Recomendados para Seguir */}
          <div
            className="p-5 rounded-3xl border fic-card shadow-sm space-y-4"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-primary)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Autores Sugeridos
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {suggestedAuthors.map((author) => {
                const isFollowing = !!followingStatusMap[author.id];

                return (
                  <div
                    key={author.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-2xl border fic-card-secondary"
                    style={{ borderColor: "var(--border-primary)" }}
                  >
                    <Link href={`/usuario?id=${author.id}`} className="flex items-center gap-2.5 min-w-0 group">
                      <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 border group-hover:scale-105 transition-transform" style={{ borderColor: "var(--border-primary)" }}>
                        <FicImage src={author.avatar_url || "/default-avatar.svg"} alt={author.name} fallbackType="avatar" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold truncate group-hover:underline" style={{ color: "var(--text-primary)" }}>
                          {author.name || "Autor"}
                        </h4>
                        <p className="text-[10px] font-mono truncate" style={{ color: "var(--text-muted)" }}>
                          @{author.username || "autor"} • Nv. {author.level || 1}
                        </p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleFollow(author)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                        isFollowing
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : "fic-btn-primary hover:scale-105 text-white shadow-xs"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3 h-3" />
                          <span>Siguiendo</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Seguir</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
