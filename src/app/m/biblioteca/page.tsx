"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Clock, BookOpen, Trash2, Play } from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, type MobileTab } from "@/components/mobile/MobileBottomNav";
import { MobileStoryCard } from "@/components/mobile/MobileStoryCard";
import { useAuth } from "@/context/AuthContext";
import { type Story } from "@/data/mockStories";
import { createClient } from "@/lib/supabase/client";

export interface MobileLibraryProps {
  onSelectStory?: (storyId: string) => void;
  onSelectTab?: (tab: MobileTab) => void;
  hideNav?: boolean;
  hideHeader?: boolean;
}

export function MobileLibraryView({
  onSelectStory,
  onSelectTab,
  hideNav,
  hideHeader,
}: MobileLibraryProps = {}) {
  const { user } = useAuth();
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [historyStories, setHistoryStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"guardadas" | "historial">("guardadas");

  useEffect(() => {
    async function loadLibrary() {
      setIsLoading(true);
      try {
        const supabase = createClient();

        // 1. Si hay usuario, consultar Supabase
        if (user?.id) {
          const { data: entries, error } = await supabase
            .from("library_entries")
            .select(`
              id,
              story_id,
              current_chapter,
              progress_percent,
              stories (
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
                ),
                chapters (id, is_published)
              )
            `)
            .eq("user_id", user.id);

          if (!error && entries && entries.length > 0) {
            const mapped: Story[] = entries
              .filter((e: any) => e.stories)
              .map((e: any) => {
                const s = e.stories;
                const profile = s.profiles as any;
                const publishedChapters = Array.isArray(s.chapters)
                  ? s.chapters.filter((c: any) => c.is_published !== false)
                  : [];
                return {
                  id: s.id,
                  title: s.title,
                  synopsis: s.synopsis || "",
                  coverImage: s.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
                  author: {
                    id: s.author_id,
                    name: profile?.name || profile?.username || "Autor",
                    username: profile?.username ? `@${profile.username}` : "@autor",
                    avatar: profile?.avatar_url || "/logo.jpg",
                  },
                  genre: s.genre || "Fantasía",
                  tags: Array.isArray(s.tags) ? s.tags : [],
                  chapters: publishedChapters.length > 0 ? publishedChapters.length : 1,
                  reads: String(s.reads_count ?? 0),
                  votes: String(s.votes_count ?? 0),
                  completed: s.is_completed || false,
                };
              });

            setSavedStories(mapped);
            setIsLoading(false);
            return;
          }
        }

        // 2. Almacenamiento local (para usuarios invitados o sin conexión)
        const stored = localStorage.getItem("ficnation_library");
        if (stored) {
          setSavedStories(JSON.parse(stored));
        } else {
          setSavedStories([]);
        }

        // Cargar historial reciente
        const recent = localStorage.getItem("ficnation_recent_read");
        if (recent) {
          const parsed = JSON.parse(recent);
          if (parsed && parsed.storyId) {
            const { data: st } = await supabase
              .from("stories")
              .select("id, title, cover_url, genre, synopsis, reads_count, votes_count, author_id")
              .eq("id", parsed.storyId)
              .maybeSingle();

            if (st) {
              setHistoryStories([
                {
                  id: st.id,
                  title: st.title,
                  synopsis: st.synopsis || "",
                  coverImage: st.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
                  author: { id: st.author_id, name: "Autor", username: "@autor", avatar: "/logo.jpg" },
                  genre: st.genre || "Lectura",
                  tags: [],
                  chapters: 1,
                  reads: String(st.reads_count ?? 0),
                  votes: String(st.votes_count ?? 0),
                },
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Error al cargar biblioteca:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLibrary();
  }, [user?.id]);

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = savedStories.filter((s) => s.id !== id);
    setSavedStories(updated);

    try {
      localStorage.setItem("ficnation_library", JSON.stringify(updated));
      if (user?.id) {
        const supabase = createClient();
        await supabase
          .from("library_entries")
          .delete()
          .eq("user_id", user.id)
          .eq("story_id", id);
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-24 select-none">
      {!hideHeader && <MobileHeader title="Mi Biblioteca" />}

      <main className="flex-1 space-y-4 px-4 pt-3">
        {/* Pestañas de la Biblioteca */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("guardadas")}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "guardadas"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Guardadas ({savedStories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("historial")}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "historial"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Historial</span>
          </button>
        </div>

        {/* Estado de Carga */}
        {isLoading && (
          <div className="text-center py-20 space-y-3">
            <div className="w-9 h-9 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-purple-300 font-bold">Cargando biblioteca...</p>
          </div>
        )}

        {/* Contenido de la Biblioteca */}
        {!isLoading && (
          <>
            {(activeTab === "guardadas" ? savedStories : historyStories).length > 0 ? (
              <div className="space-y-3 pt-2">
                {(activeTab === "guardadas" ? savedStories : historyStories).map((story) => (
                  <div key={story.id} className="relative group">
                    <MobileStoryCard
                      story={story}
                      variant="horizontal"
                      onSelectStory={onSelectStory}
                    />
                    {activeTab === "guardadas" && (
                      <button
                        onClick={(e) => handleRemove(story.id, e)}
                        className="absolute top-2 right-2 p-2 rounded-xl bg-black/40 text-slate-400 hover:text-red-400 active:scale-95 transition-all"
                        title="Eliminar de biblioteca"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-3">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">
                  {activeTab === "guardadas" ? "Tu biblioteca está vacía" : "Aún no tienes historial de lectura"}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {activeTab === "guardadas"
                    ? "Explora historias y guárdalas para encontrarlas aquí fácilmente."
                    : "Los capítulos que comiences a leer aparecerán automáticamente aquí."}
                </p>
                {onSelectTab ? (
                  <button
                    onClick={() => onSelectTab("explore")}
                    className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 active:scale-95"
                  >
                    Explorar Historias
                  </button>
                ) : (
                  <Link
                    href="/explorar"
                    className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                  >
                    Explorar Historias
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {!hideNav && <MobileBottomNav activeTab="library" onSelectTab={onSelectTab} />}
    </div>
  );
}

export default function MobileLibraryPage() {
  return <MobileLibraryView />;
}
