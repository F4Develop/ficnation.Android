"use client";

import React, { useState } from "react";
import {
  Download,
  FileText,
  BookOpen,
  Printer,
  X,
  CheckCircle2,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  exportToPrintPdf,
  exportToEpubHtml,
  exportToTxt,
  type ExportNovelData,
} from "@/lib/novelExporter";

interface NovelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  novelData: ExportNovelData;
}

export function NovelExportModal({ isOpen, onClose, novelData }: NovelExportModalProps) {
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = (format: "pdf" | "epub" | "txt") => {
    if (format === "pdf") {
      exportToPrintPdf(novelData);
    } else if (format === "epub") {
      exportToEpubHtml(novelData);
    } else if (format === "txt") {
      exportToTxt(novelData);
    }
    setExportedFormat(format);
    setTimeout(() => setExportedFormat(null), 3000);
  };

  const totalWords = novelData.chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl border fic-card p-6 shadow-2xl space-y-5 animate-fade-in-scale relative"
        style={{ borderColor: "var(--border-primary)", background: "var(--bg-card)" }}
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl border fic-card-secondary hover:scale-105 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        </button>

        {/* Encabezado */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Exportar Novela Completa
            </h3>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Descarga tu obra con portada, sinopsis y maquetación de libro lista para lectura o copias de seguridad.
          </p>
        </div>

        {/* Resumen de la Obra */}
        <div className="p-3.5 rounded-2xl border fic-card-secondary space-y-1.5 text-xs">
          <p className="font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {novelData.title}
          </p>
          <div className="flex items-center gap-3 text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
            <span>{novelData.chapters.length} capítulos</span>
            <span>•</span>
            <span>{totalWords.toLocaleString()} palabras</span>
            <span>•</span>
            <span>{novelData.genre}</span>
          </div>
        </div>

        {/* Opciones de Formato */}
        <div className="grid grid-cols-1 gap-2.5">
          {/* Opción 1: PDF */}
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer fic-card-secondary hover:scale-[1.01] hover:border-purple-500/50 group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                  <span>Documento PDF / Libro Imprimible</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 font-mono">Recomendado</span>
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Maquetación de libro con saltos de página y portada.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-badge)" }} />
          </button>

          {/* Opción 2: EPUB */}
          <button
            type="button"
            onClick={() => handleExport("epub")}
            className="flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer fic-card-secondary hover:scale-[1.01] hover:border-purple-500/50 group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                  Formato Libro Digital (.html / E-Book)
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Maquetación de lectura universal para tablets, navegadores y lectores.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-badge)" }} />
          </button>

          {/* Opción 3: TXT / Markdown */}
          <button
            type="button"
            onClick={() => handleExport("txt")}
            className="flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer fic-card-secondary hover:scale-[1.01] hover:border-purple-500/50 group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                  Texto Plano & Markdown (.txt)
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Ideal para copias de seguridad limpias sin formato.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-badge)" }} />
          </button>
        </div>

        {/* Notificación de éxito */}
        {exportedFormat && (
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Novela generada y descargada con éxito!</span>
          </div>
        )}
      </div>
    </div>
  );
}
