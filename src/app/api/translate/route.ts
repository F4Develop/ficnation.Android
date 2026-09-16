import { NextResponse } from "next/server";

interface TranslationRequest {
  title?: string;
  content: string;
  sourceLang?: string;
  targetLang: string;
}

/**
 * Traduce un texto plano o bloque usando Google Endpoint de alta resiliencia y velocidad
 */
async function translateTextFree(text: string, targetLang: string, sourceLang = "auto"): Promise<string> {
  if (!text || !text.trim()) return text;

  // 1. Motor Primario: Google dict-chrome-ex (Ultra rápido, sin bloqueo)
  try {
    const sl = sourceLang === "auto" ? "auto" : sourceLang;
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(
      sl
    )}&tl=${encodeURIComponent(targetLang)}&q=${encodeURIComponent(text)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && typeof data[0] === "string") {
        return data.join(" ");
      } else if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((item: any) => (Array.isArray(item) ? item[0] : item)).join("");
      }
    }
  } catch (err) {
    console.warn("FicNation Primary Translate API fallback:", err);
  }

  // 2. Motor Secundario: MyMemory API
  try {
    const pair = `${sourceLang === "auto" ? "es" : sourceLang}|${targetLang}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text.slice(0, 500)
    )}&langpair=${encodeURIComponent(pair)}`;

    const res = await fetch(myMemoryUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch {}

  return text;
}

/**
 * Traduce un texto HTML preservando tags, clases (como fic-fx) y estructura de párrafos con espacios intactos
 */
async function translateHtmlContent(html: string, targetLang: string, sourceLang = "auto"): Promise<string> {
  if (!html || !html.trim()) return html;

  // Si no contiene tags HTML, traducir directo
  if (!html.includes("<") && !html.includes(">")) {
    return translateTextFree(html, targetLang, sourceLang);
  }

  // Si es HTML con párrafos o spans
  const tagRegex = /(<[^>]+>)/g;
  const parts = html.split(tagRegex);

  // Procesamos los segmentos de texto en lotes controlados para evitar Rate Limit (429)
  const translatedParts: string[] = new Array(parts.length);
  const BATCH_SIZE = 5;

  for (let i = 0; i < parts.length; i += BATCH_SIZE) {
    const chunkIndices = Array.from(
      { length: Math.min(BATCH_SIZE, parts.length - i) },
      (_, idx) => i + idx
    );

    await Promise.all(
      chunkIndices.map(async (idx) => {
        const part = parts[idx];
        if (part.startsWith("<") && part.endsWith(">")) {
          translatedParts[idx] = part;
          return;
        }
        const leadingSpace = part.match(/^\s*/)?.[0] || "";
        const trailingSpace = part.match(/\s*$/)?.[0] || "";
        const coreText = part.trim();
        if (!coreText) {
          translatedParts[idx] = part;
          return;
        }

        try {
          const trans = await translateTextFree(coreText, targetLang, sourceLang);
          translatedParts[idx] = leadingSpace + trans + trailingSpace;
        } catch {
          translatedParts[idx] = part;
        }
      })
    );
  }

  return translatedParts.join("");
}

/**
 * Traducción con Google Gemini AI (si hay GEMINI_API_KEY)
 */
async function translateWithGemini(
  apiKey: string,
  title: string,
  content: string,
  targetLang: string,
  sourceLang = "auto"
) {
  const prompt = `You are a world-class literary translator specialized in fantasy, romance, sci-fi, and light novels for FicNation.
Translate the following chapter title and content from "${sourceLang}" into "${targetLang}".

CRITICAL RULES:
1. Preserve ALL HTML tags, inline styles, and class names exactly as they are (e.g. <p>, <span class="fic-fx-glow-purple">, <em>, <strong>, <img>).
2. Preserve narrative dialogues, em-dashes (—), line breaks, and emotional tone with high literary beauty.
3. Return ONLY a valid JSON object with the exact format:
{"translatedTitle": "...", "translatedContent": "..."}
Do not add any markdown backticks or commentary.

TITLE:
${title || "Capítulo"}

CONTENT:
${content}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini API Error: ${res.statusText}`);
  }

  const data = await res.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) throw new Error("Respuesta vacía de Gemini");

  const parsed = JSON.parse(textResponse);
  return {
    translatedTitle: parsed.translatedTitle || title,
    translatedContent: parsed.translatedContent || content,
    provider: "Google Gemini AI",
  };
}

export async function POST(req: Request) {
  try {
    const body: TranslationRequest = await req.json();
    const { title = "", content, sourceLang = "auto", targetLang } = body;

    if (!content || !targetLang) {
      return NextResponse.json(
        { error: "Faltan parámetros 'content' o 'targetLang'" },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    // 1. Intentar con Gemini AI si la clave está disponible
    if (geminiKey) {
      try {
        const aiResult = await translateWithGemini(geminiKey, title, content, targetLang, sourceLang);
        return NextResponse.json({
          success: true,
          ...aiResult,
          sourceLang,
          targetLang,
        });
      } catch (geminiError) {
        console.warn("FicNation Gemini Error, usando fallback de alta velocidad:", geminiError);
      }
    }

    // 2. Motor de Traducción de Alta Velocidad (HTML & Preservación de tags)
    const [translatedTitle, translatedContent] = await Promise.all([
      title ? translateTextFree(title, targetLang, sourceLang) : Promise.resolve(""),
      translateHtmlContent(content, targetLang, sourceLang),
    ]);

    return NextResponse.json({
      success: true,
      translatedTitle: translatedTitle || title,
      translatedContent: translatedContent || content,
      sourceLang,
      targetLang,
      provider: "FicNation Engine (Free Multi-Language)",
    });
  } catch (error: any) {
    console.error("Error en /api/translate:", error);
    return NextResponse.json(
      { error: error?.message || "Error al procesar la traducción" },
      { status: 500 }
    );
  }
}
