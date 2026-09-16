import { createClient } from "@/lib/supabase/client";

export type NotificationType = "follow" | "vote" | "comment" | "library" | "tip" | "cashout" | "admin_announcement";

export interface FicNotification {
  id: string;
  recipient_id: string;
  actor_id: string;
  actor_name: string;
  actor_avatar?: string;
  type: NotificationType;
  story_id?: string;
  story_title?: string;
  chapter_number?: number;
  message: string;
  read: boolean;
  created_at: string;
}

export interface CreateNotificationParams {
  recipientId: string;
  actor: {
    id: string;
    name: string;
    avatar?: string;
  };
  type: NotificationType;
  storyId?: string;
  storyTitle?: string;
  chapterNumber?: number;
  customMessage?: string;
}

/**
 * Crea una notificación en Supabase y respaldo en almacenamiento local
 */
export async function sendNotification(params: CreateNotificationParams): Promise<FicNotification | null> {
  const { recipientId, actor, type, storyId, storyTitle, chapterNumber, customMessage } = params;

  // Evitar auto-notificaciones si el usuario interactúa con su propio contenido
  if (!recipientId || !actor?.id || recipientId === actor.id) {
    return null;
  }

  // Generar mensaje según el tipo de acción
  let message = customMessage;
  if (!message) {
    switch (type) {
      case "follow":
        message = `${actor.name} ha comenzado a seguirte.`;
        break;
      case "vote":
        message = storyTitle
          ? `${actor.name} le dio una estrella a tu historia "${storyTitle}"${chapterNumber ? ` (Cap. ${chapterNumber})` : ""}.`
          : `${actor.name} le dio una estrella a tu obra.`;
        break;
      case "comment":
        message = storyTitle
          ? `${actor.name} comentó en tu historia "${storyTitle}"${chapterNumber ? ` (Cap. ${chapterNumber})` : ""}.`
          : `${actor.name} comentó en tu historia.`;
        break;
      case "library":
        message = storyTitle
          ? `${actor.name} guardó tu historia "${storyTitle}" en su biblioteca personal.`
          : `${actor.name} guardó tu historia en su biblioteca.`;
        break;
      case "tip":
        message = `${actor.name} te ha enviado un regalo de FicCoins.`;
        break;
      case "cashout":
        message = `Tu solicitud de retiro de fondos ha sido registrada con éxito.`;
        break;
      case "admin_announcement":
        message = `Aviso oficial de Administración de FicNation.`;
        break;
    }
  }

  const newNotif: FicNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    recipient_id: recipientId,
    actor_id: actor.id,
    actor_name: actor.name || "Usuario de FicNation",
    actor_avatar: actor.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    type,
    story_id: storyId,
    story_title: storyTitle,
    chapter_number: chapterNumber,
    message: message || "Nueva interacción en tu cuenta.",
    read: false,
    created_at: new Date().toISOString(),
  };

  // 1. Guardar en Supabase (si existe la tabla)
  try {
    const supabase = createClient();
    await supabase.from("notifications").insert({
      recipient_id: newNotif.recipient_id,
      actor_id: newNotif.actor_id,
      actor_name: newNotif.actor_name,
      actor_avatar: newNotif.actor_avatar,
      type: newNotif.type,
      story_id: newNotif.story_id,
      story_title: newNotif.story_title,
      chapter_number: newNotif.chapter_number,
      message: newNotif.message,
      read: false,
      created_at: newNotif.created_at,
    });
  } catch (err) {
    // Si la tabla no está creada aún en Supabase, continúa sin romper la app
    console.log("Aviso: Notificación respaldada localmente.");
  }

  // 2. Guardar en almacenamiento local para el destinatario
  if (typeof window !== "undefined") {
    try {
      const storageKey = `ficnation_notifications_${recipientId}`;
      const existingRaw = localStorage.getItem(storageKey);
      const list: FicNotification[] = existingRaw ? JSON.parse(existingRaw) : [];
      list.unshift(newNotif);
      localStorage.setItem(storageKey, JSON.stringify(list.slice(0, 50)));
    } catch {}
  }

  return newNotif;
}

/**
 * Obtiene las notificaciones del usuario desde Supabase y localStorage
 */
export async function getNotifications(userId: string): Promise<FicNotification[]> {
  if (!userId) return [];

  let results: FicNotification[] = [];

  // 1. Intentar cargar desde Supabase
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data && data.length > 0) {
      results = data as FicNotification[];
    }
  } catch (err) {
    // Fallback a localStorage
  }

  // 2. Si no hay datos de Supabase o para complementar, cargar localStorage
  if (typeof window !== "undefined") {
    try {
      const storageKey = `ficnation_notifications_${userId}`;
      const localRaw = localStorage.getItem(storageKey);
      if (localRaw) {
        const localNotifs: FicNotification[] = JSON.parse(localRaw);
        
        // Unir evitando duplicados por id
        const map = new Map<string, FicNotification>();
        results.forEach((n) => map.set(n.id, n));
        localNotifs.forEach((n) => {
          if (!map.has(n.id)) map.set(n.id, n);
        });

        results = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    } catch {}
  }

  return results;
}

/**
 * Marca una notificación individual como leída
 */
export async function markNotificationAsRead(notifId: string, userId: string): Promise<void> {
  if (!notifId || !userId) return;

  // 1. En Supabase
  try {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notifId)
      .eq("recipient_id", userId);
  } catch {}

  // 2. En localStorage
  if (typeof window !== "undefined") {
    try {
      const storageKey = `ficnation_notifications_${userId}`;
      const localRaw = localStorage.getItem(storageKey);
      if (localRaw) {
        const list: FicNotification[] = JSON.parse(localRaw);
        const updated = list.map((n) => (n.id === notifId ? { ...n, read: true } : n));
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch {}
  }
}

/**
 * Marca todas las notificaciones como leídas
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!userId) return;

  // 1. En Supabase
  try {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", userId);
  } catch {}

  // 2. En localStorage
  if (typeof window !== "undefined") {
    try {
      const storageKey = `ficnation_notifications_${userId}`;
      const localRaw = localStorage.getItem(storageKey);
      if (localRaw) {
        const list: FicNotification[] = JSON.parse(localRaw);
        const updated = list.map((n) => ({ ...n, read: true }));
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch {}
  }
}
