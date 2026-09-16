/**
 * FicNation AI & Literary Translation Engine
 * Gestión de idiomas, traducción de capítulos y sistema de caché instantánea
 */

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "es", name: "Español", nativeName: "Español", flag: "🇪🇸" },
  { code: "en", name: "Inglés", nativeName: "English", flag: "🇺🇸" },
  { code: "pt", name: "Portugués", nativeName: "Português", flag: "🇧🇷" },
  { code: "fr", name: "Francés", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "Alemán", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "ja", name: "Japonés", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Coreano", nativeName: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "Chino", nativeName: "中文", flag: "🇨🇳" },
  { code: "ru", name: "Ruso", nativeName: "Русский", flag: "🇷🇺" },
];

export interface TranslateParams {
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  targetLang: string;
  sourceLang?: string;
}

export interface TranslationResult {
  translatedTitle: string;
  translatedContent: string;
  targetLang: string;
  provider: string;
  fromCache: boolean;
}

/**
 * Obtener objeto de idioma por código
 */
export function getLanguageByCode(code: string): LanguageOption {
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || {
      code,
      name: code.toUpperCase(),
      nativeName: code.toUpperCase(),
      flag: "🌐",
    }
  );
}

/**
 * Traduce un capítulo con IA/API y soporte de caché local para carga instantánea
 */
export async function translateChapter({
  storyId,
  chapterNumber,
  title,
  content,
  targetLang,
  sourceLang = "auto",
}: TranslateParams): Promise<TranslationResult> {
  const cacheKey = `ficnation_trans_${storyId}_${chapterNumber}_${targetLang}`;

  // 1. Revisar caché local en el navegador
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.translatedContent) {
          return {
            translatedTitle: parsed.translatedTitle || title,
            translatedContent: parsed.translatedContent,
            targetLang,
            provider: parsed.provider || "Caché Local Instantánea",
            fromCache: true,
          };
        }
      }
    } catch {}
  }

  // 2. Llamada a la API de FicNation
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        targetLang,
        sourceLang,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.translatedContent) {
        const result: TranslationResult = {
          translatedTitle: data.translatedTitle || title,
          translatedContent: data.translatedContent,
          targetLang,
          provider: data.provider || "FicNation Engine",
          fromCache: false,
        };

        // Guardar en caché local
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result));
          } catch {}
        }

        return result;
      }
    }
  } catch (err) {
    console.warn("FicNation API Translate error, activando fallback de emergencia del cliente:", err);
  }

  // 3. Fallback de Emergencia Directo en Cliente
  try {
    const sl = sourceLang === "auto" ? "auto" : sourceLang;
    const tagRegex = /(<[^>]+>)/g;
    const parts = content.split(tagRegex);

    const translatedParts = await Promise.all(
      parts.map(async (part) => {
        if (part.startsWith("<") && part.endsWith(">")) return part;
        const leadingSpace = part.match(/^\s*/)?.[0] || "";
        const trailingSpace = part.match(/\s*$/)?.[0] || "";
        const coreText = part.trim();
        if (!coreText) return part;

        try {
          const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(
            sl
          )}&tl=${encodeURIComponent(targetLang)}&q=${encodeURIComponent(coreText)}`;

          const r = await fetch(url);
          if (r.ok) {
            const d = await r.json();
            let textResult = coreText;
            if (Array.isArray(d) && typeof d[0] === "string") {
              textResult = d.join(" ");
            } else if (Array.isArray(d) && Array.isArray(d[0])) {
              textResult = d[0].map((item: any) => (Array.isArray(item) ? item[0] : item)).join("");
            }
            return leadingSpace + textResult + trailingSpace;
          }
        } catch {}
        return part;
      })
    );

    let translatedTitle = title;
    if (title) {
      try {
        const tUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(
          sl
        )}&tl=${encodeURIComponent(targetLang)}&q=${encodeURIComponent(title)}`;
        const tr = await fetch(tUrl);
        if (tr.ok) {
          const td = await tr.json();
          if (Array.isArray(td) && typeof td[0] === "string") {
            translatedTitle = td.join(" ");
          } else if (Array.isArray(td) && Array.isArray(td[0])) {
            translatedTitle = td[0].map((item: any) => (Array.isArray(item) ? item[0] : item)).join("");
          }
        }
      } catch {}
    }

    const fallbackResult: TranslationResult = {
      translatedTitle: translatedTitle || title,
      translatedContent: translatedParts.join(""),
      targetLang,
      provider: "FicNation Free Multi-Language",
      fromCache: false,
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(fallbackResult));
      } catch {}
    }

    return fallbackResult;
  } catch (finalErr: any) {
    throw new Error("No se pudo traducir el capítulo: " + (finalErr?.message || "Error desconocido"));
  }
}

/**
 * Limpiar caché de traducción de un capítulo específico
 */
export function clearChapterTranslationCache(storyId: string, chapterNumber: number) {
  if (typeof window === "undefined") return;
  SUPPORTED_LANGUAGES.forEach((l) => {
    localStorage.removeItem(`ficnation_trans_${storyId}_${chapterNumber}_${l.code}`);
  });
}
