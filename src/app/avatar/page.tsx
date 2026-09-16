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
  Quote,
  Zap,
  CreditCard,
  HelpCircle,
  DollarSign,
  Building2,
  History,
  Heart,
  ArrowUpRight,
  ShieldCheck,
  Palette,
  Link2,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Feather,
  LayoutGrid,
  List,
} from "lucide-react";
import { useAuth, calculateReaderLevel, calculateAuthorLevel } from "@/context/AuthContext";
import { FicImage } from "@/components/ui/FicImage";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
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

// Presets de avatar
export const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
];

// Presets de banner
const BANNER_PRESETS = [
  { name: "Nebulosa Púrpura", value: "from-purple-950 via-indigo-950 to-[#080511]" },
  { name: "Eclipse Neón", value: "from-fuchsia-950 via-purple-900 to-black" },
  { name: "Abismo Cósmico", value: "from-slate-950 via-purple-950 to-indigo-950" },
  { name: "Fuego Violeta", value: "from-purple-900 via-rose-950 to-zinc-950" },
  { name: "Papiro Imperial", value: "from-amber-950 via-yellow-950 to-[#120a05]" },
  { name: "Esmeralda Mística", value: "from-emerald-950 via-teal-950 to-black" },
];

// Planes Oficiales de Pago y Recarga de FicCoins ($0.50 USD a $100.00 USD)
const RECHARGE_PLANS = [
  {
    id: "plan-0.5",
    usd: 0.50,
    coins: 50,
    bonusCoins: 0,
    totalCoins: 50,
    name: "Café Express",
    badge: null,
    icon: "☕",
  },
  {
    id: "plan-1",
    usd: 1.00,
    coins: 100,
    bonusCoins: 0,
    totalCoins: 100,
    name: "Lector Casual",
    badge: null,
    icon: "✒️",
  },
  {
    id: "plan-3",
    usd: 3.00,
    coins: 300,
    bonusCoins: 20,
    totalCoins: 320,
    name: "Entusiasta",
    badge: "+20 Bonus",
    icon: "📖",
  },
  {
    id: "plan-5",
    usd: 5.00,
    coins: 500,
    bonusCoins: 50,
    totalCoins: 550,
    name: "Escritor Fan",
    badge: "Popular",
    icon: "⭐",
  },
  {
    id: "plan-10",
    usd: 10.00,
    coins: 1000,
    bonusCoins: 150,
    totalCoins: 1150,
    name: "Gran Lector",
    badge: "Recomendado",
    icon: "👑",
  },
  {
    id: "plan-20",
    usd: 20.00,
    coins: 2000,
    bonusCoins: 400,
    totalCoins: 2400,
    name: "Mecenas",
    badge: "+20% Extra",
    icon: "💎",
  },
  {
    id: "plan-50",
    usd: 50.00,
    coins: 5000,
    bonusCoins: 1250,
    totalCoins: 6250,
    name: "Cósmico",
    badge: "+25% Extra",
    icon: "🌌",
  },
  {
    id: "plan-100",
    usd: 100.00,
    coins: 10000,
    bonusCoins: 3000,
    totalCoins: 13000,
    name: "Leyenda VIP",
    badge: "Máximo (+30%)",
    icon: "🏆",
  },
];

// Defaults instantáneos
const DEFAULTS = {
  name: "Alexander Raven",
  username: "alex_raven",
  bio: "Escritor aficionado de fantasía oscura y ciencia ficción. Amante de los mundos inmersivos y las historias complejas.",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
  banner: "from-purple-950 via-indigo-950 to-[#080511]",
  level: 1,
  levelTitle: "Iniciado",
  xp: 120,
  nextLevelXp: 200,
  stories: 0,
  readingLists: 0,
  followers: 0,
  following: 0,
  badges: ["Pionero"],
};

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

export default function AvatarProfilePage() {
  const {
    user,
    refreshProfile,
    requestCashout,
    getCashoutHistory,
    getReceivedTips,
    addXp,
  } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"obras" | "listas" | "logros">("obras");

  // Estados de Logros y Recompensas de XP
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);
  const [logrosCategoryFilter, setLogrosCategoryFilter] = useState<"todos" | AchievementCategory>("todos");
  const [claimedSuccessToast, setClaimedSuccessToast] = useState<{ title: string; xp: number } | null>(null);

  // Modo de visualización de obras del autor ("list" = detallada amplia, "grid" = cuadrícula de libros)
  const [storyViewMode, setStoryViewMode] = useState<"list" | "grid">("list");

  // Estados de Billetera, Retiros y Donaciones
  const [selectedPlanId] = useState<string>("plan-5");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTab, setWalletTab] = useState<"recharge" | "cashout" | "gifts">("recharge");

  // Formulario y Estados de Retiro (Cashout - Umbral $5 USD)
  const [cashoutAmount, setCashoutAmount] = useState<string>("5.00");
  const [cashoutMethod, setCashoutMethod] = useState<"paypal" | "bank_transfer" | "crypto">("paypal");
  const [cashoutAccount, setCashoutAccount] = useState("");
  const [cashoutFullName, setCashoutFullName] = useState("");
  const [cashoutBankName, setCashoutBankName] = useState("");
  const [cashoutNotes, setCashoutNotes] = useState("");
  const [isSubmittingCashout, setIsSubmittingCashout] = useState(false);
  const [cashoutStatusMsg, setCashoutStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [cashoutHistoryList, setCashoutHistoryList] = useState<any[]>([]);
  const [receivedTipsList, setReceivedTipsList] = useState<any[]>([]);

  // Obras y Listas del usuario
  const [userStories, setUserStories] = useState<UserStoryItem[]>([]);
  const [readingLists, setReadingLists] = useState<ReadingListItem[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);

  // Modal para crear nueva lista de lectura
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [newListForm, setNewListForm] = useState({ name: "", description: "", isPrivate: false });

  // Modal de edición y sección activa dentro del modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [modalSection, setModalSection] = useState<"visual" | "info">("visual");

  // Modal de Seguidores y Siguiendo
  const [followModal, setFollowModal] = useState<{
    isOpen: boolean;
    type: "followers" | "following";
  }>({ isOpen: false, type: "followers" });
  const [liveFollowStats, setLiveFollowStats] = useState<{ followers: number; following: number } | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    bio: "",
    avatar: "",
    banner: "",
  });

  // Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const quickAvatarInputRef = useRef<HTMLInputElement>(null);
  const modalAvatarInputRef = useRef<HTMLInputElement>(null);
  const modalBannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar estadísticas de seguidores / seguidos en vivo y escuchar cambios
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    async function loadStats() {
      if (!user?.id) return;
      try {
        const stats = await getFollowStats(user.id);
        if (isMounted) {
          setLiveFollowStats(stats);
        }
      } catch {}
    }

    loadStats();

    const handleFollowChanged = () => {
      loadStats();
    };

    window.addEventListener("ficnation_follow_changed", handleFollowChanged);
    return () => {
      isMounted = false;
      window.removeEventListener("ficnation_follow_changed", handleFollowChanged);
    };
  }, [user?.id]);

  // Cerrar modal al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditOpen) setIsEditOpen(false);
        if (followModal.isOpen) setFollowModal((prev) => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditOpen, followModal.isOpen]);

  // Cargar Obras y Listas desde Supabase y localStorage
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
          if (local) {
            setUserStories(JSON.parse(local));
          } else {
            setUserStories([]);
          }
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

    // Sincronización en tiempo real de votos y vistas en las obras del perfil
    const handleStoryVoted = (e: any) => {
      if (e.detail?.storyId) {
        setUserStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId ? { ...s, votesCount: Number(e.detail.newCount) } : s
          )
        );
      }
    };

    const handleStoryViewed = (e: any) => {
      if (e.detail?.storyId) {
        setUserStories((prev) =>
          prev.map((s) =>
            s.id === e.detail.storyId ? { ...s, readsCount: Number(e.detail.readsCount) } : s
          )
        );
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("ficnation_story_voted", handleStoryVoted);
      window.addEventListener("ficnation_story_viewed", handleStoryViewed);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("ficnation_story_voted", handleStoryVoted);
        window.removeEventListener("ficnation_story_viewed", handleStoryViewed);
      }
    };
  }, [user?.id]);

  // Manejar creación de lista de lectura
  const handleCreateReadingList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListForm.name.trim()) return;

    const newList: ReadingListItem = {
      id: `list-${Date.now()}`,
      name: newListForm.name.trim(),
      description: newListForm.description.trim() || "Colección temática de historias en FicNation",
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

  // Cargar lista de logros reclamados
  useEffect(() => {
    setClaimedAchievements(getClaimedAchievements(user?.id));
  }, [user?.id]);

  // Evaluación interactiva de Logros y Recompensas de XP
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
      setTimeout(() => {
        setClaimedSuccessToast(null);
      }, 4500);
    } catch (err) {
      console.error("Error al reclamar logro:", err);
    }
  };

  // ══════════════════════════════════════════════════════════
  // VALORES DERIVADOS (Disponibles tras montaje seguro del cliente)
  // ══════════════════════════════════════════════════════════
  const p = mounted ? user : null;
  const displayName     = p ? p.name      : DEFAULTS.name;
  const displayUsername  = p ? p.username  : DEFAULTS.username;
  const displayBio      = p ? p.bio       : DEFAULTS.bio;
  const displayAvatar   = p ? p.avatar    : DEFAULTS.avatar;
  const displayBanner   = p ? (p.bannerUrl || DEFAULTS.banner) : DEFAULTS.banner;
  const displayLevel    = p ? p.level     : DEFAULTS.level;
  const displayTitle    = p ? p.levelTitle : DEFAULTS.levelTitle;
  const displayCoins    = p ? (p.coins ?? 0) : 0;
  const displayEarnedCoins = p ? (p.earnedCoins ?? 0) : 0;
  const displayEarnedUsd   = displayEarnedCoins / 100;
  const thresholdPercent   = Math.min(Math.round((displayEarnedUsd / 5.0) * 100), 100);
  const canWithdraw        = displayEarnedUsd >= 5.0;
  const remainingForThreshold = Math.max(0, 5.0 - displayEarnedUsd);
  const memberSince     = p?.createdAt ? new Date(p.createdAt).toLocaleDateString("es-ES", { month: "long", year: "numeric" }) : "Reciente";
  const xpCurrent       = p ? p.xp        : DEFAULTS.xp;
  const xpNext          = p ? p.nextLevelXp : DEFAULTS.nextLevelXp;
  const stats           = p ? p.stats     : { stories: DEFAULTS.stories, readingLists: DEFAULTS.readingLists, followers: DEFAULTS.followers, following: DEFAULTS.following };
  const userBadges      = p && Array.isArray(p.badges) ? p.badges : DEFAULTS.badges;
  const displayFollowers = liveFollowStats?.followers ?? (p ? p.stats.followers : 0);
  const displayFollowing = liveFollowStats?.following ?? (p ? p.stats.following : 0);

  const isImageBanner = displayBanner.startsWith("http://") || displayBanner.startsWith("https://");
  const xpPercent = xpNext > 0 ? Math.round((xpCurrent / xpNext) * 100) : 24;

  useEffect(() => {
    if (isWalletModalOpen) {
      setCashoutHistoryList(getCashoutHistory());
      setReceivedTipsList(getReceivedTips());
      setCashoutStatusMsg(null);
    }
  }, [isWalletModalOpen, getCashoutHistory, getReceivedTips]);

  const handleExecuteCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(cashoutAmount);
    if (isNaN(amount) || amount < 5.0) {
      setCashoutStatusMsg({ type: "error", text: "El monto mínimo de retiro es de $5.00 USD." });
      return;
    }

    if (displayEarnedUsd < amount) {
      setCashoutStatusMsg({
        type: "error",
        text: `Saldo insuficiente. Tienes $${displayEarnedUsd.toFixed(2)} USD disponibles para retirar.`,
      });
      return;
    }

    if (!cashoutAccount.trim()) {
      setCashoutStatusMsg({ type: "error", text: "Debes ingresar tu correo o cuenta de destino." });
      return;
    }

    if (!cashoutFullName.trim()) {
      setCashoutStatusMsg({ type: "error", text: "Debes ingresar el nombre completo del titular." });
      return;
    }

    setIsSubmittingCashout(true);
    setCashoutStatusMsg(null);

    const accountDetail =
      cashoutMethod === "bank_transfer"
        ? `${cashoutBankName ? `[${cashoutBankName}] ` : ""}${cashoutAccount}`
        : cashoutAccount;

    const res = await requestCashout(amount, cashoutMethod, {
      emailOrAccount: accountDetail,
      fullName: cashoutFullName,
      notes: cashoutNotes,
    });

    setIsSubmittingCashout(false);
    if (res.success) {
      setCashoutStatusMsg({ type: "success", text: res.message });
      setCashoutAccount("");
      setCashoutFullName("");
      setCashoutBankName("");
      setCashoutNotes("");
      setCashoutHistoryList(getCashoutHistory());
    } else {
      setCashoutStatusMsg({ type: "error", text: res.message });
    }
  };

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

  // Subida rápida de avatar (Cámara)
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

  // Subida en modal (Avatar)
  const handleModalAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setStatusMessage(null);
    try {
      const { uploadToImgBB } = await import("@/lib/imgbb");
      const url = await uploadToImgBB(file);
      setEditForm((prev) => ({ ...prev, avatar: url }));
    } catch {
      setStatusMessage({ type: "error", text: "Error al subir a ImgBB." });
    } finally {
      setIsUploadingAvatar(false);
      if (modalAvatarInputRef.current) modalAvatarInputRef.current.value = "";
    }
  };

  // Subida en modal (Banner)
  const handleModalBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    setStatusMessage(null);
    try {
      const { uploadToImgBB } = await import("@/lib/imgbb");
      const url = await uploadToImgBB(file);
      setEditForm((prev) => ({ ...prev, banner: url }));
    } catch {
      setStatusMessage({ type: "error", text: "Error al subir a ImgBB." });
    } finally {
      setIsUploadingBanner(false);
      if (modalBannerInputRef.current) modalBannerInputRef.current.value = "";
    }
  };

  // Guardar cambios en Supabase
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.username.trim()) {
      setStatusMessage({ type: "error", text: "El nombre y el usuario son obligatorios." });
      return;
    }
    if (!user) {
      setStatusMessage({ type: "error", text: "Debes iniciar sesión para guardar." });
      return;
    }

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

  const isModalImageBanner = editForm.banner.startsWith("http://") || editForm.banner.startsWith("https://");

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full pb-24">

      {/* Input oculto para subida rápida de avatar */}
      <input
        ref={quickAvatarInputRef}
        type="file"
        accept="image/*,.gif"
        className="hidden"
        onChange={handleQuickAvatarUpload}
      />

      {/* ═══════════════════ 1. HUB MAESTRO ACOPLADO DE CREADOR ═══════════════════ */}
      <div className="relative rounded-3xl border fic-card shadow-md overflow-hidden" style={{ borderColor: "var(--border-primary)" }}>

        {/* Capa A: Banner Panorámico Cine */}
        <div className="h-56 sm:h-64 lg:h-72 w-full relative overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
          {mounted && isImageBanner ? (
            <FicImage
              src={displayBanner}
              alt="Portada"
              fallbackType="banner"
              className="w-full h-full object-cover transition-all duration-500"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-r ${mounted ? displayBanner : DEFAULTS.banner}`} />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-90 pointer-events-none" />

          <button
            onClick={() => handleOpenEdit("visual")}
            className="absolute top-4 right-4 rounded-full px-4 py-2 text-xs font-bold backdrop-blur-md border bg-black/60 text-white hover:bg-black/80 transition-all hover:scale-105 flex items-center gap-1.5 shadow-lg z-20 cursor-pointer border-white/20"
          >
            <Layers className="w-3.5 h-3.5 text-white" />
            <span>Cambiar Portada</span>
          </button>
        </div>

        {/* Capa B: Cuerpo Central Integrado con Espaciado Generoso */}
        <div className="px-6 sm:px-10 pb-7 pt-4 relative">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Bloque Identidad + Avatar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-7 flex-1 min-w-0">
              
              {/* Avatar Flotante con Punto Verde de Activo en la Esquina */}
              <div className="relative group shrink-0 -mt-20 sm:-mt-24 lg:-mt-28">
                <div
                  className="relative h-32 w-32 sm:h-36 sm:w-36 lg:h-40 lg:w-40 rounded-3xl overflow-hidden border-4 shadow-2xl ring-2 transition-transform group-hover:scale-105"
                  style={{ borderColor: "var(--bg-card)", background: "var(--bg-subtle)", boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.3)" }}
                >
                  <FicImage
                    src={displayAvatar}
                    alt={displayName}
                    fallbackType="avatar"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-1 z-30">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-glow)" }} />
                      <span className="text-[10px] text-white font-bold">Subiendo...</span>
                    </div>
                  )}

                  {/* Señal de Activo: Punto Verde en la esquina superior derecha */}
                  <div
                    className="absolute top-2.5 right-2.5 flex items-center justify-center z-20"
                    title="Usuario activo"
                  >
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-md" />
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => quickAvatarInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2.5 rounded-xl shadow-lg transition-transform group-hover:scale-110 cursor-pointer fic-btn-primary border-2 border-white dark:border-slate-900"
                  title="Cambiar foto o GIF"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Textos de Identidad y Biografía */}
              <div className="space-y-1.5 pb-1 flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <span>{displayName}</span>
                    <VerifiedBadge size="md" />
                  </h1>

                  {/* Insignia de Autor Verificado */}
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 text-amber-500 dark:text-amber-300 text-[11px] font-extrabold shadow-xs"
                    title="Autor Verificado Oficial de FicNation"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Autor Verificado</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {/* Nivel de Lector */}
                  <span
                    className="rounded-full px-3 py-0.5 text-xs font-bold border flex items-center gap-1.5 shadow-xs"
                    style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                    title="Nivel de Lector basado en XP y lecturas"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Lector Lv. {calculateReaderLevel(user?.xp ?? 0).level}: {calculateReaderLevel(user?.xp ?? 0).levelTitle}</span>
                  </span>

                  {/* Nivel de Autor */}
                  <span
                    className="rounded-full px-3 py-0.5 text-xs font-bold border flex items-center gap-1.5 shadow-xs bg-purple-950/20 border-purple-500/30 text-purple-300"
                    title="Nivel de Autor basado en historias publicadas"
                  >
                    <Feather className="w-3 h-3 text-purple-400" />
                    <span>Autor Lv. {calculateAuthorLevel(userStories.length).level}: {calculateAuthorLevel(userStories.length).levelTitle}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs sm:text-sm flex-wrap pt-1">
                  <span className="font-mono font-bold" style={{ color: "var(--text-muted)" }}>
                    @{displayUsername}
                  </span>
                  <span className="text-slate-400 opacity-60">•</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    <Calendar className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                    <span>Miembro desde {memberSince}</span>
                  </span>
                </div>

                {/* Biografía integrada naturalmente */}
                <div className="pt-2 max-w-2xl">
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {displayBio}
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo Derecho: Botón Editar Perfil (Arriba) y Cantidad de Monedas (Abajo) */}
            <div className="flex flex-col items-start sm:items-end justify-center gap-2.5 shrink-0 self-start sm:self-center lg:self-center pt-2 lg:pt-0">
              
              {/* Botón Principal de Edición (Arriba) */}
              <button
                onClick={() => handleOpenEdit("visual")}
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer fic-btn-primary"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Perfil</span>
              </button>

              {/* Contador de Crédito / Monedas (Abajo) */}
              <div
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border fic-card shadow-xs"
                style={{ borderColor: "var(--border-primary)", background: "var(--bg-card-secondary)" }}
                title="Saldo de FicCoins (Haz clic en + para recargar o ver beneficios)"
              >
                <Coins className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                <span className="font-mono font-black text-lg leading-none" style={{ color: "var(--text-primary)" }}>
                  {displayCoins.toLocaleString()}
                </span>
                <button
                  onClick={() => setIsWalletModalOpen(true)}
                  className="h-6 w-6 rounded-full flex items-center justify-center border shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer fic-btn-primary ml-1"
                  title="Agregar crédito (FicCoins)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Capa C: Barra de Estado Acoplada (Métricas + Progreso de XP) con Más Espacio */}
        <div className="border-t px-6 sm:px-10 py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}>
          
          {/* Métricas Rápidas en Fila */}
          <div className="flex items-center gap-5 sm:gap-8 lg:gap-10 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
              <span className="font-mono font-black text-base" style={{ color: "var(--text-primary)" }}>{userStories.length}</span>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Obras</span>
            </div>

            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
              <span className="font-mono font-black text-base" style={{ color: "var(--text-primary)" }}>{readingLists.length}</span>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Listas</span>
            </div>

            <button
              type="button"
              onClick={() => setFollowModal({ isOpen: true, type: "followers" })}
              className="flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
              title="Ver seguidores"
            >
              <Users className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
              <span className="font-mono font-black text-base group-hover:underline" style={{ color: "var(--text-primary)" }}>{displayFollowers}</span>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Seguidores</span>
            </button>

            <button
              type="button"
              onClick={() => setFollowModal({ isOpen: true, type: "following" })}
              className="flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
              title="Ver usuarios seguidos"
            >
              <Users className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
              <span className="font-mono font-black text-base group-hover:underline" style={{ color: "var(--text-primary)" }}>{displayFollowing}</span>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Siguiendo</span>
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-mono font-black text-base" style={{ color: "var(--text-primary)" }}>{completedCount}/{ACHIEVEMENTS.length}</span>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Logros</span>
            </div>
          </div>

          {/* Medidor de XP Acoplado */}
          <div className="flex items-center gap-3.5 w-full md:w-72">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                  <Award className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                  Nivel {displayLevel}
                </span>
                <span style={{ color: "var(--text-muted)" }}>{xpCurrent}/{xpNext} XP ({xpPercent}%)</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--reading-progress-track)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(xpPercent, 4)}%`, background: "var(--reading-progress-fill)" }}
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ═══════════════════ 2. GRID 2 COLUMNAS CON ESPACIADO AMPLIO ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Columna Izquierda (4) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Logros de la Comunidad */}
          <div className="rounded-3xl border fic-card p-6 shadow-sm space-y-4" style={{ borderColor: "var(--border-primary)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Award className="w-4 h-4 text-amber-500" />
                <span>Logros de Comunidad</span>
              </h3>
              <span className="text-xs font-bold font-mono" style={{ color: "var(--text-badge)" }}>
                {completedCount}/{ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {evaluatedAchievements.map((b) => {
                const Icon = b.icon;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setActiveTab("logros")}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      b.isCompleted
                        ? "fic-card-secondary shadow-xs hover:scale-105"
                        : "opacity-40 fic-card-secondary hover:opacity-60"
                    }`}
                    title={`${b.name} - ${b.isCompleted ? (b.isClaimed ? "Reclamado" : "¡Listo para reclamar!") : `Progreso: ${b.current}/${b.target}`}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${b.color}`} />
                    <span className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{b.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temáticas y Géneros Favoritos del Autor */}
          <div className="rounded-3xl border fic-card p-6 shadow-sm space-y-4" style={{ borderColor: "var(--border-primary)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Temáticas & Intereses</span>
              </h3>
              <span className="text-[11px] font-mono font-medium" style={{ color: "var(--text-muted)" }}>FicNation Tags</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { tag: "Fantasía Oscura", color: "border-purple-500/30 text-purple-600 dark:text-purple-300 bg-purple-500/10" },
                { tag: "Anime & Manga", color: "border-blue-500/30 text-blue-600 dark:text-blue-300 bg-blue-500/10" },
                { tag: "Isekai AU", color: "border-emerald-500/30 text-emerald-600 dark:text-emerald-300 bg-emerald-500/10" },
                { tag: "Misterio & Suspenso", color: "border-amber-500/30 text-amber-600 dark:text-amber-300 bg-amber-500/10" },
                { tag: "Sci-Fi Cósmico", color: "border-cyan-500/30 text-cyan-600 dark:text-cyan-300 bg-cyan-500/10" },
                { tag: "Romance Lento", color: "border-rose-500/30 text-rose-600 dark:text-rose-300 bg-rose-500/10" },
              ].map((item) => (
                <span
                  key={item.tag}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${item.color} transition-transform hover:scale-105 cursor-default`}
                >
                  #{item.tag}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Columna Derecha (8) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Banner Escribir con Más Espacio */}
          <div className="rounded-3xl border fic-card p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5" style={{ borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 shadow-xs" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                <PenTool className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>¿Tienes una nueva historia en mente?</h3>
                <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>Escribe en el taller interactivo y comparte tu creatividad con la comunidad.</p>
              </div>
            </div>
            <Link
              href="/escribir"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold shadow-md hover:scale-105 transition-all shrink-0 fic-btn-primary"
            >
              <span>Escribir Obra</span>
              <Check className="w-4 h-4" />
            </Link>
          </div>

          {/* Pestañas de Navegación Amplias */}
          <div className="flex items-center gap-2.5 rounded-2xl border fic-card p-2 shadow-sm" style={{ borderColor: "var(--border-primary)" }}>
            {([
              { key: "obras" as const, label: `Mis Obras (${userStories.length})`, icon: BookOpen },
              { key: "listas" as const, label: `Listas (${readingLists.length})`, icon: Bookmark },
              { key: "logros" as const, label: `Logros (${completedCount}/${ACHIEVEMENTS.length})${unclaimedCount > 0 ? ` • Reclamar (${unclaimedCount})` : ""}`, icon: Award },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "fic-btn-primary shadow-md"
                    : "fic-card-secondary hover:opacity-85"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Contenido Pestaña 1: MIS OBRAS */}
          {activeTab === "obras" && (
            <div className="space-y-4">
              {isLoadingStories ? (
                <div className="flex flex-col items-center justify-center p-12 rounded-3xl border fic-card-secondary space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-badge)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Cargando tus obras...</span>
                </div>
              ) : userStories.length > 0 ? (
                <>
                  {/* Barra de Control de Obras y Selector de Vista */}
                  <div className="flex items-center justify-between gap-3 px-1">
                    <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      {userStories.length} {userStories.length === 1 ? "obra en tu perfil" : "obras en tu perfil"}
                    </p>
                    <div className="flex items-center gap-1 p-1 rounded-2xl border fic-card shadow-2xs" style={{ borderColor: "var(--border-primary)" }}>
                      <button
                        type="button"
                        onClick={() => setStoryViewMode("list")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          storyViewMode === "list"
                            ? "fic-btn-primary shadow-xs"
                            : "fic-card-secondary opacity-70 hover:opacity-100"
                        }`}
                        title="Vista detallada (tarjetas amplias y completas)"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Detallada</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStoryViewMode("grid")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          storyViewMode === "grid"
                            ? "fic-btn-primary shadow-xs"
                            : "fic-card-secondary opacity-70 hover:opacity-100"
                        }`}
                        title="Vista en cuadrícula (portadas de libro)"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cuadrícula</span>
                      </button>
                    </div>
                  </div>

                  {/* VISTA A: DETALLADA (Tarjetas Horizontales Amplias de Ancho Completo) */}
                  {storyViewMode === "list" && (
                    <div className="flex flex-col gap-4">
                      {userStories.map((story) => (
                        <div
                          key={story.id}
                          className="group flex flex-col sm:flex-row items-stretch p-4 sm:p-5 rounded-3xl border fic-card shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden gap-5 w-full"
                          style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
                        >
                          {/* Portada Proporcionada (Estilo Libro 2:3) */}
                          <div
                            className="relative w-full sm:w-40 aspect-[2/3] sm:h-auto rounded-2xl overflow-hidden border shrink-0 shadow-md group-hover:shadow-lg transition-all"
                            style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={story.coverUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80"}
                              alt={story.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />

                            {/* Estado flotante sobre la portada */}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold backdrop-blur-md border shadow-xs ${
                                  story.status === "completa"
                                    ? "bg-emerald-950/85 text-emerald-300 border-emerald-500/40"
                                    : "bg-cyan-950/85 text-cyan-300 border-cyan-500/40"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    story.status === "completa" ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"
                                  }`}
                                />
                                {story.status === "completa" ? "Completa" : "En Desarrollo"}
                              </span>
                            </div>

                            {/* Overlay de Lectura en hover */}
                            <Link
                              href={`/leer?storyId=${story.id}&chapter=1`}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-bold text-xs backdrop-blur-xs z-20"
                              title="Leer historia"
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>Leer</span>
                            </Link>
                          </div>

                          {/* Contenido e Información Espaciosa */}
                          <div className="flex flex-col justify-between flex-1 min-w-0 space-y-3">
                            <div className="space-y-2">
                              {/* Cabecera: Género y Capítulos */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span
                                  className="px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider shadow-2xs"
                                  style={{
                                    background: "var(--bg-subtle)",
                                    borderColor: "var(--border-primary)",
                                    color: "var(--text-badge)",
                                  }}
                                >
                                  {story.genre || "Fantasía"}
                                </span>
                                <span className="text-[11px] font-mono font-semibold flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                                  <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                                  <span>{story.chaptersCount} {story.chaptersCount === 1 ? "capítulo" : "capítulos"}</span>
                                </span>
                              </div>

                              {/* Título de la Obra */}
                              <h4
                                className="text-base sm:text-lg font-black tracking-tight group-hover:text-amber-500 transition-colors"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {story.title}
                              </h4>

                              {/* Sinopsis sin apretujarse */}
                              <p className="text-xs sm:text-sm leading-relaxed line-clamp-3" style={{ color: "var(--text-secondary)" }}>
                                {story.synopsis || "Una fascinante obra en desarrollo en la comunidad de creadores de FicNation."}
                              </p>

                              {/* Métricas en Pastillas */}
                              <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                                <div
                                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl border fic-card-secondary text-xs font-mono font-bold"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  <Eye className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                                  <span>{story.readsCount.toLocaleString()}</span>
                                  <span className="text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>lecturas</span>
                                </div>

                                <div
                                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl border fic-card-secondary text-xs font-mono font-bold"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/40" />
                                  <span>{story.votesCount.toLocaleString()}</span>
                                  <span className="text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>votos</span>
                                </div>
                              </div>
                            </div>

                            {/* Fila de Acciones del Autor */}
                            <div
                              className="pt-3 border-t flex items-center gap-2.5 flex-wrap sm:flex-nowrap"
                              style={{ borderColor: "var(--border-primary)" }}
                            >
                              <Link
                                href={`/escribir?storyId=${story.id}`}
                                className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all fic-btn-primary shrink-0"
                                title="Continuar escribiendo o editar capítulos"
                              >
                                <PenTool className="w-3.5 h-3.5" />
                                <span>Taller de Escritura</span>
                              </Link>

                              <Link
                                href={`/historia?id=${story.id}`}
                                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border text-xs font-bold transition-all fic-card-secondary hover:opacity-85 hover:scale-[1.02]"
                                style={{ color: "var(--text-primary)" }}
                                title="Ver ficha pública de la historia"
                              >
                                <Eye className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                                <span>Ver Ficha</span>
                              </Link>

                              <Link
                                href={`/leer?storyId=${story.id}&chapter=1`}
                                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl border text-xs font-bold transition-all fic-card-secondary hover:text-amber-500 hover:scale-[1.02]"
                                title="Leer primer capítulo"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Leer</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* VISTA B: CUADRÍCULA (Portadas de Libro Estilo Manga / Wattpad) */}
                  {storyViewMode === "grid" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {userStories.map((story) => (
                        <div
                          key={story.id}
                          className="group flex flex-col rounded-3xl border fic-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative"
                          style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
                        >
                          {/* Portada Vertical de Libro */}
                          <div className="relative aspect-[2/3] w-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={story.coverUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80"}
                              alt={story.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                            {/* Badges en Portada */}
                            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1">
                              <span className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white/90 border border-white/15 backdrop-blur-md shadow-sm">
                                {story.genre || "Fantasía"}
                              </span>
                            </div>
                            <div className="absolute top-2.5 right-2.5 z-10">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-md border shadow-xs ${
                                  story.status === "completa"
                                    ? "bg-emerald-950/85 text-emerald-300 border-emerald-500/40"
                                    : "bg-cyan-950/85 text-cyan-300 border-cyan-500/40"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    story.status === "completa" ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"
                                  }`}
                                />
                                {story.status === "completa" ? "Completa" : "En Desarrollo"}
                              </span>
                            </div>

                            {/* Título y Métricas en la base de la portada */}
                            <div className="absolute inset-x-0 bottom-0 p-3 z-10 space-y-1">
                              <h4 className="text-xs sm:text-sm font-black text-white line-clamp-2 leading-snug drop-shadow-md">
                                {story.title}
                              </h4>
                              <div className="flex items-center justify-between text-[10px] text-white/80 font-mono pt-0.5">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3 text-amber-400" />
                                  {story.chaptersCount} cap.
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3 text-cyan-400" />
                                  {story.readsCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  {story.votesCount}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Barra de Acciones compacta */}
                          <div className="p-2.5 border-t flex items-center gap-1.5" style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}>
                            <Link
                              href={`/escribir?storyId=${story.id}`}
                              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-bold fic-btn-primary shadow-xs hover:scale-105 transition-all text-center"
                              title="Taller de Escritura"
                            >
                              <PenTool className="w-3 h-3" />
                              <span>Taller</span>
                            </Link>
                            <Link
                              href={`/historia?id=${story.id}`}
                              className="inline-flex items-center justify-center p-1.5 rounded-xl border text-xs font-bold fic-card-secondary hover:opacity-85 transition-all"
                              title="Ver Ficha"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                              href={`/leer?storyId=${story.id}&chapter=1`}
                              className="inline-flex items-center justify-center p-1.5 rounded-xl border text-xs font-bold fic-card-secondary hover:text-amber-500 transition-all"
                              title="Leer historia"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-10 rounded-3xl border fic-card-secondary space-y-3">
                  <PenTool className="h-9 w-9 opacity-50" style={{ color: "var(--text-muted)" }} />
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>No has publicado ninguna historia todavía</h3>
                  <p className="text-xs max-w-sm" style={{ color: "var(--text-muted)" }}>
                    Comparte tu creatividad con la comunidad y empieza a escribir tu primera novela o fanfic.
                  </p>
                  <Link
                    href="/escribir"
                    className="mt-2 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold shadow-md hover:scale-105 transition-transform fic-btn-primary text-white"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    Escribir mi primera obra
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Contenido Pestaña 2: LISTAS DE LECTURA */}
          {activeTab === "listas" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Tus Colecciones y Listas</span>
                <button
                  onClick={() => setIsCreateListOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer fic-card-secondary hover:scale-105"
                >
                  <Plus className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                  <span style={{ color: "var(--text-primary)" }}>Nueva Lista</span>
                </button>
              </div>

              {readingLists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {readingLists.map((list) => (
                    <div
                      key={list.id}
                      className="p-4 rounded-2xl border fic-card space-y-2 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl border flex items-center justify-center" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                            <Bookmark className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{list.name}</h4>
                            <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{list.count} historias</p>
                          </div>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full border text-[9px] font-bold flex items-center gap-1"
                          style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                        >
                          {list.isPrivate ? <Lock className="w-2.5 h-2.5 text-rose-500" /> : <Globe className="w-2.5 h-2.5 text-emerald-500" />}
                          {list.isPrivate ? "Privada" : "Pública"}
                        </span>
                      </div>

                      <p className="text-[11px] line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                        {list.description}
                      </p>

                      <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: "var(--border-primary)" }}>
                        <Link
                          href="/biblioteca"
                          className="text-xs font-bold transition-colors flex items-center gap-1 hover:opacity-80"
                          style={{ color: "var(--text-badge)" }}
                        >
                          <span>Ver en biblioteca</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-10 rounded-3xl border fic-card-secondary space-y-3 shadow-sm">
                  <Bookmark className="h-9 w-9 opacity-50" style={{ color: "var(--text-muted)" }} />
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>No tienes listas de lectura creadas</h3>
                  <p className="text-xs max-w-sm" style={{ color: "var(--text-muted)" }}>
                    Organiza tus historias favoritas en colecciones temáticas para compartirlas con otros lectores.
                  </p>
                  <button
                    onClick={() => setIsCreateListOpen(true)}
                    className="mt-2 inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer fic-btn-primary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear mi primera lista
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contenido Pestaña 3: LOGROS Y RECOMPENSAS DE XP */}
          {activeTab === "logros" && (
            <div className="space-y-4">
              {/* Notificación interactiva al reclamar XP */}
              {claimedSuccessToast && (
                <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-500 shadow-lg animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">¡Recompensa Reclamada con Éxito!</p>
                      <p className="text-[11px] opacity-90">
                        Has recibido <span className="font-extrabold text-amber-400">+{claimedSuccessToast.xp} XP</span> por desbloquear &quot;{claimedSuccessToast.title}&quot;.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClaimedSuccessToast(null)}
                    className="p-1 hover:opacity-75 cursor-pointer text-amber-400"
                    title="Cerrar notificación"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Banner de recompensas pendientes */}
              {unclaimedCount > 0 && (
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                        ¡Tienes {unclaimedCount} {unclaimedCount === 1 ? "recompensa lista" : "recompensas listas"} para reclamar!
                      </h4>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Reclama tus puntos de XP para acelerar el ascenso de nivel de tu perfil.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                    +{evaluatedAchievements.filter((a) => a.canClaim).reduce((acc, a) => acc + a.rewardXp, 0)} XP Pendientes
                  </span>
                </div>
              )}

              {/* Header de la Pestaña */}
              <div className="p-4 rounded-3xl border fic-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm" style={{ borderColor: "var(--border-primary)" }}>
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Progreso y Recompensas de Logros</span>
                  </h4>
                  <p className="text-xs pt-0.5" style={{ color: "var(--text-muted)" }}>
                    Cumple los requisitos para desbloquear logros y reclamar recompensas de XP directamente en tu perfil.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-black font-mono px-3 py-1.5 rounded-xl border fic-card-secondary" style={{ color: "var(--text-badge)" }}>
                    {completedCount} / {ACHIEVEMENTS.length} Desbloqueados ({Math.round((completedCount / ACHIEVEMENTS.length) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Filtros por Categoría */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { key: "todos" as const, label: "Todos" },
                  { key: "comunidad" as const, label: "Comunidad" },
                  { key: "escritura" as const, label: "Escritura" },
                  { key: "lector" as const, label: "Lectura" },
                  { key: "progresion" as const, label: "Progresión" },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setLogrosCategoryFilter(cat.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                      logrosCategoryFilter === cat.key
                        ? "fic-btn-primary shadow-xs"
                        : "fic-card-secondary hover:opacity-85"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Cuadrícula de Tarjetas de Logros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
                {evaluatedAchievements
                  .filter((a) => logrosCategoryFilter === "todos" || a.category === logrosCategoryFilter)
                  .map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <div
                        key={badge.id}
                        className={`flex flex-col justify-between p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${
                          badge.canClaim
                            ? "fic-card shadow-lg border-amber-500/50 ring-2 ring-amber-500/20 bg-amber-500/[0.04]"
                            : badge.isCompleted
                            ? "fic-card shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            : "fic-card-secondary opacity-75 hover:opacity-95"
                        }`}
                        style={{ borderColor: badge.canClaim ? undefined : "var(--border-primary)" }}
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

                        {/* Pie de Tarjeta: Progreso y Botón de Acción */}
                        <div className="mt-4 pt-3.5 border-t space-y-3" style={{ borderColor: "var(--border-primary)" }}>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span style={{ color: "var(--text-muted)" }}>
                                Progreso: {Math.min(badge.current, badge.target)} / {badge.target} {badge.unit || ""}
                              </span>
                              <span className="font-bold" style={{ color: badge.isCompleted ? "var(--text-primary)" : "var(--text-muted)" }}>
                                {badge.progressPercent}%
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--reading-progress-track)" }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.max(badge.progressPercent, 3)}%`,
                                  background: badge.isCompleted
                                    ? "linear-gradient(90deg, #10b981, #059669)"
                                    : "var(--reading-progress-fill)",
                                }}
                              />
                            </div>
                          </div>

                          {/* Botón o Estado */}
                          <div>
                            {badge.canClaim ? (
                              <button
                                type="button"
                                onClick={() => handleClaimAchievement(badge)}
                                className="w-full py-2.5 px-3 rounded-2xl text-xs font-black shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer fic-btn-primary animate-pulse"
                              >
                                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                                <span>Reclamar +{badge.rewardXp} XP</span>
                              </button>
                            ) : badge.isClaimed ? (
                              <div className="w-full py-2 px-3 rounded-2xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Logro Reclamado</span>
                              </div>
                            ) : (
                              <div className="w-full py-2 px-3 rounded-2xl text-xs font-semibold opacity-60 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 flex items-center justify-center gap-1.5">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Bloqueado</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 3. MODAL COMPACTO Y ORDENADO: ASPECTO VISUAL E INFORMACIÓN     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in-scale">
          <div
            className="w-full max-w-2xl sm:max-w-3xl rounded-3xl border fic-card shadow-2xl relative overflow-hidden flex flex-col my-auto"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
          >
            {/* Inputs ocultos de archivo */}
            <input ref={modalAvatarInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleModalAvatarUpload} />
            <input ref={modalBannerInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleModalBannerUpload} />

            {/* Encabezado del Modal */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3.5 border-b shrink-0" style={{ borderColor: "var(--border-primary)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border shadow-sm shrink-0"
                  style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                >
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    Ajustes de Perfil
                  </h2>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Personaliza tu identidad visual, avatar, portada e información de autor
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditOpen(false)}
                className="p-2 rounded-full border fic-card-secondary transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{ borderColor: "var(--border-primary)" }}
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {/* Selector de Pestañas Segmentadas */}
            <div className="px-6 pt-3.5 shrink-0">
              <div
                className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border fic-card-secondary"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <button
                  type="button"
                  onClick={() => setModalSection("visual")}
                  className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    modalSection === "visual"
                      ? "fic-btn-primary text-white shadow-md scale-[1.01]"
                      : "fic-card-secondary hover:opacity-90"
                  }`}
                  style={modalSection !== "visual" ? { color: "var(--text-secondary)" } : undefined}
                >
                  <Palette className="w-4 h-4 shrink-0" />
                  <span>1. Aspecto Visual & Portadas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalSection("info")}
                  className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    modalSection === "info"
                      ? "fic-btn-primary text-white shadow-md scale-[1.01]"
                      : "fic-card-secondary hover:opacity-90"
                  }`}
                  style={modalSection !== "info" ? { color: "var(--text-secondary)" } : undefined}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>2. Información de Autor</span>
                </button>
              </div>
            </div>

            {/* Mensajes de Feedback */}
            {statusMessage && (
              <div className="px-6 pt-2.5 shrink-0">
                <div
                  className={`p-2.5 rounded-2xl border text-xs flex items-center gap-2.5 animate-fade-in-scale ${
                    statusMessage.type === "error"
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-200"
                      : "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-200"
                  }`}
                >
                  {statusMessage.type === "error" ? (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  <span className="font-medium">{statusMessage.text}</span>
                </div>
              </div>
            )}

            {/* Formulario Compacto */}
            <form onSubmit={handleSaveProfile} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4">

                {/* ──────────────── SECCIÓN 1: ASPECTO VISUAL EN 2 COLUMNAS ──────────────── */}
                {modalSection === "visual" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-scale">
                    
                    {/* Columna Izquierda: Foto de Perfil / Avatar */}
                    <div
                      className="p-4 rounded-2xl border fic-card-secondary flex flex-col justify-between space-y-3"
                      style={{ borderColor: "var(--border-primary)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                          <User className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                          Foto de Perfil o GIF
                        </span>

                        {isUploadingAvatar ? (
                          <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "var(--text-badge)" }}>
                            <Loader2 className="w-3 h-3 animate-spin" /> Subiendo...
                          </span>
                        ) : (
                          <span className="text-[10px] opacity-60 font-mono">Max 32MB</span>
                        )}
                      </div>

                      {/* Vista Previa Central */}
                      <div className="flex items-center justify-center py-1">
                        <div className="relative group shrink-0">
                          <div
                            className="relative h-24 w-24 rounded-3xl overflow-hidden border-2 shadow-lg transition-transform group-hover:scale-105"
                            style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={editForm.avatar || displayAvatar}
                              alt="Avatar preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => modalAvatarInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                            className="absolute -bottom-1 -right-1 p-1.5 rounded-xl border fic-btn-primary text-white shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                            title="Subir imagen"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Controles de Avatar */}
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled={isUploadingAvatar}
                          onClick={() => modalAvatarInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border py-2 px-3 text-xs font-bold transition-all disabled:opacity-50 fic-card-secondary hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xs"
                          style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                        >
                          <UploadCloud className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                          <span>Subir Archivo o GIF (ImgBB)</span>
                        </button>

                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                            <Link2 className="w-3 h-3" />
                          </span>
                          <input
                            type="url"
                            placeholder="O pega URL directa de imagen o GIF..."
                            value={editForm.avatar}
                            onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                            className="w-full rounded-xl border fic-input py-1.5 pl-7 pr-2.5 text-xs placeholder:opacity-40 focus:outline-none"
                            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Columna Derecha: Portada del Perfil / Banner */}
                    <div
                      className="p-4 rounded-2xl border fic-card-secondary flex flex-col justify-between space-y-3"
                      style={{ borderColor: "var(--border-primary)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                          <Layers className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                          Portada del Perfil
                        </span>

                        {isUploadingBanner ? (
                          <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "var(--text-badge)" }}>
                            <Loader2 className="w-3 h-3 animate-spin" /> Subiendo...
                          </span>
                        ) : (
                          <span className="text-[10px] opacity-60 font-mono">Panorámica</span>
                        )}
                      </div>

                      {/* Vista Previa Panorámica */}
                      <div
                        className="h-20 w-full rounded-2xl overflow-hidden border relative shadow-md"
                        style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}
                      >
                        {isModalImageBanner ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={editForm.banner}
                            alt="Banner preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`h-full w-full bg-gradient-to-r ${editForm.banner}`} />
                        )}
                      </div>

                      {/* Opciones de Carga de Portada */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                              <Link2 className="w-3 h-3" />
                            </span>
                            <input
                              type="text"
                              placeholder="URL directa de portada..."
                              value={editForm.banner}
                              onChange={(e) => setEditForm({ ...editForm, banner: e.target.value })}
                              className="w-full rounded-xl border fic-input py-1.5 pl-7 pr-2 text-xs placeholder:opacity-40 focus:outline-none"
                              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
                            />
                          </div>

                          <button
                            type="button"
                            disabled={isUploadingBanner}
                            onClick={() => modalBannerInputRef.current?.click()}
                            className="rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 fic-card-secondary hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                            style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                            title="Subir archivo a ImgBB"
                          >
                            <UploadCloud className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                            <span>Subir</span>
                          </button>
                        </div>

                        {/* Presets de Temas en Cuadrícula Compacta */}
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          {BANNER_PRESETS.map((preset) => {
                            const isSelected = editForm.banner === preset.value;
                            return (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => setEditForm({ ...editForm, banner: preset.value })}
                                className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all cursor-pointer truncate ${
                                  isSelected
                                    ? "ring-1.5 ring-blue-500 dark:ring-fuchsia-400 scale-[1.02] shadow-sm border-transparent"
                                    : "hover:opacity-90"
                                }`}
                                style={{
                                  background: `linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.8))`,
                                  borderColor: isSelected ? "transparent" : "var(--border-primary)",
                                }}
                                title={preset.name}
                              >
                                <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${preset.value} shrink-0 border border-white/20`} />
                                <span className="text-[10px] font-bold text-white truncate">{preset.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* ──────────────── SECCIÓN 2: INFORMACIÓN DE AUTOR COMPACTA ──────────────── */}
                {modalSection === "info" && (
                  <div className="space-y-3.5 animate-fade-in-scale">
                    
                    {/* Fila 1: Nombre y Username en 2 columnas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      
                      {/* Nombre Visible */}
                      <div
                        className="p-3.5 rounded-2xl border fic-card-secondary space-y-1.5"
                        style={{ borderColor: "var(--border-primary)" }}
                      >
                        <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                          <User className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                          Nombre Visible / Pseudónimo
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="ej. Alexander Raven"
                          className="w-full rounded-xl border fic-input py-2 px-3 text-xs sm:text-sm placeholder:opacity-40 focus:outline-none"
                          style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
                        />
                      </div>

                      {/* Username */}
                      <div
                        className="p-3.5 rounded-2xl border fic-card-secondary space-y-1.5"
                        style={{ borderColor: "var(--border-primary)" }}
                      >
                        <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                          <AtSign className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                          Nombre de Usuario Único (@)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-mono font-bold" style={{ color: "var(--text-badge)" }}>
                            @
                          </span>
                          <input
                            type="text"
                            required
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            placeholder="usuario"
                            className="w-full rounded-xl border fic-input py-2 pl-7 pr-3 text-xs sm:text-sm placeholder:opacity-40 focus:outline-none font-mono"
                            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
                          />
                        </div>
                      </div>

                    </div>

                    {/* Fila 2: Biografía */}
                    <div
                      className="p-3.5 rounded-2xl border fic-card-secondary space-y-1.5"
                      style={{ borderColor: "var(--border-primary)" }}
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                          <FileText className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} />
                          Biografía & Descripción Pública
                        </label>
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            background: "var(--bg-subtle)",
                            borderColor: "var(--border-primary)",
                            color: editForm.bio.length >= 280 ? "#f43f5e" : "var(--text-muted)",
                          }}
                        >
                          {editForm.bio.length} / 300
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={300}
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="Escribe algo sobre ti, tus géneros favoritos o tus historias..."
                        className="w-full rounded-xl border fic-input py-2 px-3 text-xs placeholder:opacity-40 focus:outline-none resize-none leading-relaxed"
                        style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
                      />
                    </div>

                  </div>
                )}

              </div>

              {/* Pie del Modal (Acciones Principales) */}
              <div
                className="flex items-center justify-between px-6 py-3.5 border-t shrink-0 mt-auto"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <div>
                  {modalSection === "visual" ? (
                    <button
                      type="button"
                      onClick={() => setModalSection("info")}
                      className="text-xs font-bold inline-flex items-center gap-1.5 underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ color: "var(--text-badge)" }}
                    >
                      <span>Ir a Información de Autor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalSection("visual")}
                      className="text-xs font-bold inline-flex items-center gap-1.5 underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ color: "var(--text-badge)" }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver a Aspecto Visual</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer fic-card-secondary hover:opacity-90 active:scale-95"
                    style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploadingAvatar || isUploadingBanner}
                    className="rounded-full px-6 py-2 text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer fic-btn-primary text-white"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Lista de Lectura */}
      {isCreateListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-scale">
          <div className="w-full max-w-md rounded-3xl border fic-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl border flex items-center justify-center" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                  <Bookmark className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Nueva Lista de Lectura</h3>
              </div>
              <button
                onClick={() => setIsCreateListOpen(false)}
                className="p-1 rounded-full border fic-card-secondary cursor-pointer"
              >
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <form onSubmit={handleCreateReadingList} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Nombre de la lista *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Joyas de Fantasía Oscura"
                  value={newListForm.name}
                  onChange={(e) => setNewListForm({ ...newListForm, name: e.target.value })}
                  className="w-full rounded-xl border fic-input px-3 py-2 text-xs placeholder:opacity-40 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Describe de qué tratan las historias en esta colección..."
                  value={newListForm.description}
                  onChange={(e) => setNewListForm({ ...newListForm, description: e.target.value })}
                  className="w-full rounded-xl border fic-input px-3 py-2 text-xs placeholder:opacity-40 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border fic-card-secondary">
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Lista Privada</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Solo tú podrás ver esta colección</p>
                </div>
                <input
                  type="checkbox"
                  checked={newListForm.isPrivate}
                  onChange={(e) => setNewListForm({ ...newListForm, isPrivate: e.target.checked })}
                  className="h-4 w-4 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateListOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border fic-card-secondary cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer fic-btn-primary"
                >
                  Crear Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════ MODAL DE BILLETERA Y SISTEMA MONETARIO (FICCOINS) ════════════ */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in-scale">
          <div
            className="w-full max-w-2xl rounded-3xl border fic-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: "var(--border-primary)" }}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border-primary)" }}>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl flex items-center justify-center border shadow-xs" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)" }}>
                  <Coins className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <span>Billetera y Centro de Creadores</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                      <Coins className="w-3 h-3 text-amber-500" />
                      <span>FicCoins</span>
                    </span>
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Gestiona tu saldo, donaciones a autores y retiros de dinero real.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="p-2 rounded-full border fic-card-secondary hover:scale-105 transition-all cursor-pointer"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {/* Pestañas de la Billetera */}
            <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto" style={{ borderColor: "var(--border-primary)" }}>
              <button
                type="button"
                onClick={() => setWalletTab("recharge")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  walletTab === "recharge"
                    ? "fic-btn-primary shadow-sm"
                    : "fic-card-secondary hover:opacity-80"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Comprar FicCoins ($0.50 - $100)</span>
              </button>

              <button
                type="button"
                onClick={() => setWalletTab("cashout")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  walletTab === "cashout"
                    ? "fic-btn-primary shadow-sm"
                    : "fic-card-secondary hover:opacity-80"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Retirar Ganancias ($5 min)</span>
                {displayEarnedUsd > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                    ${displayEarnedUsd.toFixed(2)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setWalletTab("gifts")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  walletTab === "gifts"
                    ? "fic-btn-primary shadow-sm"
                    : "fic-card-secondary hover:opacity-80"
                }`}
              >
                <Gift className="w-3.5 h-3.5 text-rose-400" />
                <span>Regalos Recibidos</span>
                {receivedTipsList.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400">
                    {receivedTipsList.length}
                  </span>
                )}
              </button>
            </div>

            {/* ════════════ PESTAÑA 1: PLANES DE COMPRA ($0.50 - $100 USD) ════════════ */}
            {walletTab === "recharge" && (
              <div className="space-y-5 animate-fade-in-scale">
                
                {/* 🚧 CARTEL PRINCIPAL: SISTEMA MONETARIO EN FASE DE PLANEACIÓN */}
                <div
                  className="p-4 sm:p-5 rounded-2xl border space-y-2.5 relative overflow-hidden shadow-sm"
                  style={{
                    background: "rgba(245, 158, 11, 0.08)",
                    borderColor: "rgba(245, 158, 11, 0.35)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-500">
                      <span className="text-base">🚧</span>
                      <span>Sistema Monetario en Planeación</span>
                    </div>
                    <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-500">
                      Próximamente
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Las compras, recargas y pasarelas de pago (PayPal, Tarjeta y Cripto) se encuentran actualmente <strong>desactivadas y en fase de planeación técnica</strong>. Muy pronto estará disponible la compra oficial de FicCoins para apoyar a tus escritores favoritos.
                  </p>
                </div>

                {/* Tarjeta de Saldo Actual */}
                <div className="p-4 sm:p-5 rounded-2xl border fic-card-secondary space-y-2 relative overflow-hidden text-center" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span>Tu Balance de FicCoins</span>
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight" style={{ color: "var(--text-primary)" }}>
                      {displayCoins.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-amber-500 font-mono px-2 py-0.5 rounded-md border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)" }}>
                      FicCoins
                    </span>
                  </div>
                  <p className="text-[11px] max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
                    Vista previa de la billetera. Las compras de saldo se habilitarán al concluir la fase de integración.
                  </p>
                </div>

                {/* Encabezado de Selección de Planes (Vista Previa) */}
                <div className="space-y-3 pt-1 border-t" style={{ borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>Planes de Compra (Vista Previa)</span>
                      </h4>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Estructura de paquetes planificados desde $0.50 hasta $100.00 USD
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border text-amber-500 bg-amber-500/10 border-amber-500/30">
                      100 Coins = $1.00 USD
                    </span>
                  </div>

                  {/* Grid de 8 Paquetes Predefinidos (Desactivados / Vista Previa) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 opacity-75">
                    {RECHARGE_PLANS.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          className={`p-3 rounded-2xl border text-left relative flex flex-col justify-between select-none cursor-not-allowed ${
                            isSelected
                              ? "border-amber-500/60 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30"
                              : "fic-card-secondary"
                          }`}
                          style={{ borderColor: isSelected ? undefined : "var(--border-primary)" }}
                        >
                          {plan.badge && (
                            <span className="absolute -top-2 right-2 text-[9px] font-extrabold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.2 rounded-full shadow-xs">
                              {plan.badge}
                            </span>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-lg">{plan.icon}</span>
                              <span className="text-xs font-mono font-black text-emerald-500">
                                ${plan.usd.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs font-black font-mono flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                              <Coins className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>+{plan.totalCoins.toLocaleString()}</span>
                            </p>
                          </div>

                          <div className="pt-2 border-t mt-2" style={{ borderColor: "var(--border-primary)" }}>
                            <p className="text-[10px] font-bold truncate" style={{ color: "var(--text-badge)" }}>
                              {plan.name}
                            </p>
                            {plan.bonusCoins > 0 && (
                              <p className="text-[9px] font-mono text-amber-500 font-semibold">
                                (+{plan.bonusCoins} Bonus)
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Métodos de Pago Planificados (Desactivados) */}
                <div className="space-y-2 pt-1 border-t opacity-70" style={{ borderColor: "var(--border-primary)" }}>
                  <label className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    Métodos de Pago en Integración
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "card", name: "Tarjeta (Stripe)", icon: CreditCard },
                      { id: "paypal", name: "PayPal", icon: Wallet },
                      { id: "crypto", name: "USDT / Binance", icon: Coins },
                    ].map((m) => {
                      const IconComp = m.icon;
                      return (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 fic-card-secondary select-none cursor-not-allowed opacity-75"
                          style={{ borderColor: "var(--border-primary)" }}
                        >
                          <IconComp className="w-3.5 h-3.5 opacity-60" />
                          <span>{m.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botón Desactivado con Cartel */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={true}
                    className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black border border-dashed flex items-center justify-center gap-2 cursor-not-allowed opacity-75 bg-amber-500/5 transition-all text-amber-500"
                    style={{ borderColor: "rgba(245, 158, 11, 0.4)" }}
                  >
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Compras y Recargas Desactivadas (En Planeación)</span>
                  </button>

                  <p className="text-[10px] text-center mt-2 flex items-center justify-center gap-1" style={{ color: "var(--text-muted)" }}>
                    <span>El sistema de compras estará disponible en una próxima versión.</span>
                  </p>
                </div>
              </div>
            )}

            {/* ════════════ PESTAÑA 2: RETIRAR GANANCIAS (CASHOUT) ════════════ */}
            {walletTab === "cashout" && (
              <div className="space-y-5 animate-fade-in-scale">
                {/* Banner de Saldo Retirable y Umbral */}
                <div className="p-5 rounded-2xl border space-y-4 relative overflow-hidden" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Saldo Ganado de Creador</span>
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl sm:text-4xl font-black font-mono" style={{ color: "var(--text-primary)" }}>
                          ${displayEarnedUsd.toFixed(2)} USD
                        </span>
                        <span className="text-xs font-mono font-bold" style={{ color: "var(--text-muted)" }}>
                          ({displayEarnedCoins.toLocaleString()} FicCoins recibidas)
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                        Umbral Mínimo de Retiro
                      </span>
                      <span className="text-base font-mono font-extrabold text-amber-500">
                        $5.00 USD (500 Coins)
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progreso del Umbral */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span style={{ color: "var(--text-muted)" }}>Progreso hacia el retiro</span>
                      <span className={canWithdraw ? "text-emerald-500" : "text-amber-500"}>
                        ${displayEarnedUsd.toFixed(2)} / $5.00 USD ({thresholdPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden border" style={{ background: "var(--reading-progress-track)", borderColor: "var(--border-primary)" }}>
                      <div
                        className={`h-full transition-all duration-500 ${
                          canWithdraw
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : "bg-gradient-to-r from-amber-500 to-yellow-400"
                        }`}
                        style={{ width: `${Math.max(thresholdPercent, 4)}%` }}
                      />
                    </div>
                  </div>

                  {/* Mensaje de Estado del Umbral */}
                  {canWithdraw ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>¡Felicidades! Has superado el umbral de $5.00 USD. Puedes solicitar tu cobro abajo.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-medium flex items-center justify-between gap-2">
                        <span>
                          Te faltan <strong>${remainingForThreshold.toFixed(2)} USD</strong> ({Math.round(remainingForThreshold * 100)} FicCoins) en donaciones de lectores para solicitar un retiro.
                        </span>
                      </div>
                      
                      {/* Botón de Pruebas Sandbox para simular donación recibida */}
                      <button
                        type="button"
                        onClick={async () => {
                          const supabase = createClient();
                          const newEarned = displayEarnedCoins + 500;
                          await supabase.from("profiles").update({ earned_coins: newEarned }).eq("id", user?.id || "");
                          await refreshProfile();
                          setCashoutStatusMsg({ type: "success", text: "¡Simulación: +500 FicCoins ($5.00 USD) añadidas a tu saldo de creador!" });
                        }}
                        className="w-full py-2 px-3 rounded-xl border border-dashed text-xs font-mono font-bold text-amber-500 hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        style={{ borderColor: "var(--border-primary)" }}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>[Sandbox / Test] Simular Donación Recibida (+500 Coins / +$5.00 USD)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Formulario de Solicitud de Retiro */}
                <form onSubmit={handleExecuteCashout} className="space-y-4 p-5 rounded-2xl border fic-card-secondary" style={{ borderColor: "var(--border-primary)" }}>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                    <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                    <span>Solicitar Retiro a Dinero Real</span>
                  </h4>

                  {/* Selector de Método de Pago */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Método de Pago</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "paypal", name: "PayPal", icon: CreditCard },
                        { id: "bank_transfer", name: "Transferencia", icon: Building2 },
                        { id: "crypto", name: "USDT / Cripto", icon: Coins },
                      ].map((m) => {
                        const isSel = cashoutMethod === m.id;
                        const IconComponent = m.icon;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setCashoutMethod(m.id as any)}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                              isSel ? "fic-btn-primary shadow-sm" : "fic-card hover:opacity-85"
                            }`}
                            style={{ borderColor: isSel ? undefined : "var(--border-primary)" }}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span>{m.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Monto a Retirar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Monto a Retirar (USD)</label>
                      <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                        Disponible: ${displayEarnedUsd.toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.50"
                          min="5.00"
                          max={displayEarnedUsd > 0 ? displayEarnedUsd : 5.0}
                          value={cashoutAmount}
                          onChange={(e) => setCashoutAmount(e.target.value)}
                          placeholder="5.00"
                          className="w-full rounded-xl border fic-input px-4 py-2.5 text-sm font-mono font-bold focus:outline-none"
                        />
                        <DollarSign className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setCashoutAmount(Math.max(5.0, displayEarnedUsd).toFixed(2))}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold border fic-card hover:scale-105 transition-all cursor-pointer shrink-0"
                        style={{ borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                      >
                        Máximo
                      </button>
                    </div>
                  </div>

                  {/* Campos Dinámicos según Método */}
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-xs font-bold block mb-1" style={{ color: "var(--text-primary)" }}>
                        Nombre Completo del Titular
                      </label>
                      <input
                        type="text"
                        required
                        value={cashoutFullName}
                        onChange={(e) => setCashoutFullName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full rounded-xl border fic-input px-3.5 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    {cashoutMethod === "paypal" && (
                      <div>
                        <label className="text-xs font-bold block mb-1" style={{ color: "var(--text-primary)" }}>
                          Correo Electrónico de PayPal
                        </label>
                        <input
                          type="email"
                          required
                          value={cashoutAccount}
                          onChange={(e) => setCashoutAccount(e.target.value)}
                          placeholder="tu-correo@paypal.com"
                          className="w-full rounded-xl border fic-input px-3.5 py-2 text-xs font-mono focus:outline-none"
                        />
                      </div>
                    )}

                    {cashoutMethod === "bank_transfer" && (
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-bold block mb-1" style={{ color: "var(--text-primary)" }}>
                            Nombre del Banco
                          </label>
                          <input
                            type="text"
                            required
                            value={cashoutBankName}
                            onChange={(e) => setCashoutBankName(e.target.value)}
                            placeholder="Ej. BBVA / Santander / Chase"
                            className="w-full rounded-xl border fic-input px-3.5 py-2 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold block mb-1" style={{ color: "var(--text-primary)" }}>
                            Número de Cuenta / CLABE / IBAN
                          </label>
                          <input
                            type="text"
                            required
                            value={cashoutAccount}
                            onChange={(e) => setCashoutAccount(e.target.value)}
                            placeholder="012345678901234567"
                            className="w-full rounded-xl border fic-input px-3.5 py-2 text-xs font-mono focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {cashoutMethod === "crypto" && (
                      <div>
                        <label className="text-xs font-bold block mb-1" style={{ color: "var(--text-primary)" }}>
                          Dirección USDT (TRC20) o Binance Pay ID
                        </label>
                        <input
                          type="text"
                          required
                          value={cashoutAccount}
                          onChange={(e) => setCashoutAccount(e.target.value)}
                          placeholder="TXxxxxxxxxxxxxxxxxxxx o Binance ID"
                          className="w-full rounded-xl border fic-input px-3.5 py-2 text-xs font-mono focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold block mb-1" style={{ color: "var(--text-muted)" }}>
                        Notas o Instrucciones Especiales (Opcional)
                      </label>
                      <input
                        type="text"
                        value={cashoutNotes}
                        onChange={(e) => setCashoutNotes(e.target.value)}
                        placeholder="Información adicional para la transferencia..."
                        className="w-full rounded-xl border fic-input px-3.5 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Mensajes de Feedback */}
                  {cashoutStatusMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold border animate-fade-in-scale ${
                        cashoutStatusMsg.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300"
                      }`}
                    >
                      {cashoutStatusMsg.text}
                    </div>
                  )}

                  {/* Blindaje Legal */}
                  <div className="p-3 rounded-xl border fic-card flex items-start gap-2 text-[10px] leading-relaxed" style={{ borderColor: "var(--border-primary)", color: "var(--text-muted)" }}>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Blindaje Legal:</strong> Este retiro corresponde a la liquidación de donaciones voluntarias de lectores. Tiempo de procesamiento: 1 a 3 días hábiles.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingCashout || !canWithdraw}
                    className="w-full py-3 rounded-xl text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer fic-btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingCashout ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <DollarSign className="w-4 h-4" />
                    )}
                    <span>
                      Solicitar Retiro de ${cashoutAmount || "5.00"} USD
                    </span>
                  </button>
                </form>

                {/* Historial de Solicitudes de Retiro */}
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                    <History className="w-3.5 h-3.5 text-purple-400" />
                    <span>Historial de Retiros</span>
                  </h4>
                  {cashoutHistoryList.length > 0 ? (
                    <div className="space-y-2">
                      {cashoutHistoryList.map((req) => (
                        <div
                          key={req.id}
                          className="p-3.5 rounded-xl border fic-card-secondary flex items-center justify-between text-xs"
                          style={{ borderColor: "var(--border-primary)" }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm" style={{ color: "var(--text-primary)" }}>
                                ${req.amountUsd.toFixed(2)} USD
                              </span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                                {req.paymentMethod === "paypal" ? "PayPal" : req.paymentMethod === "bank_transfer" ? "Banco" : "Cripto"}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {new Date(req.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>

                          <div>
                            {req.status === "pending" ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-500">
                                🟡 Pendiente
                              </span>
                            ) : req.status === "paid" || req.status === "approved" ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
                                🟢 Pagado
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-500">
                                🔴 Rechazado
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border text-center text-xs" style={{ borderColor: "var(--border-primary)", color: "var(--text-muted)" }}>
                      Aún no has realizado solicitudes de retiro.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════ PESTAÑA 3: REGALOS RECIBIDOS ════════════ */}
            {walletTab === "gifts" && (
              <div className="space-y-4 animate-fade-in-scale">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Donaciones y Apoyo de Lectores</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-amber-500">
                    Total: {displayEarnedCoins} FicCoins (${displayEarnedUsd.toFixed(2)} USD)
                  </span>
                </div>

                {receivedTipsList.length > 0 ? (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto">
                    {receivedTipsList.map((tip) => (
                      <div
                        key={tip.id}
                        className="p-3.5 rounded-2xl border fic-card-secondary space-y-1.5"
                        style={{ borderColor: "var(--border-primary)" }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-7 w-7 rounded-full overflow-hidden border" style={{ borderColor: "var(--border-primary)" }}>
                              <FicImage
                                src={tip.senderAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                                alt={tip.senderName}
                                fallbackType="avatar"
                              />
                            </div>
                            <div>
                              <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{tip.senderName}</span>
                              <span className="text-[10px] ml-1.5 font-mono" style={{ color: "var(--text-muted)" }}>
                                {new Date(tip.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                            <span>{tip.giftIcon || "🎁"}</span>
                            <span className="font-mono">+{tip.amount} FicCoins</span>
                            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                              (${ (tip.amount / 100).toFixed(2)} USD)
                            </span>
                          </div>
                        </div>

                        {tip.storyTitle && (
                          <p className="text-[11px] font-medium" style={{ color: "var(--text-badge)" }}>
                            Historia: <em>{tip.storyTitle}</em>
                          </p>
                        )}

                        {tip.message && (
                          <p className="text-xs italic p-2 rounded-xl border bg-black/10" style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>
                            &ldquo;{tip.message}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl border space-y-2 fic-card-secondary" style={{ borderColor: "var(--border-primary)" }}>
                    <Gift className="w-8 h-8 opacity-40 mx-auto text-rose-400" />
                    <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Aún no has recibido regalos</p>
                    <p className="text-[11px] max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                      Cuando los lectores lean tus capítulos y decidan enviarte un café virtual o una pluma dorada, aparecerán aquí y podrás retirar esos fondos.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer del Modal */}
            <div className="flex justify-end pt-2 border-t" style={{ borderColor: "var(--border-primary)" }}>
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold border fic-card-secondary hover:scale-105 transition-all cursor-pointer"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
              >
                Cerrar Billetera
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
          userName={user.name || "Mi Cuenta"}
          initialType={followModal.type}
        />
      )}

    </div>
  );
}
