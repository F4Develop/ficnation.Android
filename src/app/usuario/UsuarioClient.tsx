"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Award,
  BookOpen,
  Bookmark,
  Users,
  PenTool,
  Sparkles,
  Check,
  Compass,
  Flame,
  Star,
  UserPlus,
  UserCheck,
  MessageSquare,
  ArrowLeft,
  Share2,
  Heart,
  Loader2,
  Edit3,
  Feather,
  LayoutGrid,
  List,
  Lock,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/context/PresenceContext";
import { useAuth, calculateReaderLevel, calculateAuthorLevel } from "@/context/AuthContext";
import { ACHIEVEMENTS } from "@/data/achievements";
import { FicImage } from "@/components/ui/FicImage";
import { UserAvatarWithFrame } from "@/components/ui/UserAvatarWithFrame";
import { getUserEquippedCosmetics } from "@/lib/inventoryStorage";
import { CATALOG_ITEMS } from "@/types/inventory";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { isUserVerified, checkIsAdmin } from "@/lib/adminAuth";
import { sendNotification } from "@/lib/notifications";
import { StoryCard } from "@/components/stories/StoryCard";
import { GiftAuthorModal } from "@/components/monetization/GiftAuthorModal";
import { FollowListModal } from "@/components/profile/FollowListModal";
import {
  checkIsFollowing,
  toggleFollowUser,
  getFollowStats,
} from "@/lib/followService";
import type { Story } from "@/data/mockStories";

// Presets de banner predeterminados
const BANNER_PRESETS = [
  "from-purple-950 via-indigo-950 to-[#080511]",
  "from-fuchsia-950 via-purple-900 to-black",
  "from-slate-950 via-purple-950 to-indigo-950",
  "from-purple-900 via-rose-950 to-zinc-950",
];



export default function PublicUserProfilePage() {
  const params = useParams();
  const userIdOrName = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "";

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"obras" | "listas" | "logros">("obras");

  const { isUserOnline } = usePresence();
  const { user } = useAuth();

  // Estado del botón Seguir y Estadísticas
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followModal, setFollowModal] = useState<{
    isOpen: boolean;
    type: "followers" | "following";
  }>({ isOpen: false, type: "followers" });

  const [authorStories, setAuthorStories] = useState<Story[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [storyViewMode, setStoryViewMode] = useState<"grid" | "list">("grid");

  // Perfil del usuario público
  const [targetProfile, setTargetProfile] = useState({
    id: userIdOrName,
    name: "Autor de FicNation",
    username: "autor",
    bio: "Miembro de la comunidad de creadores y lectores de FicNation.",
    avatar: "/default-avatar.svg",
    banner: BANNER_PRESETS[0],
    level: 1,
    levelTitle: "Iniciado",
    xp: 0,
    nextLevelXp: 500,
    stats: {
      stories: 0,
      readingLists: 0,
      followers: 0,
      following: 0,
    },
    badges: ["Pionero"],
  });

  const isOnline = mounted && targetProfile?.id ? isUserOnline(targetProfile.id) : false;
  const isOwnProfile = Boolean(
    user?.id && (
      user.id === targetProfile.id ||
      user.username === targetProfile.username ||
      user.id === userIdOrName ||
      user.username === userIdOrName
    )
  );

  useEffect(() => {
    setMounted(true);

    // Consultar perfil real en Supabase por ID o por Username
    async function loadPublicProfile() {
      try {
        const supabase = createClient();
        
        let query = supabase.from("profiles").select("*");
        
        // Comprobar si parece un UUID o un username
        if (userIdOrName.includes("-") && userIdOrName.length > 20) {
          query = query.eq("id", userIdOrName);
        } else {
          query = query.eq("username", userIdOrName);
        }

        const { data: dbProfile } = await query.maybeSingle();

        if (dbProfile) {
          // Obtener estadísticas exactas de seguidores y seguidos
          const statsData = await getFollowStats(dbProfile.id);

          const loaded = {
            id: dbProfile.id,
            name: dbProfile.name || "Autor de FicNation",
            username: dbProfile.username || "autor_fic",
            bio: dbProfile.bio || "Miembro de la comunidad de FicNation.",
            avatar: dbProfile.avatar_url || "/default-avatar.svg",
            banner: dbProfile.banner_url || BANNER_PRESETS[0],
            level: dbProfile.level ?? 1,
            levelTitle: dbProfile.level_title || "Iniciado",
            xp: dbProfile.xp ?? 120,
            nextLevelXp: dbProfile.next_level_xp || 500,
            stats: {
              stories: dbProfile.stories_count ?? 0,
              readingLists: dbProfile.lists_count ?? 0,
              followers: statsData.followers,
              following: statsData.following,
            },
            badges: Array.isArray(dbProfile.badges) ? dbProfile.badges : ["Pionero"],
          };
          setTargetProfile(loaded);
          setFollowersCount(loaded.stats.followers);
          setFollowingCount(loaded.stats.following);

          // Verificar si el usuario conectado ya sigue a este autor
          if (user?.id && user.id !== dbProfile.id) {
            const alreadyFollowing = await checkIsFollowing(user.id, dbProfile.id);
            setIsFollowing(alreadyFollowing);
          }

          // Cargar historias publicadas del autor
          setIsLoadingStories(true);
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
              chapters (id, is_published)
            `)
            .eq("author_id", dbProfile.id)
            .eq("is_published", true)
            .order("created_at", { ascending: false });

          if (dbStories && dbStories.length > 0) {
            const formattedStories: Story[] = dbStories
              .filter((s: any) => {
                const pubChaps = (s.chapters || []).filter((c: any) => c.is_published !== false);
                return pubChaps.length > 0;
              })
              .map((s: any) => {
                const pubChaps = (s.chapters || []).filter((c: any) => c.is_published !== false);
                return {
                  id: s.id,
                  title: s.title || "Historia sin título",
                  synopsis: s.synopsis || "",
                  genre: s.genre || "Fantasía",
                  tags: s.tags || [],
                  coverImage: s.cover_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
                  reads: `${s.reads_count || 0}`,
                  votes: `${s.votes_count || 0}`,
                  chapters: pubChaps.length,
                  completed: s.is_completed,
                  status: s.is_completed ? "completa" : "en_desarrollo",
                  author: {
                    id: dbProfile.id,
                    name: loaded.name,
                    username: loaded.username,
                    avatar: loaded.avatar,
                  },
                };
              });
            setAuthorStories(formattedStories);
            setTargetProfile((prev) => ({
              ...prev,
              stats: { ...prev.stats, stories: formattedStories.length },
            }));
          } else {
            // Si el perfil no tiene obras en Supabase, verificar si es el usuario conectado viendo su propio perfil
            const isOwnProfile = user?.id && user.id === dbProfile.id;
            if (isOwnProfile && typeof window !== "undefined") {
              try {
                const localStories = JSON.parse(localStorage.getItem("ficnation_user_stories") || "[]");
                const myLocalStories = localStories.filter((lu: any) => {
                  const isOwner = lu.authorId === dbProfile.id || lu.author_id === dbProfile.id || !lu.authorId;
                  const isPub = lu.isPublished === true || lu.is_published === true;
                  const chapCount = Number(lu.publishedChaptersCount ?? (lu.status === "borrador" ? 0 : lu.chaptersCount ?? lu.chapters?.length ?? 0));
                  return isOwner && isPub && chapCount > 0 && lu.status !== "borrador";
                });
                if (myLocalStories.length > 0) {
                  const formatted: Story[] = myLocalStories.map((lu: any) => {
                    const chapCount = Number(lu.publishedChaptersCount ?? (lu.status === "borrador" ? 0 : lu.chaptersCount ?? lu.chapters?.length ?? 0));
                    return {
                      id: lu.id,
                      title: lu.title,
                      synopsis: lu.synopsis || "",
                      genre: lu.genre || "Fantasía",
                      tags: lu.tags || [],
                      coverImage: lu.coverUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
                      reads: `${lu.readsCount || 0}`,
                      votes: `${lu.votesCount || 0}`,
                      chapters: chapCount,
                      completed: lu.status === "completa",
                      status: lu.status || "en_desarrollo",
                      author: {
                        id: dbProfile.id,
                        name: loaded.name,
                        username: loaded.username,
                        avatar: loaded.avatar,
                      },
                    };
                  });
                  setAuthorStories(formatted);
                  setTargetProfile((prev) => ({
                    ...prev,
                    stats: { ...prev.stats, stories: formatted.length },
                  }));
                } else {
                  setAuthorStories([]);
                  setTargetProfile((prev) => ({
                    ...prev,
                    stats: { ...prev.stats, stories: 0 },
                  }));
                }
              } catch {
                setAuthorStories([]);
                setTargetProfile((prev) => ({
                  ...prev,
                  stats: { ...prev.stats, stories: 0 },
                }));
              }
            } else {
              // Es el perfil de otro usuario sin historias publicadas
              setAuthorStories([]);
              setTargetProfile((prev) => ({
                ...prev,
                stats: { ...prev.stats, stories: 0 },
              }));
            }
          }
          setIsLoadingStories(false);
        }
      } catch {
        // Mantiene los fallbacks si la red tarda
      }
    }

    if (userIdOrName) {
      loadPublicProfile();
    }

    // Sincronización en tiempo real de seguimiento entre pestañas y componentes
    const handleFollowChanged = (e: any) => {
      if (e.detail?.followingId === targetProfile.id) {
        setIsFollowing(e.detail.isFollowing);
        setFollowersCount((prev) => Math.max(0, e.detail.isFollowing ? prev + 1 : prev - 1));
      }
    };

    // Sincronización en tiempo real de votos y vistas en perfil
    const handleStoryVoted = (e: any) => {
      if (e.detail?.storyId) {
        setAuthorStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId ? { ...s, votes: String(e.detail.newCount) } : s
          )
        );
      }
    };
    const handleStoryViewed = (e: any) => {
      if (e.detail?.storyId) {
        setAuthorStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId ? { ...s, reads: String(e.detail.readsCount) } : s
          )
        );
      }
    };

    window.addEventListener("ficnation_follow_changed", handleFollowChanged);
    window.addEventListener("ficnation_story_voted", handleStoryVoted);
    window.addEventListener("ficnation_story_viewed", handleStoryViewed);
    return () => {
      window.removeEventListener("ficnation_follow_changed", handleFollowChanged);
      window.removeEventListener("ficnation_story_voted", handleStoryVoted);
      window.removeEventListener("ficnation_story_viewed", handleStoryViewed);
    };
  }, [userIdOrName, user?.id, targetProfile.id]);

  // Alternar Seguir / Dejar de seguir con persistencia y feedback
  const handleToggleFollow = async () => {
    if (!user?.id) {
      // Redirigir a login o mostrar sugerencia
      window.location.href = `/login?redirect=/usuario/${targetProfile.username}`;
      return;
    }

    if (user.id === targetProfile.id || isTogglingFollow) {
      return;
    }

    setIsTogglingFollow(true);
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCount((prev) => Math.max(0, nextState ? prev + 1 : prev - 1));

    try {
      const res = await toggleFollowUser({
        followerId: user.id,
        followingId: targetProfile.id,
        actorName: user.name || "Usuario",
        actorAvatar: user.avatar,
      });

      setIsFollowing(res.isFollowing);
    } catch {
      // Revertir en caso de fallo
      setIsFollowing(!nextState);
      setFollowersCount((prev) => Math.max(0, !nextState ? prev + 1 : prev - 1));
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const isImageBanner = targetProfile.banner.startsWith("http://") || targetProfile.banner.startsWith("https://");
  const xpPercent = targetProfile.nextLevelXp > 0 ? Math.round((targetProfile.xp / targetProfile.nextLevelXp) * 100) : 24;

  const profileCosmetics = getUserEquippedCosmetics(targetProfile.id);
  const bannerFrameDef = CATALOG_ITEMS.find((c) => c.id === profileCosmetics.bannerFrameId);
  const petDef = CATALOG_ITEMS.find((c) => c.id === profileCosmetics.petId);
  const badgeDef = CATALOG_ITEMS.find((c) => c.id === profileCosmetics.badgeId);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 sm:px-6 lg:px-8 max-w-6xl xl:max-w-7xl mx-auto w-full pb-20">

      {/* Botón Volver */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </Link>
      </div>

      {/* ═══════════════════ 1. PORTADA Y HEADER DEL PERFIL PÚBLICO ═══════════════════ */}
      <div className={`relative rounded-3xl border fic-card shadow-md overflow-hidden transition-all duration-300 ${bannerFrameDef?.borderClass || ""}`}>

        {/* Banner con soporte GIF nativo y Shimmer */}
        <div className="h-36 sm:h-44 w-full relative overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
          {mounted && isImageBanner ? (
            <FicImage
              src={targetProfile.banner}
              alt="Portada"
              fallbackType="banner"
              className="w-full h-full object-cover transition-all duration-500"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-r ${mounted ? targetProfile.banner : BANNER_PRESETS[0]}`} />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80 pointer-events-none" />
        </div>

        {/* Sección con Avatar, Datos del Usuario y Acciones */}
        <div className="px-5 sm:px-7 pb-5 pt-0 relative">
          
          {/* Fila Principal: Avatar a la izquierda, Nombre al lado, Botones a la derecha */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Grupo de Identidad: Avatar solapado + Nombre, @username, niveles y badges */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
              
              {/* Avatar flotante sobre el banner */}
              <div className="-mt-12 sm:-mt-14 relative group shrink-0 inline-block">
                <div
                  className="rounded-full p-1 shadow-2xl inline-block ring-4 ring-[var(--bg-card)]"
                  style={{ background: "var(--bg-card)" }}
                >
                  <UserAvatarWithFrame
                    src={targetProfile.avatar}
                    alt={targetProfile.name}
                    size="2xl"
                    userId={targetProfile.id}
                  />
                </div>

                {/* Indicador de Actividad / En Línea Sobre el Avatar */}
                {isOnline && (
                  <div
                    className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 flex h-6 w-6 items-center justify-center rounded-full p-0.5 shadow-md ring-2 ring-emerald-500/60 z-10"
                    style={{ background: "var(--bg-card)" }}
                    title="Usuario activo en este momento"
                  >
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
                  </div>
                )}
              </div>

              {/* Nombre, @username, Niveles y Badges (AL LADO del Avatar, 100% debajo del banner) */}
              <div className="space-y-1.5 min-w-0 pt-1 sm:pt-3 flex-1">
                
                {/* Nombre + Verificación + Badges + Estado */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <span>{targetProfile.name}</span>
                    {isUserVerified(targetProfile.username || targetProfile.id) && (
                      <VerifiedBadge
                        size="md"
                        variant={checkIsAdmin(targetProfile) ? "creator" : "verified"}
                      />
                    )}
                  </h1>

                  {/* Título Cosmético Equipado del Inventario */}
                  {(() => {
                    const cosmetics = getUserEquippedCosmetics(targetProfile.id);
                    const titleItem = CATALOG_ITEMS.find((i) => i.id === cosmetics.titleId);
                    if (!titleItem) return null;
                    return (
                      <span className={`text-[11px] px-3 py-0.5 rounded-full font-bold shadow-xs ${titleItem.previewClass || "bg-purple-600 text-white font-bold"}`}>
                        {titleItem.name}
                      </span>
                    );
                  })()}

                  {/* Mascota de Lectura Acompañante */}
                  {petDef && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[11px] font-bold shadow-xs select-none"
                      title={`Mascota de lectura: ${petDef.name}`}
                    >
                      <span className="text-sm animate-bounce-gentle">{petDef.icon}</span>
                      <span>{petDef.name}</span>
                    </span>
                  )}

                  {/* Pin de Vitrina Equipado */}
                  {badgeDef && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold shadow-xs select-none"
                      title={`Pin: ${badgeDef.name}`}
                    >
                      <span>{badgeDef.icon}</span>
                      <span>{badgeDef.name}</span>
                    </span>
                  )}

                  {/* Insignia de Autor Verificado */}
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-[11px] font-extrabold shadow-xs"
                    title="Autor Verificado Oficial de FicNation"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Autor Verificado</span>
                  </span>

                  {/* Badge de Estado en Vivo */}
                  {isOnline ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold font-mono shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Activo ahora</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono fic-card-secondary" style={{ color: "var(--text-muted)" }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                      <span>Desconectado</span>
                    </span>
                  )}
                </div>

                {/* Username @username */}
                <p className="text-xs sm:text-sm font-mono font-medium" style={{ color: "var(--text-muted)" }}>
                  @{targetProfile.username}
                </p>

                {/* Niveles Duales: Lector Lv & Autor Lv */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <div
                    className="rounded-full px-3 py-0.5 text-xs font-bold border flex items-center gap-1.5 shadow-xs transition-colors"
                    style={{
                      background: "var(--bg-subtle)",
                      borderColor: "var(--border-primary)",
                      color: "var(--text-primary)",
                    }}
                    title="Nivel de Lector basado en XP y lecturas"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>
                      Lector Lv. {calculateReaderLevel(targetProfile.xp).level}:{" "}
                      <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {calculateReaderLevel(targetProfile.xp).levelTitle}
                      </span>
                    </span>
                  </div>

                  <div
                    className="rounded-full px-3 py-0.5 text-xs font-bold border flex items-center gap-1.5 shadow-xs bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 transition-colors"
                    title="Nivel de Autor basado en historias y volumen publicado"
                  >
                    <Feather className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>
                      Autor Lv. {calculateAuthorLevel(authorStories.length).level}:{" "}
                      <span className="font-semibold text-purple-600 dark:text-purple-200">
                        {calculateAuthorLevel(authorStories.length).levelTitle}
                      </span>
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Acciones Públicas: Personalizar (propio) O Seguir, Regalo, Mensaje (otro usuario) */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0 self-start sm:self-center pt-2 sm:pt-0">
              {isOwnProfile ? (
                <Link
                  href="/avatar"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer fic-btn-primary hover:scale-105 shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Personalizar Mi Perfil</span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleToggleFollow}
                    disabled={isTogglingFollow}
                    className={`inline-flex items-center justify-center gap-2 rounded-full min-w-[114px] px-4 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                      isFollowing
                        ? "fic-card-secondary border hover:scale-105 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30"
                        : "fic-btn-primary hover:scale-105"
                    }`}
                  >
                    {isTogglingFollow ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Siguiendo</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 shrink-0" />
                        <span>Seguir</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGiftModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-4.5 py-2.5 text-xs font-extrabold transition-all shadow-md cursor-pointer border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300 hover:bg-amber-500/25 hover:scale-105 shrink-0"
                  >
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
                    <span>Apoyar con Regalo</span>
                  </button>

                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold cursor-not-allowed opacity-60 fic-card-secondary shrink-0"
                    title="Mensajería disponible próximamente"
                  >
                    <MessageSquare className="w-4 h-4 opacity-50 shrink-0" />
                    <span>Mensaje</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono border"
                      style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                    >
                      Próximamente
                    </span>
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Biografía (Separada con una suave línea divisoria) */}
          {targetProfile.bio && (
            <p className="text-xs sm:text-sm max-w-3xl pt-3 mt-3 border-t leading-relaxed" style={{ color: "var(--text-secondary)", borderColor: "var(--border-primary)" }}>
              {targetProfile.bio}
            </p>
          )}

        </div>

      </div>

      {/* ═══════════════════ 2. GRID 2 COLUMNAS ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Columna Izquierda (4) */}
        <div className="lg:col-span-4 space-y-4">

          {/* Estadísticas */}
          <div className="rounded-3xl border fic-card p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Estadísticas</h3>
            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="p-3 rounded-2xl border fic-card-secondary">
                <p className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{targetProfile.stats.stories}</p>
                <p className="text-xs font-medium flex items-center justify-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                  <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                  Obras
                </p>
              </div>
              <div className="p-3 rounded-2xl border fic-card-secondary">
                <p className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{targetProfile.stats.readingLists}</p>
                <p className="text-xs font-medium flex items-center justify-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                  <Bookmark className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                  Listas
                </p>
              </div>
              
              {/* Tarjeta de Seguidores (Interactiva) */}
              <button
                type="button"
                onClick={() => setFollowModal({ isOpen: true, type: "followers" })}
                className="p-3 rounded-2xl border fic-card-secondary hover:scale-105 active:scale-95 transition-all cursor-pointer group text-center"
                title="Ver lista de seguidores"
              >
                <p className="text-xl font-black group-hover:underline" style={{ color: "var(--text-primary)" }}>{followersCount}</p>
                <p className="text-xs font-medium flex items-center justify-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                  <Users className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                  Seguidores
                </p>
              </button>

              {/* Tarjeta de Siguiendo (Interactiva) */}
              <button
                type="button"
                onClick={() => setFollowModal({ isOpen: true, type: "following" })}
                className="p-3 rounded-2xl border fic-card-secondary hover:scale-105 active:scale-95 transition-all cursor-pointer group text-center"
                title="Ver usuarios seguidos"
              >
                <p className="text-xl font-black group-hover:underline" style={{ color: "var(--text-primary)" }}>{followingCount}</p>
                <p className="text-xs font-medium flex items-center justify-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                  <Users className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                  Siguiendo
                </p>
              </button>
            </div>
          </div>

          {/* Nivel y XP */}
          <div className="rounded-3xl border fic-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm shrink-0" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                  <Award className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Nivel {targetProfile.level} • {targetProfile.levelTitle}</h3>
                  <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{targetProfile.xp} / {targetProfile.nextLevelXp} XP</p>
                </div>
              </div>
              <span className="text-xs font-extrabold font-mono" style={{ color: "var(--text-badge)" }}>{xpPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--reading-progress-track)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(xpPercent, 4)}%`, background: "var(--reading-progress-fill)" }}
              />
            </div>
          </div>

          {/* Evaluación de logros del usuario público */}
          {(() => {
            const isAchievementUnlockedForTarget = (a: (typeof ACHIEVEMENTS)[0]) => {
              if (targetProfile.badges.includes(a.id)) return true;
              if (a.legacyId && targetProfile.badges.includes(a.legacyId)) return true;
              const votesCount = authorStories.reduce((acc, s) => acc + (parseInt(s.votes) || 0), 0);
              return a.evaluate({
                user: {
                  id: targetProfile.id,
                  xp: targetProfile.xp,
                  level: targetProfile.level,
                  badges: targetProfile.badges,
                  stats: targetProfile.stats,
                },
                storiesCount: authorStories.length,
                readingListsCount: targetProfile.stats.readingLists,
                totalVotesReceived: votesCount,
              }).isCompleted;
            };

            const unlockedAchievementsCount = ACHIEVEMENTS.filter((a) => isAchievementUnlockedForTarget(a)).length;

            return (
              /* Logros Desbloqueados */
              <div className="rounded-3xl border fic-card p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Logros de {targetProfile.name.split(" ")[0]}</span>
                  </h3>
                  <span className="text-[10px] font-semibold font-mono" style={{ color: "var(--text-badge)" }}>
                    {unlockedAchievementsCount}/{ACHIEVEMENTS.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ACHIEVEMENTS.map((b) => {
                    const isUnlocked = isAchievementUnlockedForTarget(b);
                    const Icon = b.icon;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setActiveTab("logros")}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isUnlocked
                            ? "fic-card-secondary"
                            : "opacity-40 fic-card-secondary hover:opacity-60"
                        }`}
                        title={`${b.name} - ${isUnlocked ? "Desbloqueado" : "Requisito: " + b.req}`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${b.color}`} />
                        <span className="text-[10px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{b.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

        </div>

        {/* Columna Derecha (8) */}
        <div className="lg:col-span-8 space-y-4">

          {/* Pestañas */}
          <div className="flex items-center gap-2 rounded-2xl border fic-card p-1.5 shadow-sm">
            {([
              { key: "obras" as const, label: `Obras (${targetProfile.stats.stories})`, icon: BookOpen },
              { key: "listas" as const, label: `Listas (${targetProfile.stats.readingLists})`, icon: Bookmark },
              { key: "logros" as const, label: "Logros", icon: Award },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "fic-btn-primary shadow-sm"
                    : "fic-card-secondary hover:opacity-85"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Contenido Pestaña: Obras */}
          {activeTab === "obras" && (
            <div className="space-y-4">
              {isLoadingStories ? (
                <div className="p-10 text-center text-xs animate-pulse" style={{ color: "var(--text-muted)" }}>
                  Cargando obras del autor...
                </div>
              ) : authorStories.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-10 rounded-3xl border fic-card-secondary space-y-3">
                  <PenTool className="h-9 w-9 opacity-50" style={{ color: "var(--text-muted)" }} />
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Este autor no ha publicado historias todavía</h3>
                  <p className="text-xs max-w-sm" style={{ color: "var(--text-muted)" }}>
                    Cuando {targetProfile.name} publique su primera obra o capítulo, aparecerá disponible aquí.
                  </p>
                </div>
              ) : (
                <>
                  {/* Barra de control de vista de historias */}
                  <div className="flex items-center justify-between gap-2 px-1">
                    <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      {authorStories.length} {authorStories.length === 1 ? "obra publicada" : "obras publicadas"}
                    </p>
                    <div className="flex items-center gap-1 p-1 rounded-xl border fic-card-secondary">
                      <button
                        type="button"
                        onClick={() => setStoryViewMode("grid")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          storyViewMode === "grid" ? "fic-btn-primary shadow-xs" : "opacity-60 hover:opacity-100"
                        }`}
                        title="Vista Cuadrícula Mediana"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cuadrícula</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStoryViewMode("list")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          storyViewMode === "list" ? "fic-btn-primary shadow-xs" : "opacity-60 hover:opacity-100"
                        }`}
                        title="Vista Detallada (Llena el espacio sin vacíos)"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Detallada</span>
                      </button>
                    </div>
                  </div>

                  {storyViewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5">
                      {authorStories.map((story) => (
                        <div key={story.id} className="w-full max-w-[260px]">
                          <StoryCard story={story} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 w-full">
                      {authorStories.map((story) => (
                        <StoryCard key={story.id} story={story} layout="horizontal" />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Contenido Pestaña: Listas */}
          {activeTab === "listas" && (
            <div className="flex flex-col items-center justify-center text-center p-10 rounded-3xl border fic-card-secondary space-y-3">
              <Bookmark className="h-9 w-9 opacity-50" style={{ color: "var(--text-muted)" }} />
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>No hay listas de lectura públicas</h3>
              <p className="text-xs max-w-sm" style={{ color: "var(--text-muted)" }}>
                Las colecciones públicas guardadas por {targetProfile.name} se mostrarán en esta sección.
              </p>
            </div>
          )}

          {/* Contenido Pestaña: Logros */}
          {activeTab === "logros" && (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl border fic-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Logros de {targetProfile.name}</span>
                  </h4>
                  <p className="text-xs pt-0.5" style={{ color: "var(--text-muted)" }}>
                    Logros completados y recompensas de experiencia (XP) otorgadas en FicNation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
                {ACHIEVEMENTS.map((badge) => {
                  const votesCount = authorStories.reduce((acc, s) => acc + (parseInt(s.votes) || 0), 0);
                  const evalResult = badge.evaluate({
                    user: {
                      id: targetProfile.id,
                      xp: targetProfile.xp,
                      level: targetProfile.level,
                      badges: targetProfile.badges,
                      stats: targetProfile.stats,
                    },
                    storiesCount: authorStories.length,
                    readingListsCount: targetProfile.stats.readingLists,
                    totalVotesReceived: votesCount,
                  });
                  const isUnlocked =
                    targetProfile.badges.includes(badge.id) ||
                    (badge.legacyId ? targetProfile.badges.includes(badge.legacyId) : false) ||
                    evalResult.isCompleted;
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.id}
                      className={`flex flex-col justify-between p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${
                        isUnlocked
                          ? "fic-card shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          : "fic-card-secondary opacity-75 hover:opacity-95"
                      }`}
                      style={{ borderColor: "var(--border-primary)" }}
                    >
                      {/* Cabecera de Tarjeta: Icono, Recompensa y Categoría */}
                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                            style={{
                              background: "var(--bg-subtle)",
                              borderColor: "var(--border-primary)",
                              color: "var(--text-badge)",
                            }}
                          >
                            <Icon className={`h-6 w-6 ${badge.color}`} />
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            {/* Recompensa de XP */}
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 font-mono text-xs font-black shadow-xs">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              +{badge.rewardXp} XP
                            </span>
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md border fic-card-secondary"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {badge.categoryLabel}
                            </span>
                          </div>
                        </div>

                        {/* Título y Descripción */}
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }} title={badge.name}>
                            {badge.name}
                          </h4>
                          <p className="text-xs leading-relaxed line-clamp-2 min-h-[32px]" style={{ color: "var(--text-secondary)" }}>
                            {badge.desc}
                          </p>
                        </div>

                        {/* Caja de Requisito Específico */}
                        <div className="p-2.5 rounded-2xl border fic-card-secondary space-y-0.5">
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 block">
                            Requisito
                          </span>
                          <p className="text-[11px] leading-snug font-medium line-clamp-2" style={{ color: "var(--text-primary)" }}>
                            {badge.req}
                          </p>
                        </div>
                      </div>

                      {/* Pie de Tarjeta: Estado */}
                      <div className="mt-4 pt-3.5 border-t" style={{ borderColor: "var(--border-primary)" }}>
                        {isUnlocked ? (
                          <div className="w-full py-2 px-3 rounded-2xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Desbloqueado</span>
                          </div>
                        ) : (
                          <div className="w-full py-2 px-3 rounded-2xl text-xs font-semibold opacity-60 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 flex items-center justify-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Bloqueado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Modal de Enviar Regalo al Autor */}
      <GiftAuthorModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        author={{
          id: targetProfile.id,
          name: targetProfile.name,
          username: targetProfile.username,
          avatar: targetProfile.avatar,
        }}
      />

      {/* Modal de Seguidores y Siguiendo */}
      <FollowListModal
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal((prev) => ({ ...prev, isOpen: false }))}
        userId={targetProfile.id}
        userName={targetProfile.name}
        initialType={followModal.type}
      />

    </div>
  );
}
