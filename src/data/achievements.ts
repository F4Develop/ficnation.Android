import {
  Sparkles,
  PenTool,
  BookOpen,
  Flame,
  Star,
  Bookmark,
  Award,
  Users,
  Shield,
  type LucideIcon,
} from "lucide-react";

export type AchievementCategory = "comunidad" | "escritura" | "lector" | "progresion";

export interface AchievementContext {
  user?: {
    id?: string;
    xp?: number;
    level?: number;
    readerLevel?: number;
    authorLevel?: number;
    badges?: string[];
    stats?: {
      stories?: number;
      readingLists?: number;
      followers?: number;
      following?: number;
    };
    createdAt?: string;
  } | null;
  storiesCount?: number;
  readingListsCount?: number;
  totalVotesReceived?: number;
}

export interface Achievement {
  id: string;
  legacyId?: string; // Para compatibilidad con perfiles antiguos
  name: string;
  desc: string;
  req: string;
  target: number;
  unit?: string;
  rewardXp: number; // RECOMPENSA EXCLUSIVA EN XP (SIN MONEDAS)
  category: AchievementCategory;
  categoryLabel: string;
  icon: LucideIcon;
  color: string;
  bgGlow: string;
  evaluate: (ctx: AchievementContext) => {
    current: number;
    isCompleted: boolean;
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "pionero",
    legacyId: "Pionero",
    name: "Pionero de FicNation",
    desc: "Forma parte de la primera generación de miembros de la plataforma.",
    req: "Crear una cuenta y unirte a FicNation",
    target: 1,
    unit: "",
    rewardXp: 100,
    category: "comunidad",
    categoryLabel: "Comunidad",
    icon: Sparkles,
    color: "text-purple-400",
    bgGlow: "from-purple-500/20 to-indigo-500/20",
    evaluate: (ctx) => {
      const isRegistered = Boolean(ctx.user?.id || ctx.user?.badges?.includes("Pionero"));
      return {
        current: isRegistered ? 1 : 0,
        isCompleted: isRegistered,
      };
    },
  },
  {
    id: "primer_manuscrito",
    legacyId: "Primer Manuscrito",
    name: "Primer Manuscrito",
    desc: "Da vida a tu primera creación y compártela con los lectores.",
    req: "Publicar al menos 1 historia original",
    target: 1,
    unit: "historia",
    rewardXp: 250,
    category: "escritura",
    categoryLabel: "Escritura",
    icon: PenTool,
    color: "text-amber-400",
    bgGlow: "from-amber-500/20 to-orange-500/20",
    evaluate: (ctx) => {
      const count = ctx.storiesCount ?? ctx.user?.stats?.stories ?? 0;
      const legacyUnlocked = Boolean(ctx.user?.badges?.includes("Primer Manuscrito"));
      const isCompleted = count >= 1 || legacyUnlocked;
      return {
        current: isCompleted ? Math.max(count, 1) : count,
        isCompleted,
      };
    },
  },
  {
    id: "pluma_prolifica",
    legacyId: "Pluma Prolífica",
    name: "Pluma Prolífica",
    desc: "Demuestra tu constancia y pasión creando múltiples obras.",
    req: "Publicar 3 o más historias originales",
    target: 3,
    unit: "historias",
    rewardXp: 500,
    category: "escritura",
    categoryLabel: "Escritura",
    icon: BookOpen,
    color: "text-blue-400",
    bgGlow: "from-blue-500/20 to-cyan-500/20",
    evaluate: (ctx) => {
      const count = ctx.storiesCount ?? ctx.user?.stats?.stories ?? 0;
      return {
        current: count,
        isCompleted: count >= 3,
      };
    },
  },
  {
    id: "buho_nocturno",
    legacyId: "Búho Nocturno",
    name: "Búho Nocturno",
    desc: "Lector y participante incansable que acumula experiencia.",
    req: "Alcanzar 200 puntos de XP totales",
    target: 200,
    unit: "XP",
    rewardXp: 150,
    category: "progresion",
    categoryLabel: "Progresión",
    icon: Flame,
    color: "text-rose-400",
    bgGlow: "from-rose-500/20 to-red-500/20",
    evaluate: (ctx) => {
      const xp = ctx.user?.xp ?? 0;
      const legacyUnlocked = Boolean(ctx.user?.badges?.includes("Búho Nocturno"));
      const isCompleted = xp >= 200 || legacyUnlocked;
      return {
        current: isCompleted ? Math.max(xp, 200) : xp,
        isCompleted,
      };
    },
  },
  {
    id: "lector_aventurero",
    legacyId: "Crítico Literario",
    name: "Lector Aventurero",
    desc: "Avanza en tu rango de usuario alcanzando el Nivel 2.",
    req: "Alcanzar Nivel 2 de perfil de usuario",
    target: 2,
    unit: "nivel",
    rewardXp: 200,
    category: "lector",
    categoryLabel: "Lectura",
    icon: Star,
    color: "text-yellow-400",
    bgGlow: "from-yellow-500/20 to-amber-500/20",
    evaluate: (ctx) => {
      const level = ctx.user?.level ?? 1;
      const legacyUnlocked = Boolean(ctx.user?.badges?.includes("Crítico Literario"));
      const isCompleted = level >= 2 || legacyUnlocked;
      return {
        current: isCompleted ? Math.max(level, 2) : level,
        isCompleted,
      };
    },
  },
  {
    id: "gran_coleccionista",
    legacyId: "Gran Coleccionista",
    name: "Gran Coleccionista",
    desc: "Organiza tu biblioteca creando listas de lectura personalizadas.",
    req: "Crear al menos 1 lista de lectura",
    target: 1,
    unit: "lista",
    rewardXp: 150,
    category: "lector",
    categoryLabel: "Lectura",
    icon: Bookmark,
    color: "text-cyan-400",
    bgGlow: "from-cyan-500/20 to-teal-500/20",
    evaluate: (ctx) => {
      const lists = ctx.readingListsCount ?? ctx.user?.stats?.readingLists ?? 0;
      const legacyUnlocked = Boolean(ctx.user?.badges?.includes("Gran Coleccionista"));
      const isCompleted = lists >= 1 || legacyUnlocked;
      return {
        current: isCompleted ? Math.max(lists, 1) : lists,
        isCompleted,
      };
    },
  },
  {
    id: "estrella_brillante",
    legacyId: "Estrella Brillante",
    name: "Estrella Brillante",
    desc: "Tus obras conectan con la audiencia y reciben votos estelares.",
    req: "Recibir 1 o más estrellas en tus historias",
    target: 1,
    unit: "estrella",
    rewardXp: 250,
    category: "escritura",
    categoryLabel: "Escritura",
    icon: Award,
    color: "text-orange-400",
    bgGlow: "from-orange-500/20 to-yellow-500/20",
    evaluate: (ctx) => {
      const votes = ctx.totalVotesReceived ?? 0;
      const legacyUnlocked = Boolean(ctx.user?.badges?.includes("Estrella Brillante"));
      const isCompleted = votes >= 1 || legacyUnlocked;
      return {
        current: isCompleted ? Math.max(votes, 1) : votes,
        isCompleted,
      };
    },
  },
  {
    id: "comunidad_unida",
    name: "Círculo Literario",
    desc: "Interactúa con la comunidad siguiendo a creadores destacados.",
    req: "Seguir a 2 o más autores de FicNation",
    target: 2,
    unit: "seguidos",
    rewardXp: 150,
    category: "comunidad",
    categoryLabel: "Comunidad",
    icon: Users,
    color: "text-indigo-400",
    bgGlow: "from-indigo-500/20 to-purple-500/20",
    evaluate: (ctx) => {
      const following = ctx.user?.stats?.following ?? 0;
      return {
        current: following,
        isCompleted: following >= 2,
      };
    },
  },
  {
    id: "maestro_de_las_letras",
    legacyId: "Leyenda Cósmica",
    name: "Maestro de las Letras",
    desc: "Alcanza la cumbre del reconocimiento literario con rango de élite.",
    req: "Alcanzar Nivel 4 o superior",
    target: 4,
    unit: "nivel",
    rewardXp: 800,
    category: "progresion",
    categoryLabel: "Progresión",
    icon: Shield,
    color: "text-emerald-400",
    bgGlow: "from-emerald-500/20 to-teal-500/20",
    evaluate: (ctx) => {
      const level = ctx.user?.level ?? 1;
      const legacyUnlocked = Boolean(ctx.user?.badges?.includes("Leyenda Cósmica"));
      const isCompleted = level >= 4 || legacyUnlocked;
      return {
        current: isCompleted ? Math.max(level, 4) : level,
        isCompleted,
      };
    },
  },
];

// Helper para obtener la clave de almacenamiento seguro por usuario
function getStorageKey(userId?: string): string {
  return `ficnation_claimed_achievements_${userId || "guest"}`;
}

// Obtiene los IDs de los logros reclamados por el usuario
export function getClaimedAchievements(userId?: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Marca un logro como reclamado y persiste en localStorage
export function markAchievementClaimed(achievementId: string, userId?: string): string[] {
  if (typeof window === "undefined") return [achievementId];
  try {
    const current = getClaimedAchievements(userId);
    if (!current.includes(achievementId)) {
      const updated = [...current, achievementId];
      localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch {
    return [achievementId];
  }
}

// Comprueba si un logro específico ya fue reclamado
export function isAchievementClaimed(achievementId: string, claimedList: string[]): boolean {
  return claimedList.includes(achievementId);
}

// Evalúa el estado completo de un logro
export function evaluateAchievement(
  achievement: Achievement,
  context: AchievementContext,
  claimedList: string[]
) {
  const { current, isCompleted } = achievement.evaluate(context);
  const claimed = isAchievementClaimed(achievement.id, claimedList);
  const progressPercent = Math.min(
    100,
    Math.round((Math.max(0, current) / Math.max(1, achievement.target)) * 100)
  );

  return {
    ...achievement,
    current,
    isCompleted,
    isClaimed: claimed,
    progressPercent,
    canClaim: isCompleted && !claimed,
  };
}
