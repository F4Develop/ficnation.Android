"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Minus,
  Undo,
  Redo,
  Sparkles,
} from "lucide-react";

interface MobileTipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function MobileTipTapEditor({
  content,
  onChange,
  placeholder = "Escribe aquí la historia de tu capítulo... Da vida a tus personajes y escenas.",
}: MobileTipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-purple max-w-none min-h-[360px] p-4 focus:outline-none text-slate-100 text-[15px] leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sincronizar contenido si cambia externamente (ej: al cargar capítulo)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Solo actualizar si es diferente para evitar perder el foco del cursor
      if (content === "" || editor.isEmpty) {
        editor.commands.setContent(content || "");
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="w-full min-h-[360px] rounded-2xl bg-white/[0.02] border border-white/10 p-4 text-xs text-slate-500 animate-pulse flex items-center justify-center">
        Cargando editor TipTap...
      </div>
    );
  }

  const btnClass = (isActive: boolean) =>
    `p-2 rounded-xl transition-all active:scale-90 flex items-center justify-center shrink-0 ${
      isActive
        ? "bg-purple-600 text-white shadow-sm shadow-purple-600/40"
        : "text-slate-300 hover:text-white bg-white/5 border border-white/5"
    }`;

  return (
    <div className="w-full rounded-2xl bg-[#0b0f19] border border-purple-500/25 overflow-hidden shadow-xl focus-within:border-purple-500/50 transition-colors">
      
      {/* ════════════ BARRA DE HERRAMIENTAS TIPTAP MÓVIL ════════════ */}
      <div className="flex items-center gap-1.5 p-2 bg-[#0d1222] border-b border-white/10 overflow-x-auto scrollbar-none select-none">
        
        {/* Deshacer / Rehacer */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 active:scale-90 transition-all shrink-0"
          title="Deshacer"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 active:scale-90 transition-all shrink-0"
          title="Rehacer"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

        {/* Formatos Básicos */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
          title="Negrita"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
          title="Cursiva"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive("underline"))}
          title="Subrayado"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive("strike"))}
          title="Tachado"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

        {/* Títulos y Secciones */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive("heading", { level: 2 }))}
          title="Título 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnClass(editor.isActive("heading", { level: 3 }))}
          title="Título 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive("blockquote"))}
          title="Cita / Diálogo Interior"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

        {/* Listas y Separador */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive("bulletList"))}
          title="Lista con viñetas"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive("orderedList"))}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 border border-white/5 active:scale-90 transition-all shrink-0"
          title="Línea divisoria de escena"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* ════════════ LIENZO EDITABLE TIPTAP ════════════ */}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>

      {/* ════════════ PIE DE ESTADÍSTICAS DEL EDITOR ════════════ */}
      <div className="px-4 py-2 bg-[#0d1222] border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Editor TipTap Móvil</span>
        </div>
        <div>
          <span>{editor.storage.characterCount?.words?.() ?? editor.getText().trim().split(/\s+/).filter(Boolean).length} palabras</span>
        </div>
      </div>
    </div>
  );
}
