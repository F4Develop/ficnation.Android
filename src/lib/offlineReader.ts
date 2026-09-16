// FicNation Offline Storage Engine (IndexedDB + Safe Fallback)

export interface OfflineChapter {
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  savedAt: string;
}

export interface OfflineStory {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  coverUrl: string;
  authorName: string;
  authorAvatar?: string;
  authorId?: string;
  chapters: Record<number, OfflineChapter>;
  savedAt: string;
}

const DB_NAME = "ficnation_offline_db";
const DB_VERSION = 1;
const STORE_NAME = "offline_stories";

// Cache en memoria para respuestas sincrónicas instantáneas
const memoryCache: Map<string, OfflineStory> = new Map();

/**
 * Abrir o inicializar la base de datos IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB no soportado"));
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Guardar capítulo de forma segura en IndexedDB
 */
export async function saveChapterForOffline(
  storyData: {
    id: string;
    title: string;
    genre: string;
    synopsis: string;
    coverUrl: string;
    authorName: string;
    authorAvatar?: string;
    authorId?: string;
  },
  chapterData: {
    chapterNumber: number;
    title: string;
    content: string;
    wordCount: number;
  }
): Promise<boolean> {
  if (typeof window === "undefined" || !storyData.id) return false;

  try {
    let story = memoryCache.get(storyData.id);

    // Si no está en memoria, intentar leer de IndexedDB
    if (!story) {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(storyData.id);
        story = await new Promise<OfflineStory | undefined>((resolve) => {
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(undefined);
        });
      } catch {}
    }

    if (story) {
      story.title = storyData.title || story.title;
      story.coverUrl = storyData.coverUrl || story.coverUrl;
      story.authorName = storyData.authorName || story.authorName;
    } else {
      story = {
        id: storyData.id,
        title: storyData.title,
        genre: storyData.genre,
        synopsis: storyData.synopsis,
        coverUrl: storyData.coverUrl,
        authorName: storyData.authorName,
        authorAvatar: storyData.authorAvatar,
        authorId: storyData.authorId,
        chapters: {},
        savedAt: new Date().toISOString(),
      };
    }

    story.chapters[chapterData.chapterNumber] = {
      storyId: storyData.id,
      chapterNumber: chapterData.chapterNumber,
      title: chapterData.title,
      content: chapterData.content,
      wordCount: chapterData.wordCount,
      savedAt: new Date().toISOString(),
    };

    // Actualizar cache en memoria
    memoryCache.set(storyData.id, story);

    // Persistir en IndexedDB (sin límites restrictivos de 5MB)
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(story);

    try {
      const raw = localStorage.getItem("ficnation_offline_ids");
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(storyData.id)) {
        list.push(storyData.id);
        localStorage.setItem("ficnation_offline_ids", JSON.stringify(list));
      }
    } catch {}

    window.dispatchEvent(
      new CustomEvent("ficnation_offline_saved", {
        detail: { storyId: storyData.id, chapterNumber: chapterData.chapterNumber },
      })
    );
    return true;
  } catch (err) {
    // Si falla IndexedDB, mantener al menos en memoria sin romper
    return false;
  }
}

/**
 * Obtener un capítulo offline guardado
 */
export function getOfflineChapter(
  storyId: string,
  chapterNumber: number
): { story: OfflineStory; chapter: OfflineChapter } | null {
  if (typeof window === "undefined" || !storyId) return null;

  // 1. Probar caché en memoria
  const cachedStory = memoryCache.get(storyId);
  if (cachedStory && cachedStory.chapters[chapterNumber]) {
    return { story: cachedStory, chapter: cachedStory.chapters[chapterNumber] };
  }

  return null;
}

/**
 * Cargar capítulo offline de forma asíncrona desde IndexedDB
 */
export async function getOfflineChapterAsync(
  storyId: string,
  chapterNumber: number
): Promise<{ story: OfflineStory; chapter: OfflineChapter } | null> {
  if (typeof window === "undefined" || !storyId) return null;

  const syncResult = getOfflineChapter(storyId, chapterNumber);
  if (syncResult) return syncResult;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(storyId);
    const story: OfflineStory | undefined = await new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });

    if (story && story.chapters[chapterNumber]) {
      memoryCache.set(storyId, story);
      return { story, chapter: story.chapters[chapterNumber] };
    }
  } catch {}

  return null;
}

/**
 * Comprobar si una historia o capítulo específico está disponible offline
 */
export function isStoryAvailableOffline(storyId: string, chapterNumber?: number): boolean {
  if (typeof window === "undefined" || !storyId) return false;
  const story = memoryCache.get(storyId);
  if (story) {
    if (chapterNumber === undefined) return true;
    return !!story.chapters[chapterNumber];
  }

  // Comprobar índice rápido de historias offline en localStorage
  try {
    const rawIds = localStorage.getItem("ficnation_offline_ids");
    if (rawIds) {
      const ids: string[] = JSON.parse(rawIds);
      if (ids.includes(storyId)) {
        // Cargar a memoria de fondo para próximas lecturas
        getOfflineStoriesList().catch(() => {});
        return true;
      }
    }
  } catch {}

  return false;
}

/**
 * Obtener lista de historias descargadas
 */
export async function getOfflineStoriesList(): Promise<OfflineStory[]> {
  if (typeof window === "undefined") return [];
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    return await new Promise((resolve) => {
      req.onsuccess = () => {
        const result: OfflineStory[] = req.result || [];
        const ids: string[] = [];
        result.forEach((st) => {
          memoryCache.set(st.id, st);
          ids.push(st.id);
        });
        try {
          localStorage.setItem("ficnation_offline_ids", JSON.stringify(ids));
        } catch {}
        resolve(result);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return Array.from(memoryCache.values());
  }
}

/**
 * Eliminar una historia de la memoria offline
 */
export async function removeOfflineStory(storyId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  memoryCache.delete(storyId);
  try {
    const rawIds = localStorage.getItem("ficnation_offline_ids");
    if (rawIds) {
      const ids: string[] = JSON.parse(rawIds);
      localStorage.setItem("ficnation_offline_ids", JSON.stringify(ids.filter((id) => id !== storyId)));
    }
  } catch {}

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(storyId);
    window.dispatchEvent(new CustomEvent("ficnation_offline_removed", { detail: { storyId } }));
    return true;
  } catch {
    return false;
  }
}
