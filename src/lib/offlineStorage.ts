import { createClient } from "@/lib/supabase/client";
import { type Story } from "@/data/mockStories";

export interface OfflineChapterData {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  isHtml: boolean;
  wordCount?: number;
  downloadedAt: string;
}

export interface OfflineStoryData {
  id: string;
  title: string;
  synopsis: string;
  coverUrl: string;
  genre: string;
  tags: string[];
  readsCount: number;
  votesCount: number;
  totalChapters: number;
  isCompleted: boolean;
  author: {
    id?: string;
    name: string;
    username: string;
    avatar: string;
  };
  chapters: OfflineChapterData[];
  downloadedAt: string;
  sizeBytes?: number;
}

const OFFLINE_STORIES_INDEX_KEY = "ficnation_offline_stories_index";

/**
 * Obtiene la lista resumida de historias descargadas offline
 */
export function getDownloadedStoriesList(): Story[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_STORIES_INDEX_KEY);
    if (!raw) return [];
    const parsed: OfflineStoryData[] = JSON.parse(raw);
    return parsed.map((s) => ({
      id: s.id,
      title: s.title,
      synopsis: s.synopsis,
      coverImage: s.coverUrl,
      genre: s.genre,
      tags: s.tags || [],
      chapters: s.chapters?.length || s.totalChapters || 1,
      reads: String(s.readsCount || 0),
      votes: String(s.votesCount || 0),
      completed: s.isCompleted,
      author: {
        id: s.author?.id,
        name: s.author?.name || "Autor",
        username: s.author?.username || "@autor",
        avatar: s.author?.avatar || "/default-avatar.svg",
      },
    }));
  } catch (err) {
    console.warn("Error al leer lista offline:", err);
    return [];
  }
}

/**
 * Comprueba si una historia está completamente descargada en el dispositivo
 */
export function isStoryDownloadedOffline(storyId: string): boolean {
  if (typeof window === "undefined" || !storyId) return false;
  try {
    const raw = localStorage.getItem(OFFLINE_STORIES_INDEX_KEY);
    if (!raw) return false;
    const list: { id: string }[] = JSON.parse(raw);
    return list.some((item) => item.id === storyId);
  } catch {
    return false;
  }
}

/**
 * Obtiene una historia completa con todos sus capítulos offline
 */
export function getOfflineStory(storyId: string): OfflineStoryData | null {
  if (typeof window === "undefined" || !storyId) return null;
  try {
    const raw = localStorage.getItem(`ficnation_offline_story_${storyId}`);
    if (raw) return JSON.parse(raw);
    return null;
  } catch {
    return null;
  }
}

/**
 * Obtiene un capítulo individual desde el caché offline
 */
export function getOfflineChapter(storyId: string, chapterNumber: number): OfflineChapterData | null {
  if (typeof window === "undefined" || !storyId) return null;
  try {
    const full = getOfflineStory(storyId);
    if (full && Array.isArray(full.chapters)) {
      const found = full.chapters.find((c) => c.chapterNumber === chapterNumber);
      if (found) return found;
    }

    // Comprobar caché de precarga individual
    const singleRaw = localStorage.getItem(`ficnation_offline_ch_${storyId}_${chapterNumber}`);
    if (singleRaw) return JSON.parse(singleRaw);
    return null;
  } catch {
    return null;
  }
}

/**
 * Descarga una historia completa y todos sus capítulos desde Supabase para lectura sin conexión
 */
export async function downloadStoryForOffline(
  storyId: string,
  onProgress?: (percent: number, statusText: string) => void
): Promise<{ success: boolean; error?: string }> {
  if (!storyId) return { success: false, error: "ID de historia no válido" };

  try {
    onProgress?.(5, "Obteniendo información de la historia...");
    const supabase = createClient();

    // 1. Obtener datos de la historia
    const { data: sData, error: sErr } = await supabase
      .from("stories")
      .select(`
        id,
        title,
        synopsis,
        cover_url,
        genre,
        tags,
        reads_count,
        votes_count,
        is_completed,
        author_id,
        profiles!author_id (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq("id", storyId)
      .maybeSingle();

    if (sErr || !sData) {
      return { success: false, error: "No se pudo obtener la historia del servidor." };
    }

    onProgress?.(25, "Descargando lista de capítulos...");

    // 2. Obtener todos los capítulos publicados
    const { data: chaptersData, error: chErr } = await supabase
      .from("chapters")
      .select("id, chapter_number, title, content, is_published")
      .eq("story_id", storyId)
      .eq("is_published", true)
      .order("chapter_number", { ascending: true });

    if (chErr || !chaptersData || chaptersData.length === 0) {
      return { success: false, error: "La historia no contiene capítulos disponibles para descargar." };
    }

    onProgress?.(50, "Guardando capítulos en la memoria del dispositivo...");

    const downloadedChapters: OfflineChapterData[] = chaptersData.map((c: any, index: number) => {
      const isHtml = /<\/?[a-z][\s\S]*>/i.test(c.content || "");
      const progressSoFar = 50 + Math.round(((index + 1) / chaptersData.length) * 40);
      onProgress?.(progressSoFar, `Procesando Capítulo ${c.chapter_number}...`);

      return {
        id: c.id,
        chapterNumber: c.chapter_number,
        title: c.title || `Capítulo ${c.chapter_number}`,
        content: c.content || "",
        isHtml,
        downloadedAt: new Date().toISOString(),
      };
    });

    const authorProfile = sData.profiles as any;
    const fullStoryOffline: OfflineStoryData = {
      id: sData.id,
      title: sData.title || "Historia",
      synopsis: sData.synopsis || "",
      coverUrl: sData.cover_url || "",
      genre: sData.genre || "Fantasía",
      tags: Array.isArray(sData.tags) ? sData.tags : [],
      readsCount: sData.reads_count || 0,
      votesCount: sData.votes_count || 0,
      totalChapters: downloadedChapters.length,
      isCompleted: Boolean(sData.is_completed),
      author: {
        id: sData.author_id,
        name: authorProfile?.name || "Autor",
        username: authorProfile?.username ? `@${authorProfile.username}` : "@autor",
        avatar: authorProfile?.avatar_url || "/default-avatar.svg",
      },
      chapters: downloadedChapters,
      downloadedAt: new Date().toISOString(),
    };

    // 3. Guardar en localStorage
    localStorage.setItem(`ficnation_offline_story_${storyId}`, JSON.stringify(fullStoryOffline));

    // Actualizar índice de historias descargadas
    const rawIndex = localStorage.getItem(OFFLINE_STORIES_INDEX_KEY);
    const existingIndex: OfflineStoryData[] = rawIndex ? JSON.parse(rawIndex) : [];
    const filteredIndex = existingIndex.filter((s) => s.id !== storyId);
    filteredIndex.unshift(fullStoryOffline);
    localStorage.setItem(OFFLINE_STORIES_INDEX_KEY, JSON.stringify(filteredIndex));

    onProgress?.(100, "¡Historia descargada con éxito!");

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ficnation_offline_updated", {
          detail: { storyId, isDownloaded: true },
        })
      );
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error al descargar historia offline:", err);
    return { success: false, error: err?.message || "Error desconocido al guardar en memoria." };
  }
}

/**
 * Elimina una historia descargada del almacenamiento local para liberar espacio
 */
export function removeOfflineStory(storyId: string): boolean {
  if (typeof window === "undefined" || !storyId) return false;
  try {
    localStorage.removeItem(`ficnation_offline_story_${storyId}`);

    const rawIndex = localStorage.getItem(OFFLINE_STORIES_INDEX_KEY);
    if (rawIndex) {
      const existing: OfflineStoryData[] = JSON.parse(rawIndex);
      const filtered = existing.filter((s) => s.id !== storyId);
      localStorage.setItem(OFFLINE_STORIES_INDEX_KEY, JSON.stringify(filtered));
    }

    window.dispatchEvent(
      new CustomEvent("ficnation_offline_updated", {
        detail: { storyId, isDownloaded: false },
      })
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Precarga en segundo plano los siguientes capítulos (ej: actual + 1 y actual + 2)
 * para que el lector no se congele si la conexión se interrumpe de repente
 */
export async function autoPrefetchNextChapters(storyId: string, currentChapter: number): Promise<void> {
  if (typeof window === "undefined" || !storyId || !navigator.onLine) return;

  try {
    const chaptersToFetch = [currentChapter + 1, currentChapter + 2];
    const supabase = createClient();

    for (const chNum of chaptersToFetch) {
      const cacheKey = `ficnation_offline_ch_${storyId}_${chNum}`;
      if (localStorage.getItem(cacheKey)) continue; // Ya está en caché

      const { data: ch } = await supabase
        .from("chapters")
        .select("id, chapter_number, title, content")
        .eq("story_id", storyId)
        .eq("chapter_number", chNum)
        .eq("is_published", true)
        .maybeSingle();

      if (ch && ch.content) {
        const entry: OfflineChapterData = {
          id: ch.id,
          chapterNumber: ch.chapter_number,
          title: ch.title || `Capítulo ${ch.chapter_number}`,
          content: ch.content,
          isHtml: /<\/?[a-z][\s\S]*>/i.test(ch.content),
          downloadedAt: new Date().toISOString(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      }
    }
  } catch {
    // Fallback silencioso en prefetch de background
  }
}
