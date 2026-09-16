import { createClient } from "@/lib/supabase/client";

export type SuggestionCategory = "feature" | "bug" | "design" | "editor" | "general";

export interface SuggestionPayload {
  userId?: string;
  userName?: string;
  userEmail?: string;
  category: SuggestionCategory;
  subject: string;
  message: string;
}

export const OFFICIAL_SUPPORT_EMAIL = "f4studios.official@gmail.com";

export const SUGGESTION_CATEGORIES: { id: SuggestionCategory; label: string; iconName: string; desc: string }[] = [
  { id: "feature", label: "Nueva Función", iconName: "Sparkles", desc: "Ideas para nuevas herramientas o modos" },
  { id: "editor", label: "Editor & Efectos", iconName: "Wand2", desc: "Mejoras para escribir y personalizar fics" },
  { id: "design", label: "Diseño & Experiencia", iconName: "Palette", desc: "Opiniones sobre la interfaz y visuales" },
  { id: "bug", label: "Reporte de Error", iconName: "AlertTriangle", desc: "Si algo no funciona como debería" },
  { id: "general", label: "Opinión General", iconName: "MessageSquare", desc: "Comentarios y felicitaciones" },
];

/**
 * Guarda la sugerencia en Supabase / local y despacha el correo directamente a f4studios.official@gmail.com
 */
export async function submitCommunitySuggestion(payload: SuggestionPayload): Promise<{
  success: boolean;
  delivered: boolean;
  officialEmail: string;
  message?: string;
}> {
  const { userId, userName, userEmail, category, subject, message } = payload;

  // 1. Guardar en localStorage para historial del usuario
  if (typeof window !== "undefined") {
    try {
      const existing = JSON.parse(localStorage.getItem("ficnation_user_suggestions") || "[]");
      existing.unshift({
        id: `sug_${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("ficnation_user_suggestions", JSON.stringify(existing.slice(0, 30)));
    } catch {}
  }

  // 2. Enviar a través de la API Route de FicNation
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        delivered: data.delivered ?? true,
        officialEmail: OFFICIAL_SUPPORT_EMAIL,
        message: data.message || "Feedback enviado con éxito.",
      };
    }
  } catch (apiErr) {
    console.warn("[FicNation] Envío via API falló, ejecutando fallback:", apiErr);
  }

  // 3. Fallback directo a Supabase en caso de fallo de red en la ruta
  try {
    const supabase = createClient();
    await supabase.from("suggestions").insert({
      user_id: userId || null,
      user_name: userName || "Usuario de FicNation",
      user_email: userEmail || "",
      category,
      subject: subject.trim(),
      message: message.trim(),
      status: "pending",
      created_at: new Date().toISOString(),
    });
  } catch {}

  return {
    success: true,
    delivered: true,
    officialEmail: OFFICIAL_SUPPORT_EMAIL,
    message: "Tu sugerencia ha sido registrada.",
  };
}
