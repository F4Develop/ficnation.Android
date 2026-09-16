"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  Award,
  BookOpen,
  Bookmark,
  Users,
  PenTool,
  Sparkles,
  Edit3,
  X,
  Check,
  Compass,
  Flame,
  Star,
  Camera,
  Layers,
  UploadCloud,
  Loader2,
  AlertCircle,
  User,
  Image as ImageIcon,
  AtSign,
  FileText,
  Plus,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock,
  Lock,
  Globe,
  Coins,
  Wallet,
  Gift,
  Calendar,
  Zap,
  CreditCard,
  Building2,
  History,
  Heart,
  ShieldCheck,
  Palette,
  Link2,
  ArrowLeft,
  ArrowRight,
  Feather,
  LayoutGrid,
  List,
  LogOut,
  Settings,
  Moon,
  Sun,
  Share2,
} from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, type MobileTab } from "@/components/mobile/MobileBottomNav";
import { useAuth, calculateReaderLevel, calculateAuthorLevel } from "@/context/AuthContext";
import { useSettings, type AppTheme } from "@/context/SettingsContext";
import { createClient } from "@/lib/supabase/client";
import { FollowListModal } from "@/components/profile/FollowListModal";
import { getFollowStats } from "@/lib/followService";
import {
  ACHIEVEMENTS,
  getClaimedAchievements,
  markAchievementClaimed,
  evaluateAchievement,
  type AchievementCategory,
} from "@/data/achievements";

// Presets de avatar populares
export const AVATAR_PRESETS = [
  "/default-avatar.svg",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
];

// Presets de banner cósmicos
const BANNER_PRESETS = [
  { name: "Nebulosa Púrpura", value: "from-purple-950 via-indigo-950 to-[#070a12]" },
  { name: "Eclipse Neón", value: "from-fuchsia-950 via-purple-900 to-black" },
  { name: "Abismo Cósmico", value: "from-slate-950 via-purple-950 to-indigo-950" },
  { name: "Fuego Violeta", value: "from-purple-900 via-rose-950 to-zinc-950" },
  { name: "Papiro Imperial", value: "from-amber-950 via-yellow-950 to-[#120a05]" },
  { name: "Esmeralda Mística", value: "from-emerald-950 via-teal-950 to-black" },
];

export interface MobileProfileProps {
  onSelectTab?: (tab: MobileTab) => void;
  hideNav?: boolean;
  hideHeader?: boolean;
}

interface UserStoryItem {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  coverUrl: string;
  status: "completa" | "en_desarrollo";
  chaptersCount: number;
  readsCount: number;
  votesCount: number;
  createdAt: string;
}

interface ReadingListItem {
  id: string;
  name: string;
  description: string;
  count: number;
  coverImage?: string;
  isPrivate: boolean;
}

export function MobileProfileView({
  onSelectTab,
  hideNav,
  hideHeader,
}: MobileProfileProps = {}) {
  const {
    user,
    refreshProfile,
    updateProfile,
    requestCashout,
    getCashoutHistory,
    getReceivedTips,
    addXp,
    logout,
  } = useAuth();
  const {
    appTheme,
    setAppTheme,
    isLowSpecMode,
    toggleLowSpecMode,
    allowMatureContent,
    setAllowMatureContent,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<"obras" | "listas" | "logros" | "ajustes">("obras");
  const [storyViewMode, setStoryViewMode] = useState<"list" | "grid">("list");

  // Logros y XP
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);
  const [logrosCategoryFilter, setLogrosCategoryFilter] = useState<"todos" | AchievementCategory>("todos");
  const [claimedSuccessToast, setClaimedSuccessToast] = useState<{ title: string; xp: number } | null>(null);

  // Obras y Listas
  const [userStories, setUserStories] = useState<UserStoryItem[]>([]);
  const [readingLists, setReadingLists] = useState<ReadingListItem[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);

  // Modales
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [modalSection, setModalSection] = useState<"visual" | "info">("visual");
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [newListForm, setNewListForm] = useState({ name: "", description: "", isPrivate: false });
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Seguidores / Siguiendo
  const [followModal, setFollowModal] = useState<{
    isOpen: boolean;
    type: "followers" | "following";
  }>({ isOpen: false, type: "followers" });
  const [liveFollowStats, setLiveFollowStats] = useState<{ followers: number; following: number } | null>(null);

  // Formulario de edición
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    bio: "",
    avatar: "",
    banner: "",
  });

  // Estados de carga y feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const quickAvatarInputRef = useRef<HTMLInputElement>(null);
  const modalAvatarInputRef = useRef<HTMLInputElement>(null);
  const modalBannerInputRef = useRef<HTMLInputElement>(null);

  // Cargar estadísticas de seguidores en vivo
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    async function loadStats() {
      if (!user?.id) return;
      try {
        const stats = await getFollowStats(user.id);
        if (isMounted) setLiveFollowStats(stats);
      } catch {}
    }
    loadStats();

    const handleFollowChanged = () => loadStats();
    window.addEventListener("ficnation_follow_changed", handleFollowChanged);
    return () => {
      isMounted = false;
      window.removeEventListener("ficnation_follow_changed", handleFollowChanged);
    };
  }, [user?.id]);

  // Cargar logros reclamados
  useEffect(() => {
    setClaimedAchievements(getClaimedAchievements(user?.id));
  }, [user?.id]);

  // Cargar obras y listas del usuario
  useEffect(() => {
    async function loadProfileData() {
      if (!user?.id) {
        setIsLoadingStories(false);
        return;
      }

      setIsLoadingStories(true);

      // 1. Cargar Obras desde Supabase
      try {
        const supabase = createClient();
        const { data: dbStories } = await supabase
          .from("stories")
          .select(`
            id,
            title,
            genre,
            synopsis,
            cover_url,
            is_completed,
            reads_count,
            votes_count,
            created_at,
            chapters (id)
          `)
          .eq("author_id", user.id)
          .order("created_at", { ascending: false });

        if (dbStories && dbStories.length > 0) {
          const list: UserStoryItem[] = dbStories.map((s: any) => ({
            id: s.id,
            title: s.title,
            genre: s.genre || "Fantasía",
            synopsis: s.synopsis || "",
            coverUrl: s.cover_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
            status: s.is_completed ? "completa" : "en_desarrollo",
            chaptersCount: s.chapters?.length || 0,
            readsCount: s.reads_count || 0,
            votesCount: s.votes_count || 0,
            createdAt: new Date(s.created_at).toLocaleDateString("es-ES"),
          }));
          setUserStories(list);
        } else if (typeof window !== "undefined") {
          const local = localStorage.getItem("ficnation_user_stories");
          if (local) setUserStories(JSON.parse(local));
          else setUserStories([]);
        }
      } catch {
        if (typeof window !== "undefined") {
          const local = localStorage.getItem("ficnation_user_stories");
          if (local) setUserStories(JSON.parse(local));
        }
      } finally {
        setIsLoadingStories(false);
      }

      // 2. Cargar Listas de Lectura
      if (typeof window !== "undefined") {
        try {
          const savedLists = JSON.parse(localStorage.getItem("ficnation_reading_lists") || "[]");
          const libraryEntries = JSON.parse(localStorage.getItem("ficnation_library") || "[]");
          if (savedLists.length === 0 && libraryEntries.length > 0) {
            const defaultList: ReadingListItem = {
              id: "list-default-favs",
              name: "Mis Favoritas",
              description: "Historias guardadas en mi biblioteca personal",
              count: libraryEntries.length,
              coverImage: libraryEntries[0]?.coverImage || "",
              isPrivate: false,
            };
            setReadingLists([defaultList]);
            localStorage.setItem("ficnation_reading_lists", JSON.stringify([defaultList]));
          } else {
            setReadingLists(savedLists);
          }
        } catch {}
      }
    }

    loadProfileData();
  }, [user?.id]);

  // Manejar creación de lista de lectura
  const handleCreateReadingList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListForm.name.trim()) return;

    const newList: ReadingListItem = {
      id: `list-${Date.now()}`,
      name: newListForm.name.trim(),
      description: newListForm.description.trim() || "Colección de historias en FicNation",
      count: 0,
      isPrivate: newListForm.isPrivate,
    };

    const next = [newList, ...readingLists];
    setReadingLists(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("ficnation_reading_lists", JSON.stringify(next));
    }
    setNewListForm({ name: "", description: "", isPrivate: false });
    setIsCreateListOpen(false);
  };

  // Evaluación de logros
  const totalVotesReceived = userStories.reduce((acc, s) => acc + (s.votesCount || 0), 0);
  const achievementContext = {
    user,
    storiesCount: userStories.length,
    readingListsCount: readingLists.length,
    totalVotesReceived,
  };

  const evaluatedAchievements = ACHIEVEMENTS.map((a) =>
    evaluateAchievement(a, achievementContext, claimedAchievements)
  );

  const completedCount = evaluatedAchievements.filter((a) => a.isCompleted).length;
  const unclaimedCount = evaluatedAchievements.filter((a) => a.canClaim).length;

  const handleClaimAchievement = async (achievement: (typeof evaluatedAchievements)[0]) => {
    if (!achievement.canClaim) return;
    try {
      await addXp(achievement.rewardXp, `Logro: ${achievement.name}`);
      const updated = markAchievementClaimed(achievement.id, user?.id);
      setClaimedAchievements(updated);
      setClaimedSuccessToast({ title: achievement.name, xp: achievement.rewardXp });
      setTimeout(() => setClaimedSuccessToast(null), 4500);
    } catch (err) {
      console.error("Error al reclamar logro:", err);
    }
  };

  // Valores derivados del usuario
  const displayName = user?.name || user?.username || "Alexander Raven";
  const displayUsername = user?.username || "alex_raven";
  const displayBio = user?.bio || "Lector y creador apasionado en FicNation. Explorando mundos infinitos.";
  const displayAvatar = user?.avatar || "/logo.jpg";
  const displayBanner = user?.bannerUrl || "from-purple-950 via-indigo-950 to-[#070a12]";
  const isImageBanner = displayBanner.startsWith("http://") || displayBanner.startsWith("https://");
  const displayCoins = user?.coins ?? 0;
  const userXp = user?.xp ?? 0;
  const readerLevelInfo = calculateReaderLevel(userXp);
  const authorLevelInfo = calculateAuthorLevel(userStories.length);
  const xpPercent = readerLevelInfo.nextLevelXp > 0
    ? Math.min(Math.round((userXp / readerLevelInfo.nextLevelXp) * 100), 100)
    : 100;
  const displayFollowers = liveFollowStats?.followers ?? (user?.stats?.followers ?? 0);
  const displayFollowing = liveFollowStats?.following ?? (user?.stats?.following ?? 0);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-ES", { month: "short", year: "numeric" })
    : "Reciente";

  // Abrir modal de edición
  const handleOpenEdit = (section: "visual" | "info" = "visual") => {
    setEditForm({
      name: displayName,
      username: displayUsername,
      bio: displayBio,
      avatar: displayAvatar,
      banner: displayBanner,
    });
    setModalSection(section);
    setStatusMessage(null);
    setIsEditOpen(true);
  };

  // Subida rápida de avatar desde el botón de la cámara
  const handleQuickAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingAvatar(true);
    try {
      const { uploadToImgBB } = await import("@/lib/imgbb");
      const { createClient } = await import("@/lib/supabase/client");
      const url = await uploadToImgBB(file);
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      await refreshProfile();
    } catch {
      alert("Error al subir imagen o GIF.");
    } finally {
      setIsUploadingAvatar(false);
      if (quickAvatarInputRef.current) quickAvatarInputRef.current.value = "";
    }
  };

  // Subida de archivos dentro del modal
  const handleModalAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const { uploadToImgBB } = await import("@/lib/imgbb");
      const url = await uploadToImgBB(file);
      setEditForm((prev) => ({ ...prev, avatar: url }));
    } catch {
      setStatusMessage({ type: "error", text: "Error al subir a ImgBB." });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleModalBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const { uploadToImgBB } = await import("@/lib/imgbb");
      const url = await uploadToImgBB(file);
      setEditForm((prev) => ({ ...prev, banner: url }));
    } catch {
      setStatusMessage({ type: "error", text: "Error al subir a ImgBB." });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Guardar perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.username.trim()) {
      setStatusMessage({ type: "error", text: "El nombre y el usuario son obligatorios." });
      return;
    }
    if (!user) return;

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const sanitizedUsername = editForm.username.trim().toLowerCase().replace(/\s+/g, "_");

      const { error } = await supabase
        .from("profiles")
        .update({
          name: editForm.name.trim(),
          username: sanitizedUsername,
          bio: editForm.bio.trim(),
          avatar_url: editForm.avatar.trim() || displayAvatar,
          banner_url: editForm.banner.trim() || displayBanner,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") {
          setStatusMessage({ type: "error", text: "Ese nombre de usuario ya está en uso." });
          setIsSaving(false);
          return;
        }
        throw error;
      }

      await refreshProfile();
      if (updateProfile) {
        updateProfile({
          name: editForm.name.trim(),
          username: sanitizedUsername,
          bio: editForm.bio.trim(),
          avatar: editForm.avatar.trim() || displayAvatar,
          bannerUrl: editForm.banner.trim() || displayBanner,
        });
      }
      setStatusMessage({ type: "success", text: "¡Perfil guardado con éxito!" });
      setTimeout(() => {
        setIsEditOpen(false);
        setStatusMessage(null);
      }, 500);
    } catch {
      setStatusMessage({ type: "error", text: "Error al guardar en la base de datos." });
    } finally {
      setIsSaving(false);
    }
  };

  // Compartir Perfil
  const handleShareProfile = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `Perfil de ${displayName} en FicNation`,
        text: `¡Echa un vistazo al perfil de ${displayName} en FicNation!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert("¡Enlace de perfil copiado al portapapeles!");
    }
  };

  const themesList: { id: AppTheme; label: string; icon: string; bg: string }[] = [
    { id: "dark", label: "Oscuro", icon: "🌙", bg: "bg-slate-900" },
    { id: "neon", label: "Neón", icon: "⚡", bg: "bg-purple-950" },
    { id: "oled", label: "OLED Negro", icon: "🖤", bg: "bg-black" },
    { id: "sepia", label: "Sepia", icon: "📜", bg: "bg-[#2d241e]" },
  ];

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-10 select-none">
      
      {/* Input oculto para subida rápida de avatar */}
      <input
        ref={quickAvatarInputRef}
        type="file"
        accept="image/*,.gif"
        className="hidden"
        onChange={handleQuickAvatarUpload}
      />

      {/* ════════════ 1. CABECERA SUPERIOR MÓVIL ════════════ */}
      {!hideHeader && (
        <MobileHeader
          title="Mi Perfil"
          showBack={true}
          rightAction={
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleShareProfile}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all shadow-xs"
                aria-label="Compartir Perfil"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenEdit("visual")}
                className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 hover:text-white active:scale-95 transition-all shadow-xs"
                aria-label="Editar Perfil"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          }
        />
      )}

      <main className="flex-1 space-y-4">

        {/* ════════════ 2. HERO: BANNER PANORÁMICO Y AVATAR FLOTANTE ════════════ */}
        <section className="relative">
          {/* Banner Cine Panorámico */}
          <div className="h-36 sm:h-44 w-full relative overflow-hidden bg-slate-900 border-b border-purple-500/20">
            {isImageBanner ? (
              <img
                src={displayBanner}
                alt="Portada"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-r ${displayBanner}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070a12] via-black/30 to-transparent" />

            {/* Botón flotante para cambiar portada */}
            <button
              onClick={() => handleOpenEdit("visual")}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-purple-300" />
              <span>Cambiar Portada</span>
            </button>
          </div>

          {/* Información del Perfil Integrada */}
          <div className="px-4 -mt-14 relative z-10 space-y-3">
            <div className="flex items-end justify-between gap-3">
              {/* Avatar con Punto Verde de Activo y Botón de Cámara */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-[#070a12] bg-[#0b0f19] shadow-2xl relative">
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-1 z-30">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                      <span className="text-[9px] text-white font-bold">Subiendo...</span>
                    </div>
                  )}

                  {/* Señal de Activo: Punto Verde */}
                  <div className="absolute top-2 right-2 flex items-center justify-center z-20">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#070a12] shadow-sm" />
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => quickAvatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg border-2 border-[#070a12] active:scale-90 transition-transform cursor-pointer"
                  title="Cambiar foto o GIF"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Botones Rápidos de la Derecha (Editar + Monedas) */}
              <div className="flex flex-col items-end gap-2 pb-1">
                <button
                  onClick={() => handleOpenEdit("visual")}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black shadow-md shadow-purple-600/30 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Perfil</span>
                </button>

                {/* Billetera / Contador de FicCoins */}
                <button
                  onClick={() => setIsWalletModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-purple-500/25 active:scale-95 transition-all"
                  title="Ver Billetera de FicCoins"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono font-black text-xs text-amber-300">{displayCoins.toLocaleString()}</span>
                  <span className="w-4 h-4 rounded-full bg-purple-600/40 text-purple-300 flex items-center justify-center text-[10px] font-black ml-0.5">+</span>
                </button>
              </div>
            </div>

            {/* Identidad y Niveles */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
                  <span>{displayName}</span>
                  <CheckCircle2 className="w-4 h-4 text-purple-400 fill-purple-400 text-[#070a12]" />
                </h1>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black">
                  <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Autor Verificado</span>
                </span>
              </div>

              {/* Badges de Niveles (Lector + Autor) */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-purple-300 text-[11px] font-bold flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-purple-400" />
                  <span>Lector Lv. {readerLevelInfo.level}: {readerLevelInfo.levelTitle}</span>
                </span>

                <span className="px-2.5 py-0.5 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center gap-1">
                  <Feather className="w-3 h-3 text-purple-400" />
                  <span>Autor Lv. {authorLevelInfo.level}: {authorLevelInfo.levelTitle}</span>
                </span>
              </div>

              {/* Handle y Fecha de Miembro */}
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
                <span className="font-mono font-bold text-slate-300">@{displayUsername}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3 h-3 text-purple-400" />
                  <span>Miembro desde {memberSince}</span>
                </span>
              </div>

              {/* Biografía */}
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {displayBio}
              </p>
            </div>
          </div>
        </section>

        {/* ════════════ 3. MEDIDOR DE XP Y PROGRESO DE NIVEL ════════════ */}
        <section className="px-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-900/20 border border-purple-500/25 space-y-2 shadow-md">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Nivel {readerLevelInfo.level} • {readerLevelInfo.levelTitle}</span>
              </span>
              <span className="text-purple-300 font-bold">
                {userXp} / {readerLevelInfo.nextLevelXp} XP ({xpPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(xpPercent, 5)}%` }}
              />
            </div>
          </div>
        </section>

        {/* ════════════ 4. MÉTRICAS RÁPIDAS EN PASTILLAS ════════════ */}
        <section className="px-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-[10px] text-slate-400 font-medium">Obras</p>
              <p className="text-xs font-black text-white font-mono mt-0.5">{userStories.length}</p>
            </div>

            <div className="p-2 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-[10px] text-slate-400 font-medium">Listas</p>
              <p className="text-xs font-black text-white font-mono mt-0.5">{readingLists.length}</p>
            </div>

            <button
              onClick={() => setFollowModal({ isOpen: true, type: "followers" })}
              className="p-2 rounded-2xl bg-white/5 border border-white/10 text-center active:scale-95 transition-all"
            >
              <p className="text-[10px] text-slate-400 font-medium">Seguidores</p>
              <p className="text-xs font-black text-purple-300 font-mono mt-0.5">{displayFollowers}</p>
            </button>

            <button
              onClick={() => setFollowModal({ isOpen: true, type: "following" })}
              className="p-2 rounded-2xl bg-white/5 border border-white/10 text-center active:scale-95 transition-all"
            >
              <p className="text-[10px] text-slate-400 font-medium">Siguiendo</p>
              <p className="text-xs font-black text-purple-300 font-mono mt-0.5">{displayFollowing}</p>
            </button>
          </div>
        </section>

        {/* ════════════ 5. PESTAÑAS PRINCIPALES DEL PERFIL ════════════ */}
        <section className="px-4 space-y-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-purple-500/20 overflow-x-auto no-scrollbar">
            {[
              { key: "obras" as const, label: `Obras (${userStories.length})`, icon: BookOpen },
              { key: "listas" as const, label: `Listas (${readingLists.length})`, icon: Bookmark },
              { key: "logros" as const, label: `Logros (${completedCount}/${ACHIEVEMENTS.length})`, icon: Award, alert: unclaimedCount > 0 },
              { key: "ajustes" as const, label: "Ajustes", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 relative ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.alert && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ════════ PESTAÑA 1: MIS OBRAS ════════ */}
          {activeTab === "obras" && (
            <div className="space-y-3">
              {/* Barra de Control y Selector de Modo (Lista / Cuadrícula) */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">
                  {userStories.length} {userStories.length === 1 ? "historia publicada" : "historias publicadas"}
                </span>

                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/5 border border-white/10">
                  <button
                    onClick={() => setStoryViewMode("list")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      storyViewMode === "list" ? "bg-purple-600 text-white" : "text-slate-400"
                    }`}
                    title="Vista detallada"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setStoryViewMode("grid")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      storyViewMode === "grid" ? "bg-purple-600 text-white" : "text-slate-400"
                    }`}
                    title="Vista en cuadrícula"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isLoadingStories ? (
                <div className="p-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
                  <p className="text-xs text-slate-400">Cargando tus historias...</p>
                </div>
              ) : userStories.length > 0 ? (
                storyViewMode === "list" ? (
                  /* VISTA LISTA DETALLADA */
                  <div className="space-y-3">
                    {userStories.map((story) => (
                      <div
                        key={story.id}
                        className="p-3.5 rounded-2xl bg-white/5 border border-purple-500/20 space-y-3"
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-22 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                            <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                {story.genre}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                story.status === "completa" ? "bg-emerald-500/20 text-emerald-300" : "bg-cyan-500/20 text-cyan-300"
                              }`}>
                                {story.status === "completa" ? "Completa" : "En Desarrollo"}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-white truncate">{story.title}</h3>
                            <p className="text-xs text-slate-400 line-clamp-2">{story.synopsis}</p>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-0.5">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-purple-400" />
                                {story.chaptersCount} caps
                              </span>
                              <span className="flex items-center gap-1 text-amber-400">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {story.votesCount}
                              </span>
                              <span className="flex items-center gap-1 text-cyan-300">
                                <Eye className="w-3 h-3" />
                                {story.readsCount}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                          <Link
                            href={`/escribir?storyId=${story.id}`}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-center"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Taller</span>
                          </Link>
                          <Link
                            href={`/historia?id=${story.id}`}
                            className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold active:scale-95 transition-all"
                          >
                            Ficha
                          </Link>
                          <Link
                            href={`/leer?storyId=${story.id}&chapter=1`}
                            className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-purple-300 text-xs font-bold active:scale-95 transition-all"
                          >
                            Leer
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* VISTA CUADRÍCULA */
                  <div className="grid grid-cols-2 gap-3">
                    {userStories.map((story) => (
                      <div
                        key={story.id}
                        className="rounded-2xl overflow-hidden bg-white/5 border border-purple-500/20 flex flex-col"
                      >
                        <div className="relative aspect-[3/4] w-full bg-slate-800">
                          <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-purple-300">
                            {story.genre}
                          </span>
                          <div className="absolute bottom-2 left-2 right-2 space-y-0.5">
                            <h4 className="text-xs font-bold text-white truncate">{story.title}</h4>
                            <p className="text-[10px] text-purple-300">{story.chaptersCount} capítulos</p>
                          </div>
                        </div>

                        <div className="p-2 flex items-center gap-1 border-t border-white/10">
                          <Link
                            href={`/escribir?storyId=${story.id}`}
                            className="flex-1 py-1 px-2 rounded-lg bg-purple-600 text-white text-[11px] font-bold text-center"
                          >
                            Taller
                          </Link>
                          <Link
                            href={`/historia?id=${story.id}`}
                            className="p-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="p-8 text-center rounded-3xl bg-white/5 border border-purple-500/20 space-y-3">
                  <PenTool className="w-8 h-8 text-purple-400 mx-auto opacity-60" />
                  <h3 className="text-sm font-bold text-white">Aún no has publicado historias</h3>
                  <p className="text-xs text-slate-400">Escribe tu primera obra y compártela con la comunidad.</p>
                  <Link
                    href="/escribir"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                  >
                    <span>Crear Historia</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ════════ PESTAÑA 2: LISTAS DE LECTURA ════════ */}
          {activeTab === "listas" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">Tus colecciones temáticas</span>
                <button
                  onClick={() => setIsCreateListOpen(true)}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Lista</span>
                </button>
              </div>

              {readingLists.length > 0 ? (
                <div className="space-y-2.5">
                  {readingLists.map((list) => (
                    <div
                      key={list.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-purple-500/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                          <Bookmark className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="text-xs font-bold text-white truncate">{list.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{list.description}</p>
                          <p className="text-[10px] text-purple-300 font-mono">{list.count} historias</p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300 shrink-0">
                        {list.isPrivate ? "Privada" : "Pública"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-3xl bg-white/5 border border-purple-500/20 space-y-3">
                  <Bookmark className="w-8 h-8 text-purple-400 mx-auto opacity-60" />
                  <h3 className="text-sm font-bold text-white">No tienes listas de lectura</h3>
                  <p className="text-xs text-slate-400">Organiza tus novelas favoritas en colecciones.</p>
                  <button
                    onClick={() => setIsCreateListOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs"
                  >
                    Crear primera lista
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════ PESTAÑA 3: LOGROS Y RECOMPENSAS DE XP ════════ */}
          {activeTab === "logros" && (
            <div className="space-y-3">
              {/* Toast de Éxito al Reclamar */}
              {claimedSuccessToast && (
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>¡Reclamaste +{claimedSuccessToast.xp} XP por &quot;{claimedSuccessToast.title}&quot;!</span>
                  </div>
                  <button onClick={() => setClaimedSuccessToast(null)}>✕</button>
                </div>
              )}

              {/* Filtros de Categorías */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { key: "todos" as const, label: "Todos" },
                  { key: "comunidad" as const, label: "Comunidad" },
                  { key: "escritura" as const, label: "Escritura" },
                  { key: "lector" as const, label: "Lectura" },
                  { key: "progresion" as const, label: "Progresión" },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setLogrosCategoryFilter(cat.key)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      logrosCategoryFilter === cat.key
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-white/5 border border-white/10 text-slate-400"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Lista de Logros */}
              <div className="space-y-3">
                {evaluatedAchievements
                  .filter((a) => logrosCategoryFilter === "todos" || a.category === logrosCategoryFilter)
                  .map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <div
                        key={badge.id}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                          badge.canClaim
                            ? "bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30"
                            : badge.isCompleted
                            ? "bg-white/5 border-purple-500/30"
                            : "bg-white/[0.02] border-white/10 opacity-70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center shrink-0">
                              <Icon className={`w-5 h-5 ${badge.color}`} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{badge.name}</h4>
                              <p className="text-[10px] text-slate-400 leading-snug">{badge.desc}</p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                            +{badge.rewardXp} XP
                          </span>
                        </div>

                        {/* Barra de Progreso */}
                        <div className="space-y-1 pt-1 border-t border-white/5">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>Progreso: {Math.min(badge.current, badge.target)} / {badge.target}</span>
                            <span className="font-bold text-purple-300">{badge.progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                              style={{ width: `${Math.max(badge.progressPercent, 4)}%` }}
                            />
                          </div>
                        </div>

                        {/* Botón de Reclamar */}
                        {badge.canClaim && (
                          <button
                            onClick={() => handleClaimAchievement(badge)}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5 fill-slate-950" />
                            <span>¡Reclamar +{badge.rewardXp} XP!</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ════════ PESTAÑA 4: AJUSTES Y PREFERENCIAS ════════ */}
          {activeTab === "ajustes" && (
            <div className="space-y-3">
              {/* Tema de la App */}
              <div className="p-4 rounded-2xl bg-white/5 border border-purple-500/20 space-y-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>Tema de la Aplicación</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {themesList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAppTheme(t.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                        appTheme === t.id
                          ? "bg-purple-600 text-white border-purple-400 shadow-md"
                          : "bg-white/5 border-white/10 text-slate-300"
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opciones de Rendimiento y Contenido */}
              <div className="p-4 rounded-2xl bg-white/5 border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Modo Rendimiento Máximo</p>
                    <p className="text-[10px] text-slate-400">Reduce animaciones para ahorrar batería.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isLowSpecMode}
                    onChange={toggleLowSpecMode}
                    className="w-4 h-4 rounded cursor-pointer accent-purple-600"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Contenido Maduro (+18)</p>
                    <p className="text-[10px] text-slate-400">Mostrar novelas con temáticas explícitas.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowMatureContent}
                    onChange={(e) => setAllowMatureContent(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer accent-purple-600"
                  />
                </div>
              </div>

              {/* Cerrar Sesión */}
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}

        </section>

      </main>

      {/* ════════════ MODAL DE EDICIÓN DE PERFIL ════════════ */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0b0f19] border border-purple-500/30 p-5 shadow-[0_10px_50px_rgba(0,0,0,0.9)] space-y-4 max-h-[85vh] overflow-y-auto">
            <input ref={modalAvatarInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleModalAvatarUpload} />
            <input ref={modalBannerInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleModalBannerUpload} />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span>Ajustes de Perfil</span>
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded-full text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Sección del Modal */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setModalSection("visual")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  modalSection === "visual" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400"
                }`}
              >
                1. Portada & Avatar
              </button>
              <button
                onClick={() => setModalSection("info")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  modalSection === "info" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400"
                }`}
              >
                2. Datos de Autor
              </button>
            </div>

            {statusMessage && (
              <div className={`p-2.5 rounded-xl text-xs font-bold ${
                statusMessage.type === "success" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
              }`}>
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {modalSection === "visual" ? (
                <div className="space-y-3.5">
                  {/* Avatar */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-400" />
                      <span>Foto de Perfil (URL o Galería)</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                        <img src={editForm.avatar || displayAvatar} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => modalAvatarInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="w-full py-1.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{isUploadingAvatar ? "Subiendo..." : "Subir desde el móvil"}</span>
                        </button>
                        <input
                          type="url"
                          placeholder="O pega link directo..."
                          value={editForm.avatar}
                          onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                          className="w-full px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Portada */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Portada del Perfil</span>
                    </span>
                    <div className="h-16 rounded-xl overflow-hidden bg-slate-800 border border-white/10 relative">
                      {editForm.banner.startsWith("http") ? (
                        <img src={editForm.banner} alt="Banner preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-r ${editForm.banner}`} />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => modalBannerInputRef.current?.click()}
                      disabled={isUploadingBanner}
                      className="w-full py-1.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isUploadingBanner ? "Subiendo..." : "Subir Portada desde el móvil"}</span>
                    </button>

                    <div className="grid grid-cols-3 gap-1 pt-1">
                      {BANNER_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, banner: preset.value })}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold text-white truncate transition-all ${
                            editForm.banner === preset.value ? "border-purple-400 bg-purple-600/40 shadow-sm" : "border-white/10 bg-white/5"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Nombre Visible</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Usuario Único (@)</label>
                    <input
                      type="text"
                      required
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">Biografía</label>
                      <span className="text-[10px] text-slate-400 font-mono">{editForm.bio.length} / 300</span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={300}
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Escribe algo sobre tus historias o gustos..."
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white resize-none focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingAvatar || isUploadingBanner}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black shadow-md disabled:opacity-50 active:scale-95 transition-all"
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════ MODAL DE BILLETERA / FICCOINS ════════════ */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0b0f19] border border-purple-500/30 p-5 shadow-[0_10px_50px_rgba(0,0,0,0.9)] space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">Billetera de FicCoins</h3>
              </div>
              <button onClick={() => setIsWalletModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-950/40 to-black border border-amber-500/30 text-center space-y-1">
              <span className="text-[10px] font-bold text-amber-300 uppercase">Balance Actual</span>
              <p className="text-3xl font-black text-white font-mono">{displayCoins.toLocaleString()} FicCoins</p>
              <p className="text-[11px] text-slate-300">Usa tus monedas para desbloquear contenido y apoyar autores.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>🚧</span>
                <span>Recargas en fase de planeación</span>
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Las pasarelas de pago y recargas oficiales de monedas se habilitarán próximamente.
              </p>
            </div>

            <button
              onClick={() => setIsWalletModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs active:scale-95 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ════════════ MODAL DE NUEVA LISTA DE LECTURA ════════════ */}
      {isCreateListOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0b0f19] border border-purple-500/30 p-5 shadow-[0_10px_50px_rgba(0,0,0,0.9)] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-purple-400" />
                <span>Nueva Lista de Lectura</span>
              </h3>
              <button onClick={() => setIsCreateListOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateReadingList} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nombre de la lista *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Joyas de Fantasía"
                  value={newListForm.name}
                  onChange={(e) => setNewListForm({ ...newListForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="De qué trata esta colección..."
                  value={newListForm.description}
                  onChange={(e) => setNewListForm({ ...newListForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white resize-none focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-white">Lista Privada</span>
                <input
                  type="checkbox"
                  checked={newListForm.isPrivate}
                  onChange={(e) => setNewListForm({ ...newListForm, isPrivate: e.target.checked })}
                  className="w-4 h-4 accent-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateListOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-xs text-slate-300 font-bold active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black shadow-md active:scale-95 transition-all"
                >
                  Crear Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════ MODAL DE CONFIRMACIÓN DE CERRAR SESIÓN ════════════ */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl bg-[#0b0f19] border border-rose-500/40 p-5 shadow-[0_10px_50px_rgba(0,0,0,0.9)] space-y-3 text-center">
            <LogOut className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-sm font-black text-white">¿Cerrar Sesión?</h3>
            <p className="text-xs text-slate-400">Tendrás que volver a iniciar sesión para acceder a tus historias y monedas.</p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={logout}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold active:scale-95 transition-all"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seguidores y Siguiendo */}
      {user?.id && (
        <FollowListModal
          isOpen={followModal.isOpen}
          onClose={() => setFollowModal((prev) => ({ ...prev, isOpen: false }))}
          userId={user.id}
          userName={displayName}
          initialType={followModal.type}
        />
      )}
    </div>
  );
}

export default function MobileProfilePage() {
  return <MobileProfileView />;
}
