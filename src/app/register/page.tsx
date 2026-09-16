"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Loader2,
  Check,
  Palette,
  Image as ImageIcon,
  BookOpen,
  Trophy,
  Gift,
  ShieldCheck,
  Sparkle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadToImgBB } from "@/lib/imgbb";
import { useAuth } from "@/context/AuthContext";

// Presets de Avatares Cósmicos y de Fantasía
const AVATAR_PRESETS = [
  "/default-avatar.svg",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80",
];

// Presets de Portadas / Banners
const BANNER_PRESETS = [
  { name: "Nebulosa Púrpura", value: "from-purple-950 via-indigo-950 to-[#080511]" },
  { name: "Eclipse Neón", value: "from-fuchsia-950 via-purple-900 to-black" },
  { name: "Abismo Cósmico", value: "from-slate-950 via-purple-950 to-indigo-950" },
  { name: "Fuego Violeta", value: "from-purple-900 via-rose-950 to-zinc-950" },
  { name: "Ciberpunk Dark", value: "from-indigo-950 via-fuchsia-950 to-purple-950" },
  { name: "Aurora Boreal", value: "from-emerald-950 via-teal-950 to-slate-950" },
];

// Géneros para selección de gustos
const GENRE_OPTIONS = [
  { id: "fantasia", name: "Fantasía", icon: "🗡️" },
  { id: "isekai", name: "Isekai", icon: "🌌" },
  { id: "romance", name: "Romance", icon: "💖" },
  { id: "cyberpunk", name: "Cyberpunk", icon: "🤖" },
  { id: "terror", name: "Terror", icon: "👁️" },
  { id: "misterio", name: "Misterio", icon: "🕵️" },
  { id: "accion", name: "Acción", icon: "⚡" },
  { id: "scifi", name: "Ciencia Ficción", icon: "🚀" },
  { id: "drama", name: "Drama", icon: "🎭" },
  { id: "sobrenatural", name: "Sobrenatural", icon: "🧙‍♂️" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { user: currentAuthUser, refreshProfile } = useAuth();

  // Paso actual del onboarding (1: Cuenta, 2: Avatar, 3: Banner, 4: Perfil, 5: Confirmación)
  const [step, setStep] = useState<number>(1);

  // Datos del formulario
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
    avatarUrl: "/default-avatar.svg",
    bannerUrl: BANNER_PRESETS[0].value,
    bio: "¡Hola! Nuevo creador y lector en FicNation.",
    selectedGenres: ["fantasia", "isekai"] as string[],
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Si ya hay sesión activa al entrar, inicializar el userId y avanzar a la configuración de avatar
  useEffect(() => {
    if (currentAuthUser?.id) {
      setUserId(currentAuthUser.id);
      setFormData((prev) => ({
        ...prev,
        username: currentAuthUser.username || prev.username,
        displayName: currentAuthUser.name || prev.displayName,
        avatarUrl: currentAuthUser.avatar || prev.avatarUrl,
        bannerUrl: currentAuthUser.bannerUrl || prev.bannerUrl,
        bio: currentAuthUser.bio && currentAuthUser.bio !== "Nuevo miembro en FicNation." ? currentAuthUser.bio : prev.bio,
      }));
      // Si el usuario ya está autenticado, avanzar directamente al paso 2
      setStep((prevStep) => (prevStep === 1 ? 2 : prevStep));
    }
  }, [currentAuthUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMessage("");
  };

  const toggleGenre = (genreId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedGenres.includes(genreId);
      if (exists) {
        return {
          ...prev,
          selectedGenres: prev.selectedGenres.filter((g) => g !== genreId),
        };
      } else {
        return {
          ...prev,
          selectedGenres: [...prev.selectedGenres, genreId],
        };
      }
    });
  };

  // Subir avatar personalizado a ImgBB
  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImg(true);
    setErrorMessage("");
    try {
      const url = await uploadToImgBB(file);
      setFormData((prev) => ({ ...prev, avatarUrl: url }));
    } catch (err: any) {
      setErrorMessage(err?.message || "Error al subir la imagen de perfil.");
    } finally {
      setIsUploadingImg(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // Subir banner personalizado a ImgBB
  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImg(true);
    setErrorMessage("");
    try {
      const url = await uploadToImgBB(file);
      setFormData((prev) => ({ ...prev, bannerUrl: url }));
    } catch (err: any) {
      setErrorMessage(err?.message || "Error al subir la portada.");
    } finally {
      setIsUploadingImg(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  // ════════════ PASO 1: CREAR CUENTA O AVANZAR ════════════
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage("Por favor completa todos los campos requeridos.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const sanitizedUsername = formData.username.trim().toLowerCase().replace(/\s+/g, "_");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            username: sanitizedUsername,
            name: formData.displayName.trim() || formData.username.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setErrorMessage("Este correo ya está registrado. Por favor inicia sesión.");
        } else {
          setErrorMessage(error.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user?.id) {
        setUserId(data.user.id);
        if (!formData.displayName) {
          setFormData((prev) => ({ ...prev, displayName: prev.username }));
        }
      }

      // Avanzar al paso de foto de perfil
      setStep(2);
    } catch {
      setErrorMessage("Ocurrió un error inesperado al procesar el registro.");
    } finally {
      setLoading(false);
    }
  };

  // ════════════ PASO 5: CONFIRMACIÓN Y FINALIZACIÓN ════════════
  const handleCompleteRegistration = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const supabase = createClient();
      const sanitizedUsername = formData.username.trim().toLowerCase().replace(/\s+/g, "_");
      const finalName = formData.displayName.trim() || formData.username.trim();

      // Guardar / Actualizar en la tabla 'profiles'
      if (userId) {
        const { error } = await supabase.from("profiles").upsert({
          id: userId,
          name: finalName,
          username: sanitizedUsername,
          avatar_url: formData.avatarUrl || AVATAR_PRESETS[1],
          banner_url: formData.bannerUrl || BANNER_PRESETS[0].value,
          bio: formData.bio.trim(),
          xp: 100, // Bono de bienvenida de experiencia
          coins: 0, // Todos los usuarios inician con 0 FicCoins
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.warn("Aviso al guardar perfil en Supabase:", error.message);
        }

        // Marcar onboarding como completado de forma persistente
        if (typeof window !== "undefined") {
          localStorage.setItem("ficnation_onboarding_completed_" + userId, "true");
        }
      }

      // Sincronizar contexto local
      if (refreshProfile) {
        await refreshProfile();
      }

      // Éxito: redireccionar a la pantalla principal de la aplicación
      setSuccessMessage("¡Perfil configurado con éxito! Preparando tu universo...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch {
      // Redirigir de todos modos para no bloquear al usuario
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between px-4 py-6 pt-safe pb-safe relative overflow-x-hidden">
      
      {/* Inputs ocultos para carga de archivos */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*,.gif"
        className="hidden"
        onChange={handleUploadAvatar}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*,.gif"
        className="hidden"
        onChange={handleUploadBanner}
      />

      {/* ════════════ HEADER Y BARRA DE PROGRESO ════════════ */}
      <div className="w-full max-w-lg mx-auto mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-[11px] font-bold text-purple-300 backdrop-blur-md shadow-sm">
            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
            <span>Paso {step} de 5</span>
          </div>
        </div>

        {/* Barra de progreso de pasos */}
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 rounded-full transition-all duration-500 shadow-sm shadow-purple-500/50"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Indicadores de etapa */}
        <div className="flex justify-between px-1 text-[10px] font-bold text-slate-400">
          <span className={step >= 1 ? "text-purple-300 font-extrabold" : ""}>1. Cuenta</span>
          <span className={step >= 2 ? "text-purple-300 font-extrabold" : ""}>2. Foto</span>
          <span className={step >= 3 ? "text-purple-300 font-extrabold" : ""}>3. Portada</span>
          <span className={step >= 4 ? "text-purple-300 font-extrabold" : ""}>4. Perfil</span>
          <span className={step >= 5 ? "text-purple-300 font-extrabold" : ""}>5. ¡Listo!</span>
        </div>
      </div>

      {/* ════════════ CONTENEDOR PRINCIPAL DEL ONBOARDING ════════════ */}
      <div className="w-full max-w-lg mx-auto bg-[#0d1222]/90 border border-purple-500/20 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative my-auto">
        
        {/* Mensajes de Alerta / Feedback */}
        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ════════════ PASO 1: CUENTA (EMAIL Y PASSWORD) ════════════ */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Comienza tu viaje</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Crea tu Cuenta
              </h2>
              <p className="text-xs text-slate-400">
                Ingresa tus datos de acceso para asegurar tu progreso y lecturas.
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-4 pt-1">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 pl-1">
                  Nombre de usuario (@)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <User className="h-4 w-4 text-purple-400/60" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="ej: AlexanderRaven"
                    className="w-full rounded-2xl bg-black/40 border border-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 pl-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Mail className="h-4 w-4 text-purple-400/60" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@correo.com"
                    className="w-full rounded-2xl bg-black/40 border border-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 pl-1">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className="h-4 w-4 text-purple-400/60" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-2xl bg-black/40 border border-white/10 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Botón Siguiente */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 h-13 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/35 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                  </span>
                ) : (
                  <>
                    <span>Continuar al Avatar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs pt-1 text-slate-400">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-bold text-purple-300 hover:underline">
                Inicia sesión aquí
              </Link>
            </div>
          </div>
        )}

        {/* ════════════ PASO 2: FOTO DE PERFIL / AVATAR ════════════ */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Paso 2 de 5</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Elige tu Avatar
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona una imagen de perfil o sube tu propia foto o GIF animado.
              </p>
            </div>

            {/* Previsualización del Avatar Actual */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 shadow-xl shadow-purple-600/30">
                <div className="w-full h-full rounded-[20px] overflow-hidden bg-black/60">
                  <img
                    src={formData.avatarUrl || AVATAR_PRESETS[0]}
                    alt="Avatar seleccionado"
                    className="w-full h-full object-cover"
                  />
                </div>
                {isUploadingImg && (
                  <div className="absolute inset-0 bg-black/70 rounded-3xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Botón para subir archivo a ImgBB */}
              <button
                type="button"
                disabled={isUploadingImg}
                onClick={() => avatarInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-purple-400" />
                <span>Subir de mi Galería o GIF</span>
              </button>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-300">O elige uno de nuestros presets:</p>
              <div className="grid grid-cols-4 gap-2.5">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={`av-${idx}`}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: preset }))}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                      formData.avatarUrl === preset
                        ? "border-purple-400 ring-2 ring-purple-500/50 scale-105 shadow-md shadow-purple-500/40"
                        : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30"
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    {formData.avatarUrl === preset && (
                      <div className="absolute top-1 right-1 bg-purple-600 rounded-full p-0.5 shadow-sm">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 active:scale-95 transition-all"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/35 active:scale-95 transition-all"
              >
                <span>Siguiente: Portada</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════ PASO 3: PORTADA / BANNER CÓSMICO ════════════ */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>Paso 3 de 5</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Elige tu Portada
              </h2>
              <p className="text-xs text-slate-400">
                Personaliza la cabecera visual de tu perfil de creador y lector.
              </p>
            </div>

            {/* Vista Previa de la Portada en Vivo */}
            <div className="rounded-2xl overflow-hidden border border-white/15 relative shadow-xl">
              <div
                className={`h-24 w-full bg-gradient-to-r ${
                  formData.bannerUrl.startsWith("from-")
                    ? formData.bannerUrl
                    : "from-purple-950 to-indigo-950"
                } relative`}
                style={
                  !formData.bannerUrl.startsWith("from-")
                    ? {
                        backgroundImage: `url(${formData.bannerUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                
                {/* Mini avatar sobre la portada para dar contexto */}
                <div className="absolute bottom-2 left-3 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/60 shadow-md">
                    <img
                      src={formData.avatarUrl || AVATAR_PRESETS[0]}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white drop-shadow-md">
                      {formData.displayName || formData.username || "Tu Nombre"}
                    </p>
                    <p className="text-[10px] text-purple-200 font-medium drop-shadow-md">
                      @{formData.username || "usuario"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón para subir portada propia */}
            <div className="flex justify-center">
              <button
                type="button"
                disabled={isUploadingImg}
                onClick={() => bannerInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-purple-400" />
                <span>Subir Portada Panorámica</span>
              </button>
            </div>

            {/* Temas Cósmicos */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-300">O elige un tema cósmico:</p>
              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {BANNER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, bannerUrl: preset.value }))}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      formData.bannerUrl === preset.value
                        ? "border-purple-400 bg-purple-500/20 ring-1 ring-purple-400 shadow-md"
                        : "border-white/10 bg-black/40 hover:border-white/20"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-r ${preset.value} shrink-0 border border-white/20`} />
                    <span className="text-[11px] font-bold text-slate-200 truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 active:scale-95 transition-all"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/35 active:scale-95 transition-all"
              >
                <span>Siguiente: Perfil & Gustos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════ PASO 4: BIOGRAFÍA Y GUSTOS LITERARIOS ════════════ */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Paso 4 de 5</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Perfil y Gustos
              </h2>
              <p className="text-xs text-slate-400">
                Cuéntanos sobre ti y qué tipo de historias te apasionan.
              </p>
            </div>

            <div className="space-y-4">
              {/* Nombre a mostrar */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 pl-1">
                  Nombre a mostrar / Alias público
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="ej: Alexander Raven"
                  className="w-full rounded-2xl bg-black/40 border border-white/10 py-2.5 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Biografía */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 pl-1">
                  Descripción o Biografía
                </label>
                <textarea
                  rows={2}
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Escribe algo sobre tus intereses o lo que te gusta leer..."
                  className="w-full rounded-2xl bg-black/40 border border-white/10 py-2 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              {/* Géneros Favoritos */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 pl-1">
                  Géneros Favoritos (Selecciona tus preferidos)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {GENRE_OPTIONS.map((g) => {
                    const isSelected = formData.selectedGenres.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGenre(g.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-600 text-white border border-purple-400 shadow-md shadow-purple-600/30 scale-[1.02]"
                            : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <span>{g.icon}</span>
                        <span>{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 active:scale-95 transition-all"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/35 active:scale-95 transition-all"
              >
                <span>Siguiente: Confirmar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════ PASO 5: CONFIRMACIÓN, CARNET Y BIENVENIDA ════════════ */}
        {step === 5 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                <span>¡Todo listo para comenzar!</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Confirma tus Datos
              </h2>
              <p className="text-xs text-slate-400">
                Tu carnet de usuario en FicNation ha sido creado con éxito.
              </p>
            </div>

            {/* Carnet de Identidad de FicNation */}
            <div className="rounded-3xl overflow-hidden border border-purple-500/30 bg-[#070a12] shadow-2xl relative">
              {/* Cabecera / Banner */}
              <div
                className={`h-20 w-full bg-gradient-to-r ${
                  formData.bannerUrl.startsWith("from-")
                    ? formData.bannerUrl
                    : "from-purple-950 to-indigo-950"
                } relative`}
                style={
                  !formData.bannerUrl.startsWith("from-")
                    ? {
                        backgroundImage: `url(${formData.bannerUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <div className="absolute inset-0 bg-black/25" />
              </div>

              {/* Contenido del Carnet */}
              <div className="px-4 pb-4 pt-0 relative">
                <div className="flex items-end justify-between -mt-10 mb-3">
                  <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 shadow-lg">
                    <div className="w-full h-full rounded-[14px] overflow-hidden bg-black">
                      <img
                        src={formData.avatarUrl || AVATAR_PRESETS[0]}
                        alt="Avatar final"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Nivel 1 • Iniciado</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-base font-extrabold text-white">
                    {formData.displayName || formData.username || "Usuario"}
                  </p>
                  <p className="text-xs text-purple-400 font-semibold font-mono">
                    @{formData.username || "usuario"}
                  </p>
                  <p className="text-[11px] text-slate-300 italic pt-1 line-clamp-2">
                    &quot;{formData.bio || "Nuevo miembro de FicNation."}&quot;
                  </p>
                </div>

                {/* Géneros elegidos */}
                {formData.selectedGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2.5">
                    {formData.selectedGenres.slice(0, 3).map((gId) => {
                      const item = GENRE_OPTIONS.find((g) => g.id === gId);
                      return (
                        <span
                          key={gId}
                          className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-slate-300"
                        >
                          {item?.name || gId}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recompensa de Bienvenida Desbloqueada */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-fuchsia-900/30 to-indigo-900/40 border border-purple-500/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-purple-300 animate-bounce" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-white">¡Perfil Configurado con Éxito!</p>
                <p className="text-[11px] text-purple-300">
                  +100 XP de inicio ⚡ para tu rango de aventurero
                </p>
              </div>
            </div>

            {/* Botón Final: Entrar al Dashboard */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 active:scale-95 transition-all"
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleCompleteRegistration}
                className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/40 active:scale-95 transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Creando universo...
                  </span>
                ) : (
                  <>
                    <span>Entrar a FicNation</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer Términos */}
      <div className="w-full max-w-lg mx-auto text-center pt-3">
        <p className="text-[10px] text-slate-500">
          Al registrarte aceptas las Condiciones del Servicio y la Política de Privacidad de FicNation.
        </p>
      </div>

    </div>
  );
}
