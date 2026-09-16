"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Filter, Compass, Flame, Star, BookOpen, X } from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, type MobileTab } from "@/components/mobile/MobileBottomNav";
import { MobileStoryCard } from "@/components/mobile/MobileStoryCard";
import { type Story } from "@/data/mockStories";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = ["Todos", "Fantasía", "Romance", "Anime", "Isekai", "Ciencia Ficción", "Misterio", "Acción", "Slice of Life"];

export interface MobileExploreProps {
  onSelectStory?: (storyId: string) => void;
  onSelectTab?: (tab: MobileTab) => void;
  hideNav?: boolean;
  hideHeader?: boolean;
}

export function MobileExploreView({
  onSelectStory,
  onSelectTab,
  hideNav,
  hideHeader,
}: MobileExploreProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<"reads" | "rating" | "recent">("reads");
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDbStories() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
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
            created_at,
            profiles!author_id (
              id,
              name,
              username,
              avatar_url
            ),
            chapters (id, is_published)
          `)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error && data) {
          const mapped: Story[] = data
            .filter((s: any) => {
              // REGLA: Las historias sin capítulos deben estar en borradores y no mostrarse en explorar
              const publishedChapters = Array.isArray(s.chapters)
                ? s.chapters.filter((c: any) => c.is_published !== false)
                : [];
              return publishedChapters.length > 0;
            })
            .map((s: any) => {
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
                  name: profile?.name || profile?.username || "Autor FicNation",
                  username: profile?.username ? `@${profile.username}` : "@autor",
                  avatar: profile?.avatar_url || "/logo.jpg",
                },
                genre: s.genre || "Fantasía",
                tags: Array.isArray(s.tags) ? s.tags : [],
                chapters: publishedChapters.length,
                reads: String(s.reads_count ?? 0),
                votes: String(s.votes_count ?? 0),
                completed: s.is_completed || false,
              };
            });
          setStories(mapped);
        }
      } catch (err) {
        console.error("Error al cargar historias en explorar:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDbStories();
  }, []);

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const authorName = typeof story.author === "string" ? story.author : story.author?.name || "";
      const matchesSearch =
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.synopsis?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCategory === "Todos" ||
        story.genre?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(story.genre?.toLowerCase() || "");

      return matchesSearch && matchesCat;
    }).sort((a, b) => {
      const votesA = parseFloat(a.votes || "0");
      const votesB = parseFloat(b.votes || "0");
      const readsA = parseFloat(a.reads || "0");
      const readsB = parseFloat(b.reads || "0");

      if (sortBy === "rating") return votesB - votesA;
      if (sortBy === "recent") return b.id.localeCompare(a.id);
      return readsB - readsA;
    });
  }, [stories, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-24 select-none">
      {!hideHeader && <MobileHeader title="Explorar Historias" />}

      <main className="flex-1 space-y-4 px-4 pt-3">
        {/* Barra de Búsqueda Táctil */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, autor o género..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Chips de Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-white/5 border border-white/10 text-slate-300"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Selector de Orden */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>{filteredStories.length} obras encontradas</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSortBy("reads")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                sortBy === "reads" ? "bg-white/10 text-white font-bold" : "text-slate-400"
              }`}
            >
              Populares
            </button>
            <button
              onClick={() => setSortBy("rating")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                sortBy === "rating" ? "bg-white/10 text-white font-bold" : "text-slate-400"
              }`}
            >
              Top Estrellas
            </button>
          </div>
        </div>

        {/* Lista de Resultados */}
        <div className="space-y-3 pt-2">
          {isLoading ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-9 h-9 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-purple-300 font-bold">Consultando la base de datos...</p>
            </div>
          ) : filteredStories.length > 0 ? (
            filteredStories.map((story) => (
              <MobileStoryCard
                key={story.id}
                story={story}
                variant="horizontal"
                onSelectStory={onSelectStory}
              />
            ))
          ) : (
            <div className="text-center py-16 space-y-3">
              <Compass className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No se encontraron historias en la base de datos</p>
              <p className="text-xs text-slate-500">Prueba con otra palabra o publica una nueva obra.</p>
            </div>
          )}
        </div>
      </main>

      {!hideNav && <MobileBottomNav activeTab="explore" onSelectTab={onSelectTab} />}
    </div>
  );
}

export default function MobileExplorePage() {
  return <MobileExploreView />;
}
