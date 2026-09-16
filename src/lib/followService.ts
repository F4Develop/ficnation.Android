import { createClient } from "@/lib/supabase/client";
import { sendNotification } from "@/lib/notifications";

export interface FollowUserItem {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  level?: number;
  levelTitle?: string;
}

const LOCAL_FOLLOWS_KEY_PREFIX = "ficnation_following_";

/**
 * Obtiene los IDs seguidos localmente por un usuario (para respuesta instantánea)
 */
function getLocalFollowing(followerId: string): string[] {
  if (typeof window === "undefined" || !followerId) return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_FOLLOWS_KEY_PREFIX}${followerId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda los IDs seguidos localmente
 */
function setLocalFollowing(followerId: string, list: string[]): void {
  if (typeof window === "undefined" || !followerId) return;
  try {
    localStorage.setItem(`${LOCAL_FOLLOWS_KEY_PREFIX}${followerId}`, JSON.stringify(list));
  } catch {}
}

/**
 * Comprueba si `followerId` sigue a `followingId`.
 */
export async function checkIsFollowing(
  followerId?: string | null,
  followingId?: string | null
): Promise<boolean> {
  if (!followerId || !followingId || followerId === followingId) {
    return false;
  }

  // 1. Verificación rápida en local
  const localList = getLocalFollowing(followerId);
  const isLocalFollowing = localList.includes(followingId);

  // 2. Verificación en Supabase
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();

    if (!error) {
      const isDbFollowing = !!data;
      // Sincronizar cache local si diverge
      if (isDbFollowing !== isLocalFollowing) {
        const updated = isDbFollowing
          ? Array.from(new Set([...localList, followingId]))
          : localList.filter((id) => id !== followingId);
        setLocalFollowing(followerId, updated);
      }
      return isDbFollowing;
    }
  } catch {
    // Si la red falla, usar el valor local
  }

  return isLocalFollowing;
}

/**
 * Alterna el seguimiento (Seguir / Dejar de seguir).
 * Maneja inserción/borrado en Supabase, notificaciones y evento global.
 */
export async function toggleFollowUser(params: {
  followerId: string;
  followingId: string;
  actorName: string;
  actorAvatar?: string;
}): Promise<{ isFollowing: boolean; error?: string }> {
  const { followerId, followingId, actorName, actorAvatar } = params;

  if (!followerId || !followingId || followerId === followingId) {
    return { isFollowing: false, error: "Operación no permitida" };
  }

  const localList = getLocalFollowing(followerId);
  const currentlyFollowing = localList.includes(followingId);
  const nextIsFollowing = !currentlyFollowing;

  // Actualización optimista local
  const updatedLocal = nextIsFollowing
    ? Array.from(new Set([...localList, followingId]))
    : localList.filter((id) => id !== followingId);
  setLocalFollowing(followerId, updatedLocal);

  // Despachar evento para componentes escuchando en tiempo real
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("ficnation_follow_changed", {
        detail: {
          followerId,
          followingId,
          isFollowing: nextIsFollowing,
        },
      })
    );
  }

  try {
    const supabase = createClient();

    if (nextIsFollowing) {
      // 1. Insertar en tabla follows
      const { error: insertError } = await supabase
        .from("follows")
        .insert({
          follower_id: followerId,
          following_id: followingId,
        });

      if (insertError && insertError.code !== "23505") { // 23505 = duplicate key
        throw insertError;
      }

      // 2. Enviar notificación al autor seguido
      await sendNotification({
        recipientId: followingId,
        actor: {
          id: followerId,
          name: actorName || "Un lector",
          avatar: actorAvatar || "",
        },
        type: "follow",
        customMessage: `${actorName || "Un usuario"} ha comenzado a seguirte.`,
      });

      return { isFollowing: true };
    } else {
      // 1. Borrar de tabla follows
      const { error: deleteError } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("following_id", followingId);

      if (deleteError) {
        throw deleteError;
      }

      return { isFollowing: false };
    }
  } catch (err: any) {
    // Revertir estado local en caso de error crítico
    setLocalFollowing(followerId, localList);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ficnation_follow_changed", {
          detail: {
            followerId,
            followingId,
            isFollowing: currentlyFollowing,
          },
        })
      );
    }
    return { isFollowing: currentlyFollowing, error: err?.message || "Error al actualizar seguimiento" };
  }
}

/**
 * Obtiene las estadísticas de seguidores y seguidos de un usuario.
 */
export async function getFollowStats(userId: string): Promise<{ followers: number; following: number }> {
  if (!userId) return { followers: 0, following: 0 };

  try {
    const supabase = createClient();

    // 1. Intentar conteo exacto desde la tabla follows
    const [followersRes, followingRes, profileRes] = await Promise.all([
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
      supabase.from("profiles").select("followers_count, following_count").eq("id", userId).maybeSingle(),
    ]);

    const followers = typeof followersRes.count === "number"
      ? followersRes.count
      : (profileRes.data?.followers_count ?? 0);

    const following = typeof followingRes.count === "number"
      ? followingRes.count
      : (profileRes.data?.following_count ?? 0);

    return { followers, following };
  } catch {
    return { followers: 0, following: 0 };
  }
}

/**
 * Obtiene la lista de usuarios que siguen a `userId` (Seguidores).
 */
export async function getFollowersList(userId: string): Promise<FollowUserItem[]> {
  if (!userId) return [];

  try {
    const supabase = createClient();
    const { data: followRows, error } = await supabase
      .from("follows")
      .select("follower_id, created_at")
      .eq("following_id", userId)
      .order("created_at", { ascending: false });

    if (error || !followRows || followRows.length === 0) {
      return [];
    }

    const followerIds = followRows.map((r) => r.follower_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url, bio, level, level_title")
      .in("id", followerIds);

    if (!profiles) return [];

    return profiles.map((p) => ({
      id: p.id,
      name: p.name || "Usuario",
      username: p.username || "usuario",
      avatar: p.avatar_url || "/default-avatar.svg",
      bio: p.bio || "",
      level: p.level ?? 1,
      levelTitle: p.level_title || "Iniciado",
    }));
  } catch {
    return [];
  }
}

/**
 * Obtiene la lista de usuarios a los que sigue `userId` (Siguiendo).
 */
export async function getFollowingList(userId: string): Promise<FollowUserItem[]> {
  if (!userId) return [];

  try {
    const supabase = createClient();
    const { data: followRows, error } = await supabase
      .from("follows")
      .select("following_id, created_at")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });

    if (error || !followRows || followRows.length === 0) {
      return [];
    }

    const followingIds = followRows.map((r) => r.following_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url, bio, level, level_title")
      .in("id", followingIds);

    if (!profiles) return [];

    return profiles.map((p) => ({
      id: p.id,
      name: p.name || "Usuario",
      username: p.username || "usuario",
      avatar: p.avatar_url || "/default-avatar.svg",
      bio: p.bio || "",
      level: p.level ?? 1,
      levelTitle: p.level_title || "Iniciado",
    }));
  } catch {
    return [];
  }
}
