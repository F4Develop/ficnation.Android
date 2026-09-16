"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Correo o contraseña incorrectos. Por favor verifica tus datos.");
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage("Debes confirmar tu correo electrónico antes de ingresar.");
        } else {
          setErrorMessage(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.session && data.user) {
        // Verificar si el usuario ya completó la configuración inicial de su perfil
        const isLocalCompleted =
          typeof window !== "undefined" &&
          localStorage.getItem("ficnation_onboarding_completed_" + data.user.id) === "true";

        if (isLocalCompleted) {
          router.push("/dashboard");
          return;
        }

        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("avatar_url, bio, username")
            .eq("id", data.user.id)
            .maybeSingle();

          const hasCompletedBio = prof?.bio && prof.bio !== "Nuevo miembro en FicNation." && prof.bio.trim().length > 0;
          const hasCustomAvatar = prof?.avatar_url && !prof.avatar_url.includes("placeholder");

          if (hasCompletedBio || hasCustomAvatar) {
            if (typeof window !== "undefined") {
              localStorage.setItem("ficnation_onboarding_completed_" + data.user.id, "true");
            }
            router.push("/dashboard");
          } else {
            // Si interrumpió la configuración inicial, redirigir automáticamente a completarla
            router.push("/register");
          }
        } catch {
          router.push("/dashboard");
        }
      }
    } catch {
      setErrorMessage("Ocurrió un error inesperado al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] flex flex-col justify-center px-4 py-8 pt-safe pb-safe relative">
      {/* Botón Volver */}
      <div className="w-full max-w-md mx-auto mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <div
        className="w-full max-w-md mx-auto space-y-6 rounded-3xl border fic-card p-6 sm:p-8 shadow-2xl"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
      >
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold shadow-xs"
            style={{ background: "var(--bg-subtle)", borderColor: "var(--border-primary)", color: "var(--text-badge)" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Bienvenido de vuelta</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Iniciar Sesión
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Accede a tu biblioteca, continúa tus lecturas y administra tus obras
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold pl-1" style={{ color: "var(--text-secondary)" }}>
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-4 w-4 opacity-50" style={{ color: "var(--text-muted)" }} />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                className="w-full rounded-xl border fic-input py-2.5 pl-10 pr-4 text-sm placeholder:opacity-40 focus:outline-none transition-all"
                style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between pl-1">
              <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                Contraseña
              </label>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-4 w-4 opacity-50" style={{ color: "var(--text-muted)" }} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Ingresa tu contraseña"
                className="w-full rounded-xl border fic-input py-2.5 pl-10 pr-10 text-sm placeholder:opacity-40 focus:outline-none transition-all"
                style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 opacity-60 hover:opacity-100 cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-md hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer fic-btn-primary text-white"
          >
            {loading ? (
              <span>Iniciando sesión...</span>
            ) : (
              <>
                <span>Ingresar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs pt-2" style={{ color: "var(--text-muted)" }}>
          ¿No tienes una cuenta aún?{" "}
          <Link
            href="/register"
            className="font-bold hover:underline"
            style={{ color: "var(--text-badge)" }}
          >
            Regístrate gratis
          </Link>
        </div>

      </div>
    </div>
  );
}
