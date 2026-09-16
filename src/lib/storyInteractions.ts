import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendNotification } from "@/lib/notifications";

// ==============================================================================
// 0. SINCRONIZACIÓN MULTI-PESTAÑA Y CANAL GLOBAL DE INTERACCIONES
// ==============================================================================

let interactionsChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    interactionsChannel = new BroadcastChannel("ficnation_story_interactions");
    interactionsChannel.onmessage = (event) => {
      const { type, detail } = event.data || {};
      if (type === "ficnation_story_voted") {
        window.dispatchEvent(new CustomEvent("ficnation_story_voted", { detail }));
      } else if (type === "ficnation_story_viewed") {
        window.dispatchEvent(new CustomEvent("ficnation_story_viewed", { detail }));
      }
    };
  } catch {}
}

/**
 * Emite el evento de voto tanto a nivel local de ventana como a todas las pestañas abiertas
 */
export function broadcastStoryVoted(detail: { storyId: string; hasVoted: boolean; newCount: number }) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ficnation_story_voted", { detail }));
    if (interactionsChannel) {
      try {
        interactionsChannel.postMessage({ type: "ficnation_story_voted", detail });
      } catch {}
    }
  }
}

/**
 * Emite el evento de lectura/vista tanto a nivel local como a todas las pestañas
 */
export function broadcastStoryViewed(detail: { storyId: string; readsCount: number }) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ficnation_story_viewed", { detail }));
    if (interactionsChannel) {
      try {
        interactionsChannel.postMessage({ type: "ficnation_story_viewed", detail });
      } catch {}
    }
  }
}

/**
 * Sincroniza las cachés locales de historias del usuario y biblioteca
 */
function updateLocalStoryCaches(storyId: string, updates: { votesCount?: number; readsCount?: number }) {
  if (typeof window === "undefined") return;
  try {
    // 1. ficnation_user_stories
    const rawUserStories = localStorage.getItem("ficnation_user_stories");
    if (rawUserStories) {
      const userStories = JSON.parse(rawUserStories);
      let changed = false;
      const updated = userStories.map((s: any) => {
        if (s.id === storyId) {
          changed = true;
          return {
            ...s,
            ...(updates.votesCount !== undefined ? { votesCount: updates.votesCount, votes: String(updates.votesCount) } : {}),
            ...(updates.readsCount !== undefined ? { readsCount: updates.readsCount, reads: String(updates.readsCount) } : {}),
          };
        }
        return s;
      });
      if (changed) {
        localStorage.setItem("ficnation_user_stories", JSON.stringify(updated));
      }
    }

    // 2. ficnation_library
    const rawLibrary = localStorage.getItem("ficnation_library");
    if (rawLibrary) {
      const library = JSON.parse(rawLibrary);
      let changed = false;
      const updated = library.map((s: any) => {
        if (s.id === storyId || s.storyId === storyId) {
          changed = true;
          return {
            ...s,
            ...(updates.votesCount !== undefined ? { votes: String(updates.votesCount) } : {}),
            ...(updates.readsCount !== undefined ? { reads: String(updates.readsCount) } : {}),
          };
        }
        return s;
      });
      if (changed) {
        localStorage.setItem("ficnation_library", JSON.stringify(updated));
      }
    }
  } catch {}
}

/**
 * Suscripción global a Supabase Realtime para la tabla stories
 */
let isRealtimeSubscribed = false;
export function initStoryRealtimeSubscription() {
  if (typeof window === "undefined" || isRealtimeSubscribed) return;
  try {
    const supabase = createClient();
    supabase
      .channel("public:stories_interactions")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "stories" },
        (payload) => {
          const newStory = payload.new as any;
          if (!newStory || !newStory.id) return;

          const storyId = newStory.id;
          const votesCount = Number(newStory.votes_count ?? 0);
          const readsCount = Number(newStory.reads_count ?? 0);

          updateLocalStoryCaches(storyId, { votesCount, readsCount });

          broadcastStoryVoted({
            storyId,
            newCount: votesCount,
            hasVoted: getLocalVotedStoryIds().includes(storyId),
          });

          broadcastStoryViewed({
            storyId,
            readsCount,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "story_votes" },
        async (payload) => {
          const row = (payload.new || payload.old) as any;
          if (!row || !row.story_id) return;
          const storyId = row.story_id;
          const { count } = await supabase
            .from("story_votes")
            .select("*", { count: "exact", head: true })
            .eq("story_id", storyId);
          if (count !== null && count !== undefined) {
            updateLocalStoryCaches(storyId, { votesCount: count });
            broadcastStoryVoted({
              storyId,
              newCount: count,
              hasVoted: getLocalVotedStoryIds().includes(storyId),
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "story_views" },
        async (payload) => {
          const row = payload.new as any;
          if (!row || !row.story_id) return;
          const storyId = row.story_id;
          const { count } = await supabase
            .from("story_views")
            .select("*", { count: "exact", head: true })
            .eq("story_id", storyId);
          if (count !== null && count !== undefined) {
            updateLocalStoryCaches(storyId, { readsCount: count });
            broadcastStoryViewed({ storyId, readsCount: count });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          isRealtimeSubscribed = true;
        }
      });
  } catch {}
}

// ==============================================================================
// 1. GESTIÓN DE VOTOS / ESTRELLAS POR HISTORIA
// ==============================================================================

/**
 * Obtiene los IDs de historias votadas en el cliente local.
 */
export function getLocalVotedStoryIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("ficnation_story_votes") || "[]");
  } catch {
    return [];
  }
}

/**
 * Comprueba si el usuario actual ha dado estrella / votado a una historia.
 */
export async function hasUserVotedStory(storyId: string, userId?: string): Promise<boolean> {
  if (!storyId) return false;

  const localVotes = getLocalVotedStoryIds();
  const hasLocal = localVotes.includes(storyId);

  if (!userId) return hasLocal;

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("story_votes")
      .select("id")
      .eq("story_id", storyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      if (!hasLocal && typeof window !== "undefined") {
        localStorage.setItem("ficnation_story_votes", JSON.stringify([...localVotes, storyId]));
      }
      return true;
    } else {
      if (hasLocal && typeof window !== "undefined") {
        localStorage.setItem(
          "ficnation_story_votes",
          JSON.stringify(localVotes.filter((id) => id !== storyId))
        );
      }
      return false;
    }
  } catch {
    return hasLocal;
  }
}

/**
 * Obtiene la lista de identificadores de capítulos votados localmente.
 */
export function getLocalVotedChapterKeys(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ficnation_chapter_votes");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Comprueba si el usuario actual ha votado un capítulo específico.
 */
export function hasUserVotedChapter(
  storyId: string,
  chapterNumber: number | string,
  userId?: string
): boolean {
  if (!storyId || chapterNumber === undefined || typeof window === "undefined") return false;
  const visitorId = getOrCreateVisitorId();
  const readerId = userId || visitorId;
  const chapterKey = `${readerId}_${storyId}_ch_${chapterNumber}`;
  const legacyKey = `${storyId}_ch_${chapterNumber}`;

  const localVotes = getLocalVotedChapterKeys();
  return localVotes.includes(chapterKey) || localVotes.includes(legacyKey);
}

/**
 * Alterna el voto/estrella de un capítulo específico.
 * Cada capítulo votado suma +1 estrella a la historia en total.
 */
export async function toggleChapterVote(params: {
  storyId: string;
  chapterNumber: number | string;
  user?: { id: string; name?: string; avatar?: string } | null;
  storyTitle?: string;
  authorId?: string;
  currentCount?: number;
}): Promise<{ hasVoted: boolean; newCount: number }> {
  const { storyId, chapterNumber, user, storyTitle = "Historia", authorId, currentCount = 0 } = params;
  if (!storyId || chapterNumber === undefined) return { hasVoted: false, newCount: currentCount };

  const visitorId = getOrCreateVisitorId();
  const readerId = user?.id || visitorId;
  const chapterKey = `${readerId}_${storyId}_ch_${chapterNumber}`;

  const localVotes = getLocalVotedChapterKeys();
  const currentlyVoted = localVotes.includes(chapterKey) || localVotes.includes(`${storyId}_ch_${chapterNumber}`);
  const nextVoted = !currentlyVoted;

  // 1. Guardar en localStorage de capítulos votados
  if (typeof window !== "undefined") {
    let updatedChapterVotes: string[];
    if (nextVoted) {
      updatedChapterVotes = [...localVotes.filter((k) => k !== chapterKey), chapterKey];
    } else {
      updatedChapterVotes = localVotes.filter((k) => k !== chapterKey && k !== `${storyId}_ch_${chapterNumber}`);
    }
    localStorage.setItem("ficnation_chapter_votes", JSON.stringify(updatedChapterVotes));

    // Si tiene al menos un capítulo votado de esta historia, marcar story en ficnation_story_votes
    const hasAnyChapterVoted = updatedChapterVotes.some((k) => k.includes(storyId));
    const localStoryVotes = getLocalVotedStoryIds();
    if (hasAnyChapterVoted && !localStoryVotes.includes(storyId)) {
      localStorage.setItem("ficnation_story_votes", JSON.stringify([...localStoryVotes, storyId]));
    } else if (!hasAnyChapterVoted && localStoryVotes.includes(storyId)) {
      localStorage.setItem("ficnation_story_votes", JSON.stringify(localStoryVotes.filter((id) => id !== storyId)));
    }
  }

  // 2. Actualizar conteo de la historia en Supabase
  let newCount = currentCount;
  const supabase = createClient();
  try {
    const { data: dbStory } = await supabase
      .from("stories")
      .select("votes_count, reads_count")
      .eq("id", storyId)
      .maybeSingle();

    const currentVotes = dbStory?.votes_count !== undefined && dbStory?.votes_count !== null
      ? Number(dbStory.votes_count)
      : currentCount;

    newCount = nextVoted ? currentVotes + 1 : Math.max(0, currentVotes - 1);
    const currentReads = Number(dbStory?.reads_count || 0);
    const ensureReads = Math.max(currentReads, newCount);

    // Intentar actualizar vía función RPC de servidor o update directo
    try {
      await supabase.rpc("toggle_story_vote", { target_story_id: storyId, user_voted: nextVoted });
    } catch {
      try {
        await supabase
          .from("stories")
          .update({ votes_count: newCount, reads_count: ensureReads })
          .eq("id", storyId);
      } catch {}
    }

    // Registro analítico en story_votes para el usuario
    if (user?.id) {
      if (nextVoted) {
        await supabase.from("story_votes").upsert(
          {
            story_id: storyId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          },
          { onConflict: "story_id,user_id" }
        );
      } else {
        await supabase
          .from("story_votes")
          .delete()
          .eq("story_id", storyId)
          .eq("user_id", user.id);
      }
    }

    updateLocalStoryCaches(storyId, { votesCount: newCount, readsCount: ensureReads });
    broadcastStoryVoted({ storyId, hasVoted: nextVoted, newCount });
    if (ensureReads > currentReads) {
      broadcastStoryViewed({ storyId, readsCount: ensureReads });
    }
  } catch {
    newCount = nextVoted ? currentCount + 1 : Math.max(0, currentCount - 1);
    updateLocalStoryCaches(storyId, { votesCount: newCount });
    broadcastStoryVoted({ storyId, hasVoted: nextVoted, newCount });
  }

  // 3. Notificar al autor si se otorgó una estrella al capítulo
  if (nextVoted && user?.id && authorId && authorId !== user.id) {
    sendNotification({
      recipientId: authorId,
      actor: {
        id: user.id,
        name: user.name || "Usuario",
        avatar: user.avatar,
      },
      type: "vote",
      storyId,
      storyTitle: `${storyTitle} (Cap. ${chapterNumber})`,
    });
  }

  return { hasVoted: nextVoted, newCount };
}

/**
 * Alterna el voto/estrella de una historia (dar estrella o retirar estrella).
 */
export async function toggleStoryVote(params: {
  storyId: string;
  user?: { id: string; name?: string; avatar?: string } | null;
  storyTitle?: string;
  authorId?: string;
  currentCount?: number;
}): Promise<{ hasVoted: boolean; newCount: number }> {
  const { storyId, user, storyTitle = "Historia", authorId, currentCount = 0 } = params;
  if (!storyId) return { hasVoted: false, newCount: currentCount };

  const localVotes = getLocalVotedStoryIds();
  const currentlyVoted = localVotes.includes(storyId);
  const nextVoted = !currentlyVoted;

  let newCount = nextVoted ? currentCount + 1 : Math.max(0, currentCount - 1);

  // 1. Actualizar localStorage de votos
  if (typeof window !== "undefined") {
    if (nextVoted) {
      if (!localVotes.includes(storyId)) {
        localStorage.setItem("ficnation_story_votes", JSON.stringify([...localVotes, storyId]));
      }
    } else {
      localStorage.setItem(
        "ficnation_story_votes",
        JSON.stringify(localVotes.filter((id) => id !== storyId))
      );
    }
  }

  // 2. Actualizar cachés locales
  updateLocalStoryCaches(storyId, { votesCount: newCount });

  // 3. Notificar inmediatamente a toda la UI (Optimistic UI)
  broadcastStoryVoted({ storyId, hasVoted: nextVoted, newCount });

  // 4. Actualizar Supabase en segundo plano
  const supabase = createClient();
  try {
    // Actualizar story_votes si hay usuario autenticado
    if (user?.id) {
      if (nextVoted) {
        await supabase.from("story_votes").upsert(
          {
            story_id: storyId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          },
          { onConflict: "story_id,user_id" }
        );
      } else {
        await supabase
          .from("story_votes")
          .delete()
          .eq("story_id", storyId)
          .eq("user_id", user.id);
      }
    }

    // Leer y actualizar directamente en la tabla stories evitando que RLS de story_votes resetee el contador
    let finalVotes = newCount;
    try {
      const { data: dbStory } = await supabase
        .from("stories")
        .select("votes_count, reads_count")
        .eq("id", storyId)
        .maybeSingle();

      const currentDbVotes =
        dbStory?.votes_count !== undefined && dbStory?.votes_count !== null
          ? Number(dbStory.votes_count)
          : currentCount;

      finalVotes = nextVoted ? Math.max(newCount, currentDbVotes + 1) : Math.max(0, currentDbVotes - 1);
      const currentReads = Number(dbStory?.reads_count || 0);
      const ensureReads = Math.max(currentReads, finalVotes);

      await supabase
        .from("stories")
        .update({ votes_count: finalVotes, reads_count: ensureReads })
        .eq("id", storyId);

      updateLocalStoryCaches(storyId, { votesCount: finalVotes, readsCount: ensureReads });
      broadcastStoryVoted({ storyId, hasVoted: nextVoted, newCount: finalVotes });
      if (ensureReads > currentReads) {
        broadcastStoryViewed({ storyId, readsCount: ensureReads });
      }
      return { hasVoted: nextVoted, newCount: finalVotes };
    } catch {}

    updateLocalStoryCaches(storyId, { votesCount: finalVotes });
    broadcastStoryVoted({ storyId, hasVoted: nextVoted, newCount: finalVotes });
    return { hasVoted: nextVoted, newCount: finalVotes };
  } catch (err) {
    console.warn("FicNation: Error al registrar voto en Supabase:", err);
  }

  // 5. Notificar al autor si se otorgó una estrella
  if (nextVoted && user?.id && authorId && authorId !== user.id) {
    sendNotification({
      recipientId: authorId,
      actor: {
        id: user.id,
        name: user.name || "Usuario",
        avatar: user.avatar,
      },
      type: "vote",
      storyId,
      storyTitle,
    });
  }

  return { hasVoted: nextVoted, newCount };
}

// ==============================================================================
// 2. GESTIÓN DE VISTAS ÚNICAS POR HISTORIA (POR USUARIO, NO POR CAPÍTULO)
// ==============================================================================

/**
 * Obtiene o genera un identificador anónimo persistente para el visitante.
 */
function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server_visitor";
  let visitorId = localStorage.getItem("ficnation_visitor_id");
  if (!visitorId) {
    visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("ficnation_visitor_id", visitorId);
  }
  return visitorId;
}

/**
 * Registra una vista de capítulo de una historia por usuario o visitante.
 * - Cada capítulo leído por un usuario suma +1 vista al total de la obra.
 * - Si una historia tiene 5 capítulos y el usuario los lee todos, suma 5 vistas.
 * - Evita duplicados en recargas (F5) sobre el mismo capítulo.
 */
export async function recordUniqueStoryView(params: {
  storyId: string;
  chapterNumber?: number | string;
  userId?: string;
  currentReadsCount?: number;
}): Promise<{ isNewView: boolean; readsCount: number }> {
  const { storyId, chapterNumber, userId, currentReadsCount = 0 } = params;
  if (!storyId || typeof window === "undefined") {
    return { isNewView: false, readsCount: currentReadsCount };
  }

  const visitorId = getOrCreateVisitorId();
  const readerId = userId || visitorId;

  // Clave única por capítulo para evitar spam en F5, pero permitiendo sumar cada nuevo capítulo
  const chapterSuffix = chapterNumber !== undefined ? `_ch_${chapterNumber}` : "";
  const viewKey = `${readerId}_${storyId}${chapterSuffix}`;

  // 1. Verificación en caché local rápida
  let viewedItems: Record<string, number> = {};
  try {
    viewedItems = JSON.parse(localStorage.getItem("ficnation_viewed_chapters") || "{}");
  } catch {
    viewedItems = {};
  }

  if (viewedItems[viewKey]) {
    return { isNewView: false, readsCount: currentReadsCount };
  }

  // Marcar este capítulo como visto para este lector
  viewedItems[viewKey] = Date.now();
  localStorage.setItem("ficnation_viewed_chapters", JSON.stringify(viewedItems));

  // 2. Incrementar contador en la tabla stories en Supabase
  let newReadsCount = currentReadsCount;
  const supabase = createClient();

  try {
    const { data: currentStory } = await supabase
      .from("stories")
      .select("reads_count, votes_count")
      .eq("id", storyId)
      .maybeSingle();

    const baseReads = Math.max(
      currentReadsCount,
      currentStory?.reads_count !== undefined && currentStory?.reads_count !== null
        ? Number(currentStory.reads_count)
        : 0
    );

    newReadsCount = baseReads + 1;

    // 1. Reflejar el nuevo conteo mediante RPC (Security Definer) o trigger
    try {
      await supabase.rpc("increment_story_reads", { target_story_id: storyId });
    } catch {
      try {
        await supabase
          .from("stories")
          .update({ reads_count: newReadsCount })
          .eq("id", storyId);
      } catch {}
    }

    // 2. Registro analítico en story_views (que dispara el trigger automático)
    try {
      await supabase.from("story_views").insert({
        story_id: storyId,
        user_id: userId || null,
        visitor_id: visitorId,
      });
    } catch {}
  } catch {
    newReadsCount = currentReadsCount + 1;
  }

  updateLocalStoryCaches(storyId, { readsCount: newReadsCount });
  broadcastStoryViewed({ storyId, readsCount: newReadsCount });

  return { isNewView: true, readsCount: newReadsCount };
}

// ==============================================================================
// 3. HOOK REACT REUTILIZABLE: useStoryInteractions
// ==============================================================================

export function useStoryInteractions(
  storyId: string,
  initialReads: number | string = 0,
  initialVotes: number | string = 0
) {
  const parsedVotes = Number(initialVotes) || 0;
  const parsedReads = Math.max(Number(initialReads) || 0, parsedVotes);

  const [reads, setReads] = useState<number>(parsedReads);
  const [votes, setVotes] = useState<number>(parsedVotes);
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  useEffect(() => {
    if (!storyId) return;
    const isVoted = getLocalVotedStoryIds().includes(storyId);
    setHasVoted(isVoted);
    const pVotes = isVoted ? Math.max(Number(initialVotes) || 0, 1) : Number(initialVotes) || 0;
    setVotes(pVotes);
    setReads((prev) => Math.max(prev, Number(initialReads) || 0, pVotes));
  }, [initialVotes, initialReads, storyId]);

  useEffect(() => {
    if (!storyId) return;

    setHasVoted(getLocalVotedStoryIds().includes(storyId));
    initStoryRealtimeSubscription();

    const handleVoted = (e: any) => {
      if (e.detail?.storyId === storyId) {
        if (e.detail.newCount !== undefined) {
          const newVotes = Number(e.detail.newCount);
          setVotes(newVotes);
          setReads((prev) => Math.max(prev, newVotes));
        }
        if (e.detail.hasVoted !== undefined) {
          setHasVoted(Boolean(e.detail.hasVoted));
        }
      }
    };

    const handleViewed = (e: any) => {
      if (e.detail?.storyId === storyId && e.detail.readsCount !== undefined) {
        setReads(Number(e.detail.readsCount));
      }
    };

    window.addEventListener("ficnation_story_voted", handleVoted);
    window.addEventListener("ficnation_story_viewed", handleViewed);

    return () => {
      window.removeEventListener("ficnation_story_voted", handleVoted);
      window.removeEventListener("ficnation_story_viewed", handleViewed);
    };
  }, [storyId]);

  // Las lecturas nunca pueden ser menores que las estrellas
  const safeReads = Math.max(reads, votes);

  return { reads: safeReads, votes, hasVoted, setReads, setVotes, setHasVoted };
}
