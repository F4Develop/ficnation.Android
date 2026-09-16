"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  Menu,
  X,
  Sparkles,
  Compass,
  PenTool,
  User,
  Bookmark,
  LogOut,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap,
  Sliders,
  Bell,
  CheckCheck,
  Inbox,
  Clock,
  Layers,
  MessageSquare,
  Star,
  UserPlus,
  BookmarkCheck,
  Palette,
  Coins,
  Crown,
  Backpack,
  Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { FicImage } from "@/components/ui/FicImage";
import { UserAvatarWithFrame } from "@/components/ui/UserAvatarWithFrame";
import { getUserEquippedCosmetics } from "@/lib/inventoryStorage";
import { CATALOG_ITEMS } from "@/types/inventory";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { checkIsAdmin } from "@/lib/adminAuth";
import { NavbarSearch } from "@/components/layout/NavbarSearch";
import { createClient } from "@/lib/supabase/client";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type FicNotification,
} from "@/lib/notifications";

function formatTimeAgo(isoString: string): string {
  try {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return "Ahora mismo";
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return new Date(isoString).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  } catch {
    return "Reciente";
  }
}

const getThemeBadge = (t: string) => {
  switch (t) {
    case "light": return { label: "Claro", icon: "☀️" };
    case "sepia": return { label: "Sepia", icon: "📜" };
    case "neon": return { label: "Neón", icon: "⚡" };
    default: return { label: "Oscuro", icon: "🌌" };
  }
};

const THEMES_ORDER: ("dark" | "light" | "sepia" | "neon")[] = ["dark", "light", "sepia", "neon"];

export function Navbar() {
  const { user, isAuthenticated, isLoaded, logout } = useAuth();
  const { isLowSpecMode, toggleLowSpecMode, openSettings, appTheme, setAppTheme, t } = useSettings();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<FicNotification[]>([]);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar notificaciones reales del usuario conectado
  useEffect(() => {
    let isSubscribed = true;

    async function loadNotifs() {
      if (user?.id) {
        const notifs = await getNotifications(user.id);
        if (isSubscribed) setNotifications(notifs);
      } else {
        if (isSubscribed) setNotifications([]);
      }
    }

    loadNotifs();

    // Escuchar notificaciones en vivo si Supabase realtime está disponible
    if (user?.id) {
      try {
        const supabase = createClient();
        const channel = supabase
          .channel(`user_notifs_${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${user.id}`,
            },
            (payload) => {
              if (payload.new) {
                setNotifications((prev) => [payload.new as FicNotification, ...prev]);
              }
            }
          )
          .subscribe();

        return () => {
          isSubscribed = false;
          supabase.removeChannel(channel);
        };
      } catch {}
    }

    return () => {
      isSubscribed = false;
    };
  }, [user?.id]);

  // Cerrar dropdowns al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsAsRead(user.id);
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user?.id) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await markNotificationAsRead(id, user.id);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = notifFilter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const handleLogout = async () => {
    await logout();
    setIsProfileDropdownOpen(false);
    router.push("/");
  };

  const isUserLoggedIn = mounted && isLoaded && isAuthenticated && user;

  const xpCurrent = user?.xp ?? 0;
  const xpNext = user?.nextLevelXp || 500;
  const xpPercent = xpNext > 0 ? Math.round((xpCurrent / xpNext) * 100) : 0;

  return (
    <header suppressHydrationWarning className="sticky top-0 z-50 w-full border-b fic-header transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-3 sm:gap-6">
        
        {/* ════════════ 1. LADO IZQUIERDO: LOGO + BOTÓN EXPLORAR ════════════ */}
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 shrink-0">
          <Link href={isUserLoggedIn ? "/dashboard" : "/"} className="group flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden transition-transform group-hover:scale-105 group-hover:rotate-3 shrink-0 shadow-md border border-purple-500/20"
              style={{ background: "#ffffff", boxShadow: "0 0 12px rgba(168, 85, 247, 0.25)" }}
            >
              <img
                src="/logo.jpg"
                alt="FicNation Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                Fic<span className="font-black" style={{ color: "var(--logo-text-accent)" }}>Nation</span>
                <Sparkles className="h-3.5 w-3.5 animate-pulse" style={{ color: "var(--logo-sparkle)" }} />
              </span>
              <span className="text-[10px] uppercase tracking-widest font-medium -mt-1" style={{ color: "var(--text-muted)" }}>
                {t("nav.logoSubtitle")}
              </span>
            </div>
          </Link>

          {/* Botón Explorar a la izquierda con buen margen de separación */}
          <Link
            href="/explorar"
            className="hidden md:flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold border transition-all hover:scale-105 shadow-xs"
            style={{
              color: "var(--nav-btn-explore-text)",
              background: "var(--nav-btn-explore-bg)",
              borderColor: "var(--nav-btn-explore-border, var(--border-primary))",
            }}
          >
            <Compass className="h-4 w-4" style={{ color: "var(--nav-btn-explore-icon)" }} />
            <span>{t("nav.explore")}</span>
          </Link>

          {/* Botón Evento */}
          <Link
            href="/eventos"
            className="hidden md:flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border transition-all hover:scale-105 shadow-xs"
            style={{
              background: "var(--nav-btn-explore-bg)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
            title={t("nav.event")}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>{t("nav.event")}</span>
          </Link>
        </div>

        {/* ════════════ 2. EN EL MEDIO: BARRA DE BÚSQUEDA / EXPLORACIÓN ════════════ */}
        <div className="hidden sm:flex flex-1 max-w-lg mx-2 sm:mx-4 lg:mx-6">
          <NavbarSearch />
        </div>

        {/* ════════════ 3. LADO DERECHO: BOTÓN ESCRIBIR + NOTIFICACIONES + PERFIL ════════════ */}
        <div suppressHydrationWarning className="hidden sm:flex items-center gap-3 shrink-0">
          {/* Botón Escribir al lado de las notificaciones */}
          <Link
            href="/escribir"
            className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all hover:scale-105 shadow-xs"
            style={{
              background: "var(--nav-btn-write-bg)",
              borderColor: "var(--nav-btn-write-border)",
              color: "var(--nav-btn-write-text)",
            }}
          >
            <PenTool className="h-3.5 w-3.5" />
            <span>{t("nav.write")}</span>
          </Link>

          {isUserLoggedIn ? (
            <>
              {/* ════════════ BOTÓN DE NOTIFICACIONES ════════════ */}
              <div className="relative" ref={notifDropdownRef}>
                <button
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    setIsProfileDropdownOpen(false);
                  }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-all cursor-pointer fic-card hover:scale-105 ${
                    isNotificationsOpen
                      ? "ring-2 ring-blue-500/30"
                      : ""
                  }`}
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
                  title="Notificaciones"
                  aria-label="Ver notificaciones"
                >
                  <Bell className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                  
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                  )}
                </button>

                {/* DROPDOWN DE NOTIFICACIONES */}
                {isNotificationsOpen && (
                  <div
                    className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl border fic-card p-4 sm:p-5 shadow-2xl backdrop-blur-2xl animate-fade-in-scale z-50 overflow-hidden"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                  >
                    
                    {/* Header del Dropdown */}
                    <div className="flex items-center justify-between pb-3 border-b relative z-10" style={{ borderColor: "var(--border-primary)" }}>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-xl flex items-center justify-center border shadow-xs" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-sm font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>{t("nav.notifications")}</h4>
                        {unreadCount > 0 && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border"
                            style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer hover:opacity-80"
                          style={{ color: "var(--text-badge)" }}
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{t("nav.markAllAsRead")}</span>
                        </button>
                      )}
                    </div>

                    {/* Filtros: Todas / No Leídas */}
                    <div className="flex items-center gap-1 py-2 border-b relative z-10 text-xs" style={{ borderColor: "var(--border-primary)" }}>
                      <button
                        onClick={() => setNotifFilter("all")}
                        className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                          notifFilter === "all"
                            ? "fic-btn-primary shadow-xs"
                            : "hover:opacity-75"
                        }`}
                        style={notifFilter !== "all" ? { color: "var(--text-muted)" } : {}}
                      >
                        {t("nav.all")} ({notifications.length})
                      </button>
                      <button
                        onClick={() => setNotifFilter("unread")}
                        className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                          notifFilter === "unread"
                            ? "fic-btn-primary shadow-xs"
                            : "hover:opacity-75"
                        }`}
                        style={notifFilter !== "unread" ? { color: "var(--text-muted)" } : {}}
                      >
                        {t("nav.unread")} ({unreadCount})
                      </button>
                    </div>

                    {/* Lista de Notificaciones Dinámicas */}
                    <div className="py-2 space-y-2 max-h-80 overflow-y-auto pr-1 relative z-10">
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((n) => {
                          const targetHref =
                            n.type === "follow"
                              ? `/usuario?id=${n.actor_id}`
                              : n.type === "comment" && n.story_id
                              ? `/leer?storyId=${n.story_id}&chapter=${n.chapter_number || 1}`
                              : n.story_id
                              ? `/historia?id=${n.story_id}`
                              : "/avatar";

                          return (
                            <Link
                              key={n.id}
                              href={targetHref}
                              onClick={() => {
                                handleMarkAsRead(n.id);
                                setIsNotificationsOpen(false);
                              }}
                              className={`flex items-start gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer group/notif ${
                                !n.read
                                  ? "shadow-xs"
                                  : "opacity-85 hover:opacity-100"
                              }`}
                              style={{
                                background: !n.read ? "var(--bg-card)" : "var(--bg-card-secondary)",
                                borderColor: !n.read ? "var(--btn-cta-bg)" : "var(--border-primary)",
                              }}
                            >
                              {/* Avatar con insignia de tipo */}
                              <div className="relative shrink-0 mt-0.5">
                                <div className="h-9 w-9 rounded-xl overflow-hidden border shadow-xs" style={{ borderColor: "var(--border-primary)" }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={n.actor_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                                    alt={n.actor_name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div
                                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center border shadow-xs"
                                  style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
                                >
                                  {n.type === "follow" && <UserPlus className="w-2.5 h-2.5 text-emerald-500" />}
                                  {n.type === "vote" && <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                                  {n.type === "comment" && <MessageSquare className="w-2.5 h-2.5 text-blue-500" />}
                                  {n.type === "library" && <BookmarkCheck className="w-2.5 h-2.5 text-emerald-500" />}
                                </div>
                              </div>

                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-badge)" }}>
                                    {n.type === "follow" && "Nuevo Seguidor"}
                                    {n.type === "vote" && "Estrella en Fic"}
                                    {n.type === "comment" && "Comentario en Fic"}
                                    {n.type === "library" && "Guardado en Biblioteca"}
                                  </span>
                                  {!n.read && (
                                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: "var(--btn-cta-bg)" }} />
                                  )}
                                </div>

                                <p className="text-xs leading-snug font-medium" style={{ color: "var(--text-primary)" }}>
                                  {n.message}
                                </p>

                                <div className="flex items-center gap-1 text-[10px] font-mono pt-0.5" style={{ color: "var(--text-muted)" }}>
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{formatTimeAgo(n.created_at)}</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center space-y-2">
                          <div className="h-10 w-10 mx-auto rounded-full border flex items-center justify-center shadow-xs" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-muted)" }}>
                            <Inbox className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>No tienes notificaciones</p>
                          <p className="text-[10px] max-w-[220px] mx-auto" style={{ color: "var(--text-muted)" }}>
                            Te avisaremos cuando alguien te siga, comente, vote o guarde tu historia.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer del Dropdown */}
                    <div className="pt-2 border-t text-center relative z-10" style={{ borderColor: "var(--border-primary)" }}>
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-[11px] font-semibold transition-colors cursor-pointer hover:opacity-80"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Cerrar panel
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* ════════════ BOTÓN DE PERFIL INTERACTIVO ════════════ */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    setIsNotificationsOpen(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-full border p-1 pr-3 transition-all cursor-pointer fic-card hover:scale-105 ${
                    isProfileDropdownOpen
                      ? "ring-2 ring-blue-500/30"
                      : ""
                  }`}
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
                >
                  <UserAvatarWithFrame
                    src={user.avatar}
                    alt={user.name}
                    size="sm"
                    userId={user.id}
                  />
                  <span className="text-xs font-bold hidden md:inline-flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                    <span>{user.name}</span>
                    <VerifiedBadge size="xs" variant={checkIsAdmin(user) ? "creator" : "verified"} />
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ color: "var(--text-muted)" }} />
                </button>

                {/* MENÚ DESPLEGABLE DE PERFIL (Compacto, Moderno y Proporcional) */}
                {isProfileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 rounded-2xl border fic-card p-3 shadow-2xl backdrop-blur-2xl animate-fade-in-scale z-50 max-h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                  >
                    {/* 1. Encabezado Horizontal Compacto */}
                    <div className="p-2.5 rounded-xl fic-card-secondary border" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          <UserAvatarWithFrame
                            src={user.avatar}
                            alt={user.name}
                            size="md"
                            userId={user.id}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <h3 className="text-xs font-extrabold tracking-tight truncate" style={{ color: "var(--text-primary)" }}>
                              {user.name}
                            </h3>
                            <VerifiedBadge size="xs" variant={checkIsAdmin(user) ? "creator" : "verified"} />
                          </div>
                          <p className="text-[11px] font-mono truncate" style={{ color: "var(--text-muted)" }}>
                            @{user.username}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md font-mono border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}>
                              Nv. {user.level} • {user.levelTitle}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Barra XP y Billetera en formato compacto */}
                      <div className="mt-2.5 pt-2 border-t space-y-1.5" style={{ borderColor: "var(--border-primary)" }}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-medium" style={{ color: "var(--text-muted)" }}>
                            XP {xpCurrent}/{xpNext}
                          </span>
                          <span className="font-mono font-bold" style={{ color: "var(--text-badge)" }}>
                            {xpPercent}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--reading-progress-track)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, xpPercent))}%`, background: "var(--reading-progress-fill)" }}
                          />
                        </div>

                        {/* Fila de FicCoins */}
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          <span className="font-bold flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            <span>{t("nav.wallet")}:</span>
                          </span>
                          <span className="font-mono font-black" style={{ color: "var(--text-badge)" }}>
                            {(user.coins ?? 0).toLocaleString()} FicCoins
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Enlaces Rápidos y Navegación (Filas limpias y proporcionadas) */}
                    <div className="py-2 space-y-0.5 relative z-10 text-xs">
                      {/* Mi Perfil (Página dedicada al perfil/avatar) */}
                      <Link
                        href="/avatar"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center justify-between rounded-xl px-2.5 py-2 transition-all hover:bg-white/5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("nav.myProfile")}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ color: "var(--text-muted)" }} />
                      </Link>

                      {/* Ver Perfil Público */}
                      <Link
                        href={`/usuario?id=${user.id}`}
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center justify-between rounded-xl px-2.5 py-2 transition-all hover:bg-white/5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Eye className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Ver Perfil Público</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ color: "var(--text-muted)" }} />
                      </Link>

                      {/* Mi Inventario */}
                      <Link
                        href="/inventario"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center justify-between rounded-xl px-2.5 py-2 transition-all hover:bg-white/5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Backpack className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("nav.myInventory")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300">
                            {t("nav.newBadge")}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ color: "var(--text-muted)" }} />
                        </div>
                      </Link>

                      {/* Mi Biblioteca */}
                      <Link
                        href="/biblioteca"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center justify-between rounded-xl px-2.5 py-2 transition-all hover:bg-white/5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bookmark className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("nav.myLibrary")}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ color: "var(--text-muted)" }} />
                      </Link>

                      {/* Divisor sutil */}
                      <div className="my-1 border-t" style={{ borderColor: "var(--border-primary)" }} />

                      {/* Selector Rápido de Tema */}
                      <button
                        onClick={() => {
                          const idx = THEMES_ORDER.indexOf(appTheme as any);
                          const nextTheme = THEMES_ORDER[idx >= 0 ? (idx + 1) % THEMES_ORDER.length : 0];
                          setAppTheme(nextTheme);
                        }}
                        className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 transition-all hover:bg-white/5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Palette className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("nav.visualTheme")}</span>
                        </div>
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all"
                          style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                        >
                          <span>{getThemeBadge(appTheme).icon}</span>
                          <span>{getThemeBadge(appTheme).label}</span>
                        </span>
                      </button>

                      {/* Ajustes de Plataforma */}
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          openSettings();
                        }}
                        className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 transition-all hover:bg-white/5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sliders className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("nav.settings")}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ color: "var(--text-muted)" }} />
                      </button>

                      {/* Panel de Creador (Exclusivo Administrador) */}
                      {checkIsAdmin(user) && (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center justify-between rounded-xl px-2.5 py-2 transition-all border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Crown className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-amber-300">{t("nav.creatorPanel")}</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-mono font-bold">
                            ADMIN
                          </span>
                        </Link>
                      )}
                    </div>

                    {/* 3. Botón de Cerrar Sesión Compacto */}
                    <div className="pt-1.5 border-t relative z-10" style={{ borderColor: "var(--border-primary)" }}>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-red-400"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>{t("nav.logout")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Desconectado */
            <>
              {/* Botón rápido de Ajustes / Rendimiento para usuarios no logueados también */}
              <button
                onClick={openSettings}
                className="p-2 rounded-full border fic-card hover:scale-105 transition-all cursor-pointer"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
                title={t("nav.settings")}
              >
                <Sliders className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>

              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="relative inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-95 fic-btn-primary"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-xl p-2 border transition-colors fic-card cursor-pointer"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
            aria-label="Abrir menú"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div suppressHydrationWarning className="sm:hidden border-b fic-header px-4 pt-3 pb-6 space-y-4 animate-fade-in-scale" style={{ borderColor: "var(--border-primary)" }}>
          <div className="relative w-full">
            <NavbarSearch isMobile onSelectResult={() => setIsMobileMenuOpen(false)} />
          </div>

          {isUserLoggedIn ? (
            <div className="pt-2 border-t space-y-2" style={{ borderColor: "var(--border-primary)" }}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border fic-card-secondary" style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}>
                <div className="relative h-10 w-10 rounded-xl overflow-hidden border shadow-xs shrink-0" style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{user.username} • Nivel {user.level}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsNotificationsOpen(true);
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium border fic-card-secondary cursor-pointer"
                style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="h-4 w-4" style={{ color: "var(--text-badge)" }} />
                  <span style={{ color: "var(--text-primary)" }}>Notificaciones</span>
                </div>
                {unreadCount > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border"
                    style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                  >
                    {unreadCount} nuevas
                  </span>
                )}
              </button>

              <Link
                href="/avatar"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium border fic-card-secondary"
                style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}
              >
                <User className="h-4 w-4" style={{ color: "var(--text-badge)" }} />
                <span style={{ color: "var(--text-primary)" }}>Mi Perfil</span>
              </Link>
              {user?.id && (
                <Link
                  href={`/usuario?id=${user.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium border fic-card-secondary"
                  style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}
                >
                  <Eye className="h-4 w-4 text-cyan-400" />
                  <span style={{ color: "var(--text-primary)" }}>Ver Perfil Público</span>
                </Link>
              )}
              <Link
                href="/biblioteca"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium border fic-card-secondary"
                style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}
              >
                <Bookmark className="h-4 w-4" style={{ color: "var(--text-badge)" }} />
                <span style={{ color: "var(--text-primary)" }}>Mi Biblioteca</span>
              </Link>
              <Link
                href="/inventario"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium border fic-card-secondary"
                style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}
              >
                <Backpack className="h-4 w-4 text-purple-400" />
                <span style={{ color: "var(--text-primary)" }}>Mi Inventario & Equipamiento</span>
              </Link>
              <Link
                href="/eventos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold border border-purple-500/40 bg-purple-500/10 text-purple-300"
              >
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span style={{ color: "var(--text-primary)" }}>Evento</span>
              </Link>
              <Link
                href="/explorar"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium border fic-card-secondary"
                style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}
              >
                <Compass className="h-4 w-4" style={{ color: "var(--text-badge)" }} />
                <span style={{ color: "var(--text-primary)" }}>Explorar Historias</span>
              </Link>
              <Link
                href="/escribir"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium border fic-card-secondary"
                style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}
              >
                <PenTool className="h-4 w-4" style={{ color: "var(--text-badge)" }} />
                <span style={{ color: "var(--text-primary)" }}>Taller de Escritura</span>
              </Link>

              {/* Botón Switcher Directo de Tema Visual en Móvil */}
              <button
                onClick={() => {
                  const idx = THEMES_ORDER.indexOf(appTheme as any);
                  const nextTheme = THEMES_ORDER[idx >= 0 ? (idx + 1) % THEMES_ORDER.length : 0];
                  setAppTheme(nextTheme);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border fic-card-secondary cursor-pointer"
                style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="h-4 w-4" style={{ color: "var(--text-badge)" }} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Tema:</span>
                    <span
                      className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                      style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                    >
                      <span>{getThemeBadge(appTheme).icon}</span>
                      <span>{getThemeBadge(appTheme).label}</span>
                    </span>
                  </div>
                </div>
                
                <div
                  className="h-5 w-9 rounded-full p-0.5 flex items-center transition-all border"
                  style={{
                    background: appTheme === "light" ? "var(--btn-cta-bg)" : "var(--bg-subtle)",
                    borderColor: "var(--border-primary)",
                    justifyContent: appTheme === "light" ? "flex-end" : "flex-start",
                  }}
                >
                  <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                </div>
              </button>

              {/* Botón Ajustes en Móvil */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openSettings();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border fic-card-secondary cursor-pointer"
                style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)" }}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-4 w-4" style={{ color: "var(--text-badge)" }} />
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Ajustes & Rendimiento</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" style={{ color: "var(--text-muted)" }} />
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border transition-all hover:opacity-90 cursor-pointer"
                style={{
                  background: "var(--logout-bg)",
                  borderColor: "var(--logout-border)",
                  color: "var(--logout-text)",
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t flex flex-col gap-2" style={{ borderColor: "var(--border-primary)" }}>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center rounded-xl border fic-card-secondary py-2.5 text-sm font-medium"
                style={{ background: "var(--bg-card-secondary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center rounded-xl py-2.5 text-sm font-semibold shadow-md fic-btn-primary"
              >
                Crear Cuenta
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
