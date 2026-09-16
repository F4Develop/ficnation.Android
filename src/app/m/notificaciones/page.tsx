"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Sparkles,
  BookOpen,
  Heart,
  Flame,
  CheckCheck,
  Clock,
  MessageSquare,
  UserPlus,
  Star,
  RefreshCw,
  Gift,
  ArrowRight,
} from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, type MobileTab } from "@/components/mobile/MobileBottomNav";
import { useAuth } from "@/context/AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendNotification,
  type FicNotification,
} from "@/lib/notifications";

export interface MobileNotificationsProps {
  onSelectTab?: (tab: MobileTab) => void;
  hideNav?: boolean;
  hideHeader?: boolean;
}

export function MobileNotificationsView({
  onSelectTab,
  hideNav,
  hideHeader,
}: MobileNotificationsProps = {}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<FicNotification[]>([]);
  const [filter, setFilter] = useState<"todas" | "sin_leer" | "capitulos" | "social">("todas");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cargar notificaciones reales desde la base de datos Supabase
  const loadUserNotifications = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getNotifications(user.id);

      // Si es un usuario nuevo y no tiene notificaciones, registrar la bienvenida en BD
      if (data.length === 0) {
        const welcome = await sendNotification({
          recipientId: user.id,
          actor: {
            id: "system",
            name: "FicNation Sistema",
            avatar: "/logo.jpg",
          },
          type: "admin_announcement",
          customMessage: "¡Bienvenido a FicNation Móvil! Explora miles de historias, sube tus capítulos y conéctate con otros autores y lectores.",
        });
        if (welcome) {
          setNotifications([welcome]);
          setIsLoading(false);
          return;
        }
      }

      setNotifications(data);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserNotifications();
  }, [user?.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUserNotifications();
  };

  // Marcar una como leída
  const handleItemClick = async (notif: FicNotification) => {
    if (!notif.read && user?.id) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      await markNotificationAsRead(notif.id, user.id);
    }
  };

  // Marcar todas como leídas
  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsAsRead(user.id);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredList = notifications.filter((n) => {
    if (filter === "sin_leer") return !n.read;
    if (filter === "capitulos") return n.type === "vote" || Boolean(n.chapter_number);
    if (filter === "social") return n.type === "follow" || n.type === "comment" || n.type === "tip";
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "vote":
        return { icon: Star, color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" };
      case "comment":
        return { icon: MessageSquare, color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/30" };
      case "follow":
        return { icon: UserPlus, color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30" };
      case "library":
        return { icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" };
      case "tip":
        return { icon: Gift, color: "text-pink-400", bg: "bg-pink-500/15 border-pink-500/30" };
      default:
        return { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30" };
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return "Ahora";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h`;
      return `${Math.floor(diffSec / 86400)} d`;
    } catch {
      return "Reciente";
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-24 select-none">
      
      {/* ════════════ 1. CABECERA ════════════ */}
      {!hideHeader && (
        <MobileHeader
          title="Notificaciones"
          showBack={true}
          rightAction={
            <button
              onClick={handleRefresh}
              className={`w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all ${
                isRefreshing ? "animate-spin text-purple-400" : ""
              }`}
              aria-label="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          }
        />
      )}

      <main className="flex-1 px-4 py-4 space-y-4 max-w-md mx-auto w-full">
        
        {/* Filtros de Pestaña y Botón Marcar Leídas */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
            <button
              onClick={() => setFilter("todas")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "todas"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter("sin_leer")}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                filter === "sin_leer"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Sin leer</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-pink-500 text-[10px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("capitulos")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "capitulos"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Capítulos
            </button>
            <button
              onClick={() => setFilter("social")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "social"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Social
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1 active:scale-95 transition-all shrink-0 px-2 py-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Leídas</span>
            </button>
          )}
        </div>

        {/* Listado de Notificaciones desde Base de Datos */}
        {isLoading ? (
          <div className="py-20 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">Cargando tus notificaciones...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-2xl bg-white/[0.02] border border-white/5 p-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center text-purple-400">
              <Bell className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Bandeja al día</p>
              <p className="text-xs text-slate-400">
                No tienes notificaciones en esta sección en este momento.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredList.map((notif) => {
              const iconCfg = getNotifIcon(notif.type);
              const Icon = iconCfg.icon;
              const link = notif.story_id
                ? `/historia/${notif.story_id}`
                : notif.actor_id && notif.actor_id !== "system"
                ? `/perfil`
                : "/dashboard";

              return (
                <Link
                  key={notif.id}
                  href={link}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 active:scale-[0.98] ${
                    notif.read
                      ? "bg-[#0b0f19]/70 border-white/5 opacity-80"
                      : "bg-[#0d1222] border-purple-500/30 shadow-md shadow-purple-950/40"
                  }`}
                >
                  {/* Icono temático de la notificación */}
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconCfg.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${iconCfg.color}`} />
                  </div>

                  {/* Contenido textual */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs font-bold truncate ${
                          notif.read ? "text-slate-300" : "text-white"
                        }`}
                      >
                        {notif.actor_name}
                      </p>
                      <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1 font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2 font-normal">
                      {notif.message}
                    </p>

                    {notif.story_title && (
                      <span className="inline-block text-[10px] font-bold text-purple-400 truncate max-w-full">
                        📖 {notif.story_title}
                      </span>
                    )}
                  </div>

                  {/* Indicador de no leído */}
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 self-center shadow-xs shadow-purple-400" />
                  )}
                </Link>
              );
            })}
          </div>
        )}

      </main>

      {/* ════════════ 3. NAVEGACIÓN INFERIOR ════════════ */}
      {!hideNav && (
        <MobileBottomNav activeTab="notifications" onSelectTab={onSelectTab} />
      )}

    </div>
  );
}

export default function MobileNotificationsPage() {
  return <MobileNotificationsView />;
}
