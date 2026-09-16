"use client";

import React from "react";
import { CATALOG_ITEMS } from "@/types/inventory";
import { UserAvatarWithFrame } from "@/components/ui/UserAvatarWithFrame";

interface CommentBubbleProps {
  author: string;
  avatar: string;
  text: string;
  time?: string;
  bubbleSkinId?: string | null;
  avatarFrameId?: string | null;
  avatarAuraId?: string | null;
  titleName?: string | null;
  userId?: string;
  className?: string;
}

export function CommentBubble({
  author,
  avatar,
  text,
  time,
  bubbleSkinId,
  avatarFrameId,
  avatarAuraId,
  titleName,
  userId,
  className = "",
}: CommentBubbleProps) {
  const bubbleDefinition = CATALOG_ITEMS.find((c) => c.id === bubbleSkinId);

  // Estilo base o estilo especial de burbuja de comentario
  const bubbleStyleClass = bubbleDefinition?.previewClass || "fic-card-secondary";

  return (
    <div
      className={`p-4 rounded-2xl border transition-all space-y-2 ${bubbleStyleClass} ${className}`}
      style={!bubbleDefinition?.previewClass ? { borderColor: "var(--border-primary)" } : {}}
    >
      {/* Cabecera del Comentario con Avatar, Nombre y Título Cosmético */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <UserAvatarWithFrame
            src={avatar}
            alt={author}
            size="xs"
            customFrameId={avatarFrameId}
            customAuraId={avatarAuraId}
            userId={userId}
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {author}
            </span>

            {/* Título de Perfil en el Comentario */}
            {titleName && (
              <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {titleName}
              </span>
            )}
          </div>
        </div>

        {time && (
          <span className="text-[10px] opacity-75 font-mono" style={{ color: "var(--text-muted)" }}>
            {time}
          </span>
        )}
      </div>

      {/* Contenido del Comentario */}
      <p className="text-xs leading-relaxed pl-8 font-normal" style={{ color: "var(--text-secondary)" }}>
        {text}
      </p>
    </div>
  );
}
