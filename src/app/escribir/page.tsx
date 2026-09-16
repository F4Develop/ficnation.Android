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
  Zap,
} from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
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

// Efectos de Animación y Formato Especial para Historias
export interface TextEffectItem {
  id: string;
  name: string;
  tag: string;
  category: "magia" | "terror" | "narrativa";
  icon: string;
  color: string;
  description: string;
  previewClass: string;
}

export const TEXT_EFFECTS_LIST: TextEffectItem[] = [
  // 🔮 MÁGICOS Y BRILLOS
  {
    id: "fic-fx-glow-purple",
    name: "Resplandor Púrpura",
    tag: "Púrpura Arcano",
    category: "magia",
    icon: "✨",
    color: "from-purple-500 to-fuchsia-500",
    description: "Brillo místico pulsante para magia, runas o auras arcanas.",
    previewClass: "fic-fx-glow-purple",
  },
  {
    id: "fic-fx-glow-gold",
    name: "Resplandor Dorado",
    tag: "Dorado Divino",
    category: "magia",
    icon: "🌟",
    color: "from-amber-400 to-yellow-300",
    description: "Aura celestial para deidades, bendiciones o reliquias.",
    previewClass: "fic-fx-glow-gold",
  },
  {
    id: "fic-fx-glow-cyan",
    name: "Resplandor Cian",
    tag: "Cian Eléctrico",
    category: "magia",
    icon: "⚡",
    color: "from-cyan-400 to-blue-400",
    description: "Energía pura, relámpagos arcanos o sci-fi futurista.",
    previewClass: "fic-fx-glow-cyan",
  },
  {
    id: "fic-fx-glow-crimson",
    name: "Resplandor Carmesí",
    tag: "Carmesí Furia",
    category: "magia",
    icon: "🩸",
    color: "from-rose-500 to-red-600",
    description: "Aura demoníaca, cólera, sangre o poder oscuro.",
    previewClass: "fic-fx-glow-crimson",
  },
  {
    id: "fic-fx-float",
    name: "Flotación Astral",
    tag: "Levitación",
    category: "magia",
    icon: "🌌",
    color: "from-indigo-400 to-purple-400",
    description: "Vaivén de gravedad cero suave y constante.",
    previewClass: "fic-fx-float",
  },
  {
    id: "fic-fx-rainbow",
    name: "Arcoíris Cósmico",
    tag: "Flujo Cromático",
    category: "magia",
    icon: "🌈",
    color: "from-pink-500 via-purple-500 to-cyan-500",
    description: "Gradiente dinámico en movimiento continuo multicolor.",
    previewClass: "fic-fx-rainbow",
  },
  {
    id: "fic-fx-flame",
    name: "Llama Ardiente",
    tag: "Fuego & Calor",
    category: "magia",
    icon: "🔥",
    color: "from-orange-500 to-amber-400",
    description: "Distorsión ondulante de calor y llamas incandescentes.",
    previewClass: "fic-fx-flame",
  },
  {
    id: "fic-fx-sparkle",
    name: "Polvo de Estrellas",
    tag: "Destellos",
    category: "magia",
    icon: "💫",
    color: "from-yellow-300 to-amber-300",
    description: "Chispas brillantes con resplandor estelar móvil.",
    previewClass: "fic-fx-sparkle",
  },
  {
    id: "fic-fx-ghost",
    name: "Tinta Espectral",
    tag: "Etéreo",
    category: "magia",
    icon: "🌫️",
    color: "from-slate-300 to-indigo-300",
    description: "Desvanecimiento vaporoso y translúcido de fantasmas.",
    previewClass: "fic-fx-ghost",
  },

  // ⚡ TERROR Y TENSIÓN
  {
    id: "fic-fx-glitch",
    name: "Glitch Mental",
    tag: "Aberración RGB",
    category: "terror",
    icon: "👾",
    color: "from-cyan-400 to-rose-500",
    description: "Micro-desfases cromáticos, locura o fallas de sistema.",
    previewClass: "fic-fx-glitch",
  },
  {
    id: "fic-fx-shake",
    name: "Temblor de Pánico",
    tag: "Vibración Sísmica",
    category: "terror",
    icon: "💥",
    color: "from-red-400 to-amber-400",
    description: "Tiembla intensamente para gritos desgarradores o miedo.",
    previewClass: "fic-fx-shake",
  },
  {
    id: "fic-fx-heartbeat",
    name: "Latido de Tensión",
    tag: "Pulsación Cardíaca",
    category: "terror",
    icon: "💓",
    color: "from-rose-500 to-red-600",
    description: "Pum-pum acelerado para peligro inminente y suspenso.",
    previewClass: "fic-fx-heartbeat",
  },
  {
    id: "fic-fx-flicker",
    name: "Luz Parpadeante",
    tag: "Titileo Horror",
    category: "terror",
    icon: "💡",
    color: "from-amber-200 to-zinc-400",
    description: "Parpadeo intermitente de luz en penumbra y abandono.",
    previewClass: "fic-fx-flicker",
  },
  {
    id: "fic-fx-drip",
    name: "Goteo Oscuro",
    tag: "Terror Gótico",
    category: "terror",
    icon: "🩸",
    color: "from-red-600 to-rose-800",
    description: "Sombra sangrante que parece derretirse hacia abajo.",
    previewClass: "fic-fx-drip",
  },

  // 📜 NARRATIVA Y MISTERIO
  {
    id: "fic-fx-spoiler",
    name: "Texto Censurado",
    tag: "Tocar para Revelar",
    category: "narrativa",
    icon: "⬛",
    color: "from-purple-900 to-black",
    description: "Barra oscura que se revela al pasar el ratón o hacer tap.",
    previewClass: "fic-fx-spoiler",
  },
  {
    id: "fic-fx-wave",
    name: "Onda Melódica",
    tag: "Voz & Canto",
    category: "narrativa",
    icon: "🌊",
    color: "from-violet-400 to-fuchsia-400",
    description: "Ondulación armónica para cantos, suspiros o poesía.",
    previewClass: "fic-fx-wave",
  },
  {
    id: "fic-fx-breathe",
    name: "Respiración Sosegada",
    tag: "Paz / Romance",
    category: "narrativa",
    icon: "🌬️",
    color: "from-purple-300 to-pink-300",
    description: "Expansión y contracción suave para calma o intimidad.",
    previewClass: "fic-fx-breathe",
  },
  {
    id: "fic-fx-blur",
    name: "Niebla Mental",
    tag: "Desenfoque",
    category: "narrativa",
    icon: "🔍",
    color: "from-purple-400 to-indigo-400",
    description: "Borroso y nítido como despertar de un desmayo.",
    previewClass: "fic-fx-blur",
  },
  {
    id: "fic-fx-slam",
    name: "Impacto Decisivo",
    tag: "Golpe Contundente",
    category: "narrativa",
    icon: "🔨",
    color: "from-amber-400 to-orange-500",
    description: "Rebote potente para momentos de clímax y autoridad.",
    previewClass: "fic-fx-slam",
  },
];

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
    desc: "Contenido explícito, violencia gráfica, terror oscuro o romance adulto / NSFW.",
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

// Configuración de Géneros con Iconos y Descripciones
export const GENRE_CARDS = [
  { name: "Fantasía", icon: "🧙‍♂️", desc: "Magia, dragones y reinos arcanos" },
  { name: "Romance", icon: "💖", desc: "Pasión, dramas y vínculos intensos" },
  { name: "Aventura", icon: "⚔️", desc: "Expediciones épicas y supervivencia" },
  { name: "Acción & Shonen", icon: "💥", desc: "Combates intensos, poder y superación" },
  { name: "Isekai", icon: "🌀", desc: "Reencarnación y transporte a otro mundo" },
  { name: "Ciencia Ficción", icon: "🚀", desc: "Cyberpunk, galaxias y tecnología" },
  { name: "Misterio & Suspenso", icon: "🔍", desc: "Secretos ocultos, giros e investigación" },
  { name: "Terror / Sobrenatural", icon: "🌑", desc: "Misterio oscuro, espíritus y tensión" },
  { name: "Drama & Emocional", icon: "🎭", desc: "Historias profundas y conflictos humanos" },
  { name: "Comedia & Humor", icon: "😂", desc: "Risas, parodia y situaciones absurdas" },
  { name: "Slice of Life", icon: "☕", desc: "Vida cotidiana, humor y calidez" },
  { name: "Sobrenatural & Urbano", icon: "👁️", desc: "Fantasía urbana, demonios y poderes" },
  { name: "Cyberpunk & Distopía", icon: "🤖", desc: "Futuro sombrío, megacorporaciones e IA" },
  { name: "Histórico & Época", icon: "📜", desc: "Épocas antiguas, dinastías y reinos" },
  { name: "Psicológico", icon: "🧠", desc: "Mente humana, dilemas y giros oscuros" },
  { name: "BL / Yaoi", icon: "👬", desc: "Romance y vínculos Boys Love" },
  { name: "GL / Yuri", icon: "👭", desc: "Romance y vínculos Girls Love" },
  { name: "Harem / Poliamor", icon: "👑", desc: "Múltiples pretendientes e intrigas" },
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
  "academia_magica",
  "accion",
  "vampiros",
  "viaje_temporal",
];

export const COVER_PRESETS = [
  { name: "Portal Celestial", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80" },
  { name: "Reino Arcano", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80" },
  { name: "Ciber Neón", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80" },
  { name: "Noche Mística", url: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=500&auto=format&fit=crop&q=80" },
];

export default function EscribirPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Vistas del Taller: 'mis_historias' | 'gestion_historia'
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

  // Cargar historias del autor desde Supabase y localStorage
  const loadAuthorStories = async () => {
    if (!user?.id) return;
    setIsLoadingStories(true);

    // Cargar caché local primero
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("ficnation_user_stories");
        if (cached) setUserStories(JSON.parse(cached));
      } catch {}
    }

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

    // Comprobar parámetros de URL al montar
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlStoryId = urlParams.get("storyId");
      if (urlStoryId) {
        const supabase = createClient();
        supabase
          .from("stories")
          .select("*")
          .eq("id", urlStoryId)
          .maybeSingle()
          .then(({ data: st }) => {
            if (st) {
              const matchedStory: UserStory = {
                id: st.id,
                title: st.title,
                genre: st.genre || "Fantasía",
                synopsis: st.synopsis || "",
                tags: st.tags || [],
                coverUrl: st.cover_url || "",
                status: st.is_completed ? "completa" : "en_desarrollo",
                chaptersCount: 0,
                readsCount: st.reads_count || 0,
                votesCount: st.votes_count || 0,
                createdAt: new Date(st.created_at).toLocaleDateString("es-ES"),
              };
              selectStoryForManagement(matchedStory);
            }
          });
      }
    }
  }, [user?.id]);

  // Seleccionar historia para gestión
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

    // Cargar capítulos cacheados primero
    if (typeof window !== "undefined") {
      try {
        const cachedChapters = localStorage.getItem(`ficnation_chapters_${story.id}`);
        if (cachedChapters) setChaptersList(JSON.parse(cachedChapters));
      } catch {}
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

      const updated: UserStory = {
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
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-10 select-none">
      
      {/* Inputs ocultos para subida de portada */}
      <input ref={createCoverInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={(e) => handleCoverUpload(e, "create")} />
      <input ref={editCoverInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={(e) => handleCoverUpload(e, "edit")} />

      {/* ════════════ 1. CABECERA MÓVIL SUPERIOR ════════════ */}
      <MobileHeader
        title={viewMode === "gestion_historia" ? (selectedStory?.title || "Gestión") : "Taller de Historias"}
        showBack={true}
        onBack={() => {
          if (viewMode === "gestion_historia") {
            setViewMode("mis_historias");
          } else {
            router.push("/dashboard");
          }
        }}
        rightAction={
          viewMode === "mis_historias" ? (
            <button
              onClick={startCreationWizard}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva</span>
            </button>
          ) : null
        }
      />

      {/* Alerta de Feedback */}
      {statusMessage && (
        <div className={`mx-4 mt-2 p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in ${
          statusMessage.type === "error"
            ? "bg-rose-950/80 border-rose-500/40 text-rose-200"
            : "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === "error" ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100 p-1">✕</button>
        </div>
      )}

      {/* ════════════ 2. VISTA: MIS HISTORIAS (TALLER PRINCIPAL) ════════════ */}
      {viewMode === "mis_historias" && (
        <main className="flex-1 space-y-4 px-4 pt-3">
          
          {/* Bento de Métricas del Autor */}
          {userStories.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/5 border border-purple-500/20 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Novelas</p>
                  <p className="text-sm font-black text-white">{totalAuthorNovels}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-purple-500/20 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Capítulos</p>
                  <p className="text-sm font-black text-white">{totalAuthorChapters}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-purple-500/20 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Lecturas</p>
                  <p className="text-sm font-black text-white">{totalAuthorReads}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-purple-500/20 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Star className="w-4 h-4 fill-rose-400 text-rose-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Votos</p>
                  <p className="text-sm font-black text-white">{totalAuthorVotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filtros y Búsqueda */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(["todas", "en_desarrollo", "completa", "borrador"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStudioStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                    studioStatusFilter === st
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "bg-white/5 border border-white/10 text-slate-300"
                  }`}
                >
                  {st === "todas"
                    ? `Todas (${totalAuthorNovels})`
                    : st === "en_desarrollo"
                    ? "En Desarrollo"
                    : st === "completa"
                    ? "Completas"
                    : "Borradores"}
                </button>
              ))}
            </div>

            {userStories.length > 2 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={studioSearchQuery}
                  onChange={(e) => setStudioSearchQuery(e.target.value)}
                  placeholder="Buscar en mis historias..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
                {studioSearchQuery && (
                  <button
                    onClick={() => setStudioSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Lista de Historias del Autor */}
          {isLoadingStories ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-7 h-7 text-purple-400 animate-spin mx-auto" />
              <p className="text-xs text-purple-300">Cargando tus historias...</p>
            </div>
          ) : filteredAuthorStories.length > 0 ? (
            <div className="space-y-3">
              {filteredAuthorStories.map((story) => (
                <div
                  key={story.id}
                  className="p-3.5 rounded-3xl bg-gradient-to-br from-purple-950/20 via-slate-900/40 to-[#070a12] border border-purple-500/20 shadow-md space-y-3 transition-all"
                >
                  <div className="flex gap-3">
                    {/* Portada 2:3 */}
                    <div
                      onClick={() => selectStoryForManagement(story)}
                      className="relative w-20 aspect-[2/3] rounded-xl overflow-hidden bg-slate-800 border border-white/10 shrink-0 cursor-pointer group active:scale-95 transition-transform"
                    >
                      <FicImage src={story.coverUrl} alt={story.title} fallbackType="cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black border backdrop-blur-md ${
                        story.status === "borrador" || !story.isPublished
                          ? "bg-amber-950/90 text-amber-300 border-amber-500/50"
                          : story.status === "completa"
                          ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50"
                          : "bg-cyan-950/90 text-cyan-300 border-cyan-500/50"
                      }`}>
                        {story.status === "borrador" || !story.isPublished ? "Borrador" : story.status === "completa" ? "Completa" : "Activa"}
                      </span>
                    </div>

                    {/* Datos de la Obra */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
                          {story.genre}
                        </span>
                        {story.ageRating && (
                          <span className="px-1.5 py-0.5 rounded-md text-[8.5px] font-bold bg-black/60 border border-white/15 text-slate-300">
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
                        {story.synopsis || "Sin sinopsis establecida..."}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono">
                        <span>📖 {story.chaptersCount} caps</span>
                        <span>👁️ {story.readsCount}</span>
                        <span>⭐ {story.votesCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción Móviles */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => selectStoryForManagement(story)}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-transform cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Gestionar</span>
                    </button>

                    <Link
                      href={`/historia?id=${story.id}`}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 active:scale-95 transition-colors"
                      title="Ver en catálogo"
                    >
                      <Eye className="w-4 h-4 text-cyan-400" />
                    </Link>

                    <button
                      onClick={() => handleDeleteStory(story.id, story.title)}
                      className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 active:scale-95 transition-colors cursor-pointer"
                      title="Eliminar obra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 rounded-3xl bg-white/5 border border-purple-500/20 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No tienes historias todavía</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Crea tu primera novela o fanfic y comienza a redactar capítulos en tu móvil.
                </p>
              </div>
              <button
                onClick={startCreationWizard}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-transform cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear mi primera historia</span>
              </button>
            </div>
          )}

        </main>
      )}

      {/* ════════════ 3. VISTA: GESTIÓN DE LA HISTORIA ════════════ */}
      {viewMode === "gestion_historia" && selectedStory && (
        <main className="flex-1 space-y-4 px-4 pt-3">
          
          {/* Card Hero de la Historia */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-[#070a12] border border-purple-500/30 shadow-xl space-y-3.5">
            <div className="flex gap-3.5">
              <div className="relative w-24 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-800 border border-white/15 shrink-0 shadow-lg">
                <FicImage src={selectedStory.coverUrl} alt={selectedStory.title} fallbackType="cover" />
                <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[8.5px] font-black border backdrop-blur-md ${
                  selectedStory.status === "borrador" || !selectedStory.isPublished
                    ? "bg-amber-950/90 text-amber-300 border-amber-500/50"
                    : selectedStory.status === "completa"
                    ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50"
                    : "bg-cyan-950/90 text-cyan-300 border-cyan-500/50"
                }`}>
                  {selectedStory.status === "borrador" || !selectedStory.isPublished ? "Borrador" : selectedStory.status === "completa" ? "Completa" : "En Desarrollo"}
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
                    {selectedStory.genre}
                  </span>
                  {selectedStory.ageRating && (
                    <span className="px-1.5 py-0.5 rounded-md text-[8.5px] font-bold bg-black/60 border border-white/15 text-slate-300">
                      {selectedStory.ageRating}
                    </span>
                  )}
                </div>

                <h2 className="text-base font-black text-white leading-tight">
                  {selectedStory.title}
                </h2>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {selectedStory.synopsis || "Sin sinopsis..."}
                </p>
              </div>
            </div>

            {/* Aviso de borrador si no está publicada */}
            {(!selectedStory.isPublished || selectedStory.status === "borrador") && (
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <p>Publica al menos 1 capítulo para que aparezca en el catálogo público.</p>
              </div>
            )}

            {/* Botones de Acción Principales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                onClick={() => openChapterEditor()}
                className="col-span-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95 transition-transform cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Redactar Capítulo</span>
              </button>

              <button
                onClick={() => {
                  setEditingVolume(null);
                  setVolumeFormTitle("");
                  setVolumeFormDesc("");
                  setIsVolumeModalOpen(true);
                }}
                className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-purple-400" />
                <span>+ Tomo</span>
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Exportar</span>
              </button>
            </div>
          </div>

          {/* Pestañas de la Historia: Capítulos / Ficha / Lore */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => setStoryTab("capitulos")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                storyTab === "capitulos" ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" : "text-slate-400"
              }`}
            >
              Capítulos ({chaptersList.length})
            </button>
            <button
              onClick={() => setStoryTab("ficha")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                storyTab === "ficha" ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" : "text-slate-400"
              }`}
            >
              Ficha & Portada
            </button>
            <button
              onClick={() => setStoryTab("lore")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                storyTab === "lore" ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" : "text-slate-400"
              }`}
            >
              Lore ({loreNotes.length})
            </button>
          </div>

          {/* TAB 1: LISTA DE CAPÍTULOS */}
          {storyTab === "capitulos" && (
            <div className="space-y-3">
              {/* Filtro de Capítulos */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {(["todos", "publicados", "borradores", "programados"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setChapterFilter(filter)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      chapterFilter === filter
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-white/5 border border-white/10 text-slate-300"
                    }`}
                  >
                    {filter === "todos"
                      ? `Todos (${chaptersList.length})`
                      : filter === "publicados"
                      ? `Publicados (${chaptersList.filter((c) => c.isPublished).length})`
                      : filter === "borradores"
                      ? `Borradores (${chaptersList.filter((c) => !c.isPublished && !c.scheduledAt).length})`
                      : `Programados (${chaptersList.filter((c) => !c.isPublished && c.scheduledAt).length})`}
                  </button>
                ))}
              </div>

              {/* Lista renderizada */}
              {chaptersList.length > 0 ? (
                <div className="space-y-2.5">
                  {chaptersList
                    .filter((c) => {
                      if (chapterFilter === "publicados") return c.isPublished;
                      if (chapterFilter === "borradores") return !c.isPublished && !c.scheduledAt;
                      if (chapterFilter === "programados") return !c.isPublished && c.scheduledAt;
                      return true;
                    })
                    .map((chapter) => (
                      <div
                        key={chapter.id || chapter.chapterNumber}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black flex items-center justify-center shrink-0">
                              {chapter.chapterNumber}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{chapter.title}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {chapter.wordCount} pal • {chapter.updatedAt}
                              </p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border shrink-0 ${
                            chapter.isPublished
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                              : chapter.scheduledAt
                              ? "bg-purple-950/80 text-purple-300 border-purple-500/40"
                              : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                          }`}>
                            {chapter.isPublished ? "Publicado" : chapter.scheduledAt ? "Programado" : "Borrador"}
                          </span>
                        </div>

                        {/* Botones de Acción de Capítulo */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                          <button
                            onClick={() => openChapterEditor(chapter)}
                            className="flex-1 py-1.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleTogglePublishChapter(chapter)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold active:scale-95 cursor-pointer ${
                              chapter.isPublished
                                ? "bg-white/5 border-white/10 text-slate-400"
                                : "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                            }`}
                          >
                            {chapter.isPublished ? "A Borrador" : "Publicar"}
                          </button>

                          {!chapter.isPublished && (
                            <button
                              onClick={() => {
                                setSchedulingChapter(chapter);
                                setScheduleDateTime(chapter.scheduledAt ? chapter.scheduledAt.substring(0, 16) : "");
                                setIsScheduleModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-purple-300 active:scale-95 cursor-pointer"
                              title="Programar estreno"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteChapter(chapter.id!, chapter.title)}
                            className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 active:scale-95 cursor-pointer"
                            title="Eliminar capítulo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2 bg-white/5 rounded-2xl border border-white/10 p-4">
                  <BookOpen className="w-6 h-6 text-purple-400 mx-auto" />
                  <p className="text-xs font-bold text-white">No hay capítulos en esta sección</p>
                  <p className="text-[11px] text-slate-400">Pulsa "Redactar Capítulo" para comenzar.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FICHA & PORTADA */}
          {storyTab === "ficha" && (
            <form onSubmit={handleUpdateStoryMeta} className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Portada de la Novela</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 aspect-[2/3] rounded-xl overflow-hidden bg-slate-800 border border-white/10 shrink-0">
                    <FicImage src={editStoryForm.coverUrl} alt="Preview" fallbackType="cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => editCoverInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isUploadingCover ? "Subiendo..." : "Subir Foto"}</span>
                    </button>
                    <input
                      type="url"
                      placeholder="O pega URL de imagen..."
                      value={editStoryForm.coverUrl}
                      onChange={(e) => setEditStoryForm({ ...editStoryForm, coverUrl: e.target.value })}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
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
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Género Principal</label>
                <select
                  value={editStoryForm.genre}
                  onChange={(e) => setEditStoryForm({ ...editStoryForm, genre: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#0b0f19] border border-white/10 text-xs text-white focus:outline-none"
                >
                  {GENRE_CARDS.map((g) => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Clasificación por Edad</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {AGE_RATINGS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setEditStoryForm({ ...editStoryForm, ageRating: r.id })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        editStoryForm.ageRating === r.id ? `${r.badgeClass} ring-1 ring-current` : "bg-white/5 border-white/10 text-slate-400"
                      }`}
                    >
                      {r.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Sinopsis</label>
                <textarea
                  rows={3}
                  value={editStoryForm.synopsis}
                  onChange={(e) => setEditStoryForm({ ...editStoryForm, synopsis: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Etiquetas (separadas por comas)</label>
                <input
                  type="text"
                  value={editStoryForm.tags}
                  onChange={(e) => setEditStoryForm({ ...editStoryForm, tags: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-transform cursor-pointer"
              >
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>
          )}

          {/* TAB 3: CUADERNO DE LORE */}
          {storyTab === "lore" && (
            <div className="space-y-4">
              <form onSubmit={handleAddLoreNote} className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                  <span>Añadir Ficha de Lore o Nota</span>
                </h3>

                <input
                  type="text"
                  required
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Título (ej: Sistema Mágico, Villano...)"
                  className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
                />

                <select
                  value={newNoteCategory}
                  onChange={(e) => setNewNoteCategory(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-[#0b0f19] border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="personajes">Personajes & Aliados</option>
                  <option value="mundo">Worldbuilding & Magia</option>
                  <option value="trama">Giros de Trama</option>
                  <option value="general">Recordatorios</option>
                </select>

                <textarea
                  rows={3}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Detalles y secretos de tu historia..."
                  className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none resize-none"
                />

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-purple-600 text-white font-bold text-xs active:scale-95 cursor-pointer"
                >
                  Guardar Nota
                </button>
              </form>

              {loreNotes.length > 0 && (
                <div className="space-y-2">
                  {loreNotes.map((note) => (
                    <div key={note.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {note.category}
                        </span>
                        <p className="text-xs font-bold text-white truncate max-w-[180px]">{note.title}</p>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      )}

      {/* ════════════ 4. WIZARD MÓVIL PARA CREAR HISTORIA ════════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#0b0f19] border border-purple-500/30 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header Wizard */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Nueva Obra</h3>
                  <p className="text-[10px] text-purple-300 font-medium">Paso {createPhase} de 3</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-xl bg-white/5 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progreso */}
            <div className="h-1 w-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 transition-all duration-300"
                style={{ width: createPhase === 1 ? "33%" : createPhase === 2 ? "66%" : "100%" }}
              />
            </div>

            {/* Contenido según Fase */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {createPhase === 1 && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Título de la Obra *</label>
                    <input
                      type="text"
                      autoFocus
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      placeholder="ej: El Despertar del Héroe"
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Tipo: Original vs Fanfic */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, originType: "original" })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        createForm.originType === "original" ? "bg-purple-600 text-white border-purple-400" : "bg-white/5 border-white/10 text-slate-400"
                      }`}
                    >
                      <p className="text-xs font-bold">✨ Original</p>
                      <p className="text-[9px] opacity-80">Mundo 100% propio</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, originType: "fanfic" })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        createForm.originType === "fanfic" ? "bg-purple-600 text-white border-purple-400" : "bg-white/5 border-white/10 text-slate-400"
                      }`}
                    >
                      <p className="text-xs font-bold">⚡ Fanfiction</p>
                      <p className="text-[9px] opacity-80">Anime, libros o series</p>
                    </button>
                  </div>

                  {createForm.originType === "fanfic" && (
                    <input
                      type="text"
                      value={createForm.fandom}
                      onChange={(e) => setCreateForm({ ...createForm, fandom: e.target.value })}
                      placeholder="Nombre del anime / serie (ej: Jujutsu Kaisen)..."
                      className="w-full p-2 rounded-xl bg-black/40 border border-amber-500/40 text-xs text-white focus:outline-none"
                    />
                  )}

                  {/* Géneros */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Géneros ({createForm.genres.length}/3)</label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {GENRE_CARDS.slice(0, 10).map((g) => {
                        const isSel = createForm.genres.includes(g.name);
                        return (
                          <button
                            key={g.name}
                            type="button"
                            onClick={() => {
                              if (isSel) {
                                if (createForm.genres.length > 1) {
                                  const next = createForm.genres.filter((x) => x !== g.name);
                                  setCreateForm({ ...createForm, genres: next, genre: next[0] });
                                }
                              } else if (createForm.genres.length < 3) {
                                const next = [...createForm.genres, g.name];
                                setCreateForm({ ...createForm, genres: next, genre: next[0] });
                              }
                            }}
                            className={`p-2 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                              isSel ? "bg-purple-600 text-white border-purple-400" : "bg-white/5 border-white/10 text-slate-400"
                            }`}
                          >
                            <span>{g.icon} {g.name}</span>
                            {isSel && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Sinopsis</label>
                    <textarea
                      rows={3}
                      value={createForm.synopsis}
                      onChange={(e) => setCreateForm({ ...createForm, synopsis: e.target.value })}
                      placeholder="De qué trata tu historia..."
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {createPhase === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">Portada de la Obra</label>
                    <button
                      type="button"
                      disabled={isUploadingCover}
                      onClick={() => createCoverInputRef.current?.click()}
                      className="w-full py-4 rounded-2xl border-2 border-dashed border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-bold flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <UploadCloud className="w-6 h-6" />
                      <span>{isUploadingCover ? "Subiendo foto..." : "Subir desde mi teléfono"}</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">O elige una portada sugerida:</label>
                    <div className="grid grid-cols-4 gap-2">
                      {COVER_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, coverUrl: preset.url })}
                          className={`aspect-[2/3] rounded-xl overflow-hidden border transition-all cursor-pointer ${
                            createForm.coverUrl === preset.url ? "ring-2 ring-purple-500 scale-105" : "opacity-70"
                          }`}
                        >
                          <FicImage src={preset.url} alt={preset.name} fallbackType="cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {createPhase === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Clasificación por Edad</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {AGE_RATINGS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, ageRating: r.id })}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            createForm.ageRating === r.id ? `${r.badgeClass} ring-1 ring-current` : "bg-white/5 border-white/10 text-slate-400"
                          }`}
                        >
                          {r.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Avisos de Contenido (Opcional)</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {CONTENT_WARNINGS_LIST.map((w) => {
                        const isChecked = createForm.contentWarnings.includes(w.label);
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              setCreateForm((prev) => ({
                                ...prev,
                                contentWarnings: isChecked
                                  ? prev.contentWarnings.filter((item) => item !== w.label)
                                  : [...prev.contentWarnings, w.label],
                              }));
                            }}
                            className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-left truncate cursor-pointer ${
                              isChecked ? "bg-amber-500/20 text-amber-200 border-amber-500/50" : "bg-white/5 border-white/10 text-slate-400"
                            }`}
                          >
                            {w.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navegación */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              {createPhase > 1 ? (
                <button
                  type="button"
                  onClick={() => setCreatePhase((prev) => (prev - 1) as any)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 active:scale-95 cursor-pointer"
                >
                  Anterior
                </button>
              ) : <div />}

              {createPhase < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!createForm.title.trim()) {
                      setStatusMessage({ type: "error", text: "Escribe el título de tu historia." });
                      return;
                    }
                    setCreatePhase((prev) => (prev + 1) as any);
                  }}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md active:scale-95 cursor-pointer"
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleFinalizeStoryCreation}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg active:scale-95 cursor-pointer"
                >
                  {isSaving ? "Creando..." : "✨ Crear & Escribir Cap. 1"}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL PARA CREAR TOMO */}
      {isVolumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0b0f19] border border-purple-500/30 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-purple-400" />
              <span>{editingVolume ? "Editar Tomo" : "Nuevo Tomo / Arco"}</span>
            </h3>
            <input
              type="text"
              value={volumeFormTitle}
              onChange={(e) => setVolumeFormTitle(e.target.value)}
              placeholder="Nombre del Tomo (ej: Tomo 1: El Inicio)..."
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
            />
            <textarea
              rows={2}
              value={volumeFormDesc}
              onChange={(e) => setVolumeFormDesc(e.target.value)}
              placeholder="Descripción del arco..."
              className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsVolumeModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveVolume}
                disabled={!volumeFormTitle.trim()}
                className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA PROGRAMAR */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0b0f19] border border-purple-500/30 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-purple-400" />
              <span>Programar Publicación</span>
            </h3>
            <input
              type="datetime-local"
              value={scheduleDateTime}
              onChange={(e) => setScheduleDateTime(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none font-mono"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSchedule}
                disabled={!scheduleDateTime}
                className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA EXPORTAR NOVELA */}
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
    </div>
  );
}
