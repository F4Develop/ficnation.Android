import { createClient } from "@/lib/supabase/client";

export interface ReadingProgressEntry {
  id: string;
  storyId: string;
  title: string;
  synopsis?: string;
  genre?: string;
  coverUrl?: string;
  coverImage?: string;
  author: {
    id?: string;
    name: string;
    username: string;
    avatar: string;
  };
  status: "leyendo" | "sin_iniciar" | "terminadas";
  currentChapter: number;
  totalChapters: number;
  progressPercent: number;
  lastReadDate: string;
  updatedAt?: string;
}

/**
 * Registra o actualiza el avance de lectura de una historia.
 * - Si isCompleted = true: status pasa a "terminadas", progressPercent = 100%.
 * - Si está en lectura: status pasa a "leyendo", progressPercent calculado según capítulo.
 * Sincroniza tanto en localStorage (`ficnation_library`, `ficnation_continue_reading`)
 * como en la tabla `library_entries` de Supabase.
 */
export async function updateReadingProgress(params: {
  storyId: string;
  storyTitle?: string;
  synopsis?: string;
  genre?: string;
  coverUrl?: string;
  author?: {
    id?: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
  chapterNumber: number;
  totalChapters: number;
  isCompleted?: boolean;
  userId?: string;
}): Promise<{ status: "leyendo" | "terminadas"; progressPercent: number }> {
  const {
    storyId,
    storyTitle = "Historia sin título",
    synopsis = "",
    genre = "Fantasía",
    coverUrl = "",
    author = {
      name: "Autor",
      username: "autor",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    },
    chapterNumber,
    totalChapters,
    isCompleted = false,
    userId,
  } = params;

  const safeTotal = Math.max(1, totalChapters || 1);
  const safeCurrent = Math.max(1, chapterNumber || 1);

  const status: "leyendo" | "terminadas" = isCompleted ? "terminadas" : "leyendo";
  const progressPercent: number = isCompleted
    ? 100
    : Math.min(99, Math.max(5, Math.round((safeCurrent / safeTotal) * 100)));

  const nowFormatted = new Date().toLocaleDateString("es-ES");
  const nowIso = new Date().toISOString();

  // 1. Sincronizar en localStorage
  if (typeof window !== "undefined") {
    try {
      const savedLibrary: ReadingProgressEntry[] = JSON.parse(
        localStorage.getItem("ficnation_library") || "[]"
      );

      const existingIndex = savedLibrary.findIndex(
        (item) => item.storyId === storyId || item.id === storyId
      );

      const updatedEntry: ReadingProgressEntry = {
        id: storyId,
        storyId: storyId,
        title: storyTitle || (existingIndex >= 0 ? savedLibrary[existingIndex].title : "Historia"),
        synopsis: synopsis || (existingIndex >= 0 ? savedLibrary[existingIndex].synopsis : ""),
        genre: genre || (existingIndex >= 0 ? savedLibrary[existingIndex].genre : "Fantasía"),
        coverImage: coverUrl || (existingIndex >= 0 ? (savedLibrary[existingIndex].coverImage || savedLibrary[existingIndex].coverUrl) : ""),
        coverUrl: coverUrl || (existingIndex >= 0 ? (savedLibrary[existingIndex].coverUrl || savedLibrary[existingIndex].coverImage) : ""),
        author: {
          id: author.id || (existingIndex >= 0 ? savedLibrary[existingIndex].author?.id : ""),
          name: author.name || (existingIndex >= 0 ? savedLibrary[existingIndex].author?.name : "Autor"),
          username: author.username || (existingIndex >= 0 ? savedLibrary[existingIndex].author?.username : "autor"),
          avatar: author.avatar || (existingIndex >= 0 ? savedLibrary[existingIndex].author?.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"),
        },
        status,
        currentChapter: safeCurrent,
        totalChapters: safeTotal,
        progressPercent,
        lastReadDate: nowFormatted,
        updatedAt: nowIso,
      };

      if (existingIndex >= 0) {
        savedLibrary[existingIndex] = {
          ...savedLibrary[existingIndex],
          ...updatedEntry,
        };
      } else {
        savedLibrary.unshift(updatedEntry);
      }

      localStorage.setItem("ficnation_library", JSON.stringify(savedLibrary));

      // Guardar también en la lista dedicada de "continuar leyendo"
      const continueList: ReadingProgressEntry[] = savedLibrary.filter(
        (s) => s.status === "leyendo"
      );
      localStorage.setItem("ficnation_continue_reading", JSON.stringify(continueList));

      // Actualizar racha diaria de lectura
      recordReadingStreak(`${storyId}-${safeCurrent}`);

      // Disparar evento para actualizar componentes en tiempo real
      window.dispatchEvent(new Event("ficnation_reading_updated"));
    } catch {}
  }

  // 2. Sincronizar en Supabase si el usuario está autenticado
  if (userId) {
    try {
      const supabase = createClient();
      await supabase.from("library_entries").upsert(
        {
          user_id: userId,
          story_id: storyId,
          status: isCompleted ? "completado" : "leyendo",
          current_chapter: safeCurrent,
          progress_percent: progressPercent,
          updated_at: nowIso,
        },
        { onConflict: "user_id,story_id" }
      );
    } catch {}
  }

  return { status, progressPercent };
}

/**
 * Obtiene la lista de historias en curso para la sección "Continuar Leyendo".
 */
export async function getContinueReadingStories(userId?: string): Promise<ReadingProgressEntry[]> {
  let list: ReadingProgressEntry[] = [];

  // 1. Cargar desde localStorage primero (instantáneo)
  if (typeof window !== "undefined") {
    try {
      const savedLibrary: ReadingProgressEntry[] = JSON.parse(
        localStorage.getItem("ficnation_library") || "[]"
      );
      list = savedLibrary.filter((s) => s.status === "leyendo" && s.progressPercent < 100);
    } catch {}
  }

  // 2. Cargar desde Supabase si hay usuario
  if (userId) {
    try {
      const supabase = createClient();
      const { data: entries, error } = await supabase
        .from("library_entries")
        .select(`
          id,
          story_id,
          status,
          current_chapter,
          progress_percent,
          updated_at,
          stories!story_id (
            id,
            title,
            synopsis,
            genre,
            cover_url,
            is_completed,
            author_id,
            profiles!author_id (
              id,
              name,
              username,
              avatar_url
            ),
            chapters (id)
          )
        `)
        .eq("user_id", userId)
        .eq("status", "leyendo")
        .order("updated_at", { ascending: false });

      if (entries && !error && entries.length > 0) {
        const fromDb: ReadingProgressEntry[] = entries.map((item: any) => {
          const s = item.stories;
          const author = s?.profiles;
          return {
            id: item.story_id,
            storyId: item.story_id,
            title: s?.title || "Historia sin título",
            synopsis: s?.synopsis || "",
            genre: s?.genre || "Fantasía",
            coverUrl: s?.cover_url,
            coverImage: s?.cover_url,
            author: {
              id: author?.id || s?.author_id,
              name: author?.name || "Autor",
              username: author?.username || "autor",
              avatar: author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            },
            status: "leyendo",
            currentChapter: item.current_chapter || 1,
            totalChapters: s?.chapters?.length || 1,
            progressPercent: item.progress_percent || 10,
            lastReadDate: new Date(item.updated_at).toLocaleDateString("es-ES"),
            updatedAt: item.updated_at,
          };
        });

        // Combinar evitando duplicados
        const combinedMap = new Map<string, ReadingProgressEntry>();
        fromDb.forEach((item) => combinedMap.set(item.storyId, item));
        list.forEach((item) => {
          if (!combinedMap.has(item.storyId)) {
            combinedMap.set(item.storyId, item);
          }
        });

        list = Array.from(combinedMap.values());
      }
    } catch {}
  }

  return list;
}

export interface ReadingStreakData {
  streak: number;
  todayChaptersCount: number;
  dailyGoal: number;
  lastReadDate: string;
}

/**
 * Obtiene la racha real de lectura y el avance diario.
 */
export function getReadingStreak(): ReadingStreakData {
  if (typeof window === "undefined") {
    return { streak: 1, todayChaptersCount: 0, dailyGoal: 3, lastReadDate: "" };
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const raw = localStorage.getItem("ficnation_reading_streak");
    
    if (!raw) {
      const library: ReadingProgressEntry[] = JSON.parse(localStorage.getItem("ficnation_library") || "[]");
      const initialStreak = library.length > 0 ? Math.min(3, library.length) : 1;
      const initialData: ReadingStreakData = {
        streak: initialStreak,
        todayChaptersCount: Math.min(initialStreak, 2),
        dailyGoal: 3,
        lastReadDate: today,
      };
      localStorage.setItem("ficnation_reading_streak", JSON.stringify(initialData));
      return initialData;
    }

    const data: ReadingStreakData = JSON.parse(raw);
    const lastDate = data.lastReadDate;

    if (!lastDate) {
      return { ...data, streak: 1, todayChaptersCount: 0, dailyGoal: data.dailyGoal || 3 };
    }

    const lastTime = new Date(lastDate).getTime();
    const todayTime = new Date(today).getTime();
    const diffDays = Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { ...data, dailyGoal: data.dailyGoal || 3 };
    } else if (diffDays === 1) {
      return { ...data, todayChaptersCount: 0, dailyGoal: data.dailyGoal || 3 };
    } else {
      return { streak: 0, todayChaptersCount: 0, dailyGoal: data.dailyGoal || 3, lastReadDate: lastDate };
    }
  } catch {
    return { streak: 1, todayChaptersCount: 0, dailyGoal: 3, lastReadDate: "" };
  }
}

/**
 * Registra la lectura de un capítulo y actualiza la racha diaria.
 */
export function recordReadingStreak(chapterKey?: string): ReadingStreakData {
  if (typeof window === "undefined") {
    return { streak: 1, todayChaptersCount: 1, dailyGoal: 3, lastReadDate: "" };
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const current = getReadingStreak();
    const todayTime = new Date(today).getTime();
    const lastTime = current.lastReadDate ? new Date(current.lastReadDate).getTime() : 0;
    const diffDays = lastTime > 0 ? Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24)) : 999;

    let newStreak = current.streak;
    let newCount = current.todayChaptersCount;

    if (diffDays === 0) {
      newCount += 1;
    } else if (diffDays === 1) {
      newStreak = (current.streak || 0) + 1;
      newCount = 1;
    } else {
      newStreak = 1;
      newCount = 1;
    }

    const updated: ReadingStreakData = {
      streak: newStreak,
      todayChaptersCount: newCount,
      dailyGoal: current.dailyGoal || 3,
      lastReadDate: today,
    };

    localStorage.setItem("ficnation_reading_streak", JSON.stringify(updated));
    window.dispatchEvent(new Event("ficnation_streak_updated"));
    return updated;
  } catch {
    return { streak: 1, todayChaptersCount: 1, dailyGoal: 3, lastReadDate: "" };
  }
}
