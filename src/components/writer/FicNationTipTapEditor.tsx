"use client";

import React, { useEffect, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

export interface TipTapEditorHandle {
  getHTML: () => string;
  getText: () => string;
  setHTML: (html: string) => void;
  insertContent: (content: string) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrike: () => void;
  toggleHeading: (level: 1 | 2 | 3) => void;
  toggleBlockquote: () => void;
  undo: () => void;
  redo: () => void;
  applyEffect: (effectClass: string, effectName: string) => void;
  removeEffect: () => void;
}

export interface FicNationTipTapEditorProps {
  initialContent?: string;
  placeholder?: string;
  paperTheme?: "cosmico" | "carbon" | "claro" | "sepia";
  fontFamily?: "serif" | "sans" | "mono";
  fontSize?: number;
  isSplitScreen?: boolean;
  onScroll?: (e?: React.UIEvent<HTMLDivElement>) => void;
  onChange?: (html: string) => void;
  className?: string;
}

export const FicNationTipTapEditor = forwardRef<TipTapEditorHandle, FicNationTipTapEditorProps>(
  function FicNationTipTapEditor(
    {
      initialContent = "",
      placeholder = "Comienza a redactar tu capítulo aquí...",
      paperTheme = "cosmico",
      fontFamily = "serif",
      fontSize = 18,
      isSplitScreen = false,
      onScroll,
      onChange,
      className = "",
    },
    ref
  ) {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Underline,
        Placeholder.configure({
          placeholder,
        }),
      ],
      content: initialContent,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            "focus:outline-none min-h-[380px] sm:min-h-[500px] w-full p-4 sm:p-8 space-y-4 select-text leading-relaxed",
        },
      },
      onUpdate: ({ editor }) => {
        if (onChange) {
          onChange(editor.getHTML());
        }
      },
    });

    // Exponer métodos con useImperativeHandle
    useImperativeHandle(
      ref,
      () => ({
        getHTML: () => (editor ? editor.getHTML() : ""),
        getText: () => (editor ? editor.getText() : ""),
        setHTML: (html: string) => {
          if (editor) {
            editor.commands.setContent(html, { emitUpdate: false });
          }
        },
        insertContent: (content: string) => {
          if (editor) {
            editor.chain().focus().insertContent(content).run();
          }
        },
        toggleBold: () => {
          editor?.chain().focus().toggleBold().run();
        },
        toggleItalic: () => {
          editor?.chain().focus().toggleItalic().run();
        },
        toggleUnderline: () => {
          editor?.chain().focus().toggleUnderline().run();
        },
        toggleStrike: () => {
          editor?.chain().focus().toggleStrike().run();
        },
        toggleHeading: (level: 1 | 2 | 3) => {
          editor?.chain().focus().toggleHeading({ level }).run();
        },
        toggleBlockquote: () => {
          editor?.chain().focus().toggleBlockquote().run();
        },
        undo: () => {
          editor?.chain().focus().undo().run();
        },
        redo: () => {
          editor?.chain().focus().redo().run();
        },
        applyEffect: (effectClass: string, effectName: string) => {
          if (!editor) return;
          const { from, to } = editor.state.selection;
          if (from === to) {
            editor.chain().focus().insertContent(`<span class="${effectClass}">${effectName}</span>`).run();
            return;
          }
          const text = editor.state.doc.textBetween(from, to);
          editor.chain().focus().deleteRange({ from, to }).insertContent(`<span class="${effectClass}">${text}</span>`).run();
        },
        removeEffect: () => {
          if (!editor) return;
          const { from, to } = editor.state.selection;
          if (from === to) return;
          const text = editor.state.doc.textBetween(from, to);
          editor.chain().focus().deleteRange({ from, to }).insertContent(text).run();
        },
      }),
      [editor]
    );

    // Sincronizar contenido si cambia desde fuera
    useEffect(() => {
      if (editor && initialContent !== editor.getHTML()) {
        if (!initialContent || editor.isEmpty) {
          editor.commands.setContent(initialContent || "", { emitUpdate: false });
        }
      }
    }, [initialContent, editor]);

    // Clases según tema de la hoja de papel
    const getThemeStyles = () => {
      switch (paperTheme) {
        case "claro":
          return "bg-[#faf9f6] text-[#1a1a1a] border-stone-300 shadow-xl";
        case "sepia":
          return "bg-[#f4ecd8] text-[#2c2217] border-[#ddcca7] shadow-xl";
        case "carbon":
          return "bg-[#121215] text-[#f4f4f5] border-zinc-700/60 shadow-2xl";
        default:
          return "bg-[#0b0f19] text-[#e2e8f0] border-purple-500/25 shadow-2xl";
      }
    };

    // Clases según tipografía
    const getFontFamilyStyle = () => {
      switch (fontFamily) {
        case "sans":
          return "font-sans";
        case "mono":
          return "font-mono";
        default:
          return "font-serif";
      }
    };

    return (
      <div
        onScroll={onScroll}
        className={`w-full rounded-2xl sm:rounded-3xl border transition-all duration-200 overflow-hidden ${getThemeStyles()} ${className}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className={getFontFamilyStyle()}>
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);
