"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    username: "",
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
    setSuccessMessage("");

    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage("Por favor completa todos los campos.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            username: formData.username.trim().toLowerCase().replace(/\s+/g, "_"),
            name: formData.username.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setErrorMessage("Este correo electrónico ya está registrado. Intenta iniciar sesión.");
        } else {
          setErrorMessage(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        // Sesión creada automáticamente sin confirmación de email
        router.push("/dashboard");
      } else if (data.user) {
        // En caso de que Supabase tenga confirmación de email activada
        setSuccessMessage("¡Cuenta creada exitosamente! Revisa tu correo o inicia sesión para continuar.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch {
      setErrorMessage("Ocurrió un error inesperado al registrar tu cuenta.");
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
            <span>Únete a FicNation</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Crea tu cuenta
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Empieza a leer, guardar en tu biblioteca y publicar tus historias
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold pl-1" style={{ color: "var(--text-secondary)" }}>
              Nombre de usuario
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <User className="h-4 w-4 opacity-50" style={{ color: "var(--text-muted)" }} />
              </div>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="ej: AlexanderRaven"
                className="w-full rounded-xl border fic-input py-2.5 pl-10 pr-4 text-sm placeholder:opacity-40 focus:outline-none transition-all"
                style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

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
            <label className="text-xs font-semibold pl-1" style={{ color: "var(--text-secondary)" }}>
              Contraseña
            </label>
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
                placeholder="Mínimo 6 caracteres"
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
              <span>Creando cuenta...</span>
            ) : (
              <>
                <span>Registrarme</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs pt-2" style={{ color: "var(--text-muted)" }}>
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="font-bold hover:underline"
            style={{ color: "var(--text-badge)" }}
          >
            Inicia sesión aquí
          </Link>
        </div>

      </div>
    </div>
  );
}
