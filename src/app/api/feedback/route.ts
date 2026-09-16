import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export const runtime = "nodejs";

const OFFICIAL_EMAIL = "f4studios.official@gmail.com";

const CATEGORY_NAMES: Record<string, string> = {
  feature: "✨ Nueva Función / Idea",
  editor: "✍️ Editor & Efectos",
  design: "🎨 Diseño & Experiencia UI",
  bug: "🐞 Reporte de Error / Bug",
  general: "💬 Opinión General",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userName, userEmail, category, subject, message } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "El asunto y el mensaje son requeridos." },
        { status: 400 }
      );
    }

    const cleanName = (userName || "Lector de FicNation").trim();
    const cleanEmail = (userEmail || "anonimo@ficnation.dev").trim();
    const categoryTitle = CATEGORY_NAMES[category] || category || "Sugerencia";
    const timestamp = new Date().toLocaleString("es-ES", { timeZone: "America/Caracas" });

    // 1. Guardar en base de datos Supabase
    try {
      const supabase = createClient();
      await supabase.from("suggestions").insert({
        user_id: userId || null,
        user_name: cleanName,
        user_email: cleanEmail,
        category: category || "feature",
        subject: subject.trim(),
        message: message.trim(),
        status: "pending",
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn("[FicNation API Feedback] Aviso al guardar en Supabase:", dbErr);
    }

    // 2. Enviar correo electrónico directamente a f4studios.official@gmail.com
    let emailSent = false;
    let serviceUsed = "none";

    // Opción A: Si existe API Key de Resend en el entorno
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "FicNation Feedback <feedback@ficnation.dev>",
            to: [OFFICIAL_EMAIL],
            reply_to: cleanEmail,
            subject: `[FicNation Feedback] ${categoryTitle}: ${subject.trim()}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
                <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 16px;">
                  <h2 style="color: #6d28d9; margin: 0;">FicNation — Nueva Sugerencia</h2>
                  <span style="display: inline-block; background: #ede9fe; color: #6d28d9; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 20px; margin-top: 6px;">
                    ${categoryTitle}
                  </span>
                </div>
                
                <p><strong>Asunto:</strong> ${subject.trim()}</p>
                <p><strong>Enviado por:</strong> ${cleanName} &lt;${cleanEmail}&gt;</p>
                <p><strong>Fecha:</strong> ${timestamp}</p>
                
                <div style="background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 14px; border-radius: 4px; margin: 16px 0;">
                  <p style="white-space: pre-wrap; margin: 0; color: #1e293b; line-height: 1.6;">${message.trim()}</p>
                </div>
                
                <footer style="margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                  Mensaje enviado automáticamente desde la plataforma FicNation (Dashboard de Usuario).
                </footer>
              </div>
            `,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
          serviceUsed = "Resend";
        }
      } catch (rErr) {
        console.warn("[FicNation API Feedback] Fallo en envío Resend:", rErr);
      }
    }

    // Opción B: Gateway de Entrega Directa (FormSubmit AJAX API)
    if (!emailSent) {
      try {
        const gatewayRes = await fetch(`https://formsubmit.co/ajax/${OFFICIAL_EMAIL}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _subject: `[FicNation Feedback] ${categoryTitle} - ${subject.trim()}`,
            _template: "table",
            _captcha: "false",
            "Categoría": categoryTitle,
            "Asunto": subject.trim(),
            "Mensaje": message.trim(),
            "Remitente": cleanName,
            "Correo del Remitente": cleanEmail,
            "Fecha y Hora": timestamp,
            "Plataforma": "FicNation Web Platform",
          }),
        });

        if (gatewayRes.ok) {
          emailSent = true;
          serviceUsed = "FormSubmit";
        } else {
          console.warn("[FicNation API Feedback] Gateway status:", gatewayRes.status);
        }
      } catch (gateErr) {
        console.warn("[FicNation API Feedback] Fallo en gateway FormSubmit:", gateErr);
      }
    }

    return NextResponse.json({
      success: true,
      delivered: emailSent,
      service: serviceUsed,
      officialEmail: OFFICIAL_EMAIL,
      message: "Tu sugerencia ha sido enviada con éxito al equipo oficial de FicNation.",
    });
  } catch (err: any) {
    console.error("[FicNation API Feedback] Error general:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Error al procesar el feedback" },
      { status: 500 }
    );
  }
}
