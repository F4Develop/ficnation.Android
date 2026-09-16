"use client";

import { createClient } from "@/lib/supabase/client";

// ==============================================================================
// 1. VERIFICACIÓN DE IDENTIDAD DE ADMINISTRADOR / CREADOR
// ==============================================================================

export const ADMIN_USERNAMES = ["f4", "f4studios", "creator_f4"];
export const ADMIN_EMAILS = ["f4studios.official@gmail.com"];
export const MASTER_ADMIN_KEY = "f4_master_admin_2026";

/**
 * Comprueba de forma estricta si el usuario actual es Administrador o Creador.
 */
export function checkIsAdmin(user: any): boolean {
  if (!user) {
    if (typeof window !== "undefined") {
      const emergencyKey = localStorage.getItem("ficnation_admin_key");
      return emergencyKey === MASTER_ADMIN_KEY;
    }
    return false;
  }

  const username = (user.username || "").toLowerCase().trim();
  const email = (user.email || "").toLowerCase().trim();
  const name = (user.name || "").toLowerCase().trim();

  // 1. Verificación por username o name oficial exacto
  if (ADMIN_USERNAMES.includes(username) || name === "f4" || name === "f4studios") {
    return true;
  }

  // 2. Verificación por correo oficial exacto
  if (ADMIN_EMAILS.includes(email)) {
    return true;
  }

  // 3. Verificación por rol explícito
  if (user.role === "admin" || user.is_admin === true || user.role === "creator") {
    return true;
  }

  // 4. Llave maestra de sesión (para modo local o desarrollo del creador)
  if (typeof window !== "undefined") {
    const localKey = localStorage.getItem("ficnation_admin_key");
    if (localKey === MASTER_ADMIN_KEY) return true;
  }

  return false;
}

/**
 * Permite al creador activar la llave maestra de administración si inicia sesión desde otro dispositivo.
 */
export function activateMasterAdminKey(key: string): boolean {
  if (key.trim() === MASTER_ADMIN_KEY) {
    if (typeof window !== "undefined") {
      localStorage.setItem("ficnation_admin_key", MASTER_ADMIN_KEY);
      window.dispatchEvent(new Event("ficnation_admin_state_changed"));
    }
    return true;
  }
  return false;
}

export function deactivateMasterAdminKey(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("ficnation_admin_key");
    window.dispatchEvent(new Event("ficnation_admin_state_changed"));
  }
}

// ==============================================================================
// 2. GESTIÓN DE PERFILES VERIFICADOS (Badge Azul / Creador)
// ==============================================================================

const VERIFIED_STORAGE_KEY = "ficnation_verified_users";

export function getVerifiedUserIdentifiers(): string[] {
  if (typeof window === "undefined") return ["f4", "f4studios"];
  try {
    const raw = localStorage.getItem(VERIFIED_STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    // F4 siempre está en la lista de verificados de forma inmutable
    if (!list.includes("f4")) list.push("f4");
    if (!list.includes("f4studios")) list.push("f4studios");
    return list;
  } catch {
    return ["f4", "f4studios"];
  }
}

export function isUserVerified(identifier?: string): boolean {
  if (!identifier) return false;
  const clean = identifier.toLowerCase().trim();
  if (clean === "f4" || clean === "f4studios") return true;
  const list = getVerifiedUserIdentifiers();
  return list.includes(clean);
}

export function toggleUserVerification(identifier: string): boolean {
  if (!identifier) return false;
  const clean = identifier.toLowerCase().trim();
  // El creador nunca puede ser desverificado
  if (clean === "f4" || clean === "f4studios") return true;

  const currentList = getVerifiedUserIdentifiers();
  let updated: string[];
  let isNowVerified = false;

  if (currentList.includes(clean)) {
    updated = currentList.filter((id) => id !== clean);
    isNowVerified = false;
  } else {
    updated = [...currentList, clean];
    isNowVerified = true;
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(VERIFIED_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("ficnation_verification_changed", { detail: { identifier: clean, isVerified: isNowVerified } }));

    // Sincronizar en Supabase
    try {
      const supabase = createClient();
      supabase.from("profiles").update({ is_verified: isNowVerified }).or(`username.eq.${clean},id.eq.${clean}`).then();
    } catch {}
  }

  return isNowVerified;
}

// ==============================================================================
// 3. GESTIÓN DE BANEO Y SUSPENSIONES
// ==============================================================================

export interface BannedUserRecord {
  idOrUsername: string;
  name?: string;
  reason: string;
  bannedAt: string;
  bannedBy: string;
}

const BANNED_STORAGE_KEY = "ficnation_banned_users";

export function getBannedUsers(): BannedUserRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BANNED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isUserBanned(idOrUsername?: string): { isBanned: boolean; record?: BannedUserRecord } {
  if (!idOrUsername) return { isBanned: false };
  const clean = idOrUsername.toLowerCase().trim();
  // El admin nunca puede ser baneado
  if (clean === "f4" || clean === "f4studios") return { isBanned: false };

  const bannedList = getBannedUsers();
  const match = bannedList.find((b) => b.idOrUsername.toLowerCase() === clean);
  return { isBanned: Boolean(match), record: match };
}

export function banUser(params: {
  idOrUsername: string;
  name?: string;
  reason?: string;
  adminName?: string;
}): boolean {
  const { idOrUsername, name, reason = "Infracción de normas comunitarias", adminName = "F4 Admin" } = params;
  if (!idOrUsername) return false;
  const clean = idOrUsername.toLowerCase().trim();
  if (clean === "f4" || clean === "f4studios") return false;

  const currentBanned = getBannedUsers();
  if (currentBanned.some((b) => b.idOrUsername.toLowerCase() === clean)) return true;

  const newRecord: BannedUserRecord = {
    idOrUsername: clean,
    name: name || clean,
    reason,
    bannedAt: new Date().toISOString(),
    bannedBy: adminName,
  };

  const updated = [newRecord, ...currentBanned];
  if (typeof window !== "undefined") {
    localStorage.setItem(BANNED_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("ficnation_user_banned", { detail: newRecord }));

    // Sincronizar en Supabase
    try {
      const supabase = createClient();
      supabase.from("banned_users").insert({
        username: clean,
        reason,
        banned_by: adminName,
      }).then();
    } catch {}
  }

  return true;
}

export function unbanUser(idOrUsername: string): boolean {
  if (!idOrUsername) return false;
  const clean = idOrUsername.toLowerCase().trim();
  const currentBanned = getBannedUsers();
  const updated = currentBanned.filter((b) => b.idOrUsername.toLowerCase() !== clean);

  if (typeof window !== "undefined") {
    localStorage.setItem(BANNED_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("ficnation_user_unbanned", { detail: { idOrUsername: clean } }));

    // Sincronizar en Supabase
    try {
      const supabase = createClient();
      supabase.from("banned_users").delete().or(`username.eq.${clean},user_id.eq.${clean}`).then();
    } catch {}
  }

  return true;
}

// ==============================================================================
// 4. BANNER DE EMERGENCIA / ANUNCIOS DEL SISTEMA
// ==============================================================================

export interface EmergencyBannerData {
  isActive: boolean;
  message: string;
  type: "info" | "warning" | "event" | "maintenance";
  actionText?: string;
  actionUrl?: string;
  updatedAt?: string;
}

const BANNER_STORAGE_KEY = "ficnation_emergency_banner";

export function getEmergencyBanner(): EmergencyBannerData {
  if (typeof window === "undefined") {
    return { isActive: false, message: "", type: "info" };
  }
  try {
    const raw = localStorage.getItem(BANNER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { isActive: false, message: "", type: "info" };
  } catch {
    return { isActive: false, message: "", type: "info" };
  }
}

export function setEmergencyBanner(data: EmergencyBannerData): void {
  if (typeof window !== "undefined") {
    const payload = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("ficnation_banner_updated", { detail: payload }));
  }
}
