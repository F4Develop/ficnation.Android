"use client";

import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, Eye, Star, BookOpen, Sparkles } from "lucide-react";
import type { Story, StoryStatus } from "@/data/mockStories";
import { FicImage } from "@/components/ui/FicImage";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { checkIsAdmin } from "@/lib/adminAuth";
import { useStoryModal } from "@/context/StoryModalContext";
import { useAuth } from "@/context/AuthContext";
import { useStoryInteractions, toggleStoryVote } from "@/lib/storyInteractions";

interface StoryCardProps {
  story: Story;
  layout?: "grid" | "horizontal";
}

export function StoryCard({ story, layout = "grid" }: StoryCardProps) {
  const { openStoryModal } = useStoryModal();
  const { user } = useAuth();
  const authorProfileLink = `/usuario?id=${encodeURIComponent(story.author.username || story.author.name.toLowerCase().replace(/\s+/g, "_"))}`;

  // Sincronización en tiempo real de vistas y estrellas
  const { reads, votes, hasVoted } = useStoryInteractions(
    story.id,
    story.reads,
    story.votes
  );

  // Determinación del estado (Completa, En Desarrollo o Cancelada)
  let status: StoryStatus = "en_desarrollo";
  if (story.status) {
    status = story.status;
  } else if (story.completed) {
    status = "completa";
  }

  // Configuración visual de cada estado
  const statusConfig = {
    completa: {
      label: "Completa",
      badgeClass: "bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50",
      icon: CheckCircle2,
      dotColor: "bg-emerald-400",
    },
    en_desarrollo: {
      label: "En Desarrollo",
      badgeClass: "bg-cyan-950/90 text-cyan-300 border-cyan-500/50 shadow-cyan-950/50",
      icon: Clock,
      dotColor: "bg-cyan-400 animate-pulse",
    },
    cancelada: {
      label: "Cancelada",
      badgeClass: "bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-rose-950/50",
      icon: AlertCircle,
      dotColor: "bg-rose-400",
    },
    borrador: {
      label: "Borrador",
      badgeClass: "bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-amber-950/50",
      icon: Clock,
      dotColor: "bg-amber-400",
    },
  }[status] || {
    label: "En Desarrollo",
    badgeClass: "bg-cyan-950/90 text-cyan-300 border-cyan-500/50 shadow-cyan-950/50",
    icon: Clock,
    dotColor: "bg-cyan-400 animate-pulse",
  };

  const StatusIcon = statusConfig.icon;

  const handleCardClick = () => {
    openStoryModal({
      ...story,
      reads: String(reads),
      votes: String(votes),
    });
  };

  const handleQuickVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleStoryVote({
      storyId: story.id,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
      storyTitle: story.title,
      authorId: story.author?.id,
      currentCount: votes,
    });
  };

  if (layout === "horizontal") {
    return (
      <div
        onClick={handleCardClick}
        className="story-card group relative flex flex-col sm:flex-row items-stretch rounded-2xl border fic-card hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer w-full"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
      >
        {/* Portada a la izquierda (Tamaño mediano equilibrado) */}
        <div className="relative aspect-[2/3] w-full sm:w-44 shrink-0 overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
          <FicImage
            src={story.coverImage}
            alt={story.title}
            fallbackType="cover"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />
          
          {/* Badge Estado en portada */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1">
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white/90 border border-white/15 backdrop-blur-md shadow-sm">
              {story.genre}
            </span>
          </div>

          {/* Clasificación de edad */}
          {story.ageRating && (
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold backdrop-blur-md border shadow-sm bg-black/60 text-white/90 border-white/20">
                {story.ageRating}
              </span>
            </div>
          )}
        </div>

        {/* Información a la derecha (Llena todo el espacio horizontal sin vacíos) */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base sm:text-lg font-black tracking-tight line-clamp-1 group-hover:text-purple-500 transition-colors" style={{ color: "var(--text-primary)" }}>
                {story.title}
              </h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusConfig.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                <span>{statusConfig.label}</span>
              </span>
            </div>

            {/* Sinopsis completa */}
            {story.synopsis && (
              <p className="text-xs line-clamp-2 sm:line-clamp-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {story.synopsis}
              </p>
            )}

            {/* Tags / Etiquetas */}
            {story.tags && story.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {story.tags.slice(0, 5).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md border"
                    style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-muted)" }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Fila Inferior: Métricas y Botón Leer */}
          <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t flex-wrap" style={{ borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-4 text-xs font-mono font-medium" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5" title="Lecturas">
                <Eye className="w-3.5 h-3.5" />
                <span>{Math.max(Number(reads) || 0, Number(votes) || 0)}</span>
              </span>
              <button
                type="button"
                onClick={handleQuickVote}
                className="flex items-center gap-1.5 hover:text-amber-400 transition-colors cursor-pointer"
                title={hasVoted ? "Quitar estrella" : "Votar"}
              >
                <Star className={`w-3.5 h-3.5 ${hasVoted ? "text-amber-400 fill-amber-400" : "text-amber-400/70"}`} />
                <span>{votes}</span>
              </button>
              <span className="flex items-center gap-1.5" title="Capítulos">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{story.chapters} cap.</span>
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold fic-btn-primary shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Leer Obra</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="story-card group relative flex flex-col rounded-2xl border fic-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
    >
      
      {/* ══════════════════════════════════════════════════════════ */}
      {/* 1. PORTADA COMPLETA (TAMAÑO REAL DE LIBRO 2:3)             */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="relative aspect-[2/3] w-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
        
        {/* Imagen o GIF de la Portada con Shimmer */}
        <FicImage
          src={story.coverImage}
          alt={story.title}
          fallbackType="cover"
          className="transition-transform duration-500 group-hover:scale-105"
        />

        {/* ══════════════════════════════════════════════════════════ */}
        {/* 2. DIFUMINADO ELEGANTE PARA ALTO CONTRASTE DE TEXTO       */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/20 opacity-90 transition-opacity duration-300 group-hover:opacity-95 pointer-events-none" />

        {/* Indicador flotante en Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md backdrop-blur-md fic-btn-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ver detalles & Leer</span>
          </span>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* 3. INDICADOR SUTIL DE ESTADO (SIN TEXTO INVASIVO)          */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="absolute top-2.5 right-2.5 z-10" title={`Estado: ${statusConfig.label}`}>
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-sm transition-transform duration-300 group-hover:scale-110">
            <span
              className={`w-2 h-2 rounded-full ${statusConfig.dotColor} ${
                status === "completa"
                  ? "shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                  : status === "en_desarrollo"
                  ? "shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse"
                  : "shadow-[0_0_8px_rgba(244,63,94,0.9)]"
              }`}
            />
          </div>
        </div>

        {/* Género & Clasificación de Edad (Esquina superior izquierda sutil) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 flex-wrap">
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold text-white/90 border border-white/15 backdrop-blur-md shadow-sm">
            {story.genre}
          </span>
          {story.ageRating && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold backdrop-blur-md border shadow-sm ${
                story.ageRating === "+18"
                  ? "bg-rose-950/90 text-rose-300 border-rose-500/80"
                  : story.ageRating === "+16"
                  ? "bg-amber-950/90 text-amber-300 border-amber-500/70"
                  : story.ageRating === "+13"
                  ? "bg-cyan-950/90 text-cyan-300 border-cyan-500/70"
                  : "bg-emerald-950/90 text-emerald-300 border-emerald-500/70"
              }`}
            >
              {story.ageRating}
            </span>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* 4. CONTENIDO INFERIOR CON NOMBRE CENTRADO                  */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 flex flex-col items-center text-center justify-end space-y-1.5 z-10">
          
          {/* TÍTULO CENTRADO */}
          <h3 className="text-xs sm:text-[13px] font-extrabold text-white story-cover-title text-center leading-snug line-clamp-2 transition-colors w-full px-0.5">
            {story.title}
          </h3>

          {/* AUTOR CENTRADO CON AVATAR Y BADGE DE VERIFICADO */}
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="relative z-20"
          >
            <Link
              href={authorProfileLink}
              className="inline-flex items-center justify-center gap-1.5 group/author hover:opacity-100 max-w-full"
            >
              <div className="relative h-4 w-4 rounded-full overflow-hidden ring-1 ring-white/50 shrink-0 transition-all">
                <FicImage
                  src={story.author.avatar}
                  alt={story.author.name}
                  fallbackType="avatar"
                />
              </div>
              <span className="text-[11px] font-semibold text-white/90 group-hover/author:text-white transition-colors truncate">
                {story.author.name}
              </span>
              {story.author.isVerified && (
                <VerifiedBadge
                  size="xs"
                  variant={checkIsAdmin(story.author) ? "creator" : "verified"}
                />
              )}
            </Link>
          </div>

          {/* MÉTRICAS INFERIORES CENTRADAS CON ESTRELLA INTERACTIVA */}
          <div className="pt-1.5 border-t border-white/15 w-full flex items-center justify-center gap-3 text-[10px] text-white font-medium font-mono">
            <span className="flex items-center gap-1" title="Lecturas únicas">
              <Eye className="w-3 h-3 text-white/90" />
              <span>{Math.max(Number(reads) || 0, Number(votes) || 0)}</span>
            </span>

            {/* Voto rápido interactivo desde la tarjeta */}
            <button
              type="button"
              onClick={handleQuickVote}
              className={`flex items-center gap-1 transition-all cursor-pointer hover:scale-110 active:scale-95 px-1 py-0.5 rounded-md ${
                hasVoted
                  ? "text-amber-300 font-bold bg-amber-500/20"
                  : "text-white/80 hover:text-amber-300"
              }`}
              title={hasVoted ? "Quitar estrella a esta historia" : "Otorgar estrella a esta historia"}
            >
              <Star
                className={`w-3 h-3 transition-all ${
                  hasVoted
                    ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]"
                    : "text-amber-400/80 fill-amber-400/20"
                }`}
              />
              <span>{votes}</span>
            </button>

            <span className="flex items-center gap-1" title="Capítulos">
              <BookOpen className="w-3 h-3 text-cyan-300" />
              <span>{story.chapters} cap.</span>
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
