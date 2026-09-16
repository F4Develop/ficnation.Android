"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, LogIn, UserPlus, Compass, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface BackgroundStory {
  id: string;
  title: string;
  genre: string;
  cover: string;
  tag?: string;
}

const DEFAULT_STORIES: BackgroundStory[] = [
  {
    id: "fb-1",
    title: "El Despertar de las Sombras",
    genre: "Fantasía Oscura",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
    tag: "Magia",
  },
  {
    id: "fb-2",
    title: "Reencarnado como Rey Arcano",
    genre: "Isekai",
    cover: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
    tag: "Aventura",
  },
  {
    id: "fb-3",
    title: "Bajo la Lluvia de Neón",
    genre: "Cyberpunk",
    cover: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
    tag: "Sci-Fi",
  },
  {
    id: "fb-4",
    title: "Lazos de Sangre y Furia",
    genre: "Acción",
    cover: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80",
    tag: "Combate",
  },
  {
    id: "fb-5",
    title: "El Último Dragón Astral",
    genre: "Épica",
    cover: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=400&auto=format&fit=crop&q=80",
    tag: "Mitos",
  },
  {
    id: "fb-6",
    title: "Amor entre Constelaciones",
    genre: "Romance",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
    tag: "Drama",
  },
  {
    id: "fb-7",
    title: "El Alquimista del Abismo",
    genre: "Misterio",
    cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
    tag: "Ocultismo",
  },
  {
    id: "fb-8",
    title: "Crónicas del Reino Olvidado",
    genre: "Fantasía",
    cover: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=400&auto=format&fit=crop&q=80",
    tag: "Reinos",
  },
];

export default function RootPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [stories, setStories] = useState<BackgroundStory[]>(DEFAULT_STORIES);

  // Cargar historias reales de la base de datos que tengan capítulos publicados
  useEffect(() => {
    async function loadDbStories() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("stories")
          .select(`
            id,
            title,
            genre,
            cover_url,
            chapters (id, is_published)
          `)
          .eq("is_published", true)
          .order("reads_count", { ascending: false })
          .limit(16);

        if (!error && data && data.length > 0) {
          const publishedList = data
            .filter((s: any) => {
              const ch = Array.isArray(s.chapters)
                ? s.chapters.filter((c: any) => c.is_published !== false)
                : [];
              return ch.length > 0;
            })
            .map((s: any) => ({
              id: s.id,
              title: s.title || "Historia",
              genre: s.genre || "Fantasía",
              cover: s.cover_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
              tag: s.genre || "Novela",
            }));

          if (publishedList.length >= 4) {
            setStories(publishedList);
          }
        }
      } catch (err) {
        console.error("Error cargando historias de fondo:", err);
      }
    }

    loadDbStories();
  }, []);

  // Dividir historias en 2 columnas para el mosaico de fondo estático
  const col1 = stories.filter((_, i) => i % 2 === 0);
  const col2 = stories.filter((_, i) => i % 2 !== 0);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between px-6 py-8 pt-safe pb-safe relative overflow-hidden select-none">
      
      {/* ════════════ ESTILOS Y ANIMACIONES CSS NATIVAS ════════════ */}
      <style>{`
        @keyframes cosmicGradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes textBreatheGlow {
          0%, 100% {
            filter: drop-shadow(0 0 16px rgba(168, 85, 247, 0.4)) drop-shadow(0 0 32px rgba(236, 72, 153, 0.25));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 28px rgba(168, 85, 247, 0.75)) drop-shadow(0 0 45px rgba(129, 140, 248, 0.45));
            transform: scale(1.02);
          }
        }

        @keyframes ambientAuraPulse {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.75;
            transform: scale(1.1);
          }
        }

        .animated-cosmic-text {
          background-image: linear-gradient(135deg, #e879f9 0%, #c084fc 25%, #818cf8 50%, #38bdf8 75%, #e879f9 100%);
          background-size: 300% 300%;
          animation: cosmicGradientFlow 5s ease-in-out infinite;
        }

        .animated-title-container {
          animation: textBreatheGlow 4.5s ease-in-out infinite;
        }

        .ambient-aura {
          animation: ambientAuraPulse 4s ease-in-out infinite;
        }
      `}</style>

      {/* ════════════ HISTORIAS DE FONDO ESTÁTICAS (SIN ANIMACIÓN DE SCROLL) ════════════ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -inset-x-4 -inset-y-12 flex gap-4 justify-center opacity-30 sm:opacity-35 scale-[1.03] -rotate-1">
          
          {/* Columna 1 de Historias Estáticas */}
          <div className="flex-1 max-w-[165px] flex flex-col gap-4">
            {col1.map((item, idx) => (
              <div
                key={`c1-${item.id}-${idx}`}
                className="w-full h-52 rounded-2xl overflow-hidden bg-[#0d1222] border border-purple-500/20 relative shadow-xl shadow-purple-950/40 shrink-0"
              >
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070a12] via-[#070a12]/50 to-transparent p-3 flex flex-col justify-end">
                  <span className="self-start px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide bg-purple-600/80 text-purple-100 backdrop-blur-sm shadow-sm mb-1">
                    {item.genre}
                  </span>
                  <p className="text-xs font-bold text-white line-clamp-1 drop-shadow-md">
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Columna 2 de Historias Estáticas (con desfase visual sutil) */}
          <div className="flex-1 max-w-[165px] flex flex-col gap-4 pt-8">
            {col2.map((item, idx) => (
              <div
                key={`c2-${item.id}-${idx}`}
                className="w-full h-52 rounded-2xl overflow-hidden bg-[#0d1222] border border-indigo-500/20 relative shadow-xl shadow-indigo-950/40 shrink-0"
              >
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070a12] via-[#070a12]/50 to-transparent p-3 flex flex-col justify-end">
                  <span className="self-start px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide bg-indigo-600/80 text-indigo-100 backdrop-blur-sm shadow-sm mb-1">
                    {item.genre}
                  </span>
                  <p className="text-xs font-bold text-white line-clamp-1 drop-shadow-md">
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Viñeta y degradado para dar contraste y nitidez al texto central */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070a12] via-[#070a12]/75 to-[#070a12] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#070a12_82%)] pointer-events-none" />
      </div>

      {/* ════════════ HEADER / BADGE SUPERIOR ════════════ */}
      <header className="relative z-10 flex justify-center pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 border border-purple-500/30 backdrop-blur-md text-[11px] font-bold text-purple-300 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>FicNation Mobile • Edición Teléfono</span>
        </div>
      </header>

      {/* ════════════ SECCIÓN CENTRAL: LETRAS ANIMADAS Y BIENVENIDA BIEN CENTRADAS ════════════ */}
      <main className="relative z-10 flex flex-col items-center text-center my-auto py-4 space-y-6 max-w-sm mx-auto">
        
        {/* Nombre de la Aplicación con Animación Cósmica (Sin el logo cuadrado) */}
        <div className="relative flex flex-col items-center justify-center pt-2">
          {/* Luz ambiental pulsante detrás del texto */}
          <div className="absolute -inset-8 bg-gradient-to-r from-purple-600/35 via-fuchsia-500/35 to-indigo-600/35 rounded-full blur-3xl ambient-aura pointer-events-none" />
          
          <div className="relative animated-title-container">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight select-none">
              <span className="text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.45)]">Fic</span>
              <span className="animated-cosmic-text text-transparent bg-clip-text drop-shadow-[0_4px_25px_rgba(192,132,252,0.6)]">
                Nation
              </span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1 rounded-full bg-black/40 border border-purple-500/25 backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <p className="text-[10px] uppercase font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300">
              Historias & Fanfics Ilimitados
            </p>
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          </div>
        </div>

        {/* Frase de Bienvenida */}
        <div className="space-y-2 px-2">
          <h2 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-lg">
            Donde cada historia encuentra su universo
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto drop-shadow-md font-medium">
            Bienvenido a la comunidad móvil para amantes de la lectura y la escritura. Sumérgete en miles de mundos en la palma de tu mano.
          </p>
        </div>

        {/* Resumen de características en píldoras */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="px-3 py-1.5 rounded-xl text-[10.5px] font-bold bg-black/50 border border-white/15 text-slate-200 backdrop-blur-md shadow-sm">
            📖 Miles de Novelas
          </span>
          <span className="px-3 py-1.5 rounded-xl text-[10.5px] font-bold bg-black/50 border border-white/15 text-slate-200 backdrop-blur-md shadow-sm">
            ✍️ Publica Gratis
          </span>
          <span className="px-3 py-1.5 rounded-xl text-[10.5px] font-bold bg-black/50 border border-white/15 text-slate-200 backdrop-blur-md shadow-sm">
            ⚡ Modo Offline
          </span>
        </div>

      </main>

      {/* ════════════ SECCIÓN INFERIOR: BOTONES DE ACCIÓN ════════════ */}
      <footer className="relative z-10 w-full max-w-sm mx-auto space-y-3 pb-2">
        
        {isAuthenticated && user ? (
          /* Estado cuando el usuario ya está autenticado */
          <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/30 backdrop-blur-xl space-y-3 text-center shadow-xl">
            <div className="flex items-center gap-3 text-left">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-purple-600 p-0.5 shrink-0 shadow-md">
                <img
                  src={user.avatar || "/logo.jpg"}
                  alt={user.name || "Usuario"}
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-purple-300 font-semibold">Sesión activa</p>
                <p className="text-sm font-bold text-white truncate">{user.name || user.username}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/35 active:scale-95 transition-all"
              >
                <span>Entrar a la App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => logout()}
                className="py-3 px-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold hover:text-rose-400 active:scale-95 transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        ) : (
          /* Los Dos Botones Solicitados: Registrarse e Iniciar Sesión */
          <div className="space-y-2.5">
            {/* 1. Botón de Registrarse */}
            <Link
              href="/register"
              className="w-full h-13 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/35 active:scale-95 transition-transform border border-purple-400/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrarse</span>
            </Link>

            {/* 2. Botón de Iniciar Sesión */}
            <Link
              href="/login"
              className="w-full h-13 rounded-2xl bg-black/40 border border-white/15 hover:bg-black/60 text-white font-bold text-sm flex items-center justify-center gap-2 backdrop-blur-md shadow-md active:scale-95 transition-transform"
            >
              <LogIn className="w-4 h-4 text-purple-400" />
              <span>Iniciar Sesión</span>
            </Link>

            {/* Acceso directo como invitado */}
            <div className="pt-1 text-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-purple-300 active:scale-95 transition-all py-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>Explorar historias como invitado</span>
              </Link>
            </div>
          </div>
        )}

        <p className="text-[10px] text-center text-slate-500 pt-1">
          Al continuar aceptas los Términos y la Política de Privacidad de FicNation.
        </p>

      </footer>

    </div>
  );
}
