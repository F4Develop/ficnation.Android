"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Sparkles,
  Trophy,
  Coins,
  Settings,
  ChevronRight,
  CheckCircle2,
  Lock,
  UserCheck,
  Zap,
  Edit3,
  Share2,
  Camera,
  Layers,
  LogOut,
  Palette,
  Moon,
  Sun,
  Shield,
  Clock,
  Plus,
  ArrowRight,
  X,
  Check,
  Flame,
} from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, type MobileTab } from "@/components/mobile/MobileBottomNav";
import { useAuth, calculateReaderLevel } from "@/context/AuthContext";
import { useSettings, type AppTheme } from "@/context/SettingsContext";
import { ACHIEVEMENTS, type Achievement } from "@/data/achievements";
import { createClient } from "@/lib/supabase/client";

export interface MobileProfileProps {
  onSelectTab?: (tab: MobileTab) => void;
  hideNav?: boolean;
  hideHeader?: boolean;
}

interface UserStorySummary {
  id: string;
  title: string;
  genre: string;
  cover: string;
  chaptersCount: number;
  isPublished: boolean;
  reads: number;
}

export function MobileProfileView({
  onSelectTab,
  hideNav,
  hideHeader,
}: MobileProfileProps = {}) {
  const { user, addXp, updateProfile, logout } = useAuth();
  const { appTheme, setAppTheme, isLowSpecMode, toggleLowSpecMode, allowMatureContent, setAllowMatureContent, openSettings } = useSettings();

  const [activeTab, setActiveTab] = useState<"logros" | "obras" | "preferencias">("logros");
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);
  const [readCount, setReadCount] = useState(0);
  const [userStories, setUserStories] = useState<UserStorySummary[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(false);

  // Modal de Edición de Perfil
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Modal de Confirmación de Cierre de Sesión
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const userName = user?.name || user?.username || "Lector";
  const userHandle = user?.username
    ? `@${user.username}`
    : user?.email
    ? `@${user.email.split("@")[0]}`
    : "@lector";
  const userCoins = user?.coins ?? 0;
  const userXp = user?.xp ?? 0;
  const userBio = user?.bio || "Lector y creador en FicNation. Explorando mundos infinitos de historias.";
  const levelInfo = calculateReaderLevel(userXp);
  const progressPercent = levelInfo.nextLevelXp > 0 ? Math.round((userXp / levelInfo.nextLevelXp) * 100) : 100;

  // Cargar logros y datos desde Supabase / LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ficnation_claimed_achievements");
      if (stored) {
        setClaimedAchievements(JSON.parse(stored));
      }
    } catch {}

    async function loadStatsAndStories() {
      if (!user?.id) return;
      try {
        const supabase = createClient();

        // 1. Contador de biblioteca
        const { count } = await supabase
          .from("library_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        if (typeof count === "number") {
          setReadCount(count);
        }

        // 2. Historias del usuario
        setIsLoadingStories(true);
        const { data: dbStories } = await supabase
          .from("stories")
          .select(`
            id,
            title,
            genre,
            cover_url,
            reads_count,
            is_published,
            chapters (id, is_published)
          `)
          .eq("author_id", user.id)
          .order("created_at", { ascending: false });

        if (dbStories) {
          const mapped: UserStorySummary[] = dbStories.map((s: any) => {
            const ch = Array.isArray(s.chapters)
              ? s.chapters.filter((c: any) => c.is_published !== false)
              : [];
            return {
              id: s.id,
              title: s.title || "Sin título",
              genre: s.genre || "Fantasía",
              cover: s.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
              chaptersCount: ch.length,
              isPublished: Boolean(s.is_published && ch.length > 0),
              reads: s.reads_count ?? 0,
            };
          });
          setUserStories(mapped);
        }
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      } finally {
        setIsLoadingStories(false);
      }
    }

    loadStatsAndStories();
  }, [user?.id]);

  // Reclamar Logro
  const handleClaim = (ach: Achievement) => {
    if (claimedAchievements.includes(ach.id)) return;
    const next = [...claimedAchievements, ach.id];
    setClaimedAchievements(next);
    try {
      localStorage.setItem("ficnation_claimed_achievements", JSON.stringify(next));
    } catch {}
    if (addXp) {
      addXp(ach.rewardXp);
    }
  };

  // Abrir Modal de Edición
  const handleOpenEditModal = () => {
    setEditName(user?.name || "");
    setEditBio(user?.bio || "");
    setEditAvatar(user?.avatar || "");
    setIsEditModalOpen(true);
  };

  // Guardar Cambios de Perfil
  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSavingProfile(true);
    try {
      if (user?.id) {
        const supabase = createClient();
        await supabase
          .from("profiles")
          .update({
            name: editName.trim(),
            bio: editBio.trim(),
            avatar_url: editAvatar.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }
      if (updateProfile) {
        updateProfile({
          name: editName.trim(),
          bio: editBio.trim(),
          avatar: editAvatar.trim(),
        });
      }
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Compartir Perfil
  const handleShareProfile = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `Perfil de ${userName} en FicNation`,
        text: `¡Mira el perfil de ${userName} en FicNation!`,
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
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-24 select-none">
      
      {/* ════════════ 1. HEADER SUPERIOR ════════════ */}
      {!hideHeader && (
        <MobileHeader
          title="Mi Perfil"
          showBack={true}
          rightAction={
            <button
              onClick={handleOpenEditModal}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-300 hover:text-white active:scale-95 transition-all shadow-xs"
              aria-label="Editar Perfil"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          }
        />
      )}

      <main className="flex-1 space-y-5">

        {/* ════════════ 2. HERO: BANNER Y AVATAR SUPERPUESTO ════════════ */}
        <section className="relative">
          {/* Banner de Fondo Cósmico */}
          <div className="h-32 w-full bg-gradient-to-r from-purple-900 via-indigo-950 to-fuchsia-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.3)_0%,_transparent_70%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070a12] via-transparent to-black/20" />
            
            {/* Destellos ambientales */}
            <div className="absolute top-3 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-[10px] font-bold text-purple-300">
              <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
              <span>FicNation Club</span>
            </div>
          </div>

          {/* Tarjeta de Identidad Superpuesta */}
          <div className="px-4 -mt-12 relative z-10 space-y-3">
            <div className="flex items-end justify-between">
              
              {/* Avatar con marco cósmico y estado online */}
              <div className="relative group">
                <div className="w-22 h-22 rounded-3xl p-1 bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-indigo-500 shadow-xl shadow-purple-950/60">
                  <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#070a12] flex items-center justify-center">
                    <img
                      src={user?.avatar || "/logo.jpg"}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {/* Indicador de estado activo */}
                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-3 border-[#070a12] shadow-sm" />
              </div>

              {/* Botones Rápidos de Acción */}
              <div className="flex items-center gap-2 pb-1">
                <button
                  onClick={handleOpenEditModal}
                  className="px-3.5 py-2 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={handleShareProfile}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white active:scale-95 transition-all"
                  aria-label="Compartir perfil"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nombre, Usuario y Bio */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">{userName}</h1>
                <CheckCircle2 className="w-4 h-4 fill-purple-400 text-[#070a12] shrink-0" />
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Nivel {levelInfo.level}
                </span>
              </div>
              <p className="text-xs text-purple-300/80 font-semibold">{userHandle}</p>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm pt-0.5 font-normal">
                {userBio}
              </p>
            </div>
          </div>
        </section>

        {/* ════════════ 3. CONTADORES DE COMUNIDAD Y ESTADÍSTICAS ════════════ */}
        <section className="px-4">
          <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-lg text-center">
            <div className="space-y-0.5">
              <p className="text-sm font-black text-amber-400" suppressHydrationWarning>
                🪙 {userCoins.toLocaleString()}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">Monedas</p>
            </div>
            <div className="space-y-0.5 border-l border-white/5">
              <p className="text-sm font-black text-purple-400">{readCount}</p>
              <p className="text-[10px] font-semibold text-slate-400">Leídos</p>
            </div>
            <div className="space-y-0.5 border-l border-white/5">
              <p className="text-sm font-black text-indigo-400">{userStories.length}</p>
              <p className="text-[10px] font-semibold text-slate-400">Obras</p>
            </div>
            <div className="space-y-0.5 border-l border-white/5">
              <p className="text-sm font-black text-pink-400">{claimedAchievements.length}</p>
              <p className="text-[10px] font-semibold text-slate-400">Logros</p>
            </div>
          </div>
        </section>

        {/* ════════════ 4. HUD DE PROGRESO DE NIVEL CÓSMICO ════════════ */}
        <section className="px-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-purple-900/10 border border-purple-500/25 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">{levelInfo.levelTitle}</p>
                  <p className="text-[10px] text-purple-300">Rango de Lector</p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30">
                {userXp} / {levelInfo.nextLevelXp} XP
              </span>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </section>

        {/* ════════════ 5. PESTAÑAS PRINCIPALES DEL PERFIL ════════════ */}
        <section className="px-4 space-y-4">
          
          {/* Selector de Pestaña Segmentado */}
          <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab("logros")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "logros"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Logros</span>
            </button>
            <button
              onClick={() => setActiveTab("obras")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "obras"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Mis Obras</span>
              {userStories.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/15 text-[10px] flex items-center justify-center">
                  {userStories.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("preferencias")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "preferencias"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Ajustes</span>
            </button>
          </div>

          {/* ════════════ CONTENIDO DE PESTAÑA: LOGROS ════════════ */}
          {activeTab === "logros" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Recompensas desbloqueables</span>
                <span className="text-purple-300 font-extrabold">
                  {claimedAchievements.length} de {ACHIEVEMENTS.length} reclamados
                </span>
              </div>

              <div className="space-y-2.5">
                {ACHIEVEMENTS.map((ach) => {
                  const isClaimed = claimedAchievements.includes(ach.id);
                  const Icon = ach.icon;

                  return (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isClaimed
                          ? "bg-[#0d1222]/80 border-purple-500/30"
                          : "bg-white/[0.02] border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isClaimed
                              ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
                              : "bg-white/5 border border-white/10 text-slate-400"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white truncate">
                              {ach.name}
                            </h4>
                            {isClaimed && (
                              <span className="text-[10px] text-emerald-400 font-black">✓</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight line-clamp-1">
                            {ach.desc}
                          </p>
                          <p className="text-[10px] text-purple-300 font-semibold">
                            +{ach.rewardXp} XP de rango
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleClaim(ach)}
                        disabled={isClaimed}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 ${
                          isClaimed
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 cursor-default"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30"
                        }`}
                      >
                        {isClaimed ? "Completado" : "Reclamar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════ CONTENIDO DE PESTAÑA: MIS OBRAS ════════════ */}
          {activeTab === "obras" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Historias creadas por ti</span>
                <Link
                  href="/escribir"
                  className="text-purple-300 font-bold flex items-center gap-1 hover:text-purple-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear nueva</span>
                </Link>
              </div>

              {isLoadingStories ? (
                <div className="py-12 text-center text-xs text-purple-400 font-semibold">
                  Cargando tus obras...
                </div>
              ) : userStories.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center text-purple-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Aún no has escrito historias</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Comienza a redactar tu primera novela o borrador en el Taller de Escritura.
                    </p>
                  </div>
                  <Link
                    href="/escribir"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md shadow-purple-600/30 active:scale-95 transition-all"
                  >
                    <span>Ir a Escribir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userStories.map((story) => (
                    <div
                      key={story.id}
                      className="p-3 rounded-2xl bg-[#0d1222] border border-white/10 flex items-center gap-3"
                    >
                      <div className="w-14 h-18 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                        <img
                          src={story.cover}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                              story.isPublished
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {story.isPublished ? "Publicada" : "Borrador"}
                          </span>
                          <span className="text-[10px] text-slate-400">{story.genre}</span>
                        </div>

                        <h4 className="text-xs font-bold text-white truncate">{story.title}</h4>
                        
                        <p className="text-[11px] text-slate-400">
                          {story.chaptersCount} {story.chaptersCount === 1 ? "capítulo" : "capítulos"} • {story.reads} lecturas
                        </p>
                      </div>

                      <Link
                        href="/escribir"
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:text-white active:scale-95 transition-all shrink-0"
                      >
                        Gestionar
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════ CONTENIDO DE PESTAÑA: AJUSTES & PREFERENCIAS ════════════ */}
          {activeTab === "preferencias" && (
            <div className="space-y-4">
              
              {/* Selector de Tema */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Tema Visual de la App</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {themesList.map((t) => {
                    const isSelected = appTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setAppTheme(t.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all active:scale-95 ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm"
                            : "bg-white/5 border-white/5 text-slate-300 hover:text-white"
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-purple-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opciones de la Cuenta */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <span className="text-xs font-bold text-white">Opciones de Lectura</span>

                {/* Switch Contenido Maduro */}
                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-200">Contenido +18 / Maduro</p>
                    <p className="text-[10px] text-slate-400">Mostrar historias con etiquetas NSFW</p>
                  </div>
                  <button
                    onClick={() => setAllowMatureContent(!allowMatureContent)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      allowMatureContent ? "bg-purple-600" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        allowMatureContent ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Switch Rendimiento Bajo */}
                <div className="flex items-center justify-between py-1 border-t border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-200">Modo Ahorro de Recursos</p>
                    <p className="text-[10px] text-slate-400">Desactiva efectos visuales pesados</p>
                  </div>
                  <button
                    onClick={toggleLowSpecMode}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      isLowSpecMode ? "bg-purple-600" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        isLowSpecMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Botón de Cerrar Sesión */}
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>

            </div>
          )}

        </section>

      </main>

      {/* ════════════ MODAL: EDITAR PERFIL ════════════ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d1222] border border-purple-500/30 rounded-3xl p-5 space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Editar Perfil</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Nombre de pantalla</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  placeholder="Tu nombre"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Biografía</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Escribe algo sobre ti..."
                />
              </div>

              {/* URL Avatar */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">URL del Avatar / Foto</label>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  placeholder="https://ejemplo.com/avatar.jpg"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile || !editName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50 transition-all shadow-md shadow-purple-600/30"
              >
                {isSavingProfile ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ MODAL: CONFIRMACIÓN DE CERRAR SESIÓN ════════════ */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0d1222] border border-rose-500/30 rounded-3xl p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 mx-auto flex items-center justify-center text-rose-400">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">¿Cerrar Sesión?</h3>
              <p className="text-xs text-slate-400">
                Tendrás que volver a iniciar sesión para acceder a tus borradores y biblioteca guardada.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  logout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all"
              >
                Sí, Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ 6. NAVEGACIÓN INFERIOR (SIN PESTAÑA PERFIL, YA QUE ESTÁ ARRIBA) ════════════ */}
      {!hideNav && <MobileBottomNav onSelectTab={onSelectTab} />}
    </div>
  );
}

export default function MobileProfilePage() {
  return <MobileProfileView />;
}
