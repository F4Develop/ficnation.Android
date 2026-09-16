"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendNotification } from "@/lib/notifications";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar: string;
  bannerUrl: string;
  bio: string;
  level: number;
  levelTitle: string;
  xp: number;
  nextLevelXp: number;
  readerLevel?: number;
  readerLevelTitle?: string;
  readerIcon?: string;
  authorLevel?: number;
  authorLevelTitle?: string;
  authorIcon?: string;
  isVerifiedAuthor?: boolean;
  coins: number;
  earnedCoins: number;
  createdAt?: string;
  stats: {
    stories: number;
    readingLists: number;
    followers: number;
    following: number;
    wordsWritten?: number;
  };
  badges: string[];
}

export interface TipRecord {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  amount: number;
  giftName: string;
  giftIcon: string;
  message?: string;
  storyId?: string;
  storyTitle?: string;
  createdAt: string;
}

export interface CashoutRequest {
  id: string;
  userId: string;
  amountUsd: number;
  coinsDeducted: number;
  paymentMethod: "paypal" | "bank_transfer" | "crypto";
  accountDetails: {
    emailOrAccount: string;
    fullName: string;
    notes?: string;
  };
  status: "pending" | "approved" | "paid" | "rejected";
  createdAt: string;
  processedAt?: string;
}

export const COINS_PER_USD = 100;
export const MIN_CASHOUT_USD = 5.0; // Umbral mínimo de $5.00 USD

export const LEVEL_MILESTONES = [
  { level: 1, title: "Iniciado", minXp: 0, nextXp: 200 },
  { level: 2, title: "Aprendiz de Letras", minXp: 200, nextXp: 500 },
  { level: 3, title: "Escritor Errante", minXp: 500, nextXp: 1000 },
  { level: 4, title: "Forjador de Historias", minXp: 1000, nextXp: 2000 },
  { level: 5, title: "Cronista de Universos", minXp: 2000, nextXp: 3500 },
  { level: 6, title: "Maestro de la Ficción", minXp: 3500, nextXp: 5500 },
  { level: 7, title: "Leyenda Cósmica", minXp: 5500, nextXp: 10000 },
];

export function calculateLevelFromXp(xp: number): { level: number; levelTitle: string; nextLevelXp: number } {
  const safeXp = Math.max(0, xp || 0);
  let current = LEVEL_MILESTONES[0];
  for (const m of LEVEL_MILESTONES) {
    if (safeXp >= m.minXp) {
      current = m;
    }
  }
  return {
    level: current.level,
    levelTitle: current.title,
    nextLevelXp: current.nextXp,
  };
}

export function calculateReaderLevel(xp: number): { level: number; levelTitle: string; icon: string; nextLevelXp: number } {
  const safeXp = Math.max(0, xp || 0);
  const milestones = [
    { level: 1, title: "Lector Curioso", minXp: 0, nextXp: 150, icon: "📖" },
    { level: 2, title: "Lector Habitual", minXp: 150, nextXp: 400, icon: "📚" },
    { level: 3, title: "Devorador de Libros", minXp: 400, nextXp: 900, icon: "⚡" },
    { level: 4, title: "Crítico Literario", minXp: 900, nextXp: 1800, icon: "🔍" },
    { level: 5, title: "Erudito Cósmico", minXp: 1800, nextXp: 3200, icon: "🌌" },
    { level: 6, title: "Bibliotecario Arcano", minXp: 3200, nextXp: 5000, icon: "🧙‍♂️" },
    { level: 7, title: "Guardián del Saber", minXp: 5000, nextXp: 10000, icon: "👑" },
  ];
  let cur = milestones[0];
  for (const m of milestones) {
    if (safeXp >= m.minXp) cur = m;
  }
  return { level: cur.level, levelTitle: cur.title, icon: cur.icon, nextLevelXp: cur.nextXp };
}

export function calculateAuthorLevel(storiesCount: number): { level: number; levelTitle: string; icon: string } {
  const milestones = [
    { level: 1, title: "Pluma Inicial", minStories: 0, icon: "🪶" },
    { level: 2, title: "Aprendiz de Letras", minStories: 1, icon: "✍️" },
    { level: 3, title: "Narrador de Mundos", minStories: 2, icon: "📜" },
    { level: 4, title: "Forjador de Tramas", minStories: 3, icon: "🔮" },
    { level: 5, title: "Cronista Destacado", minStories: 5, icon: "⭐" },
    { level: 6, title: "Gran Novelista", minStories: 7, icon: "🏆" },
    { level: 7, title: "Maestro Creador", minStories: 10, icon: "🌟" },
  ];
  let cur = milestones[0];
  for (const m of milestones) {
    if (storiesCount >= m.minStories) cur = m;
  }
  return { level: cur.level, levelTitle: cur.title, icon: cur.icon };
}

interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  addXp: (amount: number, reason?: string) => Promise<void>;
  addCoins: (amount: number, reason?: string) => Promise<void>;
  spendCoins: (amount: number, reason?: string) => Promise<boolean>;
  claimDailyReward: () => Promise<{ success: boolean; amount: number; message: string }>;
  sendTip: (
    recipientId: string,
    amount: number,
    giftName: string,
    giftIcon: string,
    message?: string,
    storyId?: string,
    storyTitle?: string
  ) => Promise<{ success: boolean; message: string }>;
  requestCashout: (
    amountUsd: number,
    paymentMethod: "paypal" | "bank_transfer" | "crypto",
    accountDetails: { emailOrAccount: string; fullName: string; notes?: string }
  ) => Promise<{ success: boolean; message: string }>;
  updateProfile?: (data: Partial<UserProfile>) => void;
  getCashoutHistory: () => CashoutRequest[];
  getReceivedTips: () => TipRecord[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  session: null,
  isAuthenticated: false,
  isLoaded: false,
  logout: async () => {},
  refreshProfile: async () => {},
  addXp: async () => {},
  addCoins: async () => {},
  spendCoins: async () => false,
  claimDailyReward: async () => ({ success: false, amount: 0, message: "" }),
  sendTip: async () => ({ success: false, message: "" }),
  requestCashout: async () => ({ success: false, message: "" }),
  getCashoutHistory: () => [],
  getReceivedTips: () => [],
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar perfil cacheado en cliente de forma segura tras hidratación
  useEffect(() => {
    try {
      const cached = localStorage.getItem("ficnation_cached_profile");
      if (cached) {
        setUser(JSON.parse(cached));
      }
    } catch {}
  }, []);

  const fetchProfile = useCallback(async (userId: string, authUser?: SupabaseUser | null) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // Contar obras reales del usuario
      let realStoriesCount = data?.stories_count ?? 0;
      try {
        const { count } = await supabase
          .from("stories")
          .select("id", { count: "exact", head: true })
          .eq("author_id", userId);
        if (count !== null && count !== undefined) {
          realStoriesCount = count;
        }
      } catch {}

      // Contar listas de lectura reales
      let realListsCount = data?.lists_count ?? 0;
      if (typeof window !== "undefined") {
        try {
          const localLists = JSON.parse(localStorage.getItem("ficnation_reading_lists") || "[]");
          if (localLists.length > 0) realListsCount = localLists.length;
        } catch {}
      }

      if (data && !error) {
        const rawXp = data.xp ?? 0;
        const levelData = calculateLevelFromXp(rawXp);
        const readerData = calculateReaderLevel(rawXp);
        const authorData = calculateAuthorLevel(realStoriesCount);
        const isVerified = Boolean(data.is_verified || data.verified || realStoriesCount >= 1);

        // Calcular insignias desbloqueadas
        const unlockedBadges: string[] = ["Pionero"];
        if (realStoriesCount > 0) unlockedBadges.push("Primer Manuscrito");
        if (rawXp >= 100) unlockedBadges.push("Búho Nocturno");
        if (levelData.level >= 3) unlockedBadges.push("Crítico Literario");
        if (isVerified) unlockedBadges.push("Autor Verificado");

        const rawCoins = typeof data.coins === "number" ? data.coins : 0;
        const rawEarned = typeof data.earned_coins === "number" ? data.earned_coins : 0;

        const freshProfile: UserProfile = {
          id: data.id,
          name: data.name || authUser?.user_metadata?.name || "Usuario",
          username: data.username || authUser?.user_metadata?.username || "usuario",
          email: data.email || authUser?.email || "",
          avatar: data.avatar_url || authUser?.user_metadata?.avatar_url || "/default-avatar.svg",
          bannerUrl: data.banner_url || "from-purple-950 via-indigo-950 to-[#080511]",
          bio: data.bio || "Nuevo miembro en FicNation.",
          level: levelData.level,
          levelTitle: levelData.levelTitle,
          xp: rawXp,
          nextLevelXp: levelData.nextLevelXp,
          readerLevel: readerData.level,
          readerLevelTitle: readerData.levelTitle,
          readerIcon: readerData.icon,
          authorLevel: authorData.level,
          authorLevelTitle: authorData.levelTitle,
          authorIcon: authorData.icon,
          isVerifiedAuthor: isVerified,
          coins: rawCoins,
          earnedCoins: rawEarned,
          createdAt: data.created_at || new Date().toISOString(),
          stats: {
            stories: realStoriesCount,
            readingLists: realListsCount,
            followers: data.followers_count ?? 0,
            following: data.following_count ?? 0,
          },
          badges: unlockedBadges,
        };

        setUser(freshProfile);
        if (typeof window !== "undefined") {
          localStorage.setItem("ficnation_cached_profile", JSON.stringify(freshProfile));
        }
      } else if (!data && !error) {
        // La cuenta fue confirmadamente eliminada de la base de datos (sin error de red)
        try {
          await supabase.auth.signOut();
        } catch {}
        setUser(null);
        setSession(null);
        setSupabaseUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("ficnation_cached_profile");
        }
      } else if (error) {
        // En caso de error de conexión o red temporal, mantener el perfil cacheado si existe
        console.warn("[FicNation] Aviso al sincronizar perfil (modo offline/red):", error.message);
      }
    } catch {
      // Fallback
    }
  }, []);

  const addXp = useCallback(async (amount: number, reason?: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const newXp = prev.xp + amount;
      const levelData = calculateLevelFromXp(newXp);
      const updated: UserProfile = {
        ...prev,
        xp: newXp,
        level: levelData.level,
        levelTitle: levelData.levelTitle,
        nextLevelXp: levelData.nextLevelXp,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("ficnation_cached_profile", JSON.stringify(updated));
      }

      // Persistir en Supabase en background
      try {
        const supabase = createClient();
        supabase
          .from("profiles")
          .update({
            xp: newXp,
            level: levelData.level,
            level_title: levelData.levelTitle,
            next_level_xp: levelData.nextLevelXp,
            updated_at: new Date().toISOString(),
          })
          .eq("id", prev.id)
          .then();
      } catch {}

      return updated;
    });
  }, []);

  const addCoins = useCallback(async (amount: number, reason?: string) => {
    if (amount <= 0) return;
    setUser((prev) => {
      if (!prev) return null;
      const newCoins = (prev.coins ?? 0) + amount;
      const updated: UserProfile = {
        ...prev,
        coins: newCoins,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("ficnation_cached_profile", JSON.stringify(updated));
      }

      try {
        const supabase = createClient();
        supabase
          .from("profiles")
          .update({
            coins: newCoins,
            updated_at: new Date().toISOString(),
          })
          .eq("id", prev.id)
          .then();
      } catch {}

      return updated;
    });
  }, []);

  const spendCoins = useCallback(async (amount: number, reason?: string): Promise<boolean> => {
    if (amount <= 0) return true;
    let success = false;

    setUser((prev) => {
      if (!prev || (prev.coins ?? 0) < amount) {
        success = false;
        return prev;
      }
      success = true;
      const newCoins = (prev.coins ?? 0) - amount;
      const updated: UserProfile = {
        ...prev,
        coins: newCoins,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("ficnation_cached_profile", JSON.stringify(updated));
      }

      try {
        const supabase = createClient();
        supabase
          .from("profiles")
          .update({
            coins: newCoins,
            updated_at: new Date().toISOString(),
          })
          .eq("id", prev.id)
          .then();
      } catch {}

      return updated;
    });

    return success;
  }, []);

  const claimDailyReward = useCallback(async (): Promise<{ success: boolean; amount: number; message: string }> => {
    if (!user) {
      return { success: false, amount: 0, message: "Debes iniciar sesión para reclamar." };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const lastClaimKey = `ficnation_daily_reward_${user.id}`;
    const lastClaim = typeof window !== "undefined" ? localStorage.getItem(lastClaimKey) : null;

    if (lastClaim === todayStr) {
      return { success: false, amount: 0, message: "Ya reclamaste tu recompensa de hoy. ¡Vuelve mañana para más FicCoins!" };
    }

    const rewardAmount = 25;
    const bonusXp = 50;

    if (typeof window !== "undefined") {
      localStorage.setItem(lastClaimKey, todayStr);
    }

    await addCoins(rewardAmount, "Recompensa diaria");
    await addXp(bonusXp, "Recompensa diaria");

    return {
      success: true,
      amount: rewardAmount,
      message: `¡Reclamaste con éxito +${rewardAmount} FicCoins y +${bonusXp} XP!`,
    };
  }, [user, addCoins, addXp]);

  // ══════════════════════════════════════════════════════════
  // SISTEMA DE MONETIZACIÓN: PROPINAS Y REGALOS AL AUTOR
  // ══════════════════════════════════════════════════════════
  const sendTip = useCallback(
    async (
      recipientId: string,
      amount: number,
      giftName: string,
      giftIcon: string,
      message?: string,
      storyId?: string,
      storyTitle?: string
    ): Promise<{ success: boolean; message: string }> => {
      if (!user) {
        return { success: false, message: "Debes iniciar sesión para enviar regalos." };
      }
      if (user.id === recipientId) {
        return { success: false, message: "No puedes enviarte un regalo a ti mismo." };
      }
      if (amount <= 0 || (user.coins ?? 0) < amount) {
        return { success: false, message: "Saldo insuficiente de FicCoins. Recarga para continuar." };
      }

      // 1. Deducir monedas del donante
      const spent = await spendCoins(amount, `Regalo ${giftName} a ${recipientId}`);
      if (!spent) {
        return { success: false, message: "No se pudieron descontar las FicCoins." };
      }

      // 2. Registrar el Tip localmente
      const tipRecord: TipRecord = {
        id: `tip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        recipientId,
        amount,
        giftName,
        giftIcon,
        message,
        storyId,
        storyTitle,
        createdAt: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        try {
          const existingTips: TipRecord[] = JSON.parse(localStorage.getItem("ficnation_tips") || "[]");
          localStorage.setItem("ficnation_tips", JSON.stringify([tipRecord, ...existingTips]));
        } catch {}
      }

      // 3. Persistir en Supabase
      try {
        const supabase = createClient();
        supabase
          .from("tips")
          .insert({
            sender_id: user.id,
            recipient_id: recipientId,
            story_id: storyId || null,
            amount_coins: amount,
            gift_name: giftName,
            gift_icon: giftIcon,
            message: message || null,
          })
          .then();

        // Nota: La acreditación de earned_coins para el autor receptor se ejecuta automáticamente 
        // mediante el trigger de base de datos 'tr_tip_earned_coins' sobre la tabla 'public.tips'.
      } catch {}

      // 4. Enviar notificación al autor
      try {
        await sendNotification({
          recipientId,
          actor: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          },
          type: "tip",
          storyId,
          storyTitle,
          customMessage: `${user.name} te ha enviado ${giftIcon} ${giftName} (+${amount} FicCoins / $${(amount / 100).toFixed(2)} USD)${storyTitle ? ` por tu historia "${storyTitle}"` : ""}.${message ? ` Mensaje: "${message}"` : ""}`,
        });
      } catch {}

      return { success: true, message: `¡Has enviado ${giftName} con éxito!` };
    },
    [user, spendCoins]
  );

  // ══════════════════════════════════════════════════════════
  // SISTEMA DE MONETIZACIÓN: SOLICITUD DE RETIROS (CASHOUT)
  // ══════════════════════════════════════════════════════════
  const requestCashout = useCallback(
    async (
      amountUsd: number,
      paymentMethod: "paypal" | "bank_transfer" | "crypto",
      accountDetails: { emailOrAccount: string; fullName: string; notes?: string }
    ): Promise<{ success: boolean; message: string }> => {
      if (!user) {
        return { success: false, message: "Debes iniciar sesión para solicitar un retiro." };
      }

      const MIN_CASHOUT_USD = 5.0; // Umbral de $5.00 USD
      if (amountUsd < MIN_CASHOUT_USD) {
        return { success: false, message: `El umbral mínimo de retiro es de $${MIN_CASHOUT_USD.toFixed(2)} USD.` };
      }

      const requiredCoins = Math.round(amountUsd * 100);
      const currentEarned = user.earnedCoins ?? 0;

      if (currentEarned < requiredCoins) {
        return {
          success: false,
          message: `Saldo insuficiente para retirar $${amountUsd.toFixed(2)} USD. Tienes ${currentEarned} FicCoins ganadas ($${(currentEarned / 100).toFixed(2)} USD) y requieres ${requiredCoins} FicCoins.`,
        };
      }

      if (!accountDetails.emailOrAccount?.trim()) {
        return { success: false, message: "Debes ingresar tu correo o cuenta de destino." };
      }
      if (!accountDetails.fullName?.trim()) {
        return { success: false, message: "Debes ingresar el nombre del titular." };
      }

      // 1. Deducir saldo ganado
      const newEarned = currentEarned - requiredCoins;
      setUser((prev) => {
        if (!prev) return null;
        const updated: UserProfile = {
          ...prev,
          earnedCoins: newEarned,
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("ficnation_cached_profile", JSON.stringify(updated));
        }
        return updated;
      });

      // 2. Registrar la solicitud
      const cashoutReq: CashoutRequest = {
        id: `cashout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user.id,
        amountUsd,
        coinsDeducted: requiredCoins,
        paymentMethod,
        accountDetails,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        try {
          const existing: CashoutRequest[] = JSON.parse(localStorage.getItem(`ficnation_cashouts_${user.id}`) || "[]");
          localStorage.setItem(`ficnation_cashouts_${user.id}`, JSON.stringify([cashoutReq, ...existing]));
        } catch {}
      }

      // 3. Persistir en Supabase
      try {
        const supabase = createClient();
        supabase
          .from("cashout_requests")
          .insert({
            user_id: user.id,
            amount_usd: amountUsd,
            coins_deducted: requiredCoins,
            payment_method: paymentMethod,
            payment_details: accountDetails,
            status: "pending",
          })
          .then();

        supabase.from("profiles").update({ earned_coins: newEarned, updated_at: new Date().toISOString() }).eq("id", user.id).then();
      } catch {}

      // 4. Notificar al usuario
      try {
        await sendNotification({
          recipientId: user.id,
          actor: {
            id: "system",
            name: "FicNation Finanzas",
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
          },
          type: "cashout",
          customMessage: `Tu solicitud de retiro por $${amountUsd.toFixed(2)} USD vía ${paymentMethod === "paypal" ? "PayPal" : paymentMethod === "bank_transfer" ? "Transferencia Bancaria" : "Cripto"} ha sido registrada. Procesamiento estimado: 1 a 3 días hábiles.`,
        });
      } catch {}

      return {
        success: true,
        message: `¡Solicitud de retiro de $${amountUsd.toFixed(2)} USD enviada con éxito!`,
      };
    },
    [user]
  );

  const getCashoutHistory = useCallback((): CashoutRequest[] => {
    if (!user || typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(`ficnation_cashouts_${user.id}`) || "[]");
    } catch {
      return [];
    }
  }, [user]);

  const getReceivedTips = useCallback((): TipRecord[] => {
    if (!user || typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem(`ficnation_received_tips_${user.id}`);
      const remoteList: TipRecord[] = cached ? JSON.parse(cached) : [];
      const allTips: TipRecord[] = JSON.parse(localStorage.getItem("ficnation_tips") || "[]");
      const donorTips = allTips.filter((t) => t.recipientId === user.id);

      const map = new Map<string, TipRecord>();
      [...donorTips, ...remoteList].forEach((t) => map.set(t.id, t));

      // Sincronizar en segundo plano desde Supabase para el autor receptor
      (async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("tips")
            .select("id, sender_id, recipient_id, amount, gift_name, gift_icon, dedication_message, story_id, story_title, created_at, profiles!sender_id(name, avatar_url)")
            .eq("recipient_id", user.id)
            .order("created_at", { ascending: false });

          if (data && data.length > 0) {
            const synced: TipRecord[] = data.map((t: any) => ({
              id: t.id,
              senderId: t.sender_id,
              senderName: t.profiles?.name || "Lector Anónimo",
              senderAvatar: t.profiles?.avatar_url || "/default-avatar.svg",
              recipientId: t.recipient_id,
              amount: t.amount,
              usdEquivalent: t.amount / 100,
              giftName: t.gift_name,
              giftIcon: t.gift_icon,
              message: t.dedication_message,
              storyId: t.story_id,
              storyTitle: t.story_title,
              createdAt: t.created_at,
            }));
            localStorage.setItem(`ficnation_received_tips_${user.id}`, JSON.stringify(synced));
          }
        } catch {}
      })();

      return Array.from(map.values());
    } catch {
      return [];
    }
  }, [user]);

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated: UserProfile = { ...prev, ...data };
      if (typeof window !== "undefined") {
        localStorage.setItem("ficnation_cached_profile", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (supabaseUser) {
      await fetchProfile(supabaseUser.id, supabaseUser);
    }
  }, [supabaseUser, fetchProfile]);

  useEffect(() => {
    const supabase = createClient();

    // 1. Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setSupabaseUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id, initialSession.user);
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("ficnation_cached_profile");
        }
      }
      setIsLoaded(true);
    });

    // 2. Escuchar cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setSupabaseUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id, currentSession.user);
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("ficnation_cached_profile");
        }
      }
      setIsLoaded(true);
    });

    // 3. Escuchar cambios de seguimiento en tiempo real para mantener estadísticas sincronizadas
    const handleFollowEvent = (e: any) => {
      const { followerId, followingId, isFollowing } = e.detail || {};
      setUser((prev) => {
        if (!prev) return null;
        let nextFollowers = prev.stats.followers;
        let nextFollowing = prev.stats.following;

        if (prev.id === followerId) {
          nextFollowing = Math.max(0, isFollowing ? nextFollowing + 1 : nextFollowing - 1);
        }
        if (prev.id === followingId) {
          nextFollowers = Math.max(0, isFollowing ? nextFollowers + 1 : nextFollowers - 1);
        }

        const updated: UserProfile = {
          ...prev,
          stats: {
            ...prev.stats,
            followers: nextFollowers,
            following: nextFollowing,
          },
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("ficnation_cached_profile", JSON.stringify(updated));
        }
        return updated;
      });
    };

    window.addEventListener("ficnation_follow_changed", handleFollowEvent);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("ficnation_follow_changed", handleFollowEvent);
    };
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("ficnation_cached_profile");
      }
    } catch {
      // Ignora errores en logout
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      supabaseUser,
      session,
      isAuthenticated: !!supabaseUser,
      isLoaded,
      logout,
      refreshProfile,
      updateProfile,
      addXp,
      addCoins,
      spendCoins,
      claimDailyReward,
      sendTip,
      requestCashout,
      getCashoutHistory,
      getReceivedTips,
    }),
    [
      user,
      supabaseUser,
      session,
      isLoaded,
      logout,
      refreshProfile,
      updateProfile,
      addXp,
      addCoins,
      spendCoins,
      claimDailyReward,
      sendTip,
      requestCashout,
      getCashoutHistory,
      getReceivedTips,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
