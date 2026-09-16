"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Crown,
  Users,
  Bell,
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Eye,
  Star,
  Coins,
  Lock,
  Unlock,
  Sliders,
  Play,
  RotateCcw,
  Megaphone,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  UserX,
  Sparkle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { sendNotification } from "@/lib/notifications";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import {
  checkIsAdmin,
  activateMasterAdminKey,
  getVerifiedUserIdentifiers,
  toggleUserVerification,
  isUserVerified,
  getBannedUsers,
  banUser,
  unbanUser,
  isUserBanned,
  getEmergencyBanner,
  setEmergencyBanner,
  EmergencyBannerData,
  BannedUserRecord,
} from "@/lib/adminAuth";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Estados de autenticación
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [masterKeyInput, setMasterKeyInput] = useState<string>("");
  const [keyError, setKeyError] = useState<string>("");

  // Pestañas
  const [activeTab, setActiveTab] = useState<"users" | "notifications" | "sandbox" | "stories">("users");

  // --- TAB 1: USUARIOS ---
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState<string>("");
  const [userFilter, setUserFilter] = useState<"all" | "verified" | "banned">("all");
  const [selectedUserForAction, setSelectedUserForAction] = useState<any | null>(null);
  const [banReason, setBanReason] = useState<string>("");
  const [isBanModalOpen, setIsBanModalOpen] = useState<boolean>(false);
  const [coinsAmount, setCoinsAmount] = useState<number>(100);
  const [xpAmount, setXpAmount] = useState<number>(200);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>("");

  // --- TAB 2: NOTIFICACIONES ---
  const [notifRecipient, setNotifRecipient] = useState<string>("");
  const [notifTitle, setNotifTitle] = useState<string>("");
  const [notifMessage, setNotifMessage] = useState<string>("");
  const [notifType, setNotifType] = useState<"system" | "announcement" | "reward" | "warning">("system");
  const [broadcastMessage, setBroadcastMessage] = useState<string>("");
  const [bannerConfig, setBannerConfig] = useState<EmergencyBannerData>({
    isActive: false,
    message: "",
    type: "info",
    actionText: "",
    actionUrl: "",
  });

  // --- TAB 3: DEV SANDBOX & ANIMACIONES ---
  const [sandboxAnimMode, setSandboxAnimMode] = useState<"fade" | "typewriter" | "cascade" | "none">("fade");
  const [sandboxSpeed, setSandboxSpeed] = useState<number>(500); // ms
  const [sandboxFontSize, setSandboxFontSize] = useState<number>(18); // px
  const [sandboxTheme, setSandboxTheme] = useState<"white" | "sepia" | "dark" | "oled">("white");
  const [sandboxSampleText, setSandboxSampleText] = useState<string>(
    "Las sombras de la catedral danzaban al compás de la ventisca helada.\n\n" +
    "Auron dio un paso al frente, desenvainando la hoja rúnica que destellaba en un azul profundo. " +
    "Cada palabra susurrada por el oráculo resonaba en su mente como un eco eterno.\n\n" +
    "—No hay vuelta atrás —murmuró, sintiendo cómo el destino del reino entero descansaba sobre el filo de su acero."
  );
  const [typewriterProgress, setTypewriterProgress] = useState<number>(0);

  // --- TAB 4: HISTORIAS ---
  const [storiesList, setStoriesList] = useState<any[]>([]);
  const [storySearch, setStorySearch] = useState<string>("");
  const [editingStory, setEditingStory] = useState<any | null>(null);
  const [editViewsInput, setEditViewsInput] = useState<number>(0);
  const [editVotesInput, setEditVotesInput] = useState<number>(0);

  // 1. Verificación de Seguridad
  useEffect(() => {
    const adminStatus = checkIsAdmin(user);
    setIsAdmin(adminStatus);
    setAuthChecking(false);
  }, [user]);

  // Cargar datos administrativos
  useEffect(() => {
    if (!isAdmin) return;

    // Cargar banner de emergencia
    setBannerConfig(getEmergencyBanner());

    // Cargar usuarios de Supabase y perfiles locales
    async function loadData() {
      const supabase = createClient();

      // Cargar perfiles de Supabase
      try {
        const { data: dbProfiles } = await supabase
          .from("profiles")
          .select("id, name, username, avatar_url, bio, earned_coins, xp, created_at")
          .limit(100);

        if (dbProfiles && dbProfiles.length > 0) {
          setUsersList(dbProfiles);
        } else {
          // Fallback de demostración
          setUsersList([
            { id: "f4-master-id", name: "F4", username: "f4", avatar_url: user?.avatar || "/default-avatar.svg", earned_coins: 5000, xp: 8500 },
            { id: "demo-1", name: "Just_G", username: "just_g", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", earned_coins: 250, xp: 1200 },
            { id: "demo-2", name: "Marjos04", username: "marjos04", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", earned_coins: 100, xp: 800 },
            { id: "demo-3", name: "Raecher Sterling2", username: "raecher2", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", earned_coins: 400, xp: 2100 },
          ]);
        }
      } catch {
        setUsersList([
          { id: "f4-master-id", name: "F4", username: "f4", avatar_url: user?.avatar || "/default-avatar.svg", earned_coins: 5000, xp: 8500 },
        ]);
      }

      // Cargar historias
      try {
        const { data: dbStories } = await supabase
          .from("stories")
          .select("id, title, synopsis, genre, cover_url, reads_count, votes_count, is_completed, created_at, profiles!author_id(name, username)")
          .order("created_at", { ascending: false })
          .limit(100);

        if (dbStories && dbStories.length > 0) {
          setStoriesList(dbStories);
        }
      } catch {}
    }

    loadData();
  }, [isAdmin, user]);

  // Manejo de la llave maestra de desbloqueo
  const handleMasterKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activateMasterAdminKey(masterKeyInput)) {
      setIsAdmin(true);
      setKeyError("");
    } else {
      setKeyError("Llave maestra de acceso inválida.");
    }
  };

  // Acciones de Usuario
  const handleToggleVerified = (identifier: string) => {
    const isNow = toggleUserVerification(identifier);
    setActionSuccessMsg(`Usuario ${identifier} ${isNow ? "verificado con éxito" : "desverificado"}.`);
    setTimeout(() => setActionSuccessMsg(""), 4000);
    // Forzar re-render de estado
    setUsersList((prev) => [...prev]);
  };

  const handleOpenBanModal = (u: any) => {
    setSelectedUserForAction(u);
    setBanReason("");
    setIsBanModalOpen(true);
  };

  const handleConfirmBan = () => {
    if (!selectedUserForAction) return;
    const target = selectedUserForAction.username || selectedUserForAction.id;
    banUser({
      idOrUsername: target,
      name: selectedUserForAction.name,
      reason: banReason || "Suspensión administrativa por conducta inapropiada",
      adminName: user?.name || "F4 Admin",
    });
    setIsBanModalOpen(false);
    setActionSuccessMsg(`Usuario ${target} ha sido baneado.`);
    setTimeout(() => setActionSuccessMsg(""), 4000);
    setUsersList((prev) => [...prev]);
  };

  const handleUnban = (target: string) => {
    unbanUser(target);
    setActionSuccessMsg(`Usuario ${target} desbaneado con éxito.`);
    setTimeout(() => setActionSuccessMsg(""), 4000);
    setUsersList((prev) => [...prev]);
  };

  const handleGrantCoins = async (targetUserId: string, amount: number) => {
    try {
      const supabase = createClient();
      const userMatch = usersList.find((u) => u.id === targetUserId);
      const newCoins = (userMatch?.earned_coins || 0) + amount;
      await supabase.from("profiles").update({ earned_coins: newCoins }).eq("id", targetUserId);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, earned_coins: newCoins } : u))
      );
      setActionSuccessMsg(`Se otorgaron +${amount} FicCoins a ${userMatch?.name || targetUserId}.`);
      setTimeout(() => setActionSuccessMsg(""), 4000);
    } catch {
      setActionSuccessMsg("Error al actualizar monedas en la base de datos.");
    }
  };

  // Acciones de Notificaciones
  const handleSendDirectNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifRecipient || !notifTitle || !notifMessage) return;

    sendNotification({
      recipientId: notifRecipient,
      actor: {
        id: user?.id || "f4-admin",
        name: "Administración FicNation",
        avatar: user?.avatar || "/default-avatar.svg",
      },
      type: "admin_announcement",
      customMessage: `${notifTitle}: ${notifMessage}`,
    });

    setActionSuccessMsg(`Notificación enviada a ${notifRecipient} con éxito.`);
    setTimeout(() => setActionSuccessMsg(""), 4000);
    setNotifTitle("");
    setNotifMessage("");
  };

  const handleSaveBanner = () => {
    setEmergencyBanner(bannerConfig);
    setActionSuccessMsg("Banner de emergencia del sistema actualizado.");
    setTimeout(() => setActionSuccessMsg(""), 4000);
  };

  // Animación del Sandbox Typewriter
  useEffect(() => {
    if (sandboxAnimMode !== "typewriter") return;
    setTypewriterProgress(0);
    const interval = setInterval(() => {
      setTypewriterProgress((prev) => {
        if (prev < sandboxSampleText.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, Math.max(10, 800 - sandboxSpeed));

    return () => clearInterval(interval);
  }, [sandboxAnimMode, sandboxSpeed, sandboxSampleText]);

  // Acciones de Historias
  const handleSaveStoryStats = async () => {
    if (!editingStory) return;
    try {
      const supabase = createClient();
      await supabase
        .from("stories")
        .update({
          reads_count: editViewsInput,
          votes_count: editVotesInput,
        })
        .eq("id", editingStory.id);

      setStoriesList((prev) =>
        prev.map((s) =>
          s.id === editingStory.id
            ? { ...s, reads_count: editViewsInput, votes_count: editVotesInput }
            : s
        )
      );

      setActionSuccessMsg(`Métricas de "${editingStory.title}" actualizadas en Supabase.`);
      setTimeout(() => setActionSuccessMsg(""), 4000);
      setEditingStory(null);
    } catch {
      setActionSuccessMsg("Error al actualizar métricas en la base de datos.");
    }
  };

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const nameMatch =
        (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.id || "").toLowerCase().includes(userSearch.toLowerCase());

      if (!nameMatch) return false;

      const target = u.username || u.id;
      const verified = isUserVerified(target);
      const banned = isUserBanned(target).isBanned;

      if (userFilter === "verified") return verified;
      if (userFilter === "banned") return banned;
      return true;
    });
  }, [usersList, userSearch, userFilter]);

  // ============================================================================
  // SEGURIDAD: SI NO ES ADMIN, MOSTRAR PANTALLA 404 DE CAMUFLAJE
  // ============================================================================
  if (!authChecking && !isAdmin) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-zinc-500 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">404</h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          Esta página no está disponible. El enlace que seguiste puede estar roto o haber sido eliminado.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </Link>

        {/* Desbloqueador con llave maestra para el Creador (F4) */}
        <div className="mt-16 pt-8 border-t border-white/5 max-w-xs w-full">
          <form onSubmit={handleMasterKeySubmit} className="space-y-2">
            <input
              type="password"
              placeholder="Llave maestra de creador..."
              value={masterKeyInput}
              onChange={(e) => setMasterKeyInput(e.target.value)}
              className="w-full text-center px-4 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
            />
            {keyError && <p className="text-[11px] text-red-400">{keyError}</p>}
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VISTA PRINCIPAL: PANEL DE CONTROL DE ADMINISTRADOR & DEVLAB
  // ============================================================================
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Toast de Notificación de Acción */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-2xl border border-white/20 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ENCABEZADO OFICIAL DE CREADOR & ADMIN */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Crown className="w-48 h-48 text-amber-500" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase">
              <Shield className="w-3.5 h-3.5" />
              <span>Consola Maestra de Creador</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>FicNation Admin Studio</span>
              <VerifiedBadge size="md" />
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl">
              Control centralizado de usuarios, verificación manual de perfiles, sanciones, notificaciones dirigidas y laboratorio de animación para el lector.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/15 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="mt-8 flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold rounded-t-2xl border-t border-x transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 border-b-transparent shadow-lg"
                : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios & Moderación</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold rounded-t-2xl border-t border-x transition-all cursor-pointer ${
              activeTab === "notifications"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 border-b-transparent shadow-lg"
                : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notificaciones & Anuncios</span>
          </button>

          <button
            onClick={() => setActiveTab("sandbox")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold rounded-t-2xl border-t border-x transition-all cursor-pointer ${
              activeTab === "sandbox"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 border-b-transparent shadow-lg"
                : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Dev Sandbox (Animaciones & Text FX)</span>
          </button>

          <button
            onClick={() => setActiveTab("stories")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold rounded-t-2xl border-t border-x transition-all cursor-pointer ${
              activeTab === "stories"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 border-b-transparent shadow-lg"
                : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Historias & Métricas</span>
          </button>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* PESTAÑA 1: GESTIÓN DE USUARIOS Y VERIFICACIÓN */}
      {/* ====================================================================== */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Buscador */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, @username o ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-zinc-900/80 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 shadow-inner"
              />
            </div>

            {/* Filtro rápido */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setUserFilter("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  userFilter === "all" ? "bg-white text-zinc-900 shadow-md" : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                Todos ({usersList.length})
              </button>
              <button
                onClick={() => setUserFilter("verified")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  userFilter === "verified" ? "bg-sky-500 text-white shadow-md" : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                Verificados
              </button>
              <button
                onClick={() => setUserFilter("banned")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  userFilter === "banned" ? "bg-red-500 text-white shadow-md" : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                Baneados ({getBannedUsers().length})
              </button>
            </div>
          </div>

          {/* TABLA DE USUARIOS */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 overflow-hidden shadow-xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-zinc-400 uppercase font-mono tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-5 py-4">Usuario</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4">Recursos</th>
                    <th className="px-5 py-4 text-right">Acciones de Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => {
                    const target = u.username || u.id;
                    const verified = isUserVerified(target);
                    const banStatus = isUserBanned(target);
                    const isMasterCreator = target.toLowerCase() === "f4" || target.toLowerCase() === "f4studios";

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                              <img
                                src={u.avatar_url || "/default-avatar.svg"}
                                alt={u.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-extrabold text-white flex items-center gap-1.5">
                                <span>{u.name || "Usuario"}</span>
                                {verified && <VerifiedBadge size="xs" />}
                                {isMasterCreator && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                                    CREADOR
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500 font-mono">@{u.username || u.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {banStatus.isBanned ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 font-bold text-[10px]">
                                <UserX className="w-3 h-3" />
                                Baneado
                              </span>
                            ) : verified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3" />
                                Verificado
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-[11px]">Estándar</span>
                            )}
                            {banStatus.record && (
                              <p className="text-[10px] text-zinc-500 italic max-w-xs truncate">
                                Causa: {banStatus.record.reason}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4 text-zinc-300 font-mono text-[11px]">
                            <span className="flex items-center gap-1" title="FicCoins">
                              <Coins className="w-3.5 h-3.5 text-amber-400" />
                              {(u.earned_coins || 0).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1" title="XP">
                              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                              {(u.xp || 0).toLocaleString()} XP
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Verificado */}
                            {!isMasterCreator && (
                              <button
                                onClick={() => handleToggleVerified(target)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                                  verified
                                    ? "bg-sky-500/10 text-sky-300 border-sky-500/30 hover:bg-sky-500/20"
                                    : "bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10"
                                }`}
                              >
                                {verified ? "Quitar Verificado" : "✓ Verificar"}
                              </button>
                            )}

                            {/* Inyección de Recursos */}
                            <button
                              onClick={() => handleGrantCoins(u.id, 100)}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                              title="Otorgar 100 FicCoins"
                            >
                              +100 Coins
                            </button>

                            {/* Baneo / Desbaneo */}
                            {!isMasterCreator && (
                              banStatus.isBanned ? (
                                <button
                                  onClick={() => handleUnban(target)}
                                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer"
                                >
                                  Desbanear
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenBanModal(u)}
                                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all cursor-pointer"
                                >
                                  Banear
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* PESTAÑA 2: NOTIFICACIONES & ANUNCIOS */}
      {/* ====================================================================== */}
      {activeTab === "notifications" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mensaje Directo a Usuario Específico */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Enviar Mensaje Directo Oficial</h3>
                <p className="text-xs text-zinc-400">El usuario recibirá un aviso con sello de administración.</p>
              </div>
            </div>

            <form onSubmit={handleSendDirectNotification} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Destinatario (ID o @username)</label>
                <input
                  type="text"
                  placeholder="ej. just_g o UUID del usuario"
                  value={notifRecipient}
                  onChange={(e) => setNotifRecipient(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-2xl bg-zinc-900/80 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Título del Mensaje</label>
                <input
                  type="text"
                  placeholder="ej. Felicitaciones por tu historia / Aviso de moderación"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-2xl bg-zinc-900/80 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Contenido del Aviso</label>
                <textarea
                  rows={4}
                  placeholder="Escribe el mensaje formal para el usuario..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-2xl bg-zinc-900/80 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Despachar Notificación Oficial</span>
              </button>
            </form>
          </div>

          {/* Banner de Emergencia / Anuncio Global */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Banner Global en Dashboard</h3>
                <p className="text-xs text-zinc-400">Muestra una barra flotante a todos los visitantes.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-xs font-bold text-white">Estado del Banner</p>
                  <p className="text-[11px] text-zinc-400">
                    {bannerConfig.isActive ? "Activo y visible para toda la comunidad" : "Desactivado"}
                  </p>
                </div>
                <button
                  onClick={() => setBannerConfig((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    bannerConfig.isActive
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-md"
                      : "bg-zinc-800 text-zinc-400 border-white/10"
                  }`}
                >
                  {bannerConfig.isActive ? "ACTIVO" : "INACTIVO"}
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Texto del Anuncio</label>
                <input
                  type="text"
                  placeholder="ej. Mantenimiento programado hoy a las 23:00 / ¡Gran Concurso de Escritura!"
                  value={bannerConfig.message}
                  onChange={(e) => setBannerConfig((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-2.5 text-xs rounded-2xl bg-zinc-900/80 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Texto del Botón</label>
                  <input
                    type="text"
                    placeholder="ej. Ver detalles"
                    value={bannerConfig.actionText || ""}
                    onChange={(e) => setBannerConfig((prev) => ({ ...prev, actionText: e.target.value }))}
                    className="w-full px-4 py-2 text-xs rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Enlace del Botón</label>
                  <input
                    type="text"
                    placeholder="/explorar o enlace externo"
                    value={bannerConfig.actionUrl || ""}
                    onChange={(e) => setBannerConfig((prev) => ({ ...prev, actionUrl: e.target.value }))}
                    className="w-full px-4 py-2 text-xs rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveBanner}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar y Publicar Banner</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* PESTAÑA 3: DEV SANDBOX (ANIMACIONES Y TEXT FX) */}
      {/* ====================================================================== */}
      {activeTab === "sandbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de Configuración de Efectos */}
          <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-zinc-950/60 p-6 space-y-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Laboratorio de Animaciones</h3>
                <p className="text-xs text-zinc-400">Prueba efectos antes de llevarlos al lector.</p>
              </div>
            </div>

            {/* Modo de Animación */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Modo de Aparición</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "fade", label: "Fade Scroll" },
                  { id: "typewriter", label: "Typewriter" },
                  { id: "cascade", label: "Cascada" },
                  { id: "none", label: "Estático" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSandboxAnimMode(m.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      sandboxAnimMode === m.id
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md"
                        : "bg-white/5 text-zinc-400 border-white/10 hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Velocidad */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-bold">Velocidad / Easing</span>
                <span className="text-purple-400 font-mono font-bold">{sandboxSpeed} ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={sandboxSpeed}
                onChange={(e) => setSandboxSpeed(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Tamaño de Fuente */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-bold">Tamaño de Fuente</span>
                <span className="text-purple-400 font-mono font-bold">{sandboxFontSize} px</span>
              </div>
              <input
                type="range"
                min="14"
                max="24"
                step="1"
                value={sandboxFontSize}
                onChange={(e) => setSandboxFontSize(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Tema de Prueba */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Tema del Lector</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "white", label: "Blanco", bg: "bg-white text-zinc-900" },
                  { id: "sepia", label: "Sepia", bg: "bg-[#fbf0d9] text-[#5f4b32]" },
                  { id: "dark", label: "Oscuro", bg: "bg-zinc-900 text-zinc-100" },
                  { id: "oled", label: "OLED", bg: "bg-black text-zinc-100" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSandboxTheme(t.id as any)}
                    className={`py-1.5 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                      sandboxTheme === t.id ? "ring-2 ring-purple-500" : "opacity-80 hover:opacity-100"
                    } ${t.bg}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reiniciar animación */}
            <button
              onClick={() => {
                setTypewriterProgress(0);
                const temp = sandboxAnimMode;
                setSandboxAnimMode("none");
                setTimeout(() => setSandboxAnimMode(temp), 50);
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Efecto</span>
            </button>
          </div>

          {/* Previsualizador en Vivo */}
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-zinc-950/60 p-6 sm:p-8 space-y-4 shadow-xl backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-zinc-500 font-mono ml-2">preview_reader_sandbox.tsx</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold uppercase">
                Modo: {sandboxAnimMode}
              </span>
            </div>

            {/* Lienzo del Lector Simulado */}
            <div
              className={`rounded-2xl p-8 min-h-[360px] max-h-[480px] overflow-y-auto transition-all shadow-inner ${
                sandboxTheme === "white"
                  ? "bg-white text-zinc-900 border border-zinc-200"
                  : sandboxTheme === "sepia"
                  ? "bg-[#fbf0d9] text-[#5f4b32] border border-[#ecd9b5]"
                  : sandboxTheme === "dark"
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
                  : "bg-black text-zinc-200 border border-zinc-800"
              }`}
              style={{ fontSize: `${sandboxFontSize}px`, lineHeight: "1.8" }}
            >
              {sandboxAnimMode === "typewriter" ? (
                <div className="font-serif">
                  {sandboxSampleText.slice(0, typewriterProgress)}
                  <span className="inline-block w-2 h-5 bg-purple-500 ml-1 animate-pulse" />
                </div>
              ) : sandboxAnimMode === "fade" ? (
                <div className="space-y-6 font-serif">
                  {sandboxSampleText.split("\n\n").map((par, i) => (
                    <p
                      key={i}
                      className="animate-fade-in transition-all duration-700 hover:translate-x-1"
                      style={{ animationDuration: `${sandboxSpeed}ms` }}
                    >
                      {par}
                    </p>
                  ))}
                </div>
              ) : sandboxAnimMode === "cascade" ? (
                <div className="space-y-6 font-serif">
                  {sandboxSampleText.split("\n\n").map((par, i) => (
                    <p
                      key={i}
                      className="animate-fade-in"
                      style={{ animationDelay: `${i * 300}ms` }}
                    >
                      {par}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="space-y-6 font-serif">
                  {sandboxSampleText.split("\n\n").map((par, i) => (
                    <p key={i}>{par}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Simulación en tiempo real del motor de renderizado de lectura.</span>
              <span className="font-mono">FicNation Engine v2.5</span>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* PESTAÑA 4: GESTIÓN DE HISTORIAS & MÉTRICAS */}
      {/* ====================================================================== */}
      {activeTab === "stories" && (
        <div className="space-y-6">
          {/* Modal de Edición de Métricas */}
          {editingStory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="max-w-md w-full rounded-3xl border border-white/20 bg-zinc-950 p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white">Editar Métricas de Obra</h3>
                  <button onClick={() => setEditingStory(null)} className="text-zinc-400 hover:text-white">
                    ✕
                  </button>
                </div>
                <p className="text-xs text-zinc-400 font-bold">{editingStory.title}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Vistas Únicas</label>
                    <input
                      type="number"
                      value={editViewsInput}
                      onChange={(e) => setEditViewsInput(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Estrellas / Votos</label>
                    <input
                      type="number"
                      value={editVotesInput}
                      onChange={(e) => setEditVotesInput(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setEditingStory(null)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveStoryStats}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md"
                  >
                    Guardar en Supabase
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Listado de Historias */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 overflow-hidden shadow-xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-zinc-400 uppercase font-mono tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-5 py-4">Historia</th>
                    <th className="px-5 py-4">Autor</th>
                    <th className="px-5 py-4">Métricas Reales</th>
                    <th className="px-5 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {storiesList.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                            <img src={s.cover_url} alt={s.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-extrabold text-white line-clamp-1">{s.title}</p>
                            <span className="text-[10px] text-zinc-500 font-mono">{s.genre || "Fantasía"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-zinc-400 font-semibold">
                        {s.profiles?.name || s.author_name || "Autor"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4 text-zinc-300 font-mono text-[11px]">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-zinc-400" />
                            {s.reads_count || 0}
                          </span>
                          <span className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {s.votes_count || 0}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingStory(s);
                            setEditViewsInput(Number(s.reads_count || 0));
                            setEditVotesInput(Number(s.votes_count || 0));
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 hover:text-white transition-all cursor-pointer"
                        >
                          Ajustar Métricas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE BANEO */}
      {isBanModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full rounded-3xl border border-red-500/30 bg-zinc-950 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-extrabold text-white">
                Suspender Cuenta de @{selectedUserForAction.username || selectedUserForAction.id}
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              El usuario no podrá acceder a la plataforma mientras la sanción esté activa.
            </p>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Motivo de la Suspensión</label>
              <textarea
                rows={3}
                placeholder="ej. Spam masivo en comentarios, contenido ofensivo..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 resize-none"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBanModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmBan}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md"
              >
                Confirmar Suspensión
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
