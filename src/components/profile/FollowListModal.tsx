"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  X,
  Users,
  UserCheck,
  UserPlus,
  Search,
  Loader2,
  Shield,
  ExternalLink,
} from "lucide-react";
import { FicImage } from "@/components/ui/FicImage";
import { useAuth } from "@/context/AuthContext";
import { usePresence } from "@/context/PresenceContext";
import {
  getFollowersList,
  getFollowingList,
  toggleFollowUser,
  checkIsFollowing,
  FollowUserItem,
} from "@/lib/followService";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  initialType?: "followers" | "following";
}

export function FollowListModal({
  isOpen,
  onClose,
  userId,
  userName = "Usuario",
  initialType = "followers",
}: FollowListModalProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialType);
  const [followers, setFollowers] = useState<FollowUserItem[]>([]);
  const [following, setFollowing] = useState<FollowUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);

  const { user } = useAuth();
  const { isUserOnline } = usePresence();

  // Sincronizar pestaña inicial al abrir
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
      setSearchQuery("");
    }
  }, [isOpen, initialType]);

  // Cargar datos al abrir o cambiar de usuario/pestaña
  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [followersData, followingData] = await Promise.all([
          getFollowersList(userId),
          getFollowingList(userId),
        ]);

        if (!isMounted) return;

        setFollowers(followersData);
        setFollowing(followingData);

        // Si el usuario actual está logueado, consultar a quiénes sigue ya
        if (user?.id) {
          const allUserIds = Array.from(
            new Set([...followersData, ...followingData].map((u) => u.id))
          );
          const checks = await Promise.all(
            allUserIds.map(async (targetId) => ({
              id: targetId,
              isFollowing: await checkIsFollowing(user.id, targetId),
            }))
          );

          const map: Record<string, boolean> = {};
          checks.forEach((c) => {
            map[c.id] = c.isFollowing;
          });
          setFollowingMap(map);
        }
      } catch {
        // Fallback en caso de error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, user?.id]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filtrar por búsqueda
  const currentList = activeTab === "followers" ? followers : following;
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase();
    return currentList.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q))
    );
  }, [currentList, searchQuery]);

  // Alternar seguir a un usuario desde el modal
  const handleToggleItem = async (targetUser: FollowUserItem) => {
    if (!user?.id || isTogglingId === targetUser.id || user.id === targetUser.id) return;

    setIsTogglingId(targetUser.id);
    const currentlyFollowing = !!followingMap[targetUser.id];

    // Actualización optimista
    setFollowingMap((prev) => ({
      ...prev,
      [targetUser.id]: !currentlyFollowing,
    }));

    try {
      const res = await toggleFollowUser({
        followerId: user.id,
        followingId: targetUser.id,
        actorName: user.name || "Usuario",
        actorAvatar: user.avatar,
      });

      setFollowingMap((prev) => ({
        ...prev,
        [targetUser.id]: res.isFollowing,
      }));
    } catch {
      // Revertir
      setFollowingMap((prev) => ({
        ...prev,
        [targetUser.id]: currentlyFollowing,
      }));
    } finally {
      setIsTogglingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in-scale">
      <div
        className="w-full max-w-lg rounded-3xl border fic-card shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] my-auto"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-primary)",
          color: "var(--text-primary)",
        }}
      >
        {/* Encabezado */}
        <div
          className="flex items-center justify-between px-6 pt-5 pb-4 border-b shrink-0"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl border shadow-sm shrink-0"
              style={{
                background: "var(--bg-subtle)",
                borderColor: "var(--border-primary)",
                color: "var(--text-badge)",
              }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Comunidad de {userName}
              </h2>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {followers.length} seguidores • {following.length} siguiendo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full border fic-card-secondary transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{ borderColor: "var(--border-primary)" }}
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Pestañas Segmentadas */}
        <div className="px-6 pt-4 shrink-0">
          <div
            className="grid grid-cols-2 gap-1 p-1 rounded-2xl border fic-card-secondary"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("followers")}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "followers"
                  ? "fic-btn-primary text-white shadow-md"
                  : "fic-card-secondary hover:opacity-90"
              }`}
              style={activeTab !== "followers" ? { color: "var(--text-secondary)" } : undefined}
            >
              <span>Seguidores ({followers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("following")}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "following"
                  ? "fic-btn-primary text-white shadow-md"
                  : "fic-card-secondary hover:opacity-90"
              }`}
              style={activeTab !== "following" ? { color: "var(--text-secondary)" } : undefined}
            >
              <span>Siguiendo ({following.length})</span>
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="px-6 pt-3 shrink-0">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar en ${activeTab === "followers" ? "seguidores" : "siguiendo"}...`}
              className="w-full rounded-xl border fic-input py-2 pl-8.5 pr-3 text-xs placeholder:opacity-40 focus:outline-none"
              style={{
                background: "var(--bg-input)",
                borderColor: "var(--border-input)",
                color: "var(--text-primary)",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs opacity-60 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Lista de Usuarios */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5 min-h-[220px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                Cargando miembros...
              </span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <Users className="w-10 h-10 opacity-30" style={{ color: "var(--text-muted)" }} />
              <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                {searchQuery
                  ? "No se encontraron usuarios que coincidan con la búsqueda."
                  : activeTab === "followers"
                  ? "Aún no tiene seguidores."
                  : "Aún no sigue a ningún usuario."}
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const online = isUserOnline(item.id) || isUserOnline(item.username);
              const isCurrentUser = user?.id === item.id;
              const isFollowedByMe = !!followingMap[item.id];
              const isToggling = isTogglingId === item.id;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl border fic-card-secondary transition-all hover:scale-[1.01]"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <Link
                    href={`/usuario?id=${item.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    {/* Avatar con presencia */}
                    <div className="relative shrink-0">
                      <div
                        className="relative h-11 w-11 rounded-2xl overflow-hidden border shadow-xs transition-transform group-hover:scale-105"
                        style={{ borderColor: "var(--border-primary)", background: "var(--bg-subtle)" }}
                      >
                        <FicImage src={item.avatar} alt={item.name} fallbackType="avatar" />
                      </div>
                      {online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />
                      )}
                    </div>

                    {/* Información */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate group-hover:underline" style={{ color: "var(--text-primary)" }}>
                          {item.name}
                        </span>
                        {item.level && (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded-full border shrink-0 flex items-center gap-0.5"
                            style={{
                              background: "var(--bg-subtle)",
                              borderColor: "var(--border-primary)",
                              color: "var(--text-badge)",
                            }}
                          >
                            <Shield className="w-2.5 h-2.5" />
                            Nv.{item.level}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono truncate" style={{ color: "var(--text-muted)" }}>
                        @{item.username}
                      </p>
                    </div>
                  </Link>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {user?.id && !isCurrentUser ? (
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleItem(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          isFollowedByMe
                            ? "fic-card-secondary border hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30"
                            : "fic-btn-primary text-white"
                        }`}
                        style={isFollowedByMe ? { borderColor: "var(--border-primary)" } : undefined}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isFollowedByMe ? (
                          <>
                            <UserCheck className="w-3 h-3 text-emerald-500" />
                            <span>Siguiendo</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>Seguir</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={`/usuario?id=${item.username}`}
                        onClick={onClose}
                        className="p-2 rounded-xl border fic-card-secondary hover:scale-105 transition-all text-xs font-semibold cursor-pointer flex items-center gap-1"
                        style={{ borderColor: "var(--border-primary)", color: "var(--text-muted)" }}
                        title="Ver perfil"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie del modal */}
        <div
          className="flex items-center justify-end px-6 py-3 border-t shrink-0 mt-auto"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer fic-card-secondary hover:opacity-90 active:scale-95"
            style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
