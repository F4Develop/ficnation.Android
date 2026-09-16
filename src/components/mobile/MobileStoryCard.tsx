"use client";

import Link from "next/link";
import { Star, Eye, BookOpen } from "lucide-react";
import { type Story } from "@/data/mockStories";

interface MobileStoryCardProps {
  story: Story;
  variant?: "portrait" | "horizontal";
  progress?: number;
  currentChapter?: number;
  rank?: number;
  onSelectStory?: (storyId: string) => void;
}

export function MobileStoryCard({
  story,
  variant = "portrait",
  progress,
  currentChapter,
  rank,
  onSelectStory,
}: MobileStoryCardProps) {
  const storyHref = `/historia?id=${story.id}`;
  const authorName = typeof story.author === "string" ? story.author : story.author?.name || "Autor FicNation";
  const coverSrc = story.coverImage || "/placeholder-book.png";
  const chaptersCount = story.chapters || 1;

  const handleClick = (e: React.MouseEvent) => {
    if (onSelectStory) {
      e.preventDefault();
      onSelectStory(story.id);
    }
  };

  if (variant === "portrait") {
    return (
      <Link
        href={storyHref}
        onClick={handleClick}
        className="group relative flex-shrink-0 w-36 sm:w-40 flex flex-col active:scale-95 transition-transform select-none"
      >
        {/* Portada del libro con sombra y proporción 3:4 */}
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-800 shadow-md shadow-black/40 border border-white/10 group-hover:border-purple-500/40 transition-all">
          <img
            src={coverSrc}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Gradiente para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          {/* Badge de Ranking (#1, #2, #3...) */}
          {typeof rank === "number" && (
            <div
              className={`absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shadow-lg ${
                rank === 1
                  ? "bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 shadow-amber-500/50"
                  : rank === 2
                  ? "bg-gradient-to-tr from-slate-200 to-slate-400 text-slate-950 shadow-slate-400/40"
                  : rank === 3
                  ? "bg-gradient-to-tr from-amber-600 to-amber-400 text-white shadow-amber-600/40"
                  : "bg-black/70 backdrop-blur-md text-white/90 border border-white/20 text-[11px]"
              }`}
            >
              {rank}
            </div>
          )}

          {/* Badge de género / etiqueta arriba a la derecha */}
          {story.genre && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-purple-300 border border-purple-500/30">
              {story.genre}
            </span>
          )}

          {/* Barra de progreso si está en "Continuar Leyendo" */}
          {typeof progress === "number" && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-r-full"
                style={{ width: `${Math.min(Math.max(progress, 5), 100)}%` }}
              />
            </div>
          )}

          {/* Stats en la parte inferior de la portada */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white/90">
            <span className="flex items-center gap-1 font-semibold text-amber-400">
              <Star className="w-3 h-3 fill-amber-400" />
              {story.votes || "4.8"}
            </span>
            <span className="flex items-center gap-1 text-slate-300 text-[10px]">
              <Eye className="w-3 h-3" />
              {story.reads || "1.2k"}
            </span>
          </div>
        </div>

        {/* Título y Autor debajo */}
        <div className="mt-2 space-y-0.5 px-0.5">
          <h3 className="text-xs font-bold text-slate-100 truncate line-clamp-1 group-hover:text-purple-300 transition-colors">
            {story.title}
          </h3>
          <p className="text-[11px] text-slate-400 truncate">
            {authorName}
          </p>
          {currentChapter && (
            <p className="text-[10px] font-semibold text-purple-400">
              Capítulo {currentChapter}
            </p>
          )}
        </div>
      </Link>
    );
  }

  // Horizontal Card (para listas verticales de feed)
  return (
    <Link
      href={storyHref}
      onClick={handleClick}
      className="group flex gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/30 active:scale-[0.98] transition-all"
    >
      {/* Portada en miniatura */}
      <div className="relative aspect-[3/4] w-20 rounded-xl overflow-hidden bg-slate-800 shrink-0 shadow-md border border-white/10">
        <img
          src={coverSrc}
          alt={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Información de la historia */}
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {story.genre && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {story.genre}
              </span>
            )}
            {story.completed && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Completa
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-purple-300 transition-colors">
            {story.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {story.synopsis || "Una historia fascinante llena de aventuras, personajes memorables y giros inesperados."}
          </p>
        </div>

        {/* Autor y métricas */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-white/5">
          <span className="truncate font-medium text-slate-300">
            {authorName}
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-3 h-3 fill-amber-400" />
              {story.votes || "4.9"}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {chaptersCount} caps
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
