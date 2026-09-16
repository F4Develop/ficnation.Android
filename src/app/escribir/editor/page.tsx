"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PenTool,
  Save,
  Send,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Quote,
  UploadCloud,
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
  Trash2,
  Check,
  Palette,
  Image as ImageIcon,
  Undo2,
  Redo2,
  X,
  Wand2,
  Eraser,
  Calendar,
  CalendarClock,
  FolderPlus,
  Edit3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { FicNationTipTapEditor, type TipTapEditorHandle } from "@/components/writer/FicNationTipTapEditor";
import {
  TEXT_EFFECTS_LIST,
  type TextEffectItem,
  type StoryVolume,
  type UserStory,
  type ChapterItem,
} from "@/app/escribir/page";

function MobileChapterEditorStudio() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const storyId = searchParams?.get("storyId") || "";
  const chapterId = searchParams?.get("chapterId") || "";
  const urlChap = Number(searchParams?.get("chap") || 1);

  // Estados de la historia y el capítulo
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [storyVolumes, setStoryVolumes] = useState<StoryVolume[]>([]);
  const [chaptersList, setChaptersList] = useState<ChapterItem[]>([]);
  const [editingChapter, setEditingChapter] = useState<ChapterItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de redacción
  const [chapterTitle, setChapterTitle] = useState(`Capítulo ${urlChap}`);
  const [chapterNumber, setChapterNumber] = useState(urlChap);
  const [chapterContent, setChapterContent] = useState("");
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>("none");

  // Apariencia del Lienzo
  const [chapterFontSize, setChapterFontSize] = useState(17);
  const [chapterFontFamily, setChapterFontFamily] = useState<"serif" | "sans" | "mono">("serif");
  const [chapterPaperTheme, setChapterPaperTheme] = useState<"cosmico" | "carbon" | "claro" | "sepia">("cosmico");
  const [isPaperSettingsOpen, setIsPaperSettingsOpen] = useState(false);
  const paperSettingsRef = useRef<HTMLDivElement>(null);

  // Modo Vista Previa en Móvil (Toggle entre Editor y Lector)
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<"deep" | "sepia" | "light">("deep");
  const [previewFontSize, setPreviewFontSize] = useState(17);

  // Barra de Herramientas & Panel FX
  const [isFxDrawerOpen, setIsFxDrawerOpen] = useState(false);
  const [fxCategory, setFxCategory] = useState<"todos" | "magia" | "terror" | "narrativa">("todos");
  const [fxNotice, setFxNotice] = useState<string | null>(null);

  // Modales
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageAltInput, setImageAltInput] = useState("");
  const [isUploadingInlineImage, setIsUploadingInlineImage] = useState(false);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>("");

  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [volumeFormTitle, setVolumeFormTitle] = useState("");
  const [volumeFormDesc, setVolumeFormDesc] = useState("");

  // Estado de guardado y feedback
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const tiptapRef = useRef<TipTapEditorHandle>(null);

  // Métricas del editor en tiempo real
  const plainText = chapterContent.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  // Cargar datos al montar
  useEffect(() => {
    if (!storyId) {
      router.replace("/escribir");
      return;
    }

    const loadData = async () => {
      setIsLoading(true);

      // 1. Cargar historia
      try {
        const supabase = createClient();
        const { data: st } = await supabase
          .from("stories")
          .select("*")
          .eq("id", storyId)
          .maybeSingle();

        if (st) {
          setSelectedStory({
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
          });
        }
      } catch {}

      // 2. Cargar tomos
      try {
        const savedVols = localStorage.getItem(`ficnation_volumes_${storyId}`);
        if (savedVols) setStoryVolumes(JSON.parse(savedVols));
      } catch {}

      // 3. Cargar lista de capítulos
      let loadedChapters: ChapterItem[] = [];
      try {
        const cachedChapters = localStorage.getItem(`ficnation_chapters_${storyId}`);
        if (cachedChapters) loadedChapters = JSON.parse(cachedChapters);
      } catch {}

      try {
        const supabase = createClient();
        const { data: dbChapters } = await supabase
          .from("chapters")
          .select("*")
          .eq("story_id", storyId)
          .order("chapter_number", { ascending: true });

        if (dbChapters && dbChapters.length > 0) {
          const mapped: ChapterItem[] = dbChapters.map((c: any) => ({
            id: c.id,
            storyId: c.story_id,
            chapterNumber: c.chapter_number,
            title: c.title,
            content: c.content,
            wordCount: c.word_count,
            isPublished: c.is_published,
            scheduledAt: c.scheduled_at || null,
            volumeId: c.volume_id || null,
            volumeTitle: c.volume_title || null,
            updatedAt: new Date(c.updated_at || Date.now()).toLocaleDateString("es-ES"),
          }));

          let merged = [...mapped];
          loadedChapters.forEach((loc) => {
            if (!merged.some((m) => m.chapterNumber === loc.chapterNumber)) {
              merged.push(loc);
            }
          });
          merged.sort((a, b) => a.chapterNumber - b.chapterNumber);
          loadedChapters = merged;
          localStorage.setItem(`ficnation_chapters_${storyId}`, JSON.stringify(merged));
        }
      } catch {}

      setChaptersList(loadedChapters);

      // 4. Determinar capítulo activo
      let targetChapter: ChapterItem | null = null;
      if (chapterId) {
        targetChapter = loadedChapters.find((c) => c.id === chapterId) || null;
      } else if (urlChap) {
        targetChapter = loadedChapters.find((c) => c.chapterNumber === urlChap) || null;
      }

      if (targetChapter) {
        setEditingChapter(targetChapter);
        setChapterTitle(targetChapter.title);
        setChapterNumber(targetChapter.chapterNumber);
        setSelectedVolumeId(targetChapter.volumeId || "none");
        setScheduleDateTime(targetChapter.scheduledAt ? targetChapter.scheduledAt.substring(0, 16) : "");

        const cleanContent = (targetChapter.content || "").replace(/<!--\s*fic-reveal:\s*fade\s*-->/gi, "").trim();
        setChapterContent(cleanContent);
        if (tiptapRef.current) {
          tiptapRef.current.setHTML(cleanContent);
        }
      } else {
        // Nuevo capítulo
        setEditingChapter(null);
        const nextNum = urlChap || (loadedChapters.length > 0 ? Math.max(...loadedChapters.map((c) => c.chapterNumber)) + 1 : 1);
        setChapterNumber(nextNum);
        setChapterTitle(`Capítulo ${nextNum}`);
        setChapterContent("");
        if (tiptapRef.current) {
          tiptapRef.current.setHTML("");
        }

        try {
          const autoDraft = localStorage.getItem(`ficnation_draft_${storyId}_${nextNum}`);
          if (autoDraft) {
            setChapterContent(autoDraft);
            if (tiptapRef.current) {
              tiptapRef.current.setHTML(autoDraft);
            }
          }
        } catch {}
      }

      setIsLoading(false);
    };

    loadData();
  }, [storyId, chapterId, urlChap]);

  // Auto-guardado en localStorage cada 20 segundos
  useEffect(() => {
    if (!storyId || !chapterNumber) return;

    const interval = setInterval(() => {
      const currentHtml = tiptapRef.current ? tiptapRef.current.getHTML() : chapterContent;
      const cleanText = currentHtml.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
      if (cleanText.length > 5) {
        try {
          localStorage.setItem(`ficnation_draft_${storyId}_${chapterNumber}`, currentHtml);
          const now = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
          setLastSavedTime(now);
        } catch {}
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [storyId, chapterNumber, chapterContent]);

  // Cerrar popover de ajustes al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (paperSettingsRef.current && !paperSettingsRef.current.contains(e.target as Node)) {
        setIsPaperSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Comandos del editor TipTap
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (!tiptapRef.current) return;
    switch (command) {
      case "bold":
        tiptapRef.current.toggleBold();
        break;
      case "italic":
        tiptapRef.current.toggleItalic();
        break;
      case "underline":
        tiptapRef.current.toggleUnderline();
        break;
      case "strikeThrough":
        tiptapRef.current.toggleStrike();
        break;
      case "formatBlock":
        if (value === "h1") tiptapRef.current.toggleHeading(1);
        else if (value === "h2") tiptapRef.current.toggleHeading(2);
        else if (value === "blockquote") tiptapRef.current.toggleBlockquote();
        break;
      case "undo":
        tiptapRef.current.undo();
        break;
      case "redo":
        tiptapRef.current.redo();
        break;
      default:
        break;
    }
    setChapterContent(tiptapRef.current.getHTML());
  };

  const applyTextEffect = (effectClass: string, effectName: string) => {
    if (tiptapRef.current) {
      tiptapRef.current.applyEffect(effectClass, effectName);
      setChapterContent(tiptapRef.current.getHTML());
      setFxNotice(`✨ ¡Efecto "${effectName}" aplicado!`);
      setTimeout(() => setFxNotice(null), 2200);
      setIsFxDrawerOpen(false);
    }
  };

  const removeTextEffect = () => {
    if (tiptapRef.current) {
      tiptapRef.current.removeEffect();
      setChapterContent(tiptapRef.current.getHTML());
      setFxNotice("🧹 Efectos eliminados del texto seleccionado");
      setTimeout(() => setFxNotice(null), 2000);
    }
  };

  // Inserción de imágenes
  const handleInsertImage = (url: string, alt: string = "Ilustración") => {
    if (!url.trim()) return;
    const safeUrl = url.trim();
    const safeAlt = alt.trim() || "Ilustración";
    const imgHtml = `<figure class="my-4 text-center select-none"><img src="${safeUrl}" alt="${safeAlt}" class="rounded-2xl mx-auto shadow-xl max-w-full max-h-[380px] object-cover ring-1 ring-purple-500/30" /><figcaption class="text-xs text-purple-300/60 mt-1.5 italic">${safeAlt}</figcaption></figure><p></p>`;

    if (tiptapRef.current) {
      tiptapRef.current.insertContent(imgHtml);
      setChapterContent(tiptapRef.current.getHTML());
    }
    setIsImageModalOpen(false);
    setImageUrlInput("");
    setImageAltInput("");
  };

  const handleInlineFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingInlineImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrlInput(reader.result as string);
      setIsUploadingInlineImage(false);
    };
    reader.onerror = () => {
      setIsUploadingInlineImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Guardar o Publicar Capítulo
  const handleSaveOrPublishChapter = async (
    mode: "publish" | "draft" | "schedule" = "publish",
    customSchedule?: string
  ) => {
    if (!selectedStory) return;

    const currentHtml = tiptapRef.current ? tiptapRef.current.getHTML() : chapterContent;
    const cleanText = currentHtml.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();

    if (!chapterTitle.trim() || !cleanText) {
      setStatusMessage({ type: "error", text: "Escribe un título y contenido antes de guardar." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const finalWordCount = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const isPublished = mode === "publish";
    const scheduledAt = mode === "schedule" ? (customSchedule || (scheduleDateTime ? new Date(scheduleDateTime).toISOString() : null)) : null;
    const currentVol = storyVolumes.find((v) => v.id === selectedVolumeId);
    const cleanContentToSave = currentHtml.replace(/<!--\s*fic-reveal:\s*fade\s*-->/gi, "").trim();

    const newOrUpdatedChapter: ChapterItem = {
      id: editingChapter?.id || `chap-${Date.now()}`,
      storyId: selectedStory.id,
      chapterNumber: chapterNumber,
      title: chapterTitle.trim(),
      content: cleanContentToSave,
      wordCount: finalWordCount,
      isPublished: isPublished,
      scheduledAt: scheduledAt,
      volumeId: selectedVolumeId === "none" ? null : selectedVolumeId,
      volumeTitle: currentVol ? currentVol.title : null,
      updatedAt: new Date().toLocaleDateString("es-ES"),
    };

    // Actualización local inmediata
    const filtered = chaptersList.filter(
      (c) => c.chapterNumber !== chapterNumber && (!editingChapter?.id || c.id !== editingChapter.id)
    );
    const mergedChapters = [...filtered, newOrUpdatedChapter].sort((a, b) => a.chapterNumber - b.chapterNumber);
    setChaptersList(mergedChapters);
    setEditingChapter(newOrUpdatedChapter);

    try {
      localStorage.setItem(`ficnation_chapters_${selectedStory.id}`, JSON.stringify(mergedChapters));
      localStorage.removeItem(`ficnation_draft_${selectedStory.id}_${chapterNumber}`);
    } catch {}

    // Persistir en Supabase
    try {
      const supabase = createClient();
      if (editingChapter?.id && !editingChapter.id.startsWith("chap-")) {
        await supabase
          .from("chapters")
          .update({
            chapter_number: chapterNumber,
            title: chapterTitle.trim(),
            content: cleanContentToSave,
            word_count: finalWordCount,
            is_published: isPublished,
            scheduled_at: scheduledAt,
            volume_id: newOrUpdatedChapter.volumeId,
            volume_title: newOrUpdatedChapter.volumeTitle,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingChapter.id);
      } else {
        const { data: inserted } = await supabase
          .from("chapters")
          .upsert({
            story_id: selectedStory.id,
            chapter_number: chapterNumber,
            title: chapterTitle.trim(),
            content: cleanContentToSave,
            word_count: finalWordCount,
            is_published: isPublished,
            scheduled_at: scheduledAt,
            volume_id: newOrUpdatedChapter.volumeId,
            volume_title: newOrUpdatedChapter.volumeTitle,
            updated_at: new Date().toISOString(),
          }, { onConflict: "story_id,chapter_number" })
          .select("id")
          .single();

        if (inserted?.id) {
          newOrUpdatedChapter.id = inserted.id;
        }
      }

      // Sincronizar estado público de la novela
      const hasPublished = mergedChapters.some((c) => c.isPublished);
      await supabase
        .from("stories")
        .update({
          is_published: hasPublished,
          status: hasPublished ? (selectedStory.status === "completa" ? "completa" : "en_desarrollo") : "borrador",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedStory.id);

      const now = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      setLastSavedTime(now);

      setStatusMessage({
        type: "success",
        text:
          mode === "publish"
            ? `¡Capítulo "${chapterTitle}" publicado exitosamente!`
            : mode === "schedule"
            ? `¡Capítulo programado para el ${new Date(scheduledAt!).toLocaleString("es-ES")}!`
            : `¡Borrador guardado con éxito!`,
      });
    } catch {
      setStatusMessage({
        type: "success",
        text: `¡Capítulo "${chapterTitle}" guardado en almacenamiento local!`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Programar capítulo
  const handleConfirmSchedule = async () => {
    if (!scheduleDateTime) {
      setStatusMessage({ type: "error", text: "Selecciona una fecha y hora futura." });
      return;
    }
    const scheduledIso = new Date(scheduleDateTime).toISOString();
    setIsScheduleModalOpen(false);
    await handleSaveOrPublishChapter("schedule", scheduledIso);
  };

  // Crear nuevo tomo
  const handleSaveVolume = async () => {
    if (!selectedStory || !volumeFormTitle.trim()) return;

    const newVolume: StoryVolume = {
      id: `vol-${Date.now()}`,
      storyId: selectedStory.id,
      title: volumeFormTitle.trim(),
      description: volumeFormDesc.trim(),
      order: storyVolumes.length + 1,
    };

    const updated = [...storyVolumes, newVolume];
    setStoryVolumes(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(`ficnation_volumes_${selectedStory.id}`, JSON.stringify(updated));
    }
    setSelectedVolumeId(newVolume.id);
    setIsVolumeModalOpen(false);
    setVolumeFormTitle("");
    setVolumeFormDesc("");
    setStatusMessage({ type: "success", text: `¡Tomo "${newVolume.title}" creado!` });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-3 bg-[#070a12]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-xs font-mono text-purple-300">Cargando estudio de escritura...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#070a12] text-slate-100 select-none pb-20">
      
      {/* ════════════ 1. CABECERA SUPERIOR MÓVIL DEL EDITOR ════════════ */}
      <header className="sticky top-0 z-40 w-full bg-[#0b0f19]/95 backdrop-blur-xl border-b border-purple-500/15 pt-safe shadow-sm">
        <div className="px-3 h-13 flex items-center justify-between">
        
        {/* Izquierda: Volver al Taller + Título de Capítulo */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => router.push(`/escribir?storyId=${storyId}`)}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform shrink-0"
            title="Volver a la gestión de la novela"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
          </button>

          <div className="flex items-center gap-1.5 min-w-0 flex-1 max-w-[200px] sm:max-w-xs">
            <PenTool className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              placeholder="Título del capítulo..."
              className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none w-full border-b border-transparent focus:border-purple-500 py-0.5 truncate"
            />
          </div>
        </div>

        {/* Derecha: Acciones Compactas (Lienzo, Preview, Borrador, Publicar) */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Botón Lienzo / Paleta */}
          <div className="relative" ref={paperSettingsRef}>
            <button
              onClick={() => setIsPaperSettingsOpen(!isPaperSettingsOpen)}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center active:scale-95 transition-all ${
                isPaperSettingsOpen ? "bg-purple-600 text-white border-purple-400" : "bg-white/5 border-white/10 text-purple-300"
              }`}
              title="Ajustes de Lienzo y Tipografía"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Popover de Ajustes de Papel */}
            {isPaperSettingsOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-[#0b0f19] border border-purple-500/30 p-3.5 shadow-2xl z-50 space-y-3 animate-fade-in">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Fondo del Lienzo</p>
                  <div className="grid grid-cols-2 gap-1">
                    {(["cosmico", "carbon", "claro", "sepia"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setChapterPaperTheme(t)}
                        className={`p-1.5 rounded-xl text-[10px] font-bold capitalize border ${
                          chapterPaperTheme === t ? "bg-purple-600 text-white border-purple-400" : "bg-white/5 border-white/10 text-slate-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tipografía</p>
                  <div className="grid grid-cols-3 gap-1">
                    {(["serif", "sans", "mono"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setChapterFontFamily(f)}
                        className={`p-1.5 rounded-xl text-[10px] font-bold capitalize border ${
                          chapterFontFamily === f ? "bg-purple-600 text-white border-purple-400" : "bg-white/5 border-white/10 text-slate-300"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-bold">Tamaño</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChapterFontSize((p) => Math.max(13, p - 1))}
                      className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-bold"
                    >
                      A-
                    </button>
                    <span className="font-mono text-xs text-purple-300 font-bold">{chapterFontSize}px</span>
                    <button
                      onClick={() => setChapterFontSize((p) => Math.min(26, p + 1))}
                      className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-bold"
                    >
                      A+
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Toggle Modo Vista Previa / Lector */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center active:scale-95 transition-all ${
              isPreviewMode ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-white/5 border-white/10 text-slate-300"
            }`}
            title={isPreviewMode ? "Volver al Editor" : "Vista Previa de Lectura"}
          >
            {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Guardar Borrador */}
          <button
            disabled={isSaving}
            onClick={() => handleSaveOrPublishChapter("draft")}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 active:scale-95 transition-transform disabled:opacity-50"
            title="Guardar Borrador"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* Programar */}
          <button
            disabled={isSaving}
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(18, 0, 0, 0);
              setScheduleDateTime(tomorrow.toISOString().substring(0, 16));
              setIsScheduleModalOpen(true);
            }}
            className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 active:scale-95 transition-transform disabled:opacity-50"
            title="Programar estreno"
          >
            <CalendarClock className="w-4 h-4 text-purple-400" />
          </button>

          {/* Publicar */}
          <button
            disabled={isSaving}
            onClick={() => handleSaveOrPublishChapter("publish")}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-purple-600/30 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Publicar</span>
          </button>
        </div>
      </div>
    </header>

      {/* Banner de Feedback / Estado */}
      {statusMessage && (
        <div className={`mx-3 mt-2 p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 animate-fade-in ${
          statusMessage.type === "success"
            ? "bg-emerald-950/80 text-emerald-200 border-emerald-500/40"
            : "bg-rose-950/80 text-rose-200 border-rose-500/40"
        }`}>
          <div className="flex items-center gap-1.5">
            {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="opacity-70 p-1">✕</button>
        </div>
      )}

      {/* Notificación de Efecto FX aplicado */}
      {fxNotice && (
        <div className="mx-3 mt-2 p-2 rounded-xl bg-purple-950/90 border border-purple-500/50 text-xs text-purple-200 font-bold text-center animate-fade-in shadow-lg">
          {fxNotice}
        </div>
      )}

      {/* ════════════ 2. CUERPO: MODO EDITOR O VISTA PREVIA LECTOR ════════════ */}
      <main className="flex-1 px-3 pt-3 space-y-3">
        
        {/* Barra de Datos Rápidos del Capítulo */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span className="text-purple-300 font-bold">✍️ {wordCount} palabras</span>
            <span>•</span>
            <span>~{readTimeMin} min lectura</span>
          </div>

          {/* Selector de Tomo */}
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" />
            <select
              value={selectedVolumeId}
              onChange={(e) => {
                if (e.target.value === "new") {
                  setIsVolumeModalOpen(true);
                } else {
                  setSelectedVolumeId(e.target.value);
                }
              }}
              className="bg-transparent text-[11px] font-bold text-slate-300 focus:outline-none"
            >
              <option value="none" className="bg-[#0b0f19]">Sin Tomo</option>
              {storyVolumes.map((vol) => (
                <option key={vol.id} value={vol.id} className="bg-[#0b0f19]">{vol.title}</option>
              ))}
              <option value="new" className="bg-[#0b0f19]">+ Tomo...</option>
            </select>
          </div>
        </div>

        {/* Vista Editor vs Vista Lector */}
        {!isPreviewMode ? (
          /* LIENZO DE REDACCIÓN TIPTAP */
          <div className="space-y-3 pb-24">
            <FicNationTipTapEditor
              ref={tiptapRef}
              initialContent={chapterContent}
              placeholder="Escribe tu historia aquí. Usa la barra inferior para añadir diálogos, imágenes o efectos animados FX..."
              paperTheme={chapterPaperTheme}
              fontFamily={chapterFontFamily}
              fontSize={chapterFontSize}
              onChange={(html) => setChapterContent(html)}
            />
          </div>
        ) : (
          /* VISTA PREVIA DEL LECTOR EN MÓVIL */
          <div className="space-y-3 pb-24 animate-fade-in">
            {/* Controles de Lector */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <span className="text-[10px] font-bold uppercase text-amber-400 font-mono">Modo Lectura</span>
              <div className="flex items-center gap-1">
                {(["deep", "sepia", "light"] as const).map((th) => (
                  <button
                    key={th}
                    onClick={() => setPreviewTheme(th)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      previewTheme === th ? "bg-purple-600 text-white" : "text-slate-400"
                    }`}
                  >
                    {th === "deep" ? "🌙 Oscuro" : th === "sepia" ? "📜 Sepia" : "☀️ Claro"}
                  </button>
                ))}
              </div>
            </div>

            {/* Hoja del Lector */}
            <div
              className={`p-5 rounded-3xl border shadow-2xl transition-all ${
                previewTheme === "deep"
                  ? "bg-[#0a0614] text-[#ede8f8] border-purple-500/20"
                  : previewTheme === "sepia"
                  ? "bg-[#f4ecd8] text-[#2c2217] border-[#ddcca7]"
                  : "bg-[#faf9f6] text-[#1a1a1a] border-stone-300"
              }`}
              style={{
                fontSize: `${previewFontSize}px`,
                lineHeight: "1.85",
                fontFamily: chapterFontFamily === "sans" ? "ui-sans-serif, sans-serif" : chapterFontFamily === "mono" ? "monospace" : "Georgia, serif",
              }}
            >
              <div className="text-center pb-4 mb-4 border-b border-dashed border-white/15 space-y-1">
                <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">
                  Capítulo {chapterNumber}
                </span>
                <h2 className="text-lg font-black">{chapterTitle || `Capítulo ${chapterNumber}`}</h2>
                <p className="text-[10px] opacity-60 font-mono">
                  Por {user?.name || "Autor"} • {wordCount} palabras
                </p>
              </div>

              {chapterContent ? (
                <div
                  className="prose prose-invert max-w-none space-y-3"
                  dangerouslySetInnerHTML={{ __html: chapterContent }}
                />
              ) : (
                <p className="text-center text-xs italic opacity-50 py-12">
                  Escribe en el editor para ver el renderizado en tiempo real aquí...
                </p>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ════════════ 3. BARRA DE HERRAMIENTAS INFERIOR FIJA MÓVIL ════════════ */}
      {!isPreviewMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0f19]/95 backdrop-blur-xl border-t border-purple-500/20 px-2 py-1.5 shadow-2xl">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-lg mx-auto py-0.5">
            {/* Formato Rápido B, I, U, S */}
            <button
              onClick={() => executeCommand("bold")}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-white active:scale-90 shrink-0"
              title="Negrita"
            >
              B
            </button>
            <button
              onClick={() => executeCommand("italic")}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center italic font-serif text-sm text-white active:scale-90 shrink-0"
              title="Cursiva"
            >
              I
            </button>
            <button
              onClick={() => executeCommand("underline")}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center underline text-xs font-bold text-white active:scale-90 shrink-0"
              title="Subrayado"
            >
              U
            </button>
            <button
              onClick={() => executeCommand("strikeThrough")}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center line-through text-xs text-slate-400 active:scale-90 shrink-0"
              title="Tachado"
            >
              S
            </button>

            <div className="w-px h-5 bg-white/10 mx-0.5 shrink-0" />

            {/* Títulos H1 & H2 */}
            <button
              onClick={() => executeCommand("formatBlock", "h1")}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-extrabold text-[10px] text-white active:scale-90 shrink-0"
              title="Título H1"
            >
              H1
            </button>
            <button
              onClick={() => executeCommand("formatBlock", "h2")}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[9px] text-white active:scale-90 shrink-0"
              title="Subtítulo H2"
            >
              H2
            </button>

            {/* Raya de diálogo literaria — */}
            <button
              onClick={() => {
                tiptapRef.current?.insertContent("— ");
                setChapterContent(tiptapRef.current?.getHTML() || "");
              }}
              className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center font-bold text-sm text-purple-300 active:scale-90 shrink-0"
              title="Raya de Diálogo"
            >
              —
            </button>

            {/* Separador Ornamental ✦ */}
            <button
              onClick={() => {
                tiptapRef.current?.insertContent(
                  `<div class="my-4 text-center text-purple-400 font-bold tracking-[0.5em] select-none">✦ ✦ ✦</div><p></p>`
                );
                setChapterContent(tiptapRef.current?.getHTML() || "");
              }}
              className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xs text-amber-300 active:scale-90 shrink-0"
              title="Separador de Escena"
            >
              ✦
            </button>

            {/* Insertar Imagen */}
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300 active:scale-90 shrink-0"
              title="Insertar Foto"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>

            {/* Comodín T/N */}
            <button
              onClick={() => {
                tiptapRef.current?.insertContent("T/N ");
                setChapterContent(tiptapRef.current?.getHTML() || "");
              }}
              className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center font-mono font-bold text-[9px] text-purple-200 active:scale-90 shrink-0"
              title="Comodín Protagonista T/N"
            >
              T/N
            </button>

            {/* Botón Efectos de Texto FX */}
            <button
              onClick={() => setIsFxDrawerOpen(true)}
              className="px-2.5 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-400/40 flex items-center gap-1 font-bold text-xs text-white shadow-md active:scale-90 shrink-0"
              title="Efectos de Texto Animados FX"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>FX</span>
            </button>

            <div className="w-px h-5 bg-white/10 mx-0.5 shrink-0" />

            {/* Deshacer y Rehacer */}
            <button
              onClick={() => executeCommand("undo")}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:scale-90 shrink-0"
              title="Deshacer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => executeCommand("redo")}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:scale-90 shrink-0"
              title="Rehacer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════ 4. DRAWER MÓVIL DE EFECTOS ANIMADOS FX ════════════ */}
      {isFxDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-t-3xl bg-[#0b0f19] border-t border-purple-500/40 p-4 space-y-3 max-h-[80vh] flex flex-col shadow-2xl">
            
            {/* Header del Drawer FX */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Efectos de Texto Animados FX</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Selecciona texto en el editor y pulsa un efecto</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={removeTextEffect}
                  className="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Quitar FX</span>
                </button>
                <button onClick={() => setIsFxDrawerOpen(false)} className="p-1 rounded-lg text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pestañas de Categoría FX */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold">
              {(["todos", "narrativa", "magia", "terror"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFxCategory(cat)}
                  className={`flex-1 py-1 rounded-lg capitalize transition-all ${
                    fxCategory === cat ? "bg-purple-600 text-white shadow-sm" : "text-slate-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Lista de Efectos */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {TEXT_EFFECTS_LIST
                .filter((fx) => fxCategory === "todos" || fx.category === fxCategory)
                .map((fx) => (
                  <button
                    key={fx.id}
                    onClick={() => applyTextEffect(fx.id, fx.name)}
                    className="w-full text-left p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 hover:border-purple-500/40 active:scale-98 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{fx.icon}</span>
                        <p className="text-xs font-bold text-white truncate">{fx.name}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{fx.description}</p>
                    </div>

                    <span className={`px-2 py-1 rounded-xl bg-black/40 border border-white/10 text-[10px] shrink-0 ${fx.previewClass}`}>
                      {fx.category === "terror" ? "Terror" : fx.category === "magia" ? "Arcano" : "Voz ✦"}
                    </span>
                  </button>
                ))}
            </div>

          </div>
        </div>
      )}

      {/* MODAL PARA INSERTAR IMAGEN */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0b0f19] border border-purple-500/30 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>Insertar Imagen en el Capítulo</span>
            </h3>

            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Enlace URL de imagen (https://i.ibb.co/...)"
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
            />

            <input
              type="file"
              ref={inlineFileInputRef}
              onChange={handleInlineFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inlineFileInputRef.current?.click()}
              className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploadingInlineImage ? "Subiendo archivo..." : "Subir desde mi teléfono"}</span>
            </button>

            <input
              type="text"
              value={imageAltInput}
              onChange={(e) => setImageAltInput(e.target.value)}
              placeholder="Descripción / Pie de foto (opcional)"
              className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
            />

            {imageUrlInput && (
              <img src={imageUrlInput} alt="Preview" className="max-h-32 rounded-xl mx-auto object-cover" />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!imageUrlInput.trim()}
                onClick={() => handleInsertImage(imageUrlInput, imageAltInput)}
                className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs disabled:opacity-50"
              >
                Insertar
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
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSchedule}
                disabled={!scheduleDateTime}
                className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
              >
                Confirmar
              </button>
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
              <span>Nuevo Tomo / Arco</span>
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
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveVolume}
                disabled={!volumeFormTitle.trim()}
                className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ChapterEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-3 bg-[#070312]">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-xs font-mono text-purple-300">Cargando Estudio de Escritura...</p>
        </div>
      }
    >
      <MobileChapterEditorStudio />
    </Suspense>
  );
}
