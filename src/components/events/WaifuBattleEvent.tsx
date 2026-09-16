"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Zap,
  RotateCcw,
  Check,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Coins,
  Gem,
  Swords,
  Shield,
  ShoppingBag,
  Trophy,
  Flame,
  Heart,
  Star,
  Users,
  Award,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { FicImage } from "@/components/ui/FicImage";

/* ═══════════════════════════════════════════════════════════════════════════ */
/* TIPOS Y MODELOS DE DATOS                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface BattleCityWaifu {
  id: string;
  name: string;
  title: string;
  anime: string;
  avatar: string;
  element: "fuego" | "hielo" | "luz" | "sombra";
  elementLabel: string;
  elementIcon: string;
  elementColor: string;
  rarity: "RARA" | "ÉPICA" | "MÍTICA";
  stars: number;
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  specialSkill: string;
  quote: string;
  priceCoins?: number;
  priceGems?: number;
}

export interface BossNpc {
  id: string;
  name: string;
  title: string;
  anime: string;
  avatar: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  specialMove: string;
  rewardGems: number;
  rewardCoins: number;
  badgeReward: string;
  quote: string;
}

export interface StreetEnemy {
  id: string;
  name: string;
  avatar: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  rewardGems: number;
  rewardCoins: number;
  rewardXp: number;
}

export type BattleCityView =
  | "INTRO_STARTER"
  | "CITY_MAP"
  | "SUMMON_PORTAL"
  | "MARKET"
  | "TRAINING"
  | "ARENA_BOSS"
  | "ROSTER_SELECT";

/* ═══════════════════════════════════════════════════════════════════════════ */
/* BANCO DE PERSONAJES (ROSTER & INVOCACIONES)                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ALL_WAIFUS: BattleCityWaifu[] = [
  {
    id: "frieren",
    name: "Frieren",
    title: "La Maga Milenaria",
    anime: "Sousou no Frieren",
    avatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    element: "hielo",
    elementLabel: "Kuudere / Arcano",
    elementIcon: "❄️",
    elementColor: "from-cyan-500 to-blue-600 border-cyan-400 text-cyan-300",
    rarity: "MÍTICA",
    stars: 5,
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 140,
    maxHp: 140,
    atk: 32,
    def: 22,
    specialSkill: "Zoltraak Devastador: Haz de energía arcana que atraviesa defensas.",
    quote: "Solo ha pasado una décima de siglo... luchemos juntos.",
    priceGems: 400,
  },
  {
    id: "marin",
    name: "Marin Kitagawa",
    title: "La Cosplayer Radiante",
    anime: "My Dress-Up Darling",
    avatar: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
    element: "luz",
    elementLabel: "Deredere / Luz",
    elementIcon: "🌸",
    elementColor: "from-pink-500 to-amber-500 border-pink-400 text-pink-300",
    rarity: "MÍTICA",
    stars: 5,
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 125,
    maxHp: 125,
    atk: 35,
    def: 18,
    specialSkill: "Transformación Shizuku-tan: Aumenta la velocidad y el carisma de impacto.",
    quote: "¡Hacer equipo contigo va a ser lo más divertido del mundo!",
    priceGems: 400,
  },
  {
    id: "yor",
    name: "Yor Forger",
    title: "La Asesina de Espinas",
    anime: "Spy x Family",
    avatar: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    element: "fuego",
    elementLabel: "Tsundere / Letal",
    elementIcon: "🔥",
    elementColor: "from-rose-600 to-red-800 border-rose-500 text-rose-300",
    rarity: "MÍTICA",
    stars: 5,
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 150,
    maxHp: 150,
    atk: 38,
    def: 20,
    specialSkill: "Danza de Espinas Carmesí: Ataque letal de precisión fulminante.",
    quote: "¡Por la paz de nuestro equipo, no dudaré en blandir mis agujas!",
    priceGems: 450,
  },
  {
    id: "megumin",
    name: "Megumin",
    title: "La Archimaga del Caos",
    anime: "KonoSuba",
    avatar: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
    element: "fuego",
    elementLabel: "Explosiva / Carmesí",
    elementIcon: "💥",
    elementColor: "from-amber-500 to-red-600 border-amber-400 text-amber-300",
    rarity: "ÉPICA",
    stars: 4,
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 110,
    maxHp: 110,
    atk: 42,
    def: 12,
    specialSkill: "¡EXPLOSION!: El conjuro definitivo de daño cataclísmico.",
    quote: "¡Mi nombre es Megumin! ¡Dominadora de la magia de explosión!",
    priceCoins: 1200,
    priceGems: 250,
  },
  {
    id: "fern",
    name: "Fern",
    title: "Discípula Prodigio",
    anime: "Sousou no Frieren",
    avatar: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    element: "luz",
    elementLabel: "Maga Disciplinada",
    elementIcon: "✨",
    elementColor: "from-purple-500 to-indigo-600 border-purple-400 text-purple-300",
    rarity: "ÉPICA",
    stars: 4,
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 130,
    maxHp: 130,
    atk: 29,
    def: 24,
    specialSkill: "Fuego Rápido Mágico: Ráfaga continua de proyectiles arcanos.",
    quote: "Frieren-sama me enseñó que la paciencia supera a la fuerza bruta.",
    priceCoins: 1000,
  },
  {
    id: "bocchi",
    name: "Bocchi",
    title: "Guitarrista Solitaria",
    anime: "Bocchi the Rock!",
    avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    element: "sombra",
    elementLabel: "Ansiosa / Rítmica",
    elementIcon: "🎸",
    elementColor: "from-pink-400 to-slate-700 border-pink-300 text-pink-200",
    rarity: "RARA",
    stars: 3,
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 115,
    maxHp: 115,
    atk: 26,
    def: 25,
    specialSkill: "Solo de Ansiedad Distorsionada: Desconcierta al enemigo y sube su evasión.",
    quote: "¡Q-Quiero huir a mi caja de cartón, pero daré mi mejor acorde!",
    priceCoins: 600,
  },
  {
    id: "makima",
    name: "Makima",
    title: "Demonio del Control",
    anime: "Chainsaw Man",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80",
    element: "sombra",
    elementLabel: "Control Absoluto",
    elementIcon: "👁️",
    elementColor: "from-rose-700 to-zinc-900 border-rose-500 text-rose-300",
    rarity: "MÍTICA",
    stars: 5,
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 160,
    maxHp: 160,
    atk: 36,
    def: 26,
    specialSkill: "Fuerza Dominante: Golpea a distancia doblando la voluntad rival.",
    quote: "Los perros obedientes siempre reciben una recompensa.",
    priceGems: 500,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/* JEFES NPC DE LA ARENA                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const BOSS_LIST: BossNpc[] = [
  {
    id: "boss_titan",
    name: "Autómata Titán de Neón",
    title: "Guardián de las Puertas de Battle City",
    anime: "Torneo Oficial",
    avatar: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80",
    level: 3,
    hp: 380,
    maxHp: 380,
    atk: 24,
    def: 12,
    specialMove: "Descarga de Sobrecarga Cinética",
    rewardGems: 150,
    rewardCoins: 400,
    badgeReward: "⚡ Destructor de Androides",
    quote: "Protocolo de combate activado. Eliminando aspirantes débiles.",
  },
  {
    id: "boss_kaiba_bot",
    name: "Duelista Sombra Kaiba-Bot",
    title: "Campeón de la Cúpula Cibernética",
    anime: "Battle City Lore",
    avatar: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
    level: 6,
    hp: 750,
    maxHp: 750,
    atk: 42,
    def: 25,
    specialMove: "Ráfaga de Dragón de Ojos Azules Virtual",
    rewardGems: 300,
    rewardCoins: 900,
    badgeReward: "🏆 As de la Cúpula Sombra",
    quote: "¡En este torneo solo reina el poder absoluto! ¡Muéstrame lo que tienes!",
  },
  {
    id: "boss_sukuna",
    name: "Sukuna: Rey de las Sombras",
    title: "Soberano del Coliseo Maldito",
    anime: "Jujutsu Kaisen",
    avatar: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    level: 10,
    hp: 1400,
    maxHp: 1400,
    atk: 68,
    def: 38,
    specialMove: "Expansión de Dominio: Santuario Malévolo",
    rewardGems: 600,
    rewardCoins: 2000,
    badgeReward: "👑 Conquistador Supremo del Coliseo",
    quote: "Alza la cabeza y pelea. Quizás logres divertirme tres segundos.",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ENEMIGOS CALLEJEROS DE ENTRENAMIENTO                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STREET_ENEMIES: StreetEnemy[] = [
  {
    id: "drone",
    name: "Dron Centinela Mk-I",
    avatar: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400&auto=format&fit=crop&q=80",
    level: 1,
    hp: 90,
    maxHp: 90,
    atk: 10,
    rewardGems: 15,
    rewardCoins: 40,
    rewardXp: 35,
  },
  {
    id: "thug",
    name: "Duelista Rebelde de Callejón",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80",
    level: 2,
    hp: 140,
    maxHp: 140,
    atk: 15,
    rewardGems: 25,
    rewardCoins: 70,
    rewardXp: 50,
  },
  {
    id: "cyber_beast",
    name: "Ciber-Quimera de Neón",
    avatar: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80",
    level: 3,
    hp: 190,
    maxHp: 190,
    atk: 22,
    rewardGems: 35,
    rewardCoins: 110,
    rewardXp: 75,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/* COMPONENTE PRINCIPAL: BATTLE CITY ENGINE                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function WaifuBattleEvent() {
  const { user, addXp } = useAuth();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Estado de pantalla completa
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Vista actual del juego
  const [currentView, setCurrentView] = useState<BattleCityView>("INTRO_STARTER");

  // Economía interna
  const [gems, setGems] = useState(300);
  const [coins, setCoins] = useState(500);

  // Roster y compañera activa
  const [roster, setRoster] = useState<BattleCityWaifu[]>([ALL_WAIFUS[0]]);
  const [activeWaifuId, setActiveWaifuId] = useState<string>("frieren");

  // Jefes derrotados
  const [defeatedBosses, setDefeatedBosses] = useState<string[]>([]);

  // Estados de invocación
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonResult, setSummonResult] = useState<BattleCityWaifu | null>(null);

  // Estados de entrenamiento callejero
  const [currentStreetEnemyIndex, setCurrentStreetEnemyIndex] = useState(0);
  const [enemyCurrentHp, setEnemyCurrentHp] = useState(STREET_ENEMIES[0].hp);
  const [playerCurrentHp, setPlayerCurrentHp] = useState(ALL_WAIFUS[0].hp);
  const [trainingEnergy, setTrainingEnergy] = useState(0); // 0 a 100%
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [floatingDamage, setFloatingDamage] = useState<{ id: number; text: string; isCrit?: boolean }[]>([]);

  // Estados de combate contra Jefe NPC
  const [selectedBoss, setSelectedBoss] = useState<BossNpc>(BOSS_LIST[0]);
  const [bossCurrentHp, setBossCurrentHp] = useState(BOSS_LIST[0].hp);
  const [bossPlayerHp, setBossPlayerHp] = useState(ALL_WAIFUS[0].hp);
  const [bossEnergy, setBossEnergy] = useState(0);
  const [bossSpecialWarning, setBossSpecialWarning] = useState(false);
  const [isDefending, setIsDefending] = useState(false);
  const [bossBattleLog, setBossBattleLog] = useState<string[]>([]);

  // Storage key
  const storageKey = `ficnation_battle_city_v2_${user?.id || "guest"}`;
  const legacyStarterKey = `ficnation_bc_starter_${user?.id || "guest"}`;

  // Waifu activa calculada
  const activeWaifu = roster.find((w) => w.id === activeWaifuId) || roster[0] || ALL_WAIFUS[0];

  /* ─────────────────── CARGA Y GUARDADO LOCAL ─────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.gems !== undefined) setGems(parsed.gems);
        if (parsed.coins !== undefined) setCoins(parsed.coins);
        if (parsed.roster && parsed.roster.length > 0) setRoster(parsed.roster);
        if (parsed.activeWaifuId) setActiveWaifuId(parsed.activeWaifuId);
        if (parsed.defeatedBosses) setDefeatedBosses(parsed.defeatedBosses);
        setCurrentView("CITY_MAP");
      } else {
        // Verificar si ya tenía compañera en versión anterior
        const legacy = localStorage.getItem(legacyStarterKey);
        if (legacy) {
          const parsedStarter = JSON.parse(legacy);
          const matched = ALL_WAIFUS.find((w) => w.id === parsedStarter.id) || ALL_WAIFUS[0];
          setRoster([matched]);
          setActiveWaifuId(matched.id);
          setCurrentView("CITY_MAP");
        } else {
          setCurrentView("INTRO_STARTER");
        }
      }
    } catch {
      setCurrentView("INTRO_STARTER");
    }
  }, [storageKey, legacyStarterKey]);

  // Guardar cambios automáticamente
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentView === "INTRO_STARTER") return;

    try {
      const payload = {
        gems,
        coins,
        roster,
        activeWaifuId,
        defeatedBosses,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (err) {
      console.error("Error guardando Battle City:", err);
    }
  }, [gems, coins, roster, activeWaifuId, defeatedBosses, currentView, storageKey]);

  /* ─────────────────── PANTALLA COMPLETA ─────────────────── */
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
          (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!gameContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        const el = gameContainerRef.current as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        };
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }
      } else {
        const doc = document as Document & {
          webkitExitFullscreen?: () => Promise<void>;
        };
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle error:", err);
    }
  };

  /* ─────────────────── ACCIONES DE INTRO / STARTER ─────────────────── */
  const handleSelectStarter = (waifu: BattleCityWaifu) => {
    setRoster([waifu]);
    setActiveWaifuId(waifu.id);
    setGems(300);
    setCoins(500);
    setCurrentView("CITY_MAP");
    addXp(50, "Bienvenida a Battle City");
  };

  /* ─────────────────── SISTEMA DE INVOCACIÓN (GACHA) ─────────────────── */
  const handleSummon = (costGems: number) => {
    if (gems < costGems) {
      alert("¡No tienes suficientes Gemas de Batalla! Entrena en las calles o vence a jefes para conseguir más.");
      return;
    }

    setGems((prev) => prev - costGems);
    setIsSummoning(true);

    // Selección de waifu aleatoria
    const pulled = ALL_WAIFUS[Math.floor(Math.random() * ALL_WAIFUS.length)];

    setTimeout(() => {
      setIsSummoning(false);
      setSummonResult(pulled);

      // Agregar al roster o mejorar si ya existe
      setRoster((prev) => {
        const exists = prev.find((w) => w.id === pulled.id);
        if (exists) {
          // Duplicado: Subir nivel y stats
          return prev.map((w) =>
            w.id === pulled.id
              ? {
                  ...w,
                  level: w.level + 1,
                  maxHp: w.maxHp + 20,
                  hp: w.maxHp + 20,
                  atk: w.atk + 6,
                  def: w.def + 4,
                }
              : w
          );
        } else {
          return [...prev, pulled];
        }
      });
      addXp(30, "Invocación en Battle City");
    }, 2400);
  };

  /* ─────────────────── COMPRA EN EL MERCADO ─────────────────── */
  const handleBuyWaifu = (waifu: BattleCityWaifu) => {
    const costGems = waifu.priceGems || 0;
    const costCoins = waifu.priceCoins || 0;

    if (costGems > 0 && gems < costGems) {
      alert("¡No tienes suficientes Gemas para reclutar a esta waifu!");
      return;
    }
    if (costCoins > 0 && coins < costCoins) {
      alert("¡No tienes suficientes Monedas de Combate!");
      return;
    }

    if (costGems > 0) setGems((g) => g - costGems);
    if (costCoins > 0) setCoins((c) => c - costCoins);

    setRoster((prev) => [...prev, waifu]);
    addXp(40, `Reclutamiento de ${waifu.name}`);
  };

  const handleBuyStatUpgrade = (type: "atk" | "def" | "hp", costCoins: number) => {
    if (coins < costCoins) {
      alert("¡Monedas insuficientes!");
      return;
    }

    setCoins((c) => c - costCoins);
    setRoster((prev) =>
      prev.map((w) => {
        if (w.id === activeWaifuId) {
          return {
            ...w,
            atk: type === "atk" ? w.atk + 5 : w.atk,
            def: type === "def" ? w.def + 5 : w.def,
            maxHp: type === "hp" ? w.maxHp + 25 : w.maxHp,
            hp: type === "hp" ? w.hp + 25 : w.hp,
          };
        }
        return w;
      })
    );
  };

  /* ─────────────────── ZONA DE ENTRENAMIENTO CALLEJERO ─────────────────── */
  const currentEnemy = STREET_ENEMIES[currentStreetEnemyIndex];

  const spawnNextStreetEnemy = () => {
    const nextIdx = (currentStreetEnemyIndex + 1) % STREET_ENEMIES.length;
    setCurrentStreetEnemyIndex(nextIdx);
    setEnemyCurrentHp(STREET_ENEMIES[nextIdx].hp);
    setPlayerCurrentHp(activeWaifu.maxHp);
    setTrainingEnergy(0);
    setBattleLog([`¡Un ${STREET_ENEMIES[nextIdx].name} de nivel ${STREET_ENEMIES[nextIdx].level} ha aparecido!`]);
  };

  const handlePlayerAttack = () => {
    if (enemyCurrentHp <= 0 || playerCurrentHp <= 0) return;

    // Calcular daño del jugador
    const isCrit = Math.random() > 0.75;
    const baseDamage = activeWaifu.atk;
    const damageDealt = isCrit ? Math.round(baseDamage * 1.5) : baseDamage;

    // Daño flotante
    const noticeId = Date.now() + Math.random();
    setFloatingDamage((prev) => [...prev, { id: noticeId, text: `-${damageDealt} ${isCrit ? "¡CRÍTICO! 💥" : "⚔️"}`, isCrit }]);
    setTimeout(() => {
      setFloatingDamage((prev) => prev.filter((d) => d.id !== noticeId));
    }, 900);

    const nextEnemyHp = Math.max(0, enemyCurrentHp - damageDealt);
    setEnemyCurrentHp(nextEnemyHp);
    setTrainingEnergy((prev) => Math.min(100, prev + 25));

    setBattleLog((prev) => [`${activeWaifu.name} atacó causando ${damageDealt} de daño.`, ...prev.slice(0, 3)]);

    // Si el enemigo fue derrotado
    if (nextEnemyHp <= 0) {
      const rewardG = currentEnemy.rewardGems;
      const rewardC = currentEnemy.rewardCoins;
      const rewardX = currentEnemy.rewardXp;

      setGems((g) => g + rewardG);
      setCoins((c) => c + rewardC);

      // Subir XP a la waifu activa
      setRoster((prev) =>
        prev.map((w) => {
          if (w.id === activeWaifuId) {
            const nextXp = w.xp + rewardX;
            if (nextXp >= w.maxXp) {
              return {
                ...w,
                level: w.level + 1,
                xp: nextXp - w.maxXp,
                maxXp: Math.round(w.maxXp * 1.3),
                maxHp: w.maxHp + 18,
                hp: w.maxHp + 18,
                atk: w.atk + 5,
                def: w.def + 3,
              };
            }
            return { ...w, xp: nextXp };
          }
          return w;
        })
      );

      setBattleLog((prev) => [
        `🎉 ¡Victoria! Ganaste +${rewardG} 💎 Gemas, +${rewardC} 🪙 Coins y +${rewardX} XP.`,
        ...prev,
      ]);
      return;
    }

    // Contrataque del enemigo
    setTimeout(() => {
      const rawEnemyDmg = Math.max(4, currentEnemy.atk - Math.floor(activeWaifu.def / 3));
      setPlayerCurrentHp((prev) => Math.max(0, prev - rawEnemyDmg));
      setBattleLog((prev) => [
        `${currentEnemy.name} contraatacó provocando ${rawEnemyDmg} de daño.`,
        ...prev.slice(0, 3),
      ]);
    }, 350);
  };

  const handlePlayerSpecial = () => {
    if (trainingEnergy < 100 || enemyCurrentHp <= 0) return;

    const specialDamage = Math.round(activeWaifu.atk * 2.6);
    setTrainingEnergy(0);

    const noticeId = Date.now() + Math.random();
    setFloatingDamage((prev) => [...prev, { id: noticeId, text: `¡${specialDamage} IMPACTO SUPREMO! ⚡⚡`, isCrit: true }]);
    setTimeout(() => {
      setFloatingDamage((prev) => prev.filter((d) => d.id !== noticeId));
    }, 1200);

    const nextEnemyHp = Math.max(0, enemyCurrentHp - specialDamage);
    setEnemyCurrentHp(nextEnemyHp);
    setBattleLog((prev) => [
      `🌟 ¡${activeWaifu.name} desató "${activeWaifu.specialSkill.split(":")[0]}" causando ${specialDamage} de daño!`,
      ...prev.slice(0, 3),
    ]);

    if (nextEnemyHp <= 0) {
      setGems((g) => g + currentEnemy.rewardGems);
      setCoins((c) => c + currentEnemy.rewardCoins);
      setBattleLog((prev) => [`🎉 ¡Enemigo fulminado con habilidad especial!`, ...prev]);
    }
  };

  /* ─────────────────── ARENA DE JEFES NPC ─────────────────── */
  const startBossFight = (boss: BossNpc) => {
    setSelectedBoss(boss);
    setBossCurrentHp(boss.hp);
    setBossPlayerHp(activeWaifu.maxHp);
    setBossEnergy(0);
    setBossSpecialWarning(false);
    setIsDefending(false);
    setBossBattleLog([`⚔️ ¡Inicia el duelo oficial contra ${boss.name}!`, `"${boss.quote}"`]);
    setCurrentView("ARENA_BOSS");
  };

  const handleBossFightAction = (action: "attack" | "defend" | "special") => {
    if (bossCurrentHp <= 0 || bossPlayerHp <= 0) return;

    if (action === "defend") {
      setIsDefending(true);
      setBossEnergy((e) => Math.min(100, e + 20));
      setBossBattleLog((prev) => [
        `🛡️ ${activeWaifu.name} asume postura defensiva (daño recibido reducido 60%).`,
        ...prev.slice(0, 4),
      ]);
    } else if (action === "special") {
      if (bossEnergy < 100) return;
      setBossEnergy(0);
      const specialDmg = Math.round(activeWaifu.atk * 2.8);
      const nextHp = Math.max(0, bossCurrentHp - specialDmg);
      setBossCurrentHp(nextHp);
      setBossBattleLog((prev) => [
        `🌟 ¡${activeWaifu.name} ejecutó su Técnica Secreta causando ${specialDmg} de daño al Jefe!`,
        ...prev.slice(0, 4),
      ]);

      if (nextHp <= 0) {
        handleBossDefeated();
        return;
      }
    } else {
      // Ataque normal
      const isCrit = Math.random() > 0.8;
      const dmg = isCrit ? Math.round(activeWaifu.atk * 1.6) : activeWaifu.atk;
      const nextHp = Math.max(0, bossCurrentHp - dmg);
      setBossCurrentHp(nextHp);
      setBossEnergy((e) => Math.min(100, e + 25));
      setBossBattleLog((prev) => [
        `⚔️ ${activeWaifu.name} golpeó a ${selectedBoss.name} causando ${dmg} de daño.`,
        ...prev.slice(0, 4),
      ]);

      if (nextHp <= 0) {
        handleBossDefeated();
        return;
      }
    }

    // Turno del Jefe NPC
    setTimeout(() => {
      if (bossCurrentHp <= 0) return;

      if (bossSpecialWarning) {
        // Ejecución del ataque especial del Jefe
        let bossDmg = Math.round(selectedBoss.atk * 2.0);
        if (isDefending) {
          bossDmg = Math.round(bossDmg * 0.4);
        }
        setBossPlayerHp((p) => Math.max(0, p - bossDmg));
        setBossSpecialWarning(false);
        setIsDefending(false);
        setBossBattleLog((prev) => [
          `💥 ¡${selectedBoss.name} descargó su técnica "${selectedBoss.specialMove}" infligiendo ${bossDmg} de daño!`,
          ...prev.slice(0, 4),
        ]);
      } else {
        // Ataque normal del jefe o advertencia de ataque especial
        const willCharge = Math.random() > 0.65;
        if (willCharge) {
          setBossSpecialWarning(true);
          setBossBattleLog((prev) => [
            `⚠️ ¡ALERTA! ${selectedBoss.name} está concentrando energía para "${selectedBoss.specialMove}". ¡Prepárate para defenderte!`,
            ...prev.slice(0, 4),
          ]);
        } else {
          let bossDmg = Math.max(6, selectedBoss.atk - Math.floor(activeWaifu.def / 2));
          if (isDefending) bossDmg = Math.round(bossDmg * 0.4);
          setIsDefending(false);
          setBossPlayerHp((p) => Math.max(0, p - bossDmg));
          setBossBattleLog((prev) => [
            `⚡ ${selectedBoss.name} ataca causando ${bossDmg} de daño.`,
            ...prev.slice(0, 4),
          ]);
        }
      }
    }, 450);
  };

  const handleBossDefeated = () => {
    setDefeatedBosses((prev) => [...new Set([...prev, selectedBoss.id])]);
    setGems((g) => g + selectedBoss.rewardGems);
    setCoins((c) => c + selectedBoss.rewardCoins);
    addXp(150, `Victoria de Jefe: ${selectedBoss.name}`);
    setBossBattleLog((prev) => [
      `🏆 ¡HAS DERROTADO A ${selectedBoss.name}! Recompensa otorgada: +${selectedBoss.rewardGems} 💎 y +${selectedBoss.rewardCoins} 🪙.`,
      ...prev,
    ]);
  };

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /* RENDER PRINCIPAL DE LA CONSOLA ARCADE                                      */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div
      ref={gameContainerRef}
      className={`w-full relative overflow-hidden bg-[#070211] transition-all duration-300 flex flex-col select-none ${
        isFullscreen
          ? "fixed inset-0 z-[9999] h-screen w-screen rounded-none border-none"
          : "h-[640px] sm:h-[680px] rounded-3xl border-2 border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.2)]"
      }`}
    >
      {/* ─── BARRA SUPERIOR DE CONTROL ARCADE ─── */}
      <div className="h-14 px-3 sm:px-6 bg-[#0c041d]/95 backdrop-blur-md border-b border-purple-500/30 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          {currentView !== "CITY_MAP" && currentView !== "INTRO_STARTER" && (
            <button
              type="button"
              onClick={() => setCurrentView("CITY_MAP")}
              className="px-2.5 py-1 rounded-xl text-xs font-bold border border-purple-500/40 bg-purple-900/30 hover:bg-purple-800/50 text-purple-200 transition-all flex items-center gap-1 cursor-pointer"
              title="Volver al mapa de la ciudad"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ciudad</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs sm:text-sm font-mono font-black tracking-wider text-purple-200 flex items-center gap-1 uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Battle City //</span>
              <span className="text-pink-400">
                {currentView === "CITY_MAP" && "Distrito Central"}
                {currentView === "SUMMON_PORTAL" && "Portal de Invocación"}
                {currentView === "MARKET" && "Mercado de Waifus"}
                {currentView === "TRAINING" && "Zona de Entrenamiento"}
                {currentView === "ARENA_BOSS" && "Arena de Jefes"}
                {currentView === "ROSTER_SELECT" && "Tu Equipo"}
                {currentView === "INTRO_STARTER" && "Primer Pacto"}
              </span>
            </span>
          </div>
        </div>

        {/* Recursos del Jugador & Controles */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentView !== "INTRO_STARTER" && (
            <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded-xl border border-purple-500/30 font-mono text-[11px] sm:text-xs">
              <span className="text-cyan-300 flex items-center gap-1 font-bold" title="Gemas de Batalla">
                <Gem className="w-3 h-3 text-cyan-400" />
                <span>{gems}</span>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-amber-300 flex items-center gap-1 font-bold" title="Monedas de Combate">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>{coins}</span>
              </span>
            </div>
          )}

          {/* Botón Pantalla Completa */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold border border-purple-500/40 bg-purple-600/20 hover:bg-purple-600/40 hover:border-purple-400 text-purple-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden sm:inline">Salir</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden sm:inline">Pantalla Completa</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── PANTALLA PRINCIPAL INTERACTIVA ─── */}
      <div className="flex-1 relative overflow-y-auto overflow-x-hidden p-3 sm:p-5 flex flex-col justify-center items-center bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.12)_0,transparent_75%)]">
        {/* Resplandores de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VISTA 0: INTRO INICIAL PARA ELEGIR STARTER                      */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {currentView === "INTRO_STARTER" && (
          <div className="w-full max-w-xl text-center flex flex-col items-center justify-center space-y-5 my-auto animate-fade-in relative z-10">
            <span className="px-3.5 py-1 rounded-full text-[11px] font-mono font-black tracking-widest uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm animate-pulse">
              ⚡ BIENVENIDO A BATTLE CITY
            </span>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                "Necesitarás a una compañera de equipo."
              </h1>
              <p className="text-xs text-zinc-300 max-w-md mx-auto">
                Elige a tu primera waifu para entrar a Battle City. Recibirás <strong>300 Gemas 💎</strong> de bienvenida para invocar y explorar los distritos.
              </p>
            </div>

            {/* Selector de Starters */}
            <div className="grid grid-cols-3 gap-2.5 w-full pt-1">
              {ALL_WAIFUS.slice(0, 3).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleSelectStarter(w)}
                  className="p-3 rounded-2xl border bg-black/60 border-purple-500/30 hover:border-pink-500/80 hover:bg-purple-900/20 transition-all flex flex-col items-center space-y-2 group cursor-pointer shadow-lg"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-pink-400/60 shadow-md group-hover:scale-105 transition-transform">
                    <FicImage src={w.avatar} alt={w.name} fallbackType="cover" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white group-hover:text-pink-300 transition-colors">{w.name}</h3>
                    <span className="text-[10px] font-mono text-zinc-400">{w.elementIcon} {w.elementLabel.split("/")[0]}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-purple-600/30 text-purple-200 border border-purple-500/40">
                    Elegir
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VISTA 1: MAPA DE LA CIUDAD Y EDIFICIOS (DISTRITO CENTRAL)       */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {currentView === "CITY_MAP" && (
          <div className="w-full max-w-3xl flex flex-col justify-between space-y-4 my-auto relative z-10 animate-fade-in">
            {/* Cabecera del Distrito */}
            <div className="text-center space-y-1">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                MAPA VIRTUAL DE LA CIUDAD
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Distritos de Battle City
              </h2>
              <p className="text-xs text-zinc-300 max-w-lg mx-auto">
                Selecciona un edificio para invocar, comerciar, entrenar en las calles o desafiar a los jefes de la arena.
              </p>
            </div>

            {/* Grid de los 4 Edificios Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
              {/* Edificio 1: Portal de Invocación */}
              <div
                onClick={() => setCurrentView("SUMMON_PORTAL")}
                className="p-4 rounded-2xl border bg-gradient-to-br from-[#160b2b] via-[#100720] to-black border-purple-500/40 hover:border-pink-400 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all cursor-pointer flex items-center gap-3.5 group relative overflow-hidden"
              >
                <div className="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-2xl group-hover:scale-110 transition-transform">
                  ⛩️
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white group-hover:text-pink-300 transition-colors">
                      Portal de Invocación
                    </h3>
                    <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      100 💎
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    Sintoniza los portales arcanos para invocar waifus míticas con gemas.
                  </p>
                </div>
              </div>

              {/* Edificio 2: Mercado de Waifus */}
              <div
                onClick={() => setCurrentView("MARKET")}
                className="p-4 rounded-2xl border bg-gradient-to-br from-[#160b2b] via-[#100720] to-black border-purple-500/40 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.25)] transition-all cursor-pointer flex items-center gap-3.5 group relative overflow-hidden"
              >
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-2xl group-hover:scale-110 transition-transform">
                  🏪
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                      Mercado de la Ciudad
                    </h3>
                    <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      TIENDA
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    Recluta waifus directamente y adquiere elixires de ataque, salud y defensa.
                  </p>
                </div>
              </div>

              {/* Edificio 3: Zona de Entrenamiento */}
              <div
                onClick={() => {
                  setEnemyCurrentHp(currentEnemy.hp);
                  setPlayerCurrentHp(activeWaifu.maxHp);
                  setTrainingEnergy(0);
                  setCurrentView("TRAINING");
                }}
                className="p-4 rounded-2xl border bg-gradient-to-br from-[#160b2b] via-[#100720] to-black border-purple-500/40 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all cursor-pointer flex items-center gap-3.5 group relative overflow-hidden"
              >
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-2xl group-hover:scale-110 transition-transform">
                  🥋
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                      Zona de Entrenamiento
                    </h3>
                    <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      FARM 💎
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    Combates callejeros de acción ágil para conseguir gemas, monedas y subir de nivel.
                  </p>
                </div>
              </div>

              {/* Edificio 4: Arena de Jefes NPC */}
              <div
                onClick={() => setCurrentView("ARENA_BOSS")}
                className="p-4 rounded-2xl border bg-gradient-to-br from-[#160b2b] via-[#100720] to-black border-purple-500/40 hover:border-rose-400 hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] transition-all cursor-pointer flex items-center gap-3.5 group relative overflow-hidden"
              >
                <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-2xl group-hover:scale-110 transition-transform">
                  🏟️
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white group-hover:text-rose-300 transition-colors">
                      Arena de Jefes NPC
                    </h3>
                    <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      JEFES
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    Desafía a los campeones de Battle City para ganar gemas masivas e insignias.
                  </p>
                </div>
              </div>
            </div>

            {/* Barra Inferior del Mapa: Tu Compañera Activa */}
            <div className="p-3.5 rounded-2xl border bg-black/60 border-purple-500/30 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-pink-400/80 shrink-0">
                  <FicImage src={activeWaifu.avatar} alt={activeWaifu.name} fallbackType="cover" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">{activeWaifu.name}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500/30">
                      Nvl {activeWaifu.level}
                    </span>
                    <span className="text-xs">{activeWaifu.elementIcon}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 pt-0.5">
                    <span className="text-rose-400">HP {activeWaifu.maxHp}</span>
                    <span>•</span>
                    <span className="text-amber-400">ATK {activeWaifu.atk}</span>
                    <span>•</span>
                    <span className="text-cyan-400">DEF {activeWaifu.def}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentView("ROSTER_SELECT")}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-500/40 bg-purple-900/30 hover:bg-purple-800/40 text-purple-200 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Equipo ({roster.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VISTA 2: PORTAL DE INVOCACIÓN (GACHA CON GEMAS)                  */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {currentView === "SUMMON_PORTAL" && (
          <div className="w-full max-w-md text-center flex flex-col items-center justify-center space-y-4 my-auto relative z-10 animate-fade-in">
            {!isSummoning && !summonResult && (
              <>
                <div className="space-y-1">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    SANTUARIO CÓSMICO
                  </span>
                  <h2 className="text-2xl font-black text-white">Portal de Invocación</h2>
                  <p className="text-xs text-zinc-300">
                    Utiliza tus Gemas de Batalla para invocar waifus míticas y leyendas del torneo.
                  </p>
                </div>

                {/* Círculo Mágico */}
                <div className="relative w-40 h-40 rounded-full border-2 border-dashed border-purple-400/60 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.3)] my-2">
                  <div className="absolute inset-2 rounded-full border border-pink-400/40 animate-spin" style={{ animationDuration: "12s" }} />
                  <div className="absolute inset-5 rounded-full border border-cyan-400/30 animate-spin" style={{ animationDuration: "8s", animationDirection: "reverse" }} />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600/40 to-pink-500/40 flex items-center justify-center text-4xl shadow-inner">
                    ✨
                  </div>
                </div>

                {/* Saldo y Botones de Invocación */}
                <div className="space-y-2.5 w-full">
                  <div className="text-xs font-mono text-cyan-300 flex items-center justify-center gap-1.5">
                    <Gem className="w-3.5 h-3.5" />
                    <span>Tienes {gems} Gemas de Batalla disponibles</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSummon(100)}
                      disabled={gems < 100}
                      className="py-3 px-2 rounded-2xl text-xs font-black border border-pink-500/50 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-102 transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:pointer-events-none flex flex-col items-center"
                    >
                      <span>Invocación x1</span>
                      <span className="text-[10px] font-mono text-pink-200">100 💎 Gemas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSummon(300)}
                      disabled={gems < 300}
                      className="py-3 px-2 rounded-2xl text-xs font-black border border-amber-500/50 bg-gradient-to-r from-amber-500 to-purple-600 text-white hover:scale-102 transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:pointer-events-none flex flex-col items-center"
                    >
                      <span>Invocación Mayor</span>
                      <span className="text-[10px] font-mono text-amber-200">300 💎 Gemas</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Animación de Invocación */}
            {isSummoning && (
              <div className="space-y-4 my-auto animate-fade-in">
                <div className="relative w-44 h-44 rounded-full border-4 border-dashed border-purple-400 flex items-center justify-center shadow-[0_0_60px_rgba(236,72,153,0.9)] animate-spin" style={{ animationDuration: "1.5s" }}>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-4xl animate-ping">
                    ⚡
                  </div>
                </div>
                <h3 className="text-xl font-black text-white animate-pulse uppercase tracking-wider">
                  ¡Sintonizando Portal Cósmico!
                </h3>
              </div>
            )}

            {/* Resultado de la Invocación */}
            {summonResult && !isSummoning && (
              <div className="space-y-3 my-auto animate-scale-up w-full">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>¡INVOCACIÓN EXITOSA!</span>
                </span>

                <div className="p-4 rounded-2xl border bg-black/70 border-purple-500/30 space-y-3">
                  <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-pink-400 shadow-lg">
                    <FicImage src={summonResult.avatar} alt={summonResult.name} fallbackType="cover" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      ⭐⭐⭐⭐⭐ {summonResult.rarity}
                    </span>
                    <h3 className="text-lg font-black text-white">{summonResult.name}</h3>
                    <p className="text-xs text-pink-300 font-mono">{summonResult.title}</p>
                    <p className="text-[11px] italic text-zinc-300 pt-1">"{summonResult.quote}"</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-2 text-[10px] font-mono">
                    <div className="p-1 rounded bg-white/5 text-rose-400 font-bold">HP {summonResult.maxHp}</div>
                    <div className="p-1 rounded bg-white/5 text-amber-400 font-bold">ATK {summonResult.atk}</div>
                    <div className="p-1 rounded bg-white/5 text-cyan-400 font-bold">DEF {summonResult.def}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSummonResult(null)}
                    className="w-full py-2.5 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 hover:scale-102 transition-all cursor-pointer shadow-md"
                  >
                    ¡Aceptar y Continuar!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VISTA 3: MERCADO DE WAIFUS Y MEJORAS                             */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {currentView === "MARKET" && (
          <div className="w-full max-w-2xl space-y-4 my-auto relative z-10 animate-fade-in">
            <div className="text-center space-y-0.5">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                DISTRITO COMERCIAL
              </span>
              <h2 className="text-xl font-black text-white">Mercado de Battle City</h2>
              <p className="text-xs text-zinc-300">
                Recluta waifus directamente o potencia a tu compañera activa con elixires de combate.
              </p>
            </div>

            {/* Catálogo de Waifus Disponibles para Reclutar */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase text-purple-300 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>Reclutamiento Directo</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_WAIFUS.filter((w) => w.priceCoins || w.priceGems).map((w) => {
                  const isOwned = roster.some((r) => r.id === w.id);
                  return (
                    <div
                      key={w.id}
                      className="p-3 rounded-2xl border bg-black/60 border-purple-500/30 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-pink-400 shrink-0">
                          <FicImage src={w.avatar} alt={w.name} fallbackType="cover" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white">{w.name}</h4>
                          <span className="text-[10px] font-mono text-zinc-400">{w.elementIcon} {w.rarity}</span>
                        </div>
                      </div>

                      <div>
                        {isOwned ? (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Reclutada
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuyWaifu(w)}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-amber-500/40 bg-amber-500/20 text-amber-200 hover:bg-amber-500/40 transition-all cursor-pointer flex items-center gap-1"
                          >
                            {w.priceCoins ? (
                              <>
                                <Coins className="w-3 h-3 text-amber-400" />
                                <span>{w.priceCoins}</span>
                              </>
                            ) : (
                              <>
                                <Gem className="w-3 h-3 text-cyan-400" />
                                <span>{w.priceGems}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mejoras de Estadísticas para la Waifu Activa */}
            <div className="p-3 rounded-2xl border bg-black/60 border-purple-500/30 space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase text-purple-300 flex items-center justify-between">
                <span>Elixires de Mejora ({activeWaifu.name})</span>
                <span className="text-[10px] text-zinc-400">Pagas con Monedas 🪙</span>
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleBuyStatUpgrade("atk", 150)}
                  disabled={coins < 150}
                  className="p-2 rounded-xl border border-white/10 hover:border-amber-400/50 bg-white/5 hover:bg-white/10 transition-all text-center cursor-pointer disabled:opacity-40"
                >
                  <span className="text-[11px] font-black text-amber-300 block">+5 ATK</span>
                  <span className="text-[9px] font-mono text-zinc-400">150 🪙 Coins</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBuyStatUpgrade("def", 150)}
                  disabled={coins < 150}
                  className="p-2 rounded-xl border border-white/10 hover:border-cyan-400/50 bg-white/5 hover:bg-white/10 transition-all text-center cursor-pointer disabled:opacity-40"
                >
                  <span className="text-[11px] font-black text-cyan-300 block">+5 DEF</span>
                  <span className="text-[9px] font-mono text-zinc-400">150 🪙 Coins</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBuyStatUpgrade("hp", 200)}
                  disabled={coins < 200}
                  className="p-2 rounded-xl border border-white/10 hover:border-rose-400/50 bg-white/5 hover:bg-white/10 transition-all text-center cursor-pointer disabled:opacity-40"
                >
                  <span className="text-[11px] font-black text-rose-300 block">+25 HP</span>
                  <span className="text-[9px] font-mono text-zinc-400">200 🪙 Coins</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VISTA 4: ZONA DE ENTRENAMIENTO (COMBATE CALLEJERO / FARM GEMAS)   */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {currentView === "TRAINING" && (
          <div className="w-full max-w-xl space-y-4 my-auto relative z-10 animate-fade-in">
            {/* Header del Combate */}
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                <Swords className="w-3.5 h-3.5" />
                <span>Patrulla Callejera • Nivel {currentEnemy.level}</span>
              </span>

              <button
                type="button"
                onClick={spawnNextStreetEnemy}
                className="text-[10px] font-mono text-purple-300 hover:text-white flex items-center gap-1 border border-purple-500/30 px-2 py-0.5 rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Cambiar Enemigo</span>
              </button>
            </div>

            {/* Arena Visual: Waifu vs Enemigo */}
            <div className="grid grid-cols-2 gap-4 items-center p-4 rounded-2xl border bg-black/60 border-purple-500/30 relative overflow-hidden">
              {/* Tu Waifu */}
              <div className="text-center space-y-1.5 flex flex-col items-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <FicImage src={activeWaifu.avatar} alt={activeWaifu.name} fallbackType="cover" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{activeWaifu.name}</h4>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">HP {playerCurrentHp}/{activeWaifu.maxHp}</span>
                  <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden mx-auto mt-1">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.max(0, (playerCurrentHp / activeWaifu.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Enemigo Callejero */}
              <div className="text-center space-y-1.5 flex flex-col items-center relative">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                  <FicImage src={currentEnemy.avatar} alt={currentEnemy.name} fallbackType="cover" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-300 truncate max-w-[120px]">{currentEnemy.name}</h4>
                  <span className="text-[10px] font-mono text-rose-400 font-bold">HP {enemyCurrentHp}/{currentEnemy.maxHp}</span>
                  <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden mx-auto mt-1">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${Math.max(0, (enemyCurrentHp / currentEnemy.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Daños Flotantes */}
                {floatingDamage.map((d) => (
                  <span
                    key={d.id}
                    className={`absolute -top-3 text-xs sm:text-sm font-black pointer-events-none animate-bounce ${
                      d.isCrit ? "text-amber-300" : "text-rose-400"
                    }`}
                  >
                    {d.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Barra de Energía para Habilidad Especial */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-purple-300 font-bold">ENERGÍA DE HABILIDAD ESPECIAL</span>
                <span className="text-amber-400 font-bold">{trainingEnergy}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-purple-500/30">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${trainingEnergy}%` }}
                />
              </div>
            </div>

            {/* Controles de Acción */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePlayerAttack}
                disabled={enemyCurrentHp <= 0 || playerCurrentHp <= 0}
                className="py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-102 transition-all cursor-pointer shadow-lg disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Swords className="w-4 h-4" />
                <span>¡Atacar! (+ATK)</span>
              </button>

              <button
                type="button"
                onClick={handlePlayerSpecial}
                disabled={trainingEnergy < 100 || enemyCurrentHp <= 0}
                className="py-3 rounded-2xl text-xs font-black text-black bg-gradient-to-r from-amber-400 to-pink-400 hover:scale-102 transition-all cursor-pointer shadow-lg disabled:opacity-30 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                <span>¡Habilidad Especial!</span>
              </button>
            </div>

            {/* Registro de Batalla */}
            <div className="p-2.5 rounded-xl border border-purple-500/20 bg-black/40 text-[10px] font-mono text-zinc-400 min-h-[48px] space-y-0.5">
              {battleLog.slice(0, 2).map((log, idx) => (
                <p key={idx} className="leading-snug">{log}</p>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VISTA 5: ARENA PVP & JEFES NPC                                   */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {currentView === "ARENA_BOSS" && (
          <div className="w-full max-w-xl space-y-3.5 my-auto relative z-10 animate-fade-in">
            {/* Si aún no está en combate contra un jefe específico, muestra la lista de Jefes */}
            {bossCurrentHp <= 0 && (
              <div className="space-y-3">
                <div className="text-center space-y-0.5">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    COLISEO SUPREMO
                  </span>
                  <h2 className="text-xl font-black text-white">Jefes de Battle City</h2>
                  <p className="text-xs text-zinc-300">
                    Derrota a los campeones NPC para desbloquear gemas de élite e insignias únicas.
                  </p>
                </div>

                <div className="space-y-2">
                  {BOSS_LIST.map((b) => {
                    const isDefeated = defeatedBosses.includes(b.id);
                    return (
                      <div
                        key={b.id}
                        className="p-3 rounded-2xl border bg-black/60 border-purple-500/30 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-rose-500/60 shrink-0">
                            <FicImage src={b.avatar} alt={b.name} fallbackType="cover" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-white">{b.name}</h4>
                              <span className="text-[10px] font-mono px-1.5 rounded bg-rose-900/40 text-rose-300 border border-rose-500/30">
                                Nvl {b.level}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-amber-400">
                              Recompensa: +{b.rewardGems} 💎 | +{b.rewardCoins} 🪙
                            </p>
                            <span className="text-[9px] font-mono text-zinc-400">{b.badgeReward}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => startBossFight(b)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                            isDefeated
                              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                              : "bg-rose-600 hover:bg-rose-500 text-white shadow-md hover:scale-102"
                          }`}
                        >
                          {isDefeated ? "Rejugar" : "Desafiar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Combate Activo contra el Jefe */}
            {bossCurrentHp > 0 && (
              <div className="space-y-3">
                {/* Barra de Salud Gigante del Jefe */}
                <div className="p-3 rounded-2xl border bg-black/70 border-rose-500/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-rose-300">{selectedBoss.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-500/30">
                        Nivel {selectedBoss.level}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {bossCurrentHp} / {selectedBoss.maxHp} HP
                    </span>
                  </div>

                  <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-rose-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-300"
                      style={{ width: `${Math.max(0, (bossCurrentHp / selectedBoss.maxHp) * 100)}%` }}
                    />
                  </div>

                  {bossSpecialWarning && (
                    <div className="p-1.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-center text-[10px] font-mono font-bold text-rose-300 flex items-center justify-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>¡ALERTA! {selectedBoss.name} PREPARA {selectedBoss.specialMove.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* Duelo Visual: Waifu vs Boss */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl border bg-black/50 border-purple-500/30 items-center">
                  <div className="text-center space-y-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md">
                      <FicImage src={activeWaifu.avatar} alt={activeWaifu.name} fallbackType="cover" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[11px] font-bold text-white">{activeWaifu.name}</p>
                    <p className="text-[10px] font-mono text-emerald-400">HP {bossPlayerHp}/{activeWaifu.maxHp}</p>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl overflow-hidden border-2 border-rose-500 shadow-md">
                      <FicImage src={selectedBoss.avatar} alt={selectedBoss.name} fallbackType="cover" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[11px] font-bold text-rose-300">{selectedBoss.name}</p>
                    <p className="text-[10px] font-mono text-rose-400">ATK {selectedBoss.atk} | DEF {selectedBoss.def}</p>
                  </div>
                </div>

                {/* Acciones de Combate por Turnos / Táctica */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleBossFightAction("attack")}
                    disabled={bossPlayerHp <= 0}
                    className="py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-102 transition-all cursor-pointer shadow-md disabled:opacity-40 flex items-center justify-center gap-1"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Atacar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBossFightAction("defend")}
                    disabled={bossPlayerHp <= 0}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-1 ${
                      isDefending
                        ? "bg-cyan-500 text-black font-extrabold ring-2 ring-cyan-300"
                        : "bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-800/60"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Defender</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBossFightAction("special")}
                    disabled={bossEnergy < 100 || bossPlayerHp <= 0}
                    className="py-2.5 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-400 to-pink-400 hover:scale-102 transition-all cursor-pointer shadow-md disabled:opacity-30 flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Suprema</span>
                  </button>
                </div>

                {/* Log de Combate */}
                <div className="p-2.5 rounded-xl border border-purple-500/20 bg-black/50 text-[10px] font-mono text-zinc-400 min-h-[46px] space-y-0.5">
                  {bossBattleLog.slice(0, 2).map((log, i) => (
                    <p key={i} className="leading-tight">{log}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VISTA 6: GESTOR DE EQUIPO (ROSTER DE WAIFUS)                    */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {currentView === "ROSTER_SELECT" && (
          <div className="w-full max-w-xl space-y-4 my-auto relative z-10 animate-fade-in">
            <div className="text-center space-y-0.5">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                GESTIÓN DE EQUIPO
              </span>
              <h2 className="text-xl font-black text-white">Tus Waifus ({roster.length})</h2>
              <p className="text-xs text-zinc-300">
                Selecciona a tu waifu líder para combatir en las calles y arenas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {roster.map((w) => {
                const isActive = w.id === activeWaifuId;
                return (
                  <div
                    key={w.id}
                    onClick={() => setActiveWaifuId(w.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isActive
                        ? "bg-purple-900/40 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.3)] ring-1 ring-pink-400"
                        : "bg-black/60 border-purple-500/30 hover:border-purple-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-pink-400 shrink-0">
                        <FicImage src={w.avatar} alt={w.name} fallbackType="cover" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-black text-white">{w.name}</h4>
                          <span className="text-[10px]">{w.elementIcon}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">Nvl {w.level} • {w.rarity}</span>
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400 pt-0.5">
                          <span className="text-rose-400">HP {w.maxHp}</span>
                          <span>ATK {w.atk}</span>
                          <span>DEF {w.def}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-white/5 text-zinc-400 border border-white/10"
                      }`}
                    >
                      {isActive ? "Activa" : "Equipar"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── BARRA INFERIOR DE ESTADO ARCADE ─── */}
      <div className="h-8 px-4 sm:px-6 bg-[#06020e]/95 border-t border-purple-500/20 flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0 select-none z-20">
        <div className="flex items-center gap-3">
          <span className="text-purple-400 font-bold">FicNation Arcade Cab</span>
          <span className="hidden sm:inline text-zinc-600">•</span>
          <span className="hidden sm:inline text-zinc-300">
            Líder: {activeWaifu.name} (Nvl {activeWaifu.level})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold hidden sm:inline">
            ATK: {activeWaifu.atk} | DEF: {activeWaifu.def}
          </span>
          <span className="text-purple-400/80">
            {isFullscreen ? "ESC para salir" : "Ventana Fija Arcade"}
          </span>
        </div>
      </div>
    </div>
  );
}
