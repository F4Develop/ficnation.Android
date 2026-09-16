"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { UserPresence } from "@/types/presence";

interface PresenceContextType {
  onlineUsers: UserPresence[];
  communityUsers: UserPresence[];
  onlineCount: number;
  isUserOnline: (userId: string) => boolean;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  markMessagesAsRead: () => void;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: [],
  communityUsers: [],
  onlineCount: 0,
  isUserOnline: () => false,
  unreadCount: 0,
  setUnreadCount: () => {},
  markMessagesAsRead: () => {},
});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [realtimeUsers, setRealtimeUsers] = useState<UserPresence[]>([]);
  const [registeredProfiles, setRegisteredProfiles] = useState<UserPresence[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 1. Cargar autores reales registrados en la base de datos de Supabase
  useEffect(() => {
    async function loadCommunity() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, username, avatar_url, level, level_title")
          .order("created_at", { ascending: false })
          .limit(50);

        if (data && !error && data.length > 0) {
          const profiles: UserPresence[] = data.map((p) => ({
            userId: p.id,
            name: p.name || "Autor de FicNation",
            username: p.username || "autor",
            avatar:
              p.avatar_url ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
            level: p.level ?? 1,
            levelTitle: p.level_title || "Iniciado",
            status: "offline",
            lastSeen: "Visto recientemente",
          }));
          setRegisteredProfiles(profiles);
        }
      } catch {
        // Fallback silencioso
      }
    }

    loadCommunity();
  }, []);

  // 2. Conexión al canal WebSockets Realtime de Supabase
  useEffect(() => {
    const supabase = createClient();
    const presenceChannel = supabase.channel("ficnation:presence", {
      config: {
        presence: {
          key: user?.id || `guest_${Math.random().toString(36).substring(7)}`,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const activeList: UserPresence[] = [];

        Object.keys(state).forEach((key) => {
          const userArr = state[key] as any[];
          if (userArr && userArr.length > 0) {
            const data = userArr[0];
            if (data.userId) {
              activeList.push({
                userId: data.userId,
                name: data.name || "Usuario de FicNation",
                username: data.username || "usuario",
                avatar:
                  data.avatar ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
                level: data.level || 1,
                levelTitle: data.levelTitle || "Iniciado",
                status: "online",
                lastSeen: "Ahora mismo",
              });
            }
          }
        });

        setRealtimeUsers(activeList);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && isAuthenticated && user) {
          await presenceChannel.track({
            userId: user.id,
            name: user.name || "Autor de FicNation",
            username: user.username || "autor",
            avatar:
              user.avatar ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
            level: user.level || 1,
            levelTitle: user.levelTitle || "Iniciado",
            status: "online",
            joinedAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [user, isAuthenticated]);

  // Lista de usuarios actualmente online (excluyendo al usuario propio)
  const onlineUsers = useMemo(() => {
    const map = new Map<string, UserPresence>();

    realtimeUsers.forEach((u) => {
      if (!user || u.userId !== user.id) {
        map.set(u.userId, { ...u, status: "online" });
      }
    });

    return Array.from(map.values());
  }, [realtimeUsers, user]);

  // Directorio total de comunidad (usuarios registrados reales con su estado en vivo)
  const communityUsers = useMemo(() => {
    const map = new Map<string, UserPresence>();

    // Primero agregamos todos los perfiles registrados
    registeredProfiles.forEach((p) => {
      if (!user || p.userId !== user.id) {
        map.set(p.userId, p);
      }
    });

    // Si alguno está conectado ahora mismo, actualizamos su estado a 'online'
    realtimeUsers.forEach((u) => {
      if (!user || u.userId !== user.id) {
        map.set(u.userId, { ...u, status: "online" });
      }
    });

    return Array.from(map.values());
  }, [registeredProfiles, realtimeUsers, user]);

  const onlineCount = onlineUsers.length + (isAuthenticated ? 1 : 0);

  const isUserOnline = (userId: string) => {
    if (!userId) return false;
    if (user && user.id === userId) return true;
    return realtimeUsers.some((u) => u.userId === userId);
  };

  const markMessagesAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <PresenceContext.Provider
      value={{
        onlineUsers,
        communityUsers,
        onlineCount,
        isUserOnline,
        unreadCount,
        setUnreadCount,
        markMessagesAsRead,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
