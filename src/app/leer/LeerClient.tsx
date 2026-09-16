"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  Sparkles,
  BookOpen,
  Send,
  Sliders,
  Type,
  Check,
  Loader2,
  PenTool,
  Trophy,
  CheckCircle2,
  BookmarkCheck,
  Home,
  Bookmark,
  Languages,
  RotateCcw,
  Globe,
  AlertCircle,
  Heart,
  Gift,
  Download,
  WifiOff,
  Wifi,
  CalendarClock,
  Lock,
  Layers,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { createClient } from "@/lib/supabase/client";
import { sendNotification } from "@/lib/notifications";
import { updateReadingProgress } from "@/lib/readingProgress";
import { GiftAuthorModal } from "@/components/monetization/GiftAuthorModal";
import { AmbientAudioPlayer } from "@/components/reader/AmbientAudioPlayer";
import {
  saveChapterForOffline,
  getOfflineChapter,
  getOfflineChapterAsync,
  isStoryAvailableOffline,
} from "@/lib/offlineReader";
import {
  hasUserVotedStory,
  hasUserVotedChapter,
  toggleChapterVote,
  toggleStoryVote,
  recordUniqueStoryView,
} from "@/lib/storyInteractions";
import {
  SUPPORTED_LANGUAGES,
  translateChapter,
  getLanguageByCode,
} from "@/lib/translator";
import {
  ReaderInsertModal,
  ReaderInsertHeaderButton,
  getStoredReaderName,
  getStoredReaderLastName,
  replaceTnCommands,
} from "@/components/reader/ReaderInsertModal";
import { ReadingPetCompanion } from "@/components/reader/ReadingPetCompanion";
import { CommentBubble } from "@/components/comments/CommentBubble";
import { getUserEquippedCosmetics, progressPetEggReading } from "@/lib/inventoryStorage";
import { CATALOG_ITEMS } from "@/types/inventory";
import {
  ParagraphReactionWidget,
  getStoredChapterReactions,
  getStoredUserReactions,
  type ParagraphReactionsMap,
  type UserReactionsMap,
} from "@/components/reader/ParagraphReactions";

// Temas de fondo de lectura (Blanco puro por defecto)
const READING_THEMES = {
  light: { name: "Blanco / Día", bg: "bg-white", text: "text-zinc-900", border: "border-zinc-200" },
  deep: { name: "Cósmico", bg: "bg-[#080511]", text: "text-purple-100", border: "border-purple-900/30" },
  oled: { name: "OLED", bg: "bg-[#000000]", text: "text-zinc-100", border: "border-zinc-800" },
  sepia: { name: "Sepia Cálido", bg: "bg-[#fbf0df]", text: "text-[#2b221b]", border: "border-[#e0d0b8]" },
};

export default function ChapterReaderPage() {
  const params = useParams();
  const router = useRouter();
  const { user, addXp } = useAuth();
  const { appTheme } = useSettings();

  const searchParams = useSearchParams();
  const storyId = Array.isArray(params?.storyId) ? params.storyId[0] : (params?.storyId as string) || searchParams?.get("storyId") || searchParams?.get("id") || "";
  const chapterNumber = Number(Array.isArray(params?.chapterNumber) ? params.chapterNumber[0] : params?.chapterNumber || searchParams?.get("chapter") || 1);

  // Estados de Personalización del Lector (Blanco por defecto)
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<"serif" | "sans" | "mono">("serif");
  const [theme, setTheme] = useState<"deep" | "oled" | "sepia" | "light">("light");
  const [maxWidth, setMaxWidth] = useState<"compact" | "normal" | "wide">("normal");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Cargar preferencia guardada o mantener blanco ("light") por defecto
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("ficnation_reader_theme") as "deep" | "oled" | "sepia" | "light" | null;
      if (savedTheme && ["deep", "oled", "sepia", "light"].includes(savedTheme)) {
        setTheme(savedTheme);
      } else {
        setTheme("light");
      }
    }
  }, []);

  // Estados de Traducción con IA & Soporte Multilingüe
  const [selectedLang, setSelectedLang] = useState<string>("original");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [translationProvider, setTranslationProvider] = useState<string>("");
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Datos reales de la historia y del capítulo desde Supabase
  const [storyTitle, setStoryTitle] = useState("Historia");
  const [storyGenre, setStoryGenre] = useState("Fantasía");
  const [storySynopsis, setStorySynopsis] = useState("");
  const [storyCover, setStoryCover] = useState("");
  const [storyAgeRating, setStoryAgeRating] = useState<string>("TP");
  const [storyContentWarnings, setStoryContentWarnings] = useState<string[]>([]);
  const [authorName, setAuthorName] = useState("Autor");
  const [authorAvatar, setAuthorAvatar] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [chapterTitle, setChapterTitle] = useState(`Capítulo ${chapterNumber}`);
  const [chapterContent, setChapterContent] = useState("");
  const [chapterVolumeTitle, setChapterVolumeTitle] = useState<string | null>(null);
  const [chapterScheduledAt, setChapterScheduledAt] = useState<string | null>(null);
  const [totalChapters, setTotalChapters] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isDownloadedOffline, setIsDownloadedOffline] = useState(false);

  // Modal de finalización de obra
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Progreso de lectura en scroll
  const [scrollProgress, setScrollProgress] = useState(0);

  // Voto y Recompensas
  const [hasVotedChapter, setHasVotedChapter] = useState(false);
  const [showXpReward, setShowXpReward] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

  // Comentarios del capítulo
  const [commentText, setCommentText] = useState("");
  const [chapterComments, setChapterComments] = useState<any[]>([]);

  // Estados de Protagonista T/N (Reader Insert)
  const [isReaderInsertStory, setIsReaderInsertStory] = useState(false);
  const [readerCustomName, setReaderCustomName] = useState("");
  const [readerCustomLastName, setReaderCustomLastName] = useState("");
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);

  // Estados de Micro-Reacciones en Párrafos
  const [chapterReactions, setChapterReactions] = useState<ParagraphReactionsMap>({});
  const [userReactions, setUserReactions] = useState<UserReactionsMap>({});

  // Cosméticos equipados (Marcador, Mascota, Burbuja)
  const [equippedCosmetics, setEquippedCosmetics] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const loadCosmetics = () => {
      setEquippedCosmetics(getUserEquippedCosmetics(user.id));
    };
    loadCosmetics();
    window.addEventListener("ficnation_cosmetics_updated", loadCosmetics);
    return () => window.removeEventListener("ficnation_cosmetics_updated", loadCosmetics);
  }, [user]);

  const equippedBookmark = CATALOG_ITEMS.find((c) => c.id === equippedCosmetics?.bookmarkId);

  // Progresión de incubación de huevos de lectura al avanzar capítulos
  useEffect(() => {
    if (user?.id && storyId) {
      const incubationResult = progressPetEggReading(user.id, 1);
      if (incubationResult.hatched && incubationResult.hatchedPet) {
        alert(`🎉 ¡Uno de tus Huevos de Lectura ha eclosionado! Ahora tienes a "${incubationResult.hatchedPet.name}" en tu inventario.`);
      }
    }
  }, [storyId, chapterNumber, user?.id]);

  // Función para guardar / alternar descarga offline
  const handleToggleOfflineSave = async () => {
    const success = await saveChapterForOffline(
      {
        id: storyId,
        title: storyTitle,
        genre: storyGenre,
        synopsis: storySynopsis,
        coverUrl: storyCover,
        authorName,
        authorAvatar,
        authorId,
      },
      {
        chapterNumber,
        title: chapterTitle,
        content: chapterContent,
        wordCount: chapterContent.trim().split(/\s+/).length,
      }
    );
    if (success) {
      setIsDownloadedOffline(true);
    }
  };

  // Cargar historia y capítulo desde Supabase (con fallback Offline y Lazy Prefetching)
  useEffect(() => {
    // Comprobar si ya está descargado offline
    if (typeof window !== "undefined" && storyId) {
      setIsDownloadedOffline(isStoryAvailableOffline(storyId, chapterNumber));
      setIsOfflineMode(!navigator.onLine);
    }

    // Cargar comentarios locales para este capítulo
    if (typeof window !== "undefined" && storyId) {
      try {
        const savedComments = localStorage.getItem(`ficnation_comments_${storyId}_${chapterNumber}`);
        if (savedComments) {
          setChapterComments(JSON.parse(savedComments));
        } else {
          setChapterComments([]);
        }
      } catch {
        setChapterComments([]);
      }
    }

    // Cargar nombre de protagonista T/N y micro-reacciones del capítulo
    if (typeof window !== "undefined" && storyId) {
      const storedName = getStoredReaderName(storyId);
      const storedLastName = getStoredReaderLastName(storyId);
      setReaderCustomName(storedName);
      setReaderCustomLastName(storedLastName);

      setChapterReactions(getStoredChapterReactions(storyId, chapterNumber));
      setUserReactions(getStoredUserReactions(storyId, chapterNumber));
    }

    async function loadChapterData() {
      if (!storyId) return;
      setIsLoading(true);

      // Comprobar si no hay conexión para usar el modo offline directo
      if (typeof window !== "undefined" && !navigator.onLine) {
        const offlineData = await getOfflineChapterAsync(storyId, chapterNumber);
        if (offlineData) {
          setStoryTitle(offlineData.story.title);
          setStorySynopsis(offlineData.story.synopsis);
          setStoryGenre(offlineData.story.genre);
          setStoryCover(offlineData.story.coverUrl);
          setAuthorName(offlineData.story.authorName);
          setChapterTitle(offlineData.chapter.title);
          setChapterContent(offlineData.chapter.content);
          setTotalChapters(Object.keys(offlineData.story.chapters).length || 1);
          setIsOfflineMode(true);
          setIsLoading(false);
          return;
        }
      }

      try {
        const supabase = createClient();

        let loadedTitle = "Historia";
        let loadedSynopsis = "";
        let loadedGenre = "Fantasía";
        let loadedCover = "";
        let loadedAuthorId = "";
        let loadedAuthorName = "Autor";
        let loadedAuthorAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";
        let loadedTotalChapters = 1;
        let loadedChapterTitle = `Capítulo ${chapterNumber}`;
        let loadedChapterContent = "";

        // 1. Cargar datos de la historia
        const { data: dbStory } = await supabase
          .from("stories")
          .select(`
            id,
            title,
            synopsis,
            genre,
            tags,
            cover_url,
            author_id,
            age_rating,
            content_warnings,
            is_reader_insert,
            profiles!author_id (id, name, username, avatar_url)
          `)
          .eq("id", storyId)
          .maybeSingle();

        if (dbStory) {
          loadedTitle = dbStory.title || "Historia";
          loadedSynopsis = dbStory.synopsis || "";
          loadedGenre = dbStory.genre || "Fantasía";
          loadedCover = dbStory.cover_url || "";
          loadedAuthorId = dbStory.author_id || "";

          const author = dbStory.profiles as any;
          if (author?.name) loadedAuthorName = author.name;
          if (author?.avatar_url) loadedAuthorAvatar = author.avatar_url;

          setStoryTitle(loadedTitle);
          setStorySynopsis(loadedSynopsis);
          setStoryGenre(loadedGenre);
          setStoryCover(loadedCover);
          setStoryAgeRating(dbStory.age_rating || "TP");
          setStoryContentWarnings(dbStory.content_warnings || []);
          setAuthorId(loadedAuthorId);
          setAuthorName(loadedAuthorName);
          setAuthorAvatar(loadedAuthorAvatar);
        } else {
          try {
            const localUserStories = JSON.parse(localStorage.getItem("ficnation_user_stories") || "[]");
            const localStory = localUserStories.find((s: any) => s.id === storyId);
            if (localStory) {
              setStoryTitle(localStory.title);
              setStorySynopsis(localStory.synopsis || "");
              setStoryGenre(localStory.genre || "Fantasía");
              setStoryCover(localStory.coverImage || "");
              setAuthorName("Tú");
              setTotalChapters(localStory.chapters || 1);
            }
          } catch {}
        }

        // 2. Cargar total de capítulos
        const isOwner = user?.id && (user.id === loadedAuthorId);
        let chapQuery = supabase
          .from("chapters")
          .select("id, chapter_number, title, is_published")
          .eq("story_id", storyId)
          .order("chapter_number", { ascending: true });

        if (!isOwner) {
          chapQuery = chapQuery.eq("is_published", true);
        }

        const { data: allChapters } = await chapQuery;

        if (allChapters && allChapters.length > 0) {
          loadedTotalChapters = allChapters.length;
          setTotalChapters(loadedTotalChapters);
        }

        // 3. Cargar el capítulo actual
        const { data: currentChap } = await supabase
          .from("chapters")
          .select("*")
          .eq("story_id", storyId)
          .eq("chapter_number", chapterNumber)
          .maybeSingle();

        if (currentChap) {
          if (currentChap.is_published === false && !isOwner) {
            loadedChapterTitle = `Capítulo ${chapterNumber}`;
            loadedChapterContent = "Este capítulo se encuentra actualmente en borrador o en revisión privada y aún no ha sido publicado oficialmente por el autor.";
          } else {
            loadedChapterTitle = currentChap.title || `Capítulo ${chapterNumber}`;
            loadedChapterContent = currentChap.content || "Capítulo sin contenido.";
          }
          setChapterTitle(loadedChapterTitle);
          setChapterContent(loadedChapterContent);
          setChapterVolumeTitle(currentChap.volume_title || null);
          setChapterScheduledAt(currentChap.scheduled_at || null);
        } else {
          loadedChapterTitle = `Capítulo ${chapterNumber}: El Despertar del Héroe`;
          loadedChapterContent = [
            "El silencio en la colina era absoluto, roto únicamente por el crujido de las hojas bajo sus botas. Las luces de la ciudad lejana parpadeaban a través de la densa niebla como luciérnagas dormidas.",
            "Respiró hondo. El viento helado de la medianoche le recordaba las palabras que su maestro le había grabado en la memoria antes de partir: 'No busques la gloria en el filo de tu espada, encuéntrala en el motivo que te impulsa a sostenerla'.",
            "Apretó el mango de su arma. Una vibración sutil, casi imperceptible pero cargada de energía arcana, recorrió el metal. Algo se aproximaba desde las sombras del bosque. No era una bestia ordinaria; el aura que distorsionaba el aire alrededor pertenecía a un poder antiguo que el reino creía extinto hace siglos.",
            "Frente a él, las ramas se abrieron revelando un par de ojos luminosos de tono violeta profundo. Dio un paso al frente, listo para escribir el primer verso de su propio destino.",
          ].join("\n\n");
          setChapterTitle(loadedChapterTitle);
          setChapterContent(loadedChapterContent);
          setChapterVolumeTitle(null);
          setChapterScheduledAt(null);
        }

        // 4. Soporte para historias y capítulos creados por el autor en esta sesión / local
        if (typeof window !== "undefined") {
          try {
            const localUserStories = JSON.parse(localStorage.getItem("ficnation_user_stories") || "[]");
            const localStory = localUserStories.find((s: any) => s.id === storyId);
            if (localStory) {
              loadedTitle = localStory.title || loadedTitle;
              loadedSynopsis = localStory.synopsis || loadedSynopsis;
              loadedGenre = localStory.genre || loadedGenre;
              loadedCover = localStory.coverUrl || loadedCover;
              setStoryTitle(loadedTitle);
              setStorySynopsis(loadedSynopsis);
              setStoryGenre(loadedGenre);
              setStoryCover(loadedCover);
              setStoryAgeRating(localStory.ageRating || "TP");
              setStoryContentWarnings(localStory.contentWarnings || []);
            }

            const localChapters = JSON.parse(localStorage.getItem(`ficnation_chapters_${storyId}`) || "[]");
            if (localChapters && localChapters.length > 0) {
              loadedTotalChapters = Math.max(loadedTotalChapters, localChapters.length);
              setTotalChapters(loadedTotalChapters);
              const localChap = localChapters.find((c: any) => c.chapterNumber === chapterNumber);
              if (localChap && (!currentChap || !currentChap.content)) {
                loadedChapterTitle = localChap.title || `Capítulo ${chapterNumber}`;
                loadedChapterContent = localChap.content || "Capítulo sin contenido.";
                setChapterTitle(loadedChapterTitle);
                setChapterContent(loadedChapterContent);
                setChapterVolumeTitle(localChap.volumeTitle || null);
                setChapterScheduledAt(localChap.scheduledAt || null);
              }
            }
          } catch {}
        }

        // Detección automática inteligente de Protagonista T/N (Reader Insert)
        const tags = (dbStory?.tags as string[]) || [];
        const isTnStory =
          Boolean((dbStory as any)?.is_reader_insert) ||
          tags.some((t: string) =>
            ["reader_insert", "tn_protagonist", "t/n", "tn", "y/n", "tu nombre"].includes(String(t).toLowerCase())
          ) ||
          /\b(?:T\/N|t\/n|Y\/N|y\/n)\b|\[(?:T\/N|t\/n|Y\/N|y\/n)\]/i.test(loadedChapterContent) ||
          /\b(?:T\/N|t\/n|Y\/N|y\/n)\b|\[(?:T\/N|t\/n|Y\/N|y\/n)\]/i.test(loadedSynopsis);

        if (isTnStory) {
          setIsReaderInsertStory(true);
          const currentStoredName = getStoredReaderName(storyId);
          if (!currentStoredName) {
            setIsReaderModalOpen(true);
          }
        }

        // 5. AUTO-CACHE PARA LECTURA OFFLINE
        saveChapterForOffline(
          {
            id: storyId,
            title: loadedTitle,
            genre: loadedGenre,
            synopsis: loadedSynopsis,
            coverUrl: loadedCover,
            authorName: loadedAuthorName,
            authorAvatar: loadedAuthorAvatar,
            authorId: loadedAuthorId,
          },
          {
            chapterNumber,
            title: loadedChapterTitle,
            content: loadedChapterContent,
            wordCount: loadedChapterContent.trim().split(/\s+/).length,
          }
        );
        setIsDownloadedOffline(true);

        // 6. LAZY LOADING / PRECARGA INVISIBLE DEL SIGUIENTE CAPÍTULO (N+1)
        if (chapterNumber < loadedTotalChapters) {
          const nextChapNum = chapterNumber + 1;
          supabase
            .from("chapters")
            .select("*")
            .eq("story_id", storyId)
            .eq("chapter_number", nextChapNum)
            .maybeSingle()
            .then(
              ({ data: nextData }) => {
                if (nextData) {
                  saveChapterForOffline(
                    {
                      id: storyId,
                      title: loadedTitle,
                      genre: loadedGenre,
                      synopsis: loadedSynopsis,
                      coverUrl: loadedCover,
                      authorName: loadedAuthorName,
                      authorAvatar: loadedAuthorAvatar,
                      authorId: loadedAuthorId,
                    },
                    {
                      chapterNumber: nextChapNum,
                      title: nextData.title,
                      content: nextData.content,
                      wordCount: nextData.word_count || 0,
                    }
                  );
                }
              },
              () => {}
            );
        }

        // 7. Registrar automáticamente la lectura en progreso en biblioteca y dashboard
        updateReadingProgress({
          storyId,
          storyTitle: loadedTitle,
          synopsis: loadedSynopsis,
          genre: loadedGenre,
          coverUrl: loadedCover,
          author: {
            id: loadedAuthorId,
            name: loadedAuthorName,
            avatar: loadedAuthorAvatar,
          },
          chapterNumber,
          totalChapters: loadedTotalChapters,
          isCompleted: false,
          userId: user?.id,
        });

        // REGISTRAR VISTA POR CAPÍTULO LEÍDO
        recordUniqueStoryView({
          storyId,
          chapterNumber,
          userId: user?.id,
        });

        // Cargar estado de voto / estrella específico para este capítulo
        const voted = hasUserVotedChapter(storyId, chapterNumber, user?.id);
        setHasVotedChapter(voted);

        // 6. Cargar comentarios de Supabase
        const { data: dbComments } = await supabase
          .from("comments")
          .select(`
            id,
            content,
            likes_count,
            created_at,
            user_id,
            profiles!user_id (
              name,
              avatar_url
            )
          `)
          .eq("story_id", storyId)
          .eq("chapter_number", chapterNumber)
          .order("created_at", { ascending: false });

        if (dbComments && dbComments.length > 0) {
          setChapterComments(
            dbComments.map((c: any) => ({
              id: c.id,
              author: c.profiles?.name || "Lector",
              avatar: c.profiles?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
              text: c.content,
              time: new Date(c.created_at).toLocaleDateString("es-ES"),
              likes: c.likes_count || 0,
            }))
          );
        }
      } catch {
        // Fallback local
        if (typeof window !== "undefined") {
          try {
            const localChapters = JSON.parse(localStorage.getItem(`ficnation_chapters_${storyId}`) || "[]");
            const localChap = localChapters.find((c: any) => c.chapterNumber === chapterNumber);
            if (localChap) {
              setChapterTitle(localChap.title || `Capítulo ${chapterNumber}`);
              setChapterContent(localChap.content || "Capítulo sin contenido.");
            }
          } catch {}
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadChapterData();
  }, [storyId, chapterNumber, user?.id]);

  // Escuchar eventos globales de votos
  useEffect(() => {
    const handleStoryVoted = (e: any) => {
      if (e.detail && e.detail.storyId === storyId) {
        setHasVotedChapter(e.detail.hasVoted);
      }
    };
    window.addEventListener("ficnation_story_voted", handleStoryVoted);
    return () => window.removeEventListener("ficnation_story_voted", handleStoryVoted);
  }, [storyId]);

  // Completar historia
  const handleFinishStory = async () => {
    await updateReadingProgress({
      storyId,
      storyTitle,
      synopsis: storySynopsis,
      genre: storyGenre,
      coverUrl: storyCover,
      author: {
        id: authorId,
        name: authorName,
        avatar: authorAvatar,
      },
      chapterNumber,
      totalChapters,
      isCompleted: true,
      userId: user?.id,
    });

    addXp(30, "Historia Completada");
    setIsCompleted(true);
    setShowCompletionModal(true);
  };

  // Seguimiento del scroll de lectura
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const currentProgress = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleVoteChapter = async () => {
    const { hasVoted: nextVoted } = await toggleChapterVote({
      storyId,
      chapterNumber,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
      storyTitle,
      authorId,
    });

    setHasVotedChapter(nextVoted);

    if (nextVoted) {
      setShowXpReward(true);
      setTimeout(() => setShowXpReward(false), 3000);
      addXp(15, `Estrella a Capítulo ${chapterNumber}`);
    }
  };

  // Alternar Micro-Reacción a un Párrafo específico
  const handleToggleReaction = (paragraphIndex: number, emoji: string) => {
    let hadVoted = false;

    setUserReactions((prevUser) => {
      const currentVoted = prevUser[paragraphIndex] || [];
      const hasVoted = currentVoted.includes(emoji);
      hadVoted = hasVoted;
      const newVoted = hasVoted
        ? currentVoted.filter((e) => e !== emoji)
        : [...currentVoted, emoji];

      const updatedUser = { ...prevUser, [paragraphIndex]: newVoted };
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `ficnation_user_p_reactions_${storyId}_ch_${chapterNumber}`,
          JSON.stringify(updatedUser)
        );
      }
      return updatedUser;
    });

    setChapterReactions((prevAll) => {
      const currentMap = prevAll[paragraphIndex] || {};
      const currentCount = currentMap[emoji] || 0;
      const newCount = hadVoted ? Math.max(0, currentCount - 1) : currentCount + 1;

      const updatedMap = {
        ...prevAll,
        [paragraphIndex]: {
          ...currentMap,
          [emoji]: newCount,
        },
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(
          `ficnation_p_reactions_${storyId}_ch_${chapterNumber}`,
          JSON.stringify(updatedMap)
        );
      }
      return updatedMap;
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const titleItem = equippedCosmetics?.titleId ? CATALOG_ITEMS.find((i) => i.id === equippedCosmetics.titleId) : null;

    const newC = {
      id: `c-${Date.now()}`,
      author: user?.name || "Lector",
      avatar: user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      text: commentText.trim(),
      time: "Ahora mismo",
      likes: 0,
      bubbleSkinId: equippedCosmetics?.bubbleId || null,
      avatarFrameId: equippedCosmetics?.frameId || null,
      avatarAuraId: equippedCosmetics?.auraId || null,
      titleName: titleItem?.name || null,
    };

    const nextComments = [newC, ...chapterComments];
    setChapterComments(nextComments);
    if (typeof window !== "undefined" && storyId) {
      localStorage.setItem(`ficnation_comments_${storyId}_${chapterNumber}`, JSON.stringify(nextComments));
    }

    if (user && storyId) {
      try {
        const supabase = createClient();
        supabase.from("comments").insert({
          story_id: storyId,
          chapter_number: chapterNumber,
          user_id: user.id,
          content: commentText.trim(),
          likes_count: 0,
        }).then();
      } catch {}
    }

    // Otorgar XP al comentar
    addXp(10, "Comentario en capítulo");

    // Notificar al autor de la historia
    if (user && authorId) {
      sendNotification({
        recipientId: authorId,
        actor: {
          id: user.id,
          name: user.name || "Usuario",
          avatar: user.avatar,
        },
        type: "comment",
        storyId,
        storyTitle,
        chapterNumber,
        customMessage: `${user.name || "Un lector"} comentó en "${storyTitle}" (Capítulo ${chapterNumber}).`,
      });
    }

    setCommentText("");
  };

  // Manejador de traducción con IA / API
  const handleSelectLanguage = async (langCode: string) => {
    setIsLangMenuOpen(false);
    if (langCode === "original") {
      setSelectedLang("original");
      setTranslatedTitle(null);
      setTranslatedContent(null);
      setTranslationError(null);
      return;
    }

    if (!chapterContent || isPendingChapter) return;

    setSelectedLang(langCode);
    setIsTranslating(true);
    setTranslationError(null);

    try {
      const res = await translateChapter({
        storyId,
        chapterNumber,
        title: chapterTitle,
        content: chapterContent,
        targetLang: langCode,
      });

      setTranslatedTitle(res.translatedTitle);
      setTranslatedContent(res.translatedContent);
      setTranslationProvider(res.provider);
    } catch (err: any) {
      setTranslationError(err?.message || "Error al traducir el capítulo");
      setSelectedLang("original");
    } finally {
      setIsTranslating(false);
    }
  };

  // Re-traducir automáticamente si se cambia de capítulo con un idioma activo
  useEffect(() => {
    if (selectedLang !== "original" && chapterContent && !isPendingChapter) {
      handleSelectLanguage(selectedLang);
    } else {
      setTranslatedTitle(null);
      setTranslatedContent(null);
      setTranslationError(null);
    }
  }, [chapterNumber, storyId, chapterContent]);

  const currentTheme = READING_THEMES[theme];

  const widthClass = {
    compact: "max-w-2xl",
    normal: "max-w-3xl",
    wide: "max-w-4xl",
  }[maxWidth];

  const fontClass = {
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono",
  }[fontFamily];

  const isScheduledLocked = !isOfflineMode && !!chapterScheduledAt && new Date(chapterScheduledAt).getTime() > Date.now() && authorId !== user?.id;
  const isAuthorPreviewingScheduled = !!chapterScheduledAt && new Date(chapterScheduledAt).getTime() > Date.now() && authorId === user?.id;
  const isPendingChapter = !chapterContent || chapterContent === "Este capítulo aún no ha sido redactado por el autor.";
  const displayedTitle = selectedLang !== "original" && translatedTitle ? translatedTitle : chapterTitle;
  const rawDisplayedContent = selectedLang !== "original" && translatedContent ? translatedContent : chapterContent;
  const displayedContent = rawDisplayedContent.replace(/<!--\s*fic-reveal:\s*fade\s*-->/gi, "").trim();

  // Reemplazo de comandos T/N en tiempo real con el nombre del lector
  const contentWithTn = useMemo(() => {
    if (!displayedContent) return "";
    const shouldReplace =
      isReaderInsertStory ||
      Boolean(readerCustomName) ||
      /\b(?:T\/N|t\/n|Y\/N|y\/n)\b|\[(?:T\/N|t\/n|Y\/N|y\/n)\]/i.test(displayedContent);

    if (shouldReplace) {
      return replaceTnCommands(displayedContent, readerCustomName || "T/N", readerCustomLastName);
    }
    return displayedContent;
  }, [displayedContent, isReaderInsertStory, readerCustomName, readerCustomLastName]);

  // Descomposición en párrafos interactivos para micro-reacciones
  const paragraphs = useMemo(() => {
    if (!contentWithTn) return [];
    if (contentWithTn.includes("<p>") || contentWithTn.includes("<p ")) {
      const parts = contentWithTn.split(/<\/p>/i);
      const cleaned = parts
        .map((part) => part.replace(/<p[^>]*>/i, "").trim())
        .filter((part) => part.length > 0);
      if (cleaned.length > 0) return cleaned;
    }
    return contentWithTn
      .split(/\n{2,}|\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [contentWithTn]);

  const plainText = isPendingChapter || isScheduledLocked ? "" : displayedContent.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div
      data-reader-theme={theme}
      className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} transition-colors duration-300 relative`}
    >

      {/* ═══════════════════ 1. BARRA DE PROGRESO FIJA SUPERIOR ═══════════════════ */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50" style={{ background: "var(--reading-progress-track)" }}>
        <div
          className="h-full transition-all duration-150"
          style={{ width: `${scrollProgress}%`, background: "var(--reading-progress-fill)" }}
        />
      </div>

      {/* ═══════════════════ 2. HEADER FLOTANTE DEL LECTOR ═══════════════════ */}
      <header className="sticky top-0 z-40 w-full border-b fic-header backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          
          {/* Izquierda: Volver y Título */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/historia?id=${storyId}`}
              className="p-2 rounded-xl border transition-colors shrink-0 fic-card-secondary hover:scale-105"
              title="Volver a la historia"
            >
              <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {storyTitle}
                </h2>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border backdrop-blur-md shrink-0 ${
                  storyAgeRating === "+18"
                    ? "bg-rose-950/90 text-rose-300 border-rose-500/70 shadow-sm"
                    : storyAgeRating === "+16"
                    ? "bg-amber-950/90 text-amber-300 border-amber-500/60"
                    : storyAgeRating === "+13"
                    ? "bg-cyan-950/90 text-cyan-300 border-cyan-500/60"
                    : "bg-emerald-950/90 text-emerald-300 border-emerald-500/60"
                }`}>
                  {storyAgeRating}
                </span>
              </div>
              <p className="text-[11px] font-mono truncate" style={{ color: "var(--text-muted)" }}>
                {chapterVolumeTitle ? `${chapterVolumeTitle} • ` : ""}Capítulo {chapterNumber} de {totalChapters}
              </p>
            </div>
          </div>

          {/* Centro: Selector rápido de capítulos */}
          <div className="hidden md:flex items-center gap-2">
            <select
              value={chapterNumber}
              onChange={(e) => router.push(`/leer?storyId=${storyId}&chapter=${e.target.value}`)}
              className="rounded-xl px-3 py-1 text-xs border cursor-pointer fic-card-secondary"
            >
              {Array.from({ length: totalChapters }).map((_, i) => (
                <option key={i + 1} value={i + 1} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
                  Capítulo {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Derecha: Audio Ambiental, Descarga Offline, Traducción IA y Ajustes */}
          <div className="flex items-center gap-2">
            
            {/* Reproductor de Música Ambiental & Efectos Sonoros */}
            <AmbientAudioPlayer />

            {/* Botón de Protagonista T/N (Reader Insert) */}
            {isReaderInsertStory && (
              <ReaderInsertHeaderButton
                storyId={storyId}
                currentName={readerCustomName || "T/N"}
                onClick={() => setIsReaderModalOpen(true)}
              />
            )}

            {/* Botón Guardar Offline */}
            <button
              type="button"
              onClick={handleToggleOfflineSave}
              className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isDownloadedOffline
                  ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300"
                  : "fic-card-secondary hover:scale-105"
              }`}
              title={isDownloadedOffline ? "Capítulo guardado para lectura sin internet" : "Descargar capítulo para leer sin conexión"}
            >
              {isDownloadedOffline ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden lg:inline">
                {isDownloadedOffline ? "Offline Listo" : "Descargar"}
              </span>
            </button>

            {/* Botón de Traducción IA */}
            <button
              onClick={() => {
                setIsLangMenuOpen(!isLangMenuOpen);
                setIsSettingsOpen(false);
              }}
              className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isLangMenuOpen || selectedLang !== "original"
                  ? "fic-btn-primary shadow-sm"
                  : "fic-card-secondary hover:scale-105"
              }`}
              title="Traducir capítulo con IA"
            >
              {isTranslating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Languages className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {selectedLang === "original"
                  ? "Traducir"
                  : `${getLanguageByCode(selectedLang).flag} ${getLanguageByCode(selectedLang).code.toUpperCase()}`}
              </span>
            </button>

            {/* Botón de Ajustes */}
            <button
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen);
                setIsLangMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isSettingsOpen
                  ? "fic-btn-primary shadow-sm"
                  : "fic-card-secondary hover:scale-105"
              }`}
              title="Ajustes de lectura"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>
          </div>

        </div>

        {/* Banner de Modo Offline Activo */}
        {isOfflineMode && (
          <div className="bg-amber-500/15 border-t border-amber-500/30 px-4 py-1.5 text-center text-xs font-bold text-amber-500 dark:text-amber-300 flex items-center justify-center gap-2">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Estás leyendo en Modo Offline (sin conexión a internet)</span>
          </div>
        )}

        {/* ═══════════════════ MENÚ DESPLEGABLE DE TRADUCCIÓN IA ═══════════════════ */}
        {isLangMenuOpen && (
          <div className="border-t fic-card px-4 py-5 backdrop-blur-2xl shadow-2xl animate-fade-in-scale">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-xs sm:text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Traductor Literario con IA</span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                    style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                  >
                    Preserva Efectos Fic FX
                  </span>
                </div>
                {selectedLang !== "original" && (
                  <button
                    onClick={() => handleSelectLanguage("original")}
                    className="text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all cursor-pointer fic-card-secondary hover:scale-105"
                    style={{ color: "var(--text-badge)" }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Idioma Original</span>
                  </button>
                )}
              </div>

              {/* Grid de Idiomas Disponibles */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* Opción Original */}
                <button
                  onClick={() => handleSelectLanguage("original")}
                  disabled={isTranslating}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left cursor-pointer ${
                    selectedLang === "original"
                      ? "fic-btn-primary shadow-sm"
                      : "fic-card-secondary hover:opacity-85"
                  }`}
                >
                  <span className="text-base">📖</span>
                  <div className="min-w-0">
                    <p className="font-bold truncate" style={{ color: selectedLang === "original" ? "white" : "var(--text-primary)" }}>Original</p>
                    <p className="text-[10px] font-mono truncate" style={{ color: selectedLang === "original" ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>Texto del autor</p>
                  </div>
                </button>

                {/* Idiomas soportados */}
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    disabled={isTranslating}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left cursor-pointer ${
                      selectedLang === lang.code
                        ? "fic-btn-primary shadow-sm"
                        : "fic-card-secondary hover:opacity-85"
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <div className="min-w-0">
                      <p className="font-bold truncate" style={{ color: selectedLang === lang.code ? "white" : "var(--text-primary)" }}>{lang.name}</p>
                      <p className="text-[10px] font-mono truncate" style={{ color: selectedLang === lang.code ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>{lang.nativeName}</p>
                    </div>
                  </button>
                ))}
              </div>

              {translationError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-600 dark:text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{translationError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════ MENÚ DESPLEGABLE DE PERSONALIZACIÓN ═══════════════════ */}
        {isSettingsOpen && (
          <div className="border-t fic-card px-4 py-5 backdrop-blur-2xl shadow-2xl animate-fade-in-scale">
            <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              
              {/* 1. Tamaño de Fuente */}
              <div className="space-y-1.5">
                <span className="font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                  <Type className="w-3.5 h-3.5" style={{ color: "var(--text-badge)" }} /> Tamaño ({fontSize}px)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize((p) => Math.max(14, p - 2))}
                    className="p-1.5 rounded-lg border transition-colors flex-1 fic-card-secondary cursor-pointer hover:scale-105"
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setFontSize((p) => Math.min(26, p + 2))}
                    className="p-1.5 rounded-lg border transition-colors flex-1 fic-card-secondary cursor-pointer hover:scale-105"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* 2. Tipografía */}
              <div className="space-y-1.5">
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>Tipografía</span>
                <div className="grid grid-cols-3 gap-1">
                  {(["serif", "sans", "mono"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFontFamily(f)}
                      className={`p-1.5 rounded-lg text-[10px] font-bold capitalize transition-all border cursor-pointer ${
                        fontFamily === f
                          ? "fic-btn-primary shadow-sm"
                          : "fic-card-secondary hover:opacity-85"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Tema de Fondo */}
              <div className="space-y-1.5">
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>Fondo de Lectura</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(["light", "deep", "sepia", "oled"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTheme(t);
                        if (typeof window !== "undefined") {
                          localStorage.setItem("ficnation_reader_theme", t);
                        }
                      }}
                      className={`p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        theme === t
                          ? "fic-btn-primary shadow-sm"
                          : "fic-card-secondary hover:opacity-85"
                      }`}
                    >
                      {t === "light" ? "☀️ Blanco" : t === "deep" ? "🌌 Cósmico" : t === "sepia" ? "📜 Sepia" : "🖤 OLED"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Ancho de Lectura */}
              <div className="space-y-1.5">
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>Ancho</span>
                <div className="grid grid-cols-3 gap-1">
                  {(["compact", "normal", "wide"] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setMaxWidth(w)}
                      className={`p-1.5 rounded-lg text-[10px] font-bold capitalize transition-all border cursor-pointer ${
                        maxWidth === w
                          ? "fic-btn-primary shadow-sm"
                          : "fic-card-secondary hover:opacity-85"
                      }`}
                    >
                      {w === "compact" ? "Estrecho" : w === "normal" ? "Medio" : "Ancho"}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════ 3. CUERPO DE LECTURA DEL CAPÍTULO ═══════════════════ */}
      <main className={`mx-auto ${widthClass} px-5 sm:px-8 py-10 sm:py-16 space-y-10 relative`}>
        {/* Marcador de Lectura Equipado (Ribbon) */}
        {equippedBookmark && (
          <div
            className="absolute top-0 right-6 sm:right-10 z-20 flex flex-col items-center pointer-events-none drop-shadow-lg select-none"
            title={`Marcador de lectura: ${equippedBookmark.name}`}
          >
            <div className={`w-8 sm:w-9 h-14 sm:h-16 rounded-b-xl border-x-2 border-b-2 shadow-xl flex items-center justify-center pt-2 ${equippedBookmark.previewClass || "bg-red-600 text-amber-200"}`}>
              <span className="text-sm sm:text-base filter drop-shadow">{equippedBookmark.icon}</span>
            </div>
            <div className="w-0.5 h-3 bg-amber-400/80 -mt-0.5" />
          </div>
        )}
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
            <p className="text-xs text-purple-300/60 font-mono">Cargando capítulo...</p>
          </div>
        ) : (
          <>
            {/* Encabezado del Capítulo */}
            <div className="text-center space-y-3 pb-8 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {chapterVolumeTitle && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-300 shadow-xs">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>{chapterVolumeTitle}</span>
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full border shadow-xs"
                  style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
                >
                  Capítulo {chapterNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-md ${
                  storyAgeRating === "+18"
                    ? "bg-rose-950/90 text-rose-300 border-rose-500/70 shadow-sm"
                    : storyAgeRating === "+16"
                    ? "bg-amber-950/90 text-amber-300 border-amber-500/60"
                    : storyAgeRating === "+13"
                    ? "bg-cyan-950/90 text-cyan-300 border-cyan-500/60"
                    : "bg-emerald-950/90 text-emerald-300 border-emerald-500/60"
                }`}>
                  {storyAgeRating}
                </span>
              </div>

              {isAuthorPreviewingScheduled && (
                <div className="p-3 rounded-2xl border border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-xs flex items-center justify-center gap-2 font-medium max-w-xl mx-auto shadow-sm">
                  <CalendarClock className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    <strong>Vista Previa de Autor:</strong> Este capítulo está programado para tus lectores el{" "}
                    <strong>{new Date(chapterScheduledAt!).toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" })}</strong>.
                  </span>
                </div>
              )}

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
                {displayedTitle}
              </h1>

              {/* Banner Informativo de Idioma Traducido */}
              {selectedLang !== "original" && !isTranslating && (
                <div
                  className="inline-flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 rounded-2xl border text-xs shadow-md max-w-full fic-card-secondary"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                  <span className="truncate" style={{ color: "var(--text-secondary)" }}>
                    Capítulo traducido a <strong style={{ color: "var(--text-primary)" }}>{getLanguageByCode(selectedLang).flag} {getLanguageByCode(selectedLang).name}</strong> ({translationProvider || "IA Literaria"})
                  </span>
                  <button
                    onClick={() => handleSelectLanguage("original")}
                    className="ml-1 sm:ml-2 px-2.5 py-1 rounded-xl text-white font-bold text-[10px] sm:text-[11px] flex items-center gap-1 transition-all shrink-0 cursor-pointer fic-btn-primary"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Ver Original</span>
                  </button>
                </div>
              )}

              {storyContentWarnings.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mr-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Avisos de Contenido:</span>
                  </span>
                  {storyContentWarnings.map((cw) => (
                    <span
                      key={cw}
                      className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-200"
                    >
                      {cw}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                Por {authorName} • {wordCount} palabras • {scrollProgress.toFixed(0)}% leído
              </p>
            </div>

            {/* Texto del Capítulo con Estilo Personalizado (soporta texto plano, HTML e imágenes) */}
            {isScheduledLocked ? (
              <div className="my-12 p-8 sm:p-12 rounded-3xl border border-dashed border-purple-500/40 bg-purple-500/5 text-center space-y-4 max-w-xl mx-auto shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto shadow-md">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
                    Capítulo en Espera de Estreno
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    El autor ha dejado programado el lanzamiento de este capítulo para todos sus lectores:
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-purple-600 dark:text-purple-400 font-mono pt-2">
                    🕒 {new Date(chapterScheduledAt!).toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" })}
                  </p>
                </div>
                <div className="pt-3">
                  <Link
                    href={`/historia?id=${storyId}`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white fic-btn-primary hover:scale-105 transition-all shadow-md"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver a la Ficha de la Historia</span>
                  </Link>
                </div>
              </div>
            ) : isTranslating ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4 rounded-3xl border shadow-xl animate-pulse fic-card">
                <div className="relative inline-flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--text-badge)" }} />
                  <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                    Traduciendo capítulo al {getLanguageByCode(selectedLang).flag} {getLanguageByCode(selectedLang).name}...
                  </h3>
                  <p className="text-xs max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
                    El motor de IA está procesando el contexto narrativo, adaptando los diálogos y preservando las animaciones Fic FX.
                  </p>
                </div>
              </div>
            ) : isPendingChapter ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-5 rounded-3xl border fic-card-secondary">
                <div
                  className="h-16 w-16 rounded-3xl border flex items-center justify-center text-3xl shadow-inner"
                  style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)" }}
                >
                  ✍️
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>Este capítulo aún no ha sido redactado</h3>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {user?.id === authorId || user?.name === authorName || user?.username === authorName?.toLowerCase()
                      ? "Eres el autor de esta historia. Entra al editor para escribir y darle vida a este capítulo."
                      : "El autor está redactando el contenido de este capítulo. ¡Guarda la obra en tu biblioteca para enterarte cuando se publique!"}
                  </p>
                </div>
                {(user?.id === authorId || user?.name === authorName || user?.username === authorName?.toLowerCase()) && (
                  <Link
                    href={`/escribir?storyId=${storyId}&chap=${chapterNumber}`}
                    className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-xs font-bold shadow-xl hover:scale-105 transition-all fic-btn-primary"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Redactar Capítulo {chapterNumber} en el Editor</span>
                  </Link>
                )}
              </div>
            ) : (
              <article
                className={`space-y-6 leading-relaxed ${fontClass} transition-all duration-200 select-text chapter-rendered-html`}
                style={{ fontSize: `${fontSize}px`, lineHeight: "1.9" }}
              >
                {paragraphs.map((paragraphText, idx) => {
                  const currentReactions = chapterReactions[idx] || {};
                  const totalPReactions = Object.values(currentReactions).reduce((sum, count) => sum + count, 0);
                  const isHotParagraph = totalPReactions >= 3;

                  return (
                    <div
                      key={idx}
                      className={`group/paragraph relative transition-all rounded-2xl py-1 px-3 -mx-3 ${
                        isHotParagraph
                          ? "border-l-2 border-purple-500/80 pl-4 bg-gradient-to-r from-purple-500/[0.04] to-transparent shadow-xs"
                          : "hover:bg-white/[0.015]"
                      }`}
                    >
                      <div
                        className="leading-relaxed select-text"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          const spoilerEl = target.classList.contains("fic-fx-spoiler")
                            ? target
                            : target.closest(".fic-fx-spoiler");
                          if (spoilerEl) {
                            spoilerEl.classList.toggle("revealed");
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: paragraphText }}
                      />

                      {/* Micro-Reacciones Emocionales de Párrafo */}
                      <div className="flex items-center justify-between pt-0.5">
                        <ParagraphReactionWidget
                          paragraphIndex={idx}
                          reactions={currentReactions}
                          userReactions={userReactions[idx] || []}
                          onToggleReaction={handleToggleReaction}
                        />
                      </div>
                    </div>
                  );
                })}
              </article>
            )}
          </>
        )}

        {/* Notificación Flotante de Recompensa de XP */}
        {showXpReward && (
          <div className="fixed bottom-8 right-8 z-50 p-4 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white shadow-2xl flex items-center gap-3 animate-fade-in-scale">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            <div>
              <p className="text-xs font-extrabold">¡Capítulo Votado!</p>
              <p className="text-[10px] opacity-90">+10 XP ganados para tu perfil</p>
            </div>
          </div>
        )}

        {/* ═══════════════════ 4. PIE DE CAPÍTULO Y NAVEGACIÓN ═══════════════════ */}
        <div className="pt-10 border-t space-y-8" style={{ borderColor: "var(--border-primary)" }}>
          
          {/* Tarjeta de Apoyo al Autor con Regalos Virtuales */}
          <div
            className="p-5 sm:p-6 rounded-3xl border fic-card flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm"
            style={{ borderColor: "var(--border-primary)", background: "var(--bg-card-secondary)" }}
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div
                className="h-12 w-12 rounded-2xl border flex items-center justify-center text-2xl shadow-sm shrink-0"
                style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)" }}
              >
                🎁
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2 justify-center sm:justify-start" style={{ color: "var(--text-primary)" }}>
                  <span>¿Te gustó este capítulo?</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-emerald-500 bg-emerald-500/10 border-emerald-500/30">
                    Apoyo al Creador
                  </span>
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Envía una propina o regalo de FicCoins a <strong>{authorName}</strong> para motivar los próximos capítulos.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGiftModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-extrabold shadow-md hover:scale-105 transition-all shrink-0 fic-btn-primary cursor-pointer w-full sm:w-auto justify-center"
            >
              <Heart className="w-4 h-4 text-rose-300 fill-rose-300" />
              <span>Enviar Regalo al Autor</span>
            </button>
          </div>

          {/* Botones de Voto y Siguiente Capítulo */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Capítulo Anterior */}
            {chapterNumber > 1 ? (
              <Link
                href={`/leer?storyId=${storyId}&chapter=${chapterNumber - 1}`}
                className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold transition-all w-full sm:w-auto justify-center fic-card-secondary hover:scale-105"
                style={{ color: "var(--text-primary)" }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Capítulo Anterior</span>
              </Link>
            ) : (
              <div />
            )}

            {/* Votar Capítulo */}
            <button
              onClick={handleVoteChapter}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-extrabold border transition-all shadow-sm w-full sm:w-auto justify-center cursor-pointer ${
                hasVotedChapter
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40"
                  : "fic-card-secondary hover:scale-105"
              }`}
            >
              <Star className={`w-4 h-4 ${hasVotedChapter ? "fill-amber-500 text-amber-500" : ""}`} style={{ color: hasVotedChapter ? undefined : "var(--text-muted)" }} />
              <span style={{ color: "var(--text-primary)" }}>{hasVotedChapter ? "¡Votaste este capítulo!" : "Votar este capítulo (+10 XP)"}</span>
            </button>

            {/* Siguiente Capítulo o Finalizar Historia */}
            {chapterNumber < totalChapters ? (
              <Link
                href={`/leer?storyId=${storyId}&chapter=${chapterNumber + 1}`}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold shadow-md hover:scale-105 transition-all w-full sm:w-auto justify-center fic-btn-primary"
              >
                <span>Siguiente Capítulo</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={handleFinishStory}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-xl hover:scale-105 transition-all w-full sm:w-auto justify-center cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>Finalizar Historia (+30 XP)</span>
              </button>
            )}

          </div>

          {/* ═══════════════════ 5. COMENTARIOS DEL CAPÍTULO ═══════════════════ */}
          <div className="space-y-4 pt-6 border-t" style={{ borderColor: "var(--border-primary)" }}>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <MessageSquare className="w-4 h-4" style={{ color: "var(--text-badge)" }} />
              <span>Comentarios del Capítulo ({chapterComments.length})</span>
            </h3>

            {/* Formulario */}
            <form onSubmit={handleAddComment} className="flex gap-3 items-start">
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe tu reacción sobre este capítulo..."
                className="flex-1 rounded-2xl border fic-input p-3 text-xs placeholder:opacity-40 focus:outline-none resize-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-3 rounded-2xl shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer fic-btn-primary"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Lista de comentarios */}
            <div className="space-y-3 pt-2">
              {chapterComments.length > 0 ? (
                chapterComments.map((c) => (
                  <CommentBubble
                    key={c.id}
                    author={c.author}
                    avatar={c.avatar}
                    text={c.text}
                    time={c.time}
                    bubbleSkinId={c.bubbleSkinId || c.bubbleSkin}
                    avatarFrameId={c.avatarFrameId || c.avatarFrame}
                    avatarAuraId={c.avatarAuraId || c.avatarAura}
                    titleName={c.titleName || c.title}
                  />
                ))
              ) : (
                <div className="p-6 text-center rounded-2xl border space-y-1.5 fic-card-secondary">
                  <MessageSquare className="w-6 h-6 opacity-40 mx-auto" style={{ color: "var(--text-muted)" }} />
                  <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Aún no hay comentarios en este capítulo</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>¡Sé el primero en compartir tu opinión con el autor!</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* Modal de Felicitaciones por Finalizar Historia */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-scale">
          <div className="w-full max-w-md rounded-3xl border p-6 sm:p-7 shadow-2xl text-center space-y-5 relative overflow-hidden fic-card">
            <div className="absolute top-0 right-1/4 h-32 w-32 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-xl">
                <Trophy className="w-8 h-8 text-white animate-pulse" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-300 uppercase tracking-wider">
                  ¡Historia Completada!
                </span>
                <h3 className="text-xl font-black tracking-tight mt-2" style={{ color: "var(--text-primary)" }}>
                  {storyTitle}
                </h3>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Has llegado al final de todos los capítulos publicados.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border text-left space-y-2 fic-card-secondary">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Guardada en tu pestaña de &quot;Terminadas&quot;</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>+30 XP añadidos a tu nivel de experiencia</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href={`/historia?id=${storyId}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white shadow-lg hover:scale-102 transition-all fic-btn-primary"
              >
                <Star className="w-4 h-4" />
                <span>Dejar una Reseña a la Historia</span>
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href="/biblioteca"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border text-xs font-bold transition-colors fic-card-secondary hover:scale-102"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Mi Biblioteca</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border text-xs font-bold transition-colors fic-card-secondary hover:scale-102"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Enviar Regalo al Autor */}
      <GiftAuthorModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        author={{
          id: authorId || "author",
          name: authorName || "Autor",
          username: authorName ? authorName.toLowerCase().replace(/\s+/g, "_") : "autor",
          avatar: authorAvatar,
        }}
        storyId={storyId}
        storyTitle={storyTitle}
      />

      {/* Modal Emergente para configurar Nombre de Protagonista T/N */}
      <ReaderInsertModal
        isOpen={isReaderModalOpen}
        onClose={() => setIsReaderModalOpen(false)}
        storyId={storyId}
        storyTitle={storyTitle}
        initialName={readerCustomName || user?.name || ""}
        onSaveName={(name, lastName) => {
          setReaderCustomName(name);
          if (lastName) setReaderCustomLastName(lastName);
        }}
      />

      {/* Mascota Acompañante de Lectura Flotante */}
      <ReadingPetCompanion userId={user?.id} chapterTitle={chapterTitle} />

    </div>
  );
}
