"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PenTool,
  Save,
  Send,
  Sparkles,
  CheckCircle2,
  Layers,
  BookOpen,
  Eye,
  AlertCircle,
  Loader2,
  Clock,
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  Trash2,
  Edit3,
  Bookmark,
  Sliders,
  Check,
  Star,
  Compass,
  Tag,
  Palette,
  Feather,
  CheckCircle,
  X,
  EyeOff,
  Shield,
  Download,
  Calendar,
  CalendarClock,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  UploadCloud,
} from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, type MobileTab } from "@/components/mobile/MobileBottomNav";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { FicImage } from "@/components/ui/FicImage";
import { NovelExportModal } from "@/components/writer/NovelExportModal";
import {
  type StoryStatus,
  type AgeRating,
  type StoryType,
  type OriginType,
} from "@/data/mockStories";

export interface StoryVolume {
  id: string;
  storyId?: string;
  title: string;
  description?: string;
  order: number;
}

export interface UserStory {
  id: string;
  title: string;
  genre: string;
  genres?: string[];
  synopsis: string;
  tags: string[];
  coverUrl: string;
  status: StoryStatus;
  isPublished?: boolean;
  chaptersCount: number;
  publishedChaptersCount?: number;
  readsCount: number;
  votesCount: number;
  createdAt: string;
  ageRating?: AgeRating;
  contentWarnings?: string[];
  storyType?: StoryType;
  originType?: OriginType;
  fandom?: string;
  volumes?: StoryVolume[];
  isReaderInsert?: boolean;
}

export interface ChapterItem {
  id?: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  isPublished: boolean;
  scheduledAt?: string | null;
  volumeId?: string | null;
  volumeTitle?: string | null;
  updatedAt?: string;
}

export interface LoreNote {
  id: string;
  title: string;
  content: string;
  category: "personajes" | "mundo" | "trama" | "general";
  updatedAt: string;
}

export const AGE_RATINGS: {
  id: AgeRating;
  label: string;
  desc: string;
  badgeClass: string;
  textColor: string;
}[] = [
  {
    id: "TP",
    label: "TP (Todo Público)",
    desc: "Apto para todas las edades. Sin contenido explícito ni violencia gráfica.",
    badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
    textColor: "text-emerald-400",
  },
  {
    id: "+13",
    label: "+13 (Adolescentes)",
    desc: "Acción moderada, romance ligero o suspenso suave.",
    badgeClass: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40",
    textColor: "text-cyan-400",
  },
  {
    id: "+16",
    label: "+16 (Jóvenes Adultos)",
    desc: "Violencia de combate, temas maduros o drama psicológico intenso.",
    badgeClass: "bg-amber-950/80 text-amber-300 border-amber-500/40",
    textColor: "text-amber-400",
  },
  {
    id: "+18",
    label: "+18 (Maduro / NSFW)",
    desc: "Contenido explícito, violencia gráfica, terror oscuro o romance adulto.",
    badgeClass: "bg-rose-950/90 text-rose-300 border-rose-500/50 ring-1 ring-rose-400/40 shadow-rose-950/50",
    textColor: "text-rose-400",
  },
];

export const CONTENT_WARNINGS_LIST = [
  { id: "nsfw", label: "🔞 Contenido Explícito / NSFW" },
  { id: "violencia", label: "⚔️ Violencia Gráfica & Sangre" },
  { id: "lenguaje", label: "🤬 Lenguaje Fuerte / Explícito" },
  { id: "oscuro", label: "🌑 Temas Oscuros / Psicológicos" },
  { id: "muerte", label: "💔 Muerte de Personajes" },
  { id: "sensible", label: "⚠️ Menciones Sensibles" },
];

export const GENRE_CARDS = [
  { name: "Fantasía", icon: "🧙‍♂️", desc: "Magia, dragones y reinos arcanos" },
  { name: "Romance", icon: "💖", desc: "Pasión, dramas y química intensa" },
  { name: "Aventura", icon: "⚔️", desc: "Expediciones épicas y supervivencia" },
  { name: "Acción & Shonen", icon: "💥", desc: "Combates intensos y superación" },
  { name: "Isekai", icon: "🌀", desc: "Reencarnación y transporte a otro mundo" },
  { name: "Ciencia Ficción", icon: "🚀", desc: "Cyberpunk, galaxias y tecnología" },
  { name: "Misterio & Suspenso", icon: "🔍", desc: "Secretos ocultos e investigación" },
  { name: "Terror / Sobrenatural", icon: "🌑", desc: "Misterio oscuro y tensión" },
  { name: "Drama & Emocional", icon: "🎭", desc: "Historias profundas y dilemas" },
  { name: "Slice of Life", icon: "☕", desc: "Vida cotidiana y calidez" },
];

export const POPULAR_TAGS = [
  "isekai",
  "magia",
  "romance_oscuro",
  "enemigos_a_amantes",
  "venganza",
  "poderes_ocultos",
  "reencarnacion",
  "demonios",
  "apocalipsis",
  "accion",
];

export const COVER_PRESETS = [
  { name: "Portal Celestial", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80" },
  { name: "Reino Arcano", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80" },
  { name: "Ciber Neón", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80" },
  { name: "Noche Mística", url: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=500&auto=format&fit=crop&q=80" },
];

export interface MobileWriterProps {
  onSelectTab?: (tab: MobileTab) => void;
  hideNav?: boolean;
  hideHeader?: boolean;
}

export function MobileWriterView({
  onSelectTab,
  hideNav,
  hideHeader,
}: MobileWriterProps = {}) {
  const router = useRouter();
  const { user } = useAuth();

  // Vista activa: 'mis_historias' | 'gestion_historia'
  const [viewMode, setViewMode] = useState<"mis_historias" | "gestion_historia">("mis_historias");

  // Historias del usuario
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [isLoadingStories, setIsLoadingStories] = useState(false);

  // Filtros del Taller
  const [studioStatusFilter, setStudioStatusFilter] = useState<"todas" | "en_desarrollo" | "completa" | "borrador">("todas");
  const [studioSearchQuery, setStudioSearchQuery] = useState("");

  // Pestañas en Gestión de Historia: 'capitulos' | 'ficha' | 'lore'
  const [storyTab, setStoryTab] = useState<"capitulos" | "ficha" | "lore">("capitulos");

  // Lista de Capítulos de la historia seleccionada
  const [chaptersList, setChaptersList] = useState<ChapterItem[]>([]);
  const [chapterFilter, setChapterFilter] = useState<"todos" | "publicados" | "borradores" | "programados">("todos");

  // Volúmenes / Arcos de la historia seleccionada
  const [storyVolumes, setStoryVolumes] = useState<StoryVolume[]>([]);
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [editingVolume, setEditingVolume] = useState<StoryVolume | null>(null);
  const [volumeFormTitle, setVolumeFormTitle] = useState("");
  const [volumeFormDesc, setVolumeFormDesc] = useState("");
  const [collapsedVolumeIds, setCollapsedVolumeIds] = useState<Record<string, boolean>>({});

  // Programador de Publicación
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>("");
  const [schedulingChapter, setSchedulingChapter] = useState<ChapterItem | null>(null);

  // Notas de Lore
  const [loreNotes, setLoreNotes] = useState<LoreNote[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<"personajes" | "mundo" | "trama" | "general">("personajes");

  // Formulario Ficha de la Obra
  const [editStoryForm, setEditStoryForm] = useState({
    title: "",
    genre: "Fantasía",
    synopsis: "",
    tags: "",
    coverUrl: "",
    status: "en_desarrollo" as StoryStatus,
    ageRating: "TP" as AgeRating,
    contentWarnings: [] as string[],
    storyType: "tradicional" as StoryType,
    isReaderInsert: false,
  });

  // Modal Wizard para Crear Historia
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createPhase, setCreatePhase] = useState<1 | 2 | 3>(1);
  const [createForm, setCreateForm] = useState({
    title: "",
    genre: "Fantasía",
    genres: ["Fantasía"] as string[],
    originType: "original" as OriginType,
    fandom: "",
    synopsis: "",
    tags: ["magia", "aventura"] as string[],
    customTagInput: "",
    coverUrl: COVER_PRESETS[0]?.url || "",
    status: "borrador" as StoryStatus,
    storyType: "tradicional" as StoryType,
    ageRating: "TP" as AgeRating,
    contentWarnings: [] as string[],
    isReaderInsert: false,
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const createCoverInputRef = useRef<HTMLInputElement>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);

  // 1. Cargar historias del autor desde Supabase
  const loadAuthorStories = async () => {
    if (!user?.id) return;
    setIsLoadingStories(true);

    try {
      const supabase = createClient();
      const { data: dbStories, error } = await supabase
        .from("stories")
        .select(`
          id,
          title,
          genre,
          synopsis,
          tags,
          cover_url,
          is_completed,
          is_published,
          reads_count,
          votes_count,
          created_at,
          chapters (id, is_published)
        `)
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (dbStories && !error) {
        const formatted: UserStory[] = dbStories.map((s: any) => {
          const chList = Array.isArray(s.chapters) ? s.chapters : [];
          const published = chList.filter((c: any) => c.is_published !== false);
          const isPub = Boolean(s.is_published && published.length > 0);

          return {
            id: s.id,
            title: s.title || "Sin título",
            genre: s.genre || "Fantasía",
            synopsis: s.synopsis || "",
            tags: Array.isArray(s.tags) ? s.tags : [],
            coverUrl: s.cover_url || "",
            isPublished: isPub,
            status: !isPub ? "borrador" : s.is_completed ? "completa" : "en_desarrollo",
            chaptersCount: chList.length,
            publishedChaptersCount: published.length,
            readsCount: s.reads_count || 0,
            votesCount: s.votes_count || 0,
            createdAt: new Date(s.created_at).toLocaleDateString("es-ES"),
          };
        });

        setUserStories(formatted);
        if (typeof window !== "undefined") {
          localStorage.setItem("ficnation_user_stories", JSON.stringify(formatted));
        }
      }
    } catch (err) {
      console.error("Error al cargar obras del autor:", err);
    } finally {
      setIsLoadingStories(false);
    }
  };

  useEffect(() => {
    loadAuthorStories();
  }, [user?.id]);

  // 2. Seleccionar historia para gestión
  const selectStoryForManagement = async (story: UserStory) => {
    setSelectedStory(story);
    setEditStoryForm({
      title: story.title,
      genre: story.genre,
      synopsis: story.synopsis,
      tags: story.tags.join(", "),
      coverUrl: story.coverUrl,
      status: story.status,
      ageRating: story.ageRating || "TP",
      contentWarnings: story.contentWarnings || [],
      storyType: story.storyType || "tradicional",
      isReaderInsert: Boolean(story.isReaderInsert),
    });
    setViewMode("gestion_historia");
    setStoryTab("capitulos");

    // Cargar notas de lore
    try {
      const savedLore = localStorage.getItem(`ficnation_lore_${story.id}`);
      setLoreNotes(savedLore ? JSON.parse(savedLore) : []);
    } catch {
      setLoreNotes([]);
    }

    // Cargar tomos
    try {
      const savedVols = localStorage.getItem(`ficnation_volumes_${story.id}`);
      setStoryVolumes(savedVols ? JSON.parse(savedVols) : []);
    } catch {
      setStoryVolumes([]);
    }

    // Cargar capítulos desde Supabase
    try {
      const supabase = createClient();
      const { data: dbChapters } = await supabase
        .from("chapters")
        .select("*")
        .eq("story_id", story.id)
        .order("chapter_number", { ascending: true });

      if (dbChapters) {
        const mapped: ChapterItem[] = dbChapters.map((c: any) => ({
          id: c.id,
          storyId: c.story_id,
          chapterNumber: c.chapter_number,
          title: c.title || `Capítulo ${c.chapter_number}`,
          content: c.content || "",
          wordCount: c.word_count || 0,
          isPublished: c.is_published,
          scheduledAt: c.scheduled_at || null,
          volumeId: c.volume_id || null,
          volumeTitle: c.volume_title || null,
          updatedAt: new Date(c.updated_at || Date.now()).toLocaleDateString("es-ES"),
        }));

        setChaptersList(mapped);
        if (typeof window !== "undefined") {
          localStorage.setItem(`ficnation_chapters_${story.id}`, JSON.stringify(mapped));
        }
      }
    } catch (err) {
      console.error("Error al cargar capítulos de la historia:", err);
    }
  };

  // Abrir editor para un capítulo (navega a /escribir/editor)
  const openChapterEditor = (chapter?: ChapterItem) => {
    if (!selectedStory) return;
    if (chapter) {
      router.push(`/escribir/editor?storyId=${selectedStory.id}&chapterId=${chapter.id || ""}&chap=${chapter.chapterNumber}`);
    } else {
      const nextNum = chaptersList.length > 0 ? Math.max(...chaptersList.map((c) => c.chapterNumber)) + 1 : 1;
      router.push(`/escribir/editor?storyId=${selectedStory.id}&chap=${nextNum}`);
    }
  };

  // Subir portada con ImgBB
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "create" | "edit") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setStatusMessage(null);

    try {
      const { uploadToImgBB } = await import("@/lib/imgbb");
      const url = await uploadToImgBB(file);
      if (target === "create") {
        setCreateForm((prev) => ({ ...prev, coverUrl: url }));
      } else {
        setEditStoryForm((prev) => ({ ...prev, coverUrl: url }));
      }
      setStatusMessage({ type: "success", text: "¡Portada subida exitosamente!" });
    } catch {
      setStatusMessage({ type: "error", text: "Error al subir la portada." });
    } finally {
      setIsUploadingCover(false);
      if (createCoverInputRef.current) createCoverInputRef.current.value = "";
      if (editCoverInputRef.current) editCoverInputRef.current.value = "";
    }
  };

  // Abrir Wizard de Creación
  const startCreationWizard = () => {
    setCreatePhase(1);
    setCreateForm({
      title: "",
      genre: "Fantasía",
      genres: ["Fantasía"],
      originType: "original",
      fandom: "",
      synopsis: "",
      tags: ["magia", "aventura"],
      customTagInput: "",
      coverUrl: COVER_PRESETS[0]?.url || "",
      status: "borrador",
      storyType: "tradicional",
      ageRating: "TP",
      contentWarnings: [],
      isReaderInsert: false,
    });
    setIsCreateModalOpen(true);
  };

  // Crear historia en Supabase
  const handleFinalizeStoryCreation = async () => {
    if (!createForm.title.trim()) {
      setStatusMessage({ type: "error", text: "El título de la novela es obligatorio." });
      return;
    }
    if (!user) {
      setStatusMessage({ type: "error", text: "Inicia sesión para crear obras." });
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const finalTags = Array.from(
        new Set([
          ...createForm.tags,
          ...(createForm.originType === "fanfic" ? ["fanfic"] : ["original"]),
          ...(createForm.originType === "fanfic" && createForm.fandom.trim() ? [createForm.fandom.trim()] : []),
          ...(createForm.isReaderInsert ? ["reader_insert", "tn_protagonist"] : []),
          ...createForm.genres,
        ])
      );

      const mainGenre = createForm.genres.join(", ") || createForm.genre || "Fantasía";

      const { data: newDbStory, error } = await supabase
        .from("stories")
        .insert({
          author_id: user.id,
          title: createForm.title.trim(),
          synopsis: createForm.synopsis.trim() || "Una fascinante historia en desarrollo en FicNation.",
          genre: mainGenre,
          tags: finalTags,
          cover_url: createForm.coverUrl.trim(),
          is_completed: false,
          is_published: false,
          age_rating: createForm.ageRating || "TP",
          content_warnings: createForm.contentWarnings || [],
          story_type: createForm.storyType || "tradicional",
        })
        .select()
        .single();

      const createdUserStory: UserStory = {
        id: newDbStory?.id || `story-${Date.now()}`,
        title: createForm.title.trim(),
        genre: mainGenre,
        genres: createForm.genres,
        synopsis: createForm.synopsis.trim(),
        tags: finalTags,
        coverUrl: createForm.coverUrl.trim(),
        isPublished: false,
        status: "borrador",
        chaptersCount: 0,
        publishedChaptersCount: 0,
        readsCount: 0,
        votesCount: 0,
        createdAt: new Date().toLocaleDateString("es-ES"),
        ageRating: createForm.ageRating,
        contentWarnings: createForm.contentWarnings,
        storyType: createForm.storyType,
        originType: createForm.originType,
        fandom: createForm.fandom.trim(),
        isReaderInsert: createForm.isReaderInsert,
      };

      setUserStories((prev) => [createdUserStory, ...prev]);
      setIsCreateModalOpen(false);
      setSelectedStory(createdUserStory);
      router.push(`/escribir/editor?storyId=${createdUserStory.id}&chap=1`);
    } catch (err) {
      setStatusMessage({ type: "error", text: "Error al crear la historia." });
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar Cambios de Ficha
  const handleUpdateStoryMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStory || !user) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      const tagsArray = editStoryForm.tags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      await supabase
        .from("stories")
        .update({
          title: editStoryForm.title.trim(),
          genre: editStoryForm.genre,
          synopsis: editStoryForm.synopsis.trim(),
          tags: tagsArray,
          cover_url: editStoryForm.coverUrl.trim(),
          is_completed: editStoryForm.status === "completa",
          age_rating: editStoryForm.ageRating || "TP",
          content_warnings: editStoryForm.contentWarnings || [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedStory.id)
        .eq("author_id", user.id);

      const updated = {
        ...selectedStory,
        title: editStoryForm.title.trim(),
        genre: editStoryForm.genre,
        synopsis: editStoryForm.synopsis.trim(),
        tags: tagsArray,
        coverUrl: editStoryForm.coverUrl.trim(),
        status: editStoryForm.status,
        ageRating: editStoryForm.ageRating,
        contentWarnings: editStoryForm.contentWarnings,
      };

      setSelectedStory(updated);
      setUserStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setStatusMessage({ type: "success", text: "¡Ficha de la obra actualizada con éxito!" });
    } catch {
      setStatusMessage({ type: "error", text: "Error al actualizar la ficha." });
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar Historia
  const handleDeleteStory = async (storyId: string, storyTitle: string) => {
    if (!user) return;
    if (!confirm(`¿Estás seguro de eliminar permanentemente "${storyTitle}"? Esta acción no se puede deshacer.`)) return;

    try {
      const supabase = createClient();
      await supabase.from("stories").delete().eq("id", storyId).eq("author_id", user.id);

      setUserStories((prev) => prev.filter((s) => s.id !== storyId));
      if (selectedStory?.id === storyId) {
        setSelectedStory(null);
        setViewMode("mis_historias");
      }
      setStatusMessage({ type: "success", text: `"${storyTitle}" ha sido eliminada.` });
    } catch {
      setStatusMessage({ type: "error", text: "Error al eliminar la historia." });
    }
  };

  // Guardar Tomo / Volumen
  const handleSaveVolume = async () => {
    if (!selectedStory || !volumeFormTitle.trim()) return;

    let updatedVolumes: StoryVolume[] = [];
    if (editingVolume) {
      updatedVolumes = storyVolumes.map((v) =>
        v.id === editingVolume.id ? { ...v, title: volumeFormTitle.trim(), description: volumeFormDesc.trim() } : v
      );
    } else {
      const newVol: StoryVolume = {
        id: `vol-${Date.now()}`,
        storyId: selectedStory.id,
        title: volumeFormTitle.trim(),
        description: volumeFormDesc.trim(),
        order: storyVolumes.length + 1,
      };
      updatedVolumes = [...storyVolumes, newVol];
    }

    setStoryVolumes(updatedVolumes);
    setIsVolumeModalOpen(false);
    setEditingVolume(null);
    setVolumeFormTitle("");
    setVolumeFormDesc("");

    if (typeof window !== "undefined") {
      localStorage.setItem(`ficnation_volumes_${selectedStory.id}`, JSON.stringify(updatedVolumes));
    }
    setStatusMessage({ type: "success", text: "¡Tomo guardado exitosamente!" });
  };

  // Eliminar Tomo
  const handleDeleteVolume = async (volId: string) => {
    if (!confirm("¿Eliminar este Tomo? Los capítulos pasarán a Sin Asignar.")) return;
    const next = storyVolumes.filter((v) => v.id !== volId);
    setStoryVolumes(next);
    if (typeof window !== "undefined" && selectedStory) {
      localStorage.setItem(`ficnation_volumes_${selectedStory.id}`, JSON.stringify(next));
    }
  };

  // Programar capítulo
  const handleConfirmSchedule = async () => {
    if (!scheduleDateTime || !schedulingChapter || !selectedStory) return;
    const scheduledIso = new Date(scheduleDateTime).toISOString();

    const updated = chaptersList.map((c) =>
      c.id === schedulingChapter.id ? { ...c, isPublished: false, scheduledAt: scheduledIso } : c
    );
    setChaptersList(updated);

    try {
      const supabase = createClient();
      await supabase
        .from("chapters")
        .update({ is_published: false, scheduled_at: scheduledIso, updated_at: new Date().toISOString() })
        .eq("id", schedulingChapter.id);
    } catch {}

    setIsScheduleModalOpen(false);
    setSchedulingChapter(null);
    setStatusMessage({ type: "success", text: `Capítulo programado para el ${new Date(scheduledIso).toLocaleString("es-ES")}` });
  };

  // Alternar publicación directa de capítulo
  const handleTogglePublishChapter = async (chapter: ChapterItem) => {
    if (!selectedStory) return;
    const newStatus = !chapter.isPublished;
    const updated = chaptersList.map((c) => (c.id === chapter.id ? { ...c, isPublished: newStatus } : c));
    setChaptersList(updated);

    try {
      const supabase = createClient();
      await supabase
        .from("chapters")
        .update({ is_published: newStatus, updated_at: new Date().toISOString() })
        .eq("id", chapter.id);

      // Actualizar estado de la historia si corresponde
      const hasPublished = updated.some((c) => c.isPublished);
      await supabase.from("stories").update({ is_published: hasPublished }).eq("id", selectedStory.id);
      setSelectedStory((prev) => (prev ? { ...prev, isPublished: hasPublished } : prev));
      setUserStories((prev) => prev.map((s) => (s.id === selectedStory.id ? { ...s, isPublished: hasPublished } : s)));

      setStatusMessage({ type: "success", text: `Capítulo ${newStatus ? "publicado para todos" : "guardado en borrador"}` });
    } catch {}
  };

  // Eliminar Capítulo
  const handleDeleteChapter = async (chapId: string, chapTitle: string) => {
    if (!confirm(`¿Eliminar el capítulo "${chapTitle}"?`)) return;
    try {
      const supabase = createClient();
      await supabase.from("chapters").delete().eq("id", chapId);
      setChaptersList((prev) => prev.filter((c) => c.id !== chapId));
      setStatusMessage({ type: "success", text: `"${chapTitle}" eliminado.` });
    } catch {}
  };

  // Guardar Lore
  const handleAddLoreNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !selectedStory) return;

    const note: LoreNote = {
      id: `lore-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      category: newNoteCategory,
      updatedAt: new Date().toLocaleDateString("es-ES"),
    };

    const updated = [note, ...loreNotes];
    setLoreNotes(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(`ficnation_lore_${selectedStory.id}`, JSON.stringify(updated));
    }
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  const totalAuthorNovels = userStories.length;
  const totalAuthorChapters = userStories.reduce((acc, s) => acc + (s.chaptersCount || 0), 0);
  const totalAuthorReads = userStories.reduce((acc, s) => acc + (Number(s.readsCount) || 0), 0);
  const totalAuthorVotes = userStories.reduce((acc, s) => acc + (Number(s.votesCount) || 0), 0);

  const filteredAuthorStories = userStories.filter((s) => {
    const matchesFilter =
      studioStatusFilter === "todas"
        ? true
        : studioStatusFilter === "borrador"
        ? s.status === "borrador" || !s.isPublished
        : s.status === studioStatusFilter;
    const matchesSearch =
      studioSearchQuery.trim() === ""
        ? true
        : s.title.toLowerCase().includes(studioSearchQuery.toLowerCase()) ||
          s.genre.toLowerCase().includes(studioSearchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-24 select-none">
      
      {/* Inputs ocultos para subida de portada */}
      <input ref={createCoverInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={(e) => handleCoverUpload(e, "create")} />
      <input ref={editCoverInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={(e) => handleCoverUpload(e, "edit")} />

      {/* ════════════ 1. CABECERA MÓVIL SUPERIOR ════════════ */}
      {!hideHeader && (
        <MobileHeader
          title={viewMode === "gestion_historia" ? (selectedStory?.title || "Gestión") : "Taller de Historias"}
          showBack={viewMode === "gestion_historia"}
          onBack={() => setViewMode("mis_historias")}
          rightAction={
            viewMode === "mis_historias" ? (
              <button
                onClick={startCreationWizard}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-purple-600/30 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva</span>
              </button>
            ) : null
          }
        />
      )}

      {/* Alerta de Feedback */}
      {statusMessage && (
        <div className={`mx-4 mt-2 p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in ${
          statusMessage.type === "error"
            ? "bg-rose-950/80 border-rose-500/40 text-rose-200"
            : "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            {statusMessage.type === "error" ? <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span className="truncate">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100 shrink-0">✕</button>
        </div>
      )}

      <main className="flex-1 space-y-4 px-4 pt-3 max-w-md mx-auto w-full">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* VISTA 1: MIS HISTORIAS (PANEL PRINCIPAL DEL AUTOR EN MÓVIL)   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "mis_historias" && (
          <div className="space-y-4">
            
            {/* Bento de Métricas del Autor en Móvil (Grid 2x2) */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-3xl bg-white/[0.03] border border-white/10 shadow-lg">
              <div className="p-2.5 rounded-2xl bg-[#0d1222] border border-purple-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-300">Obras</span>
                <p className="text-lg font-black text-white">{totalAuthorNovels}</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#0d1222] border border-cyan-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-cyan-300">Capítulos</span>
                <p className="text-lg font-black text-white">{totalAuthorChapters}</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#0d1222] border border-amber-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-300">Lecturas</span>
                <p className="text-lg font-black text-white">{totalAuthorReads}</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#0d1222] border border-rose-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-300">Estrellas</span>
                <p className="text-lg font-black text-white">{totalAuthorVotes}</p>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={studioSearchQuery}
                  onChange={(e) => setStudioSearchQuery(e.target.value)}
                  placeholder="Buscar en mis historias..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "todas", label: `Todas (${totalAuthorNovels})` },
                  { id: "borrador", label: "Borradores" },
                  { id: "en_desarrollo", label: "En Curso" },
                  { id: "completa", label: "Completas" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStudioStatusFilter(f.id as any)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      studioStatusFilter === f.id
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Historias para Móvil */}
            {isLoadingStories ? (
              <div className="py-20 text-center text-xs text-purple-400 font-semibold space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                <p>Cargando tus historias...</p>
              </div>
            ) : filteredAuthorStories.length === 0 ? (
              <div className="py-16 px-4 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center text-purple-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">No tienes novelas aquí</p>
                  <p className="text-xs text-slate-400">
                    Crea tu primera historia para redactar capítulos y publicarla en la comunidad.
                  </p>
                </div>
                <button
                  onClick={startCreationWizard}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md shadow-purple-600/30 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Historia</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAuthorStories.map((story) => (
                  <div
                    key={story.id}
                    className="p-3.5 rounded-3xl bg-[#0d1222] border border-purple-500/20 shadow-lg space-y-3"
                  >
                    <div className="flex gap-3">
                      {/* Portada 2:3 */}
                      <div
                        onClick={() => selectStoryForManagement(story)}
                        className="w-20 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 relative cursor-pointer active:scale-95 transition-transform"
                      >
                        <FicImage src={story.coverUrl} alt={story.title} fallbackType="cover" />
                        <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          !story.isPublished || story.status === "borrador"
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-500 text-white"
                        }`}>
                          {!story.isPublished || story.status === "borrador" ? "Borrador" : "Pública"}
                        </span>
                      </div>

                      {/* Info de la obra */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {story.genre}
                          </span>
                          {story.ageRating && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/10 text-slate-300">
                              {story.ageRating}
                            </span>
                          )}
                        </div>

                        <h3
                          onClick={() => selectStoryForManagement(story)}
                          className="text-sm font-black text-white truncate cursor-pointer hover:text-purple-300"
                        >
                          {story.title}
                        </h3>

                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {story.synopsis || "Sin sinopsis."}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-slate-400">
                          <span>📖 {story.chaptersCount} caps</span>
                          <span>👁️ {story.readsCount}</span>
                          <span>⭐ {story.votesCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción móvil */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={() => selectStoryForManagement(story)}
                        className="flex-1 py-2 px-3 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-purple-600/30 transition-all"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Gestionar Capítulos</span>
                      </button>

                      <Link
                        href={`/historia/${story.id}`}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white active:scale-95 transition-all"
                        title="Ver como lector"
                      >
                        <Eye className="w-4 h-4 text-cyan-400" />
                      </Link>

                      <button
                        onClick={() => handleDeleteStory(story.id, story.title)}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
                        title="Eliminar obra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* VISTA 2: GESTIÓN DE LA HISTORIA (DETALLE DEL TALLER EN MÓVIL)  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "gestion_historia" && selectedStory && (
          <div className="space-y-4">
            
            {/* Tarjeta Resumen de la Novela */}
            <div className="p-4 rounded-3xl bg-gradient-to-b from-purple-950/40 via-[#0d1222] to-[#0b0f19] border border-purple-500/25 shadow-xl space-y-3">
              <div className="flex gap-3">
                <div className="w-20 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-purple-500/30 shrink-0 relative shadow-md">
                  <FicImage src={selectedStory.coverUrl} alt={selectedStory.title} fallbackType="cover" />
                  <span className={`absolute bottom-1 inset-x-1 py-0.5 text-[8px] font-black text-center rounded ${
                    !selectedStory.isPublished || selectedStory.status === "borrador"
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-500 text-white"
                  }`}>
                    {!selectedStory.isPublished || selectedStory.status === "borrador" ? "Borrador" : "Pública"}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {selectedStory.genre}
                    </span>
                    {selectedStory.ageRating && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/10 text-slate-300">
                        {selectedStory.ageRating}
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-black text-white leading-snug truncate">
                    {selectedStory.title}
                  </h2>

                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    {selectedStory.synopsis || "Sin sinopsis."}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-purple-300">
                    <span>{chaptersList.length} caps</span>
                    <span>•</span>
                    <span>{selectedStory.readsCount} vistas</span>
                    <span>•</span>
                    <span>{selectedStory.votesCount} votos</span>
                  </div>
                </div>
              </div>

              {/* Botones de acción de la novela */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
                <button
                  onClick={() => openChapterEditor()}
                  className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95 transition-all col-span-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Escribir Capítulo</span>
                </button>

                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="py-2.5 px-2 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
                  title="Exportar en PDF/EPUB"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            {/* Pestañas de Gestión: Capítulos / Ficha / Lore */}
            <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10">
              {[
                { id: "capitulos", label: `Capítulos (${chaptersList.length})`, icon: BookOpen },
                { id: "ficha", label: "Ficha & Portada", icon: Sliders },
                { id: "lore", label: `Lore (${loreNotes.length})`, icon: Bookmark },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStoryTab(t.id as any)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    storyTab === t.id
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>

            {/* ────────── SUBPESTAÑA: CAPÍTULOS ────────── */}
            {storyTab === "capitulos" && (
              <div className="space-y-3">
                {/* Filtros de capítulo */}
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
                    {[
                      { id: "todos", label: "Todos" },
                      { id: "publicados", label: "Públicos" },
                      { id: "programados", label: "Programados" },
                      { id: "borradores", label: "Borradores" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setChapterFilter(f.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          chapterFilter === f.id
                            ? "bg-purple-600 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setEditingVolume(null);
                      setVolumeFormTitle("");
                      setVolumeFormDesc("");
                      setIsVolumeModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center gap-1 shrink-0"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Tomo</span>
                  </button>
                </div>

                {/* Lista de Capítulos */}
                {chaptersList.length === 0 ? (
                  <div className="py-12 px-4 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
                    <p className="text-xs text-slate-400">Esta obra aún no tiene capítulos redactados.</p>
                    <button
                      onClick={() => openChapterEditor()}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md shadow-purple-600/30"
                    >
                      Redactar Capítulo 1
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chaptersList
                      .filter((c) => {
                        if (chapterFilter === "publicados") return c.isPublished;
                        if (chapterFilter === "programados") return !c.isPublished && Boolean(c.scheduledAt);
                        if (chapterFilter === "borradores") return !c.isPublished && !c.scheduledAt;
                        return true;
                      })
                      .map((ch) => (
                        <div
                          key={ch.id || ch.chapterNumber}
                          className="p-3 rounded-2xl bg-[#0d1222] border border-white/10 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                {ch.chapterNumber}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate">{ch.title}</h4>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {ch.wordCount || 0} palabras • {ch.updatedAt}
                                </p>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                              ch.isPublished
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : ch.scheduledAt
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}>
                              {ch.isPublished ? "Público" : ch.scheduledAt ? "Programado" : "Borrador"}
                            </span>
                          </div>

                          {/* Acciones de capítulo en móvil */}
                          <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-white/5">
                            <button
                              onClick={() => handleTogglePublishChapter(ch)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 active:scale-95"
                            >
                              {ch.isPublished ? "A Borrador" : "Publicar"}
                            </button>

                            <button
                              onClick={() => openChapterEditor(ch)}
                              className="px-3 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-bold active:scale-95"
                            >
                              Editar
                            </button>

                            {ch.id && (
                              <button
                                onClick={() => handleDeleteChapter(ch.id!, ch.title)}
                                className="p-1 text-rose-400 hover:text-rose-300"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* ────────── SUBPESTAÑA: FICHA & PORTADA ────────── */}
            {storyTab === "ficha" && (
              <form onSubmit={handleUpdateStoryMeta} className="space-y-4 p-4 rounded-3xl bg-[#0d1222] border border-white/10">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">Portada de la Obra</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 aspect-[2/3] rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                      <FicImage src={editStoryForm.coverUrl} alt="Portada" fallbackType="cover" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => editCoverInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-bold active:scale-95 transition-all"
                      >
                        {isUploadingCover ? "Subiendo..." : "Subir desde Galería"}
                      </button>
                      <input
                        type="url"
                        placeholder="O pega URL de imagen..."
                        value={editStoryForm.coverUrl}
                        onChange={(e) => setEditStoryForm({ ...editStoryForm, coverUrl: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Título</label>
                  <input
                    type="text"
                    required
                    value={editStoryForm.title}
                    onChange={(e) => setEditStoryForm({ ...editStoryForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Género</label>
                  <select
                    value={editStoryForm.genre}
                    onChange={(e) => setEditStoryForm({ ...editStoryForm, genre: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070a12] border border-white/10 text-xs text-white"
                  >
                    {GENRE_CARDS.map((g) => (
                      <option key={g.name} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Sinopsis</label>
                  <textarea
                    rows={3}
                    value={editStoryForm.synopsis}
                    onChange={(e) => setEditStoryForm({ ...editStoryForm, synopsis: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Clasificación por Edad</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {AGE_RATINGS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setEditStoryForm({ ...editStoryForm, ageRating: r.id })}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          editStoryForm.ageRating === r.id
                            ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                            : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                      >
                        {r.id}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md shadow-purple-600/30 active:scale-95 transition-all"
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </button>

                {/* Zona de peligro */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => handleDeleteStory(selectedStory.id, selectedStory.title)}
                    className="w-full py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold active:scale-95"
                  >
                    Eliminar Novela Definitivamente
                  </button>
                </div>
              </form>
            )}

            {/* ────────── SUBPESTAÑA: LORE ────────── */}
            {storyTab === "lore" && (
              <div className="space-y-3">
                <form onSubmit={handleAddLoreNote} className="p-3.5 rounded-3xl bg-[#0d1222] border border-white/10 space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                    <span>Añadir Nota de Universo / Personaje</span>
                  </h4>
                  <input
                    type="text"
                    required
                    placeholder="Título (ej: Grimorio de Éter)"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                  />
                  <textarea
                    rows={2}
                    placeholder="Descripción y detalles..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold active:scale-95"
                  >
                    + Guardar Nota
                  </button>
                </form>

                <div className="space-y-2">
                  {loreNotes.map((note) => (
                    <div key={note.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-white">{note.title}</h5>
                        <span className="text-[9px] uppercase font-bold text-purple-400">{note.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ════════════ MODAL WIZARD: CREAR HISTORIA ════════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3">
          <div className="w-full max-w-md bg-[#0d1222] border border-purple-500/30 rounded-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Nueva Novela</h3>
                <p className="text-[10px] text-purple-300">Paso {createPhase} de 3</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {createPhase === 1 && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Título de la Obra *</label>
                    <input
                      type="text"
                      autoFocus
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      placeholder="Ej: Las Crónicas del Dragón"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Tipo de Historia</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, originType: "original" })}
                        className={`p-2 rounded-xl border text-xs font-bold ${
                          createForm.originType === "original" ? "bg-purple-600 text-white border-purple-500" : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                      >
                        ✨ Original
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, originType: "fanfic" })}
                        className={`p-2 rounded-xl border text-xs font-bold ${
                          createForm.originType === "fanfic" ? "bg-purple-600 text-white border-purple-500" : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                      >
                        ⚡ Fanfiction
                      </button>
                    </div>
                  </div>

                  {createForm.originType === "fanfic" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Fandom / Serie</label>
                      <input
                        type="text"
                        value={createForm.fandom}
                        onChange={(e) => setCreateForm({ ...createForm, fandom: e.target.value })}
                        placeholder="Ej: Jujutsu Kaisen, Naruto..."
                        className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Género Principal</label>
                    <select
                      value={createForm.genre}
                      onChange={(e) => setCreateForm({ ...createForm, genre: e.target.value, genres: [e.target.value] })}
                      className="w-full px-3 py-2 rounded-xl bg-[#070a12] border border-white/10 text-xs text-white"
                    >
                      {GENRE_CARDS.map((g) => (
                        <option key={g.name} value={g.name}>{g.icon} {g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Sinopsis Breve</label>
                    <textarea
                      rows={2}
                      value={createForm.synopsis}
                      onChange={(e) => setCreateForm({ ...createForm, synopsis: e.target.value })}
                      placeholder="De qué trata tu historia..."
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white resize-none"
                    />
                  </div>
                </>
              )}

              {createPhase === 2 && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">Portada de la Obra</label>
                    <button
                      type="button"
                      onClick={() => createCoverInputRef.current?.click()}
                      className="w-full py-3 rounded-xl border border-dashed border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isUploadingCover ? "Subiendo..." : "Subir desde tu teléfono"}</span>
                    </button>
                    <input
                      type="url"
                      placeholder="O pega URL de portada..."
                      value={createForm.coverUrl}
                      onChange={(e) => setCreateForm({ ...createForm, coverUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">O elige una portada de preset:</label>
                    <div className="grid grid-cols-4 gap-2">
                      {COVER_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, coverUrl: p.url })}
                          className={`aspect-[2/3] rounded-xl overflow-hidden border transition-all ${
                            createForm.coverUrl === p.url ? "ring-2 ring-purple-500 scale-105" : "opacity-70"
                          }`}
                        >
                          <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {createPhase === 3 && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Clasificación por Edad</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {AGE_RATINGS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, ageRating: r.id })}
                          className={`py-2 rounded-xl text-xs font-bold border ${
                            createForm.ageRating === r.id ? "bg-purple-600 text-white border-purple-500" : "bg-white/5 border-white/10 text-slate-400"
                          }`}
                        >
                          {r.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Modo Borrador Privado</span>
                    </p>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Tu obra no se mostrará en Explorar ni el Dashboard hasta que agregues y publiques su Capítulo 1.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              {createPhase > 1 ? (
                <button
                  type="button"
                  onClick={() => setCreatePhase((p) => (p - 1) as any)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-bold"
                >
                  Atrás
                </button>
              ) : <div />}

              {createPhase < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (createPhase === 1 && !createForm.title.trim()) {
                      alert("Por favor ingresa un título para la obra.");
                      return;
                    }
                    setCreatePhase((p) => (p + 1) as any);
                  }}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md shadow-purple-600/30"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleFinalizeStoryCreation}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-600/30 disabled:opacity-50"
                >
                  {isSaving ? "Creando..." : "Crear & Escribir Cap. 1"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR TOMO */}
      {isVolumeModalOpen && selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0d1222] border border-purple-500/30 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">Nuevo Tomo / Arco</h3>
              <button onClick={() => setIsVolumeModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Ej: Tomo 1: El Despertar"
              value={volumeFormTitle}
              onChange={(e) => setVolumeFormTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsVolumeModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveVolume}
                disabled={!volumeFormTitle.trim()}
                className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold disabled:opacity-50 shadow-md shadow-purple-600/30"
              >
                Crear Tomo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPORTAR */}
      {isExportModalOpen && selectedStory && (
        <NovelExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          novelData={{
            title: selectedStory.title,
            author: user?.name || "Autor FicNation",
            genre: selectedStory.genre,
            synopsis: selectedStory.synopsis,
            coverUrl: selectedStory.coverUrl,
            chapters: chaptersList.map((c) => ({
              chapterNumber: c.chapterNumber,
              title: c.title,
              content: c.content,
              wordCount: c.wordCount,
            })),
          }}
        />
      )}

      {/* ════════════ 3. NAVEGACIÓN INFERIOR MÓVIL ════════════ */}
      {!hideNav && <MobileBottomNav activeTab="write" onSelectTab={onSelectTab} />}
    </div>
  );
}

export default function MobileWriterPage() {
  return <MobileWriterView />;
}
