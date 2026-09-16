import { get, set, del, keys } from "idb-keyval";

/**
 * Servicio de Almacenamiento Offline de Alto Rendimiento (IndexedDB + Fallback).
 * Supera el límite de 5MB de localStorage y permite guardar novelas completas en Android.
 */

export async function setOfflineData<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value);
  } catch {
    // Fallback a localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    }
  }
}

export async function getOfflineData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const val = await get<T>(key);
    if (val !== undefined && val !== null) {
      return val;
    }
  } catch {}

  // Fallback a localStorage
  if (typeof window !== "undefined") {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
    } catch {}
  }

  return defaultValue;
}

export async function removeOfflineData(key: string): Promise<void> {
  try {
    await del(key);
  } catch {}
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

/**
 * Guarda una historia completa para lectura 100% offline en el dispositivo
 */
export async function cacheStoryOffline(story: any, chapters: any[]): Promise<void> {
  const storyKey = `fic_offline_story_${story.id}`;
  const chaptersKey = `fic_offline_chapters_${story.id}`;

  await setOfflineData(storyKey, story);
  await setOfflineData(chaptersKey, chapters);

  // Registrar en la lista de historias descargadas
  const downloadedIds = await getOfflineData<string[]>("fic_downloaded_stories_list", []);
  if (!downloadedIds.includes(story.id)) {
    downloadedIds.push(story.id);
    await setOfflineData("fic_downloaded_stories_list", downloadedIds);
  }
}
