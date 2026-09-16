// FicNation Novel Exporter (PDF, EPUB, TXT)

export interface ExportNovelData {
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  coverUrl?: string;
  chapters: {
    chapterNumber: number;
    title: string;
    content: string; // HTML or text
    wordCount?: number;
  }[];
}

/**
 * Limpia tags HTML para texto plano
 */
function stripHtml(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>?/gm, "");
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

/**
 * 1. Exportar a TXT / Markdown
 */
export function exportToTxt(data: ExportNovelData) {
  let output = `# ${data.title}\n`;
  output += `Autor: ${data.author}\n`;
  output += `Género: ${data.genre}\n`;
  output += `Publicado en: FicNation\n`;
  output += `Fecha de Exportación: ${new Date().toLocaleDateString()}\n\n`;
  output += `--- SINOPSIS ---\n${data.synopsis}\n\n`;
  output += `========================================================\n\n`;

  data.chapters.forEach((ch) => {
    output += `### Capítulo ${ch.chapterNumber}: ${ch.title}\n\n`;
    output += `${stripHtml(ch.content)}\n\n`;
    output += `--------------------------------------------------------\n\n`;
  });

  const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${sanitizeFilename(data.title)}.txt`);
}

/**
 * 2. Exportar a EPUB / Formato E-Book HTML estándar
 */
export function exportToEpubHtml(data: ExportNovelData) {
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${data.title} - ${data.author}</title>
  <style>
    body { font-family: 'Georgia', serif; line-height: 1.8; margin: 40px auto; max-width: 720px; color: #111; }
    .cover-page { text-align: center; page-break-after: always; padding: 60px 0; }
    .cover-title { font-size: 32px; font-weight: bold; margin-bottom: 12px; }
    .cover-author { font-size: 20px; color: #555; margin-bottom: 24px; }
    .cover-meta { font-size: 14px; color: #777; margin-top: 30px; }
    .synopsis-page { page-break-after: always; margin-bottom: 40px; }
    .chapter { page-break-before: always; margin-top: 40px; }
    .chapter-title { font-size: 24px; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 20px; }
    p { margin-bottom: 1em; text-indent: 1.5em; }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="cover-title">${data.title}</div>
    <div class="cover-author">Por: ${data.author}</div>
    <div class="cover-meta">Género: ${data.genre} • FicNation Edition</div>
  </div>

  <div class="synopsis-page">
    <h2>Sinopsis</h2>
    <p>${data.synopsis}</p>
  </div>
`;

  data.chapters.forEach((ch) => {
    html += `
  <div class="chapter">
    <h2 class="chapter-title">Capítulo ${ch.chapterNumber}: ${ch.title}</h2>
    ${ch.content}
  </div>`;
  });

  html += `\n</body>\n</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  downloadBlob(blob, `${sanitizeFilename(data.title)}_libro.html`);
}

/**
 * 3. Exportar / Imprimir a PDF Maquetado
 */
export function exportToPrintPdf(data: ExportNovelData) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const content = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${data.title} - Libro Completo</title>
  <style>
    @page {
      size: A4;
      margin: 2.5cm;
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #1a1a1a;
      line-height: 1.7;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }
    .book-cover {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      text-align: center;
    }
    .book-title {
      font-size: 30pt;
      font-weight: bold;
      margin-bottom: 15px;
      color: #0f0822;
    }
    .book-author {
      font-size: 16pt;
      color: #6b21a8;
      margin-bottom: 25px;
    }
    .book-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #f3e8ff;
      border: 1px solid #d8b4fe;
      color: #7e22ce;
      border-radius: 20px;
      font-size: 9pt;
      font-family: sans-serif;
      font-weight: bold;
    }
    .synopsis-section {
      page-break-after: always;
      padding-top: 40px;
    }
    .synopsis-title {
      font-size: 16pt;
      font-weight: bold;
      border-bottom: 2px solid #9333ea;
      padding-bottom: 6px;
      margin-bottom: 16px;
    }
    .chapter-container {
      page-break-before: always;
    }
    .chapter-heading {
      font-size: 18pt;
      font-weight: bold;
      color: #111;
      margin-top: 30px;
      margin-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    p {
      margin-bottom: 1.1em;
      text-align: justify;
      text-indent: 1.5em;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="book-cover">
    <div class="book-title">${data.title}</div>
    <div class="book-author">Escrito por ${data.author}</div>
    <div class="book-badge">${data.genre} • FicNation</div>
  </div>

  <div class="synopsis-section">
    <div class="synopsis-title">Sinopsis de la Obra</div>
    <p>${data.synopsis || "Sin sinopsis registrada."}</p>
  </div>

  ${data.chapters
    .map(
      (ch) => `
  <div class="chapter-container">
    <div class="chapter-heading">Capítulo ${ch.chapterNumber}: ${ch.title}</div>
    ${ch.content}
  </div>`
    )
    .join("")}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(content);
  printWindow.document.close();
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-\u00C0-\u017F]/gi, "_").toLowerCase();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
