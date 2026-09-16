import { InventoryItem, ItemType, CATALOG_ITEMS } from "@/types/inventory";
import { createClient } from "@/lib/supabase/client";

const INVENTORY_STORAGE_KEY_PREFIX = "ficnation_user_inventory_";
const EQUIPPED_COSMETICS_KEY_PREFIX = "ficnation_equipped_cosmetics_";

export interface EquippedCosmetics {
  frameId: string | null;
  auraId: string | null;
  titleId: string | null;
  badgeId: string | null;
  bookmarkId: string | null;
  bubbleId: string | null;
  bannerFrameId: string | null;
  petId: string | null;
}

export const DEFAULT_EQUIPPED_COSMETICS: EquippedCosmetics = {
  frameId: null,
  auraId: null,
  titleId: null,
  badgeId: null,
  bookmarkId: null,
  bubbleId: null,
  bannerFrameId: null,
  petId: null,
};

// Sin objetos de prueba por defecto; el inventario inicia limpio
export const STARTER_INVENTORY_ITEMS: InventoryItem[] = [];

// Lista de IDs de objetos de prueba que fueron inyectados previamente y deben ser eliminados
export const TEST_SEED_ITEM_IDS = new Set([
  "chest_wooden",
  "egg_paper_slime",
  "bookmark_crimson_silk",
  "bubble_parchment",
  "title_star",
  "potion_xp_small",
  "event_spin_ticket",
]);

export function getUserInventory(userId: string): InventoryItem[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(`${INVENTORY_STORAGE_KEY_PREFIX}${userId}`);
    const cleanupKey = `ficnation_cleaned_test_items_v2_${userId}`;

    // Si aún no se ha purgado los objetos de prueba antiguos para este usuario
    if (!localStorage.getItem(cleanupKey)) {
      localStorage.setItem(cleanupKey, "true");
      if (raw) {
        try {
          const parsed: InventoryItem[] = JSON.parse(raw);
          const filtered = parsed.filter((item) => !TEST_SEED_ITEM_IDS.has(item.id));
          localStorage.setItem(`${INVENTORY_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(filtered));

          // Desequipar cualquier cosmético de prueba que estuviese equipado
          const eq = getUserEquippedCosmetics(userId);
          let eqChanged = false;
          if (eq.titleId && TEST_SEED_ITEM_IDS.has(eq.titleId)) { eq.titleId = null; eqChanged = true; }
          if (eq.bookmarkId && TEST_SEED_ITEM_IDS.has(eq.bookmarkId)) { eq.bookmarkId = null; eqChanged = true; }
          if (eq.bubbleId && TEST_SEED_ITEM_IDS.has(eq.bubbleId)) { eq.bubbleId = null; eqChanged = true; }
          if (eq.frameId && TEST_SEED_ITEM_IDS.has(eq.frameId)) { eq.frameId = null; eqChanged = true; }
          if (eq.auraId && TEST_SEED_ITEM_IDS.has(eq.auraId)) { eq.auraId = null; eqChanged = true; }
          if (eq.badgeId && TEST_SEED_ITEM_IDS.has(eq.badgeId)) { eq.badgeId = null; eqChanged = true; }
          if (eq.bannerFrameId && TEST_SEED_ITEM_IDS.has(eq.bannerFrameId)) { eq.bannerFrameId = null; eqChanged = true; }
          if (eq.petId && TEST_SEED_ITEM_IDS.has(eq.petId)) { eq.petId = null; eqChanged = true; }

          if (eqChanged) {
            saveUserEquippedCosmetics(userId, eq);
          }
          return filtered;
        } catch {
          localStorage.setItem(`${INVENTORY_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify([]));
          return [];
        }
      }
      return [];
    }

    if (!raw) {
      localStorage.setItem(`${INVENTORY_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error cargando inventario:", err);
    return [];
  }
}

export function getUserEquippedCosmetics(userId: string): EquippedCosmetics {
  if (typeof window === "undefined" || !userId) {
    return { ...DEFAULT_EQUIPPED_COSMETICS };
  }
  try {
    const raw = localStorage.getItem(`${EQUIPPED_COSMETICS_KEY_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_EQUIPPED_COSMETICS, ...parsed };
    }

    // Si no está en caché local, consultar Supabase de forma no bloqueante
    fetchUserEquippedCosmetics(userId).then((cosmetics) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(`${EQUIPPED_COSMETICS_KEY_PREFIX}${userId}`, JSON.stringify(cosmetics));
        window.dispatchEvent(new CustomEvent("ficnation_cosmetics_updated", { detail: { userId, cosmetics } }));
      }
    }).catch(() => {});

    return { ...DEFAULT_EQUIPPED_COSMETICS };
  } catch (err) {
    return { ...DEFAULT_EQUIPPED_COSMETICS };
  }
}

export async function fetchUserEquippedCosmetics(userId: string): Promise<EquippedCosmetics> {
  if (!userId) return { ...DEFAULT_EQUIPPED_COSMETICS };
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_inventory")
      .select("item_id, type")
      .eq("user_id", userId)
      .eq("is_equipped", true);

    if (error || !data || data.length === 0) {
      return { ...DEFAULT_EQUIPPED_COSMETICS };
    }

    const cosmetics: EquippedCosmetics = { ...DEFAULT_EQUIPPED_COSMETICS };
    data.forEach((row: any) => {
      if (row.type === "frame") cosmetics.frameId = row.item_id;
      if (row.type === "aura") cosmetics.auraId = row.item_id;
      if (row.type === "title") cosmetics.titleId = row.item_id;
      if (row.type === "badge") cosmetics.badgeId = row.item_id;
      if (row.type === "bookmark") cosmetics.bookmarkId = row.item_id;
      if (row.type === "bubble") cosmetics.bubbleId = row.item_id;
      if (row.type === "banner_frame") cosmetics.bannerFrameId = row.item_id;
      if (row.type === "pet") cosmetics.petId = row.item_id;
    });

    if (typeof window !== "undefined") {
      localStorage.setItem(`${EQUIPPED_COSMETICS_KEY_PREFIX}${userId}`, JSON.stringify(cosmetics));
    }

    return cosmetics;
  } catch {
    return { ...DEFAULT_EQUIPPED_COSMETICS };
  }
}

export function saveUserEquippedCosmetics(userId: string, cosmetics: EquippedCosmetics): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(`${EQUIPPED_COSMETICS_KEY_PREFIX}${userId}`, JSON.stringify(cosmetics));
    window.dispatchEvent(new CustomEvent("ficnation_cosmetics_updated", { detail: { userId, cosmetics } }));

    // Sincronizar en Supabase
    const supabase = createClient();
    const equippedEntries: { item_id: string; type: string }[] = [];
    if (cosmetics.frameId) equippedEntries.push({ item_id: cosmetics.frameId, type: "frame" });
    if (cosmetics.auraId) equippedEntries.push({ item_id: cosmetics.auraId, type: "aura" });
    if (cosmetics.titleId) equippedEntries.push({ item_id: cosmetics.titleId, type: "title" });
    if (cosmetics.badgeId) equippedEntries.push({ item_id: cosmetics.badgeId, type: "badge" });
    if (cosmetics.bookmarkId) equippedEntries.push({ item_id: cosmetics.bookmarkId, type: "bookmark" });
    if (cosmetics.bubbleId) equippedEntries.push({ item_id: cosmetics.bubbleId, type: "bubble" });
    if (cosmetics.bannerFrameId) equippedEntries.push({ item_id: cosmetics.bannerFrameId, type: "banner_frame" });
    if (cosmetics.petId) equippedEntries.push({ item_id: cosmetics.petId, type: "pet" });

    // Desequipar anteriores y equipar los nuevos en segundo plano
    (async () => {
      try {
        await supabase.from("user_inventory").update({ is_equipped: false }).eq("user_id", userId);
        for (const entry of equippedEntries) {
          await supabase.from("user_inventory").update({ is_equipped: true }).eq("user_id", userId).eq("item_id", entry.item_id);
        }
      } catch {}
    })();
  } catch (err) {
    console.error("Error guardando cosméticos equipados:", err);
  }
}

export function addItemToUserInventory(
  userId: string,
  catalogItemId: string,
  quantityToAdd: number = 1
): { inventory: InventoryItem[]; addedItem: InventoryItem } {
  const current = getUserInventory(userId);
  const catalogItem = CATALOG_ITEMS.find((i) => i.id === catalogItemId);

  if (!catalogItem) {
    throw new Error(`Item ${catalogItemId} no existe en el catálogo.`);
  }

  const existingIndex = current.findIndex((i) => i.id === catalogItemId);
  let updatedItem: InventoryItem;

  if (existingIndex >= 0 && (catalogItem.type === "consumable" || catalogItem.type === "chest")) {
    const existing = current[existingIndex];
    const newQty = (existing.quantity || 1) + quantityToAdd;
    current[existingIndex] = {
      ...existing,
      quantity: newQty,
    };
    updatedItem = current[existingIndex];
  } else if (existingIndex >= 0 && catalogItem.type !== "consumable" && catalogItem.type !== "chest") {
    updatedItem = current[existingIndex];
  } else {
    updatedItem = {
      ...catalogItem,
      quantity: quantityToAdd,
      equipped: false,
      acquiredAt: new Date().toISOString(),
    };
    current.push(updatedItem);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${INVENTORY_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(current));
    window.dispatchEvent(new Event("ficnation_inventory_updated"));
  }

  return { inventory: current, addedItem: updatedItem };
}

export function equipUserItem(userId: string, itemId: string): {
  inventory: InventoryItem[];
  equipped: EquippedCosmetics;
} {
  const current = getUserInventory(userId);
  const itemToEquip = current.find((i) => i.id === itemId);

  if (!itemToEquip) {
    return { inventory: current, equipped: getUserEquippedCosmetics(userId) };
  }

  const updated = current.map((item) => {
    if (item.type === itemToEquip.type) {
      return { ...item, equipped: item.id === itemId };
    }
    return item;
  });

  const cosmetics = getUserEquippedCosmetics(userId);
  if (itemToEquip.type === "frame") cosmetics.frameId = itemToEquip.id;
  if (itemToEquip.type === "aura") cosmetics.auraId = itemToEquip.id;
  if (itemToEquip.type === "title") cosmetics.titleId = itemToEquip.id;
  if (itemToEquip.type === "badge") cosmetics.badgeId = itemToEquip.id;
  if (itemToEquip.type === "bookmark") cosmetics.bookmarkId = itemToEquip.id;
  if (itemToEquip.type === "bubble") cosmetics.bubbleId = itemToEquip.id;
  if (itemToEquip.type === "banner_frame") cosmetics.bannerFrameId = itemToEquip.id;
  if (itemToEquip.type === "pet") cosmetics.petId = itemToEquip.id;

  if (typeof window !== "undefined") {
    localStorage.setItem(`${INVENTORY_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
    saveUserEquippedCosmetics(userId, cosmetics);
    window.dispatchEvent(new Event("ficnation_inventory_updated"));
  }

  return { inventory: updated, equipped: cosmetics };
}

export function unequipUserItem(userId: string, itemType: ItemType): {
  inventory: InventoryItem[];
  equipped: EquippedCosmetics;
} {
  const current = getUserInventory(userId);
  const updated = current.map((item) => {
    if (item.type === itemType) {
      return { ...item, equipped: false };
    }
    return item;
  });

  const cosmetics = getUserEquippedCosmetics(userId);
  if (itemType === "frame") cosmetics.frameId = null;
  if (itemType === "aura") cosmetics.auraId = null;
  if (itemType === "title") cosmetics.titleId = null;
  if (itemType === "badge") cosmetics.badgeId = null;
  if (itemType === "bookmark") cosmetics.bookmarkId = null;
  if (itemType === "bubble") cosmetics.bubbleId = null;
  if (itemType === "banner_frame") cosmetics.bannerFrameId = null;
  if (itemType === "pet") cosmetics.petId = null;

  if (typeof window !== "undefined") {
    localStorage.setItem(`${INVENTORY_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
    saveUserEquippedCosmetics(userId, cosmetics);
    window.dispatchEvent(new Event("ficnation_inventory_updated"));
  }

  return { inventory: updated, equipped: cosmetics };
}

export function unequipAllCosmetics(userId: string): {
  inventory: InventoryItem[];
  equipped: EquippedCosmetics;
} {
  const current = getUserInventory(userId);
  const updated = current.map((item) => ({ ...item, equipped: false }));
  const resetCosmetics: EquippedCosmetics = { ...DEFAULT_EQUIPPED_COSMETICS };

  if (typeof window !== "undefined") {
    localStorage.setItem(`${INVENTORY_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
    saveUserEquippedCosmetics(userId, resetCosmetics);
    window.dispatchEvent(new Event("ficnation_inventory_updated"));
    window.dispatchEvent(new CustomEvent("ficnation_cosmetics_updated", { detail: { userId, cosmetics: resetCosmetics } }));
  }

  return { inventory: updated, equipped: resetCosmetics };
}

export function clearAllTestItems(userId: string): {
  inventory: InventoryItem[];
  equipped: EquippedCosmetics;
} {
  const current = getUserInventory(userId);
  const filtered = current.filter((item) => !TEST_SEED_ITEM_IDS.has(item.id));
  const cosmetics = getUserEquippedCosmetics(userId);

  let eqChanged = false;
  if (cosmetics.titleId && TEST_SEED_ITEM_IDS.has(cosmetics.titleId)) { cosmetics.titleId = null; eqChanged = true; }
  if (cosmetics.bookmarkId && TEST_SEED_ITEM_IDS.has(cosmetics.bookmarkId)) { cosmetics.bookmarkId = null; eqChanged = true; }
  if (cosmetics.bubbleId && TEST_SEED_ITEM_IDS.has(cosmetics.bubbleId)) { cosmetics.bubbleId = null; eqChanged = true; }
  if (cosmetics.frameId && TEST_SEED_ITEM_IDS.has(cosmetics.frameId)) { cosmetics.frameId = null; eqChanged = true; }
  if (cosmetics.auraId && TEST_SEED_ITEM_IDS.has(cosmetics.auraId)) { cosmetics.auraId = null; eqChanged = true; }
  if (cosmetics.badgeId && TEST_SEED_ITEM_IDS.has(cosmetics.badgeId)) { cosmetics.badgeId = null; eqChanged = true; }
  if (cosmetics.bannerFrameId && TEST_SEED_ITEM_IDS.has(cosmetics.bannerFrameId)) { cosmetics.bannerFrameId = null; eqChanged = true; }
  if (cosmetics.petId && TEST_SEED_ITEM_IDS.has(cosmetics.petId)) { cosmetics.petId = null; eqChanged = true; }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${INVENTORY_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(filtered));
    if (eqChanged) {
      saveUserEquippedCosmetics(userId, cosmetics);
    }
    window.dispatchEvent(new Event("ficnation_inventory_updated"));
    window.dispatchEvent(new CustomEvent("ficnation_cosmetics_updated", { detail: { userId, cosmetics } }));
  }

  return { inventory: filtered, equipped: cosmetics };
}

export function consumeUserItem(userId: string, itemId: string): {
  success: boolean;
  item?: InventoryItem;
  remainingQuantity: number;
} {
  const current = getUserInventory(userId);
  const index = current.findIndex((i) => i.id === itemId && (i.type === "consumable" || i.type === "chest"));

  if (index === -1) {
    return { success: false, remainingQuantity: 0 };
  }

  const target = current[index];
  const currentQty = target.quantity || 1;

  if (currentQty <= 1) {
    current.splice(index, 1);
  } else {
    current[index] = { ...target, quantity: currentQty - 1 };
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${INVENTORY_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(current));
    window.dispatchEvent(new Event("ficnation_inventory_updated"));
  }

  return {
    success: true,
    item: target,
    remainingQuantity: Math.max(0, currentQty - 1),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// APERTURA DE COFRES (CHEST OPENING)
// ════════════════════════════════════════════════════════════════════════════
export function openChest(userId: string, chestItemId: string): {
  success: boolean;
  loot: InventoryItem[];
  message: string;
} {
  const current = getUserInventory(userId);
  const chestIndex = current.findIndex((i) => i.id === chestItemId && i.type === "chest");

  if (chestIndex === -1) {
    return { success: false, loot: [], message: "No posees este cofre en tu inventario." };
  }

  const chest = current[chestIndex];

  // Descontar el cofre del inventario
  consumeUserItem(userId, chestItemId);

  // Elegir 1 o 2 objetos del lootPool
  const lootPool = chest.lootPool && chest.lootPool.length > 0 ? chest.lootPool : ["potion_xp_small", "coins_pouch"];
  const countToPick = chest.rarity === "mitico" || chest.rarity === "legendario" ? 2 : 1;
  const pickedLoot: InventoryItem[] = [];

  for (let i = 0; i < countToPick; i++) {
    const randomCatalogId = lootPool[Math.floor(Math.random() * lootPool.length)];
    try {
      const res = addItemToUserInventory(userId, randomCatalogId, 1);
      pickedLoot.push(res.addedItem);
    } catch (err) {
      console.error("Error agregando botín de cofre:", err);
    }
  }

  return {
    success: true,
    loot: pickedLoot,
    message: `¡Has abierto "${chest.name}" y descubierto ${pickedLoot.length} recompensa(s)!`,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// PROGRESO Y ECLOSIÓN DE HUEVOS DE LECTURA (READING PET EGGS)
// ════════════════════════════════════════════════════════════════════════════
export function progressPetEggReading(
  userId: string,
  chaptersIncrement: number = 1
): {
  hatched: boolean;
  hatchedPet?: InventoryItem;
  updatedEggs: { name: string; current: number; needed: number }[];
} {
  const current = getUserInventory(userId);
  let hatched = false;
  let hatchedPet: InventoryItem | undefined;
  const updatedEggs: { name: string; current: number; needed: number }[] = [];

  const modified = current.map((item) => {
    if (item.type === "pet_egg" && item.eggData) {
      const newRead = item.eggData.chaptersRead + chaptersIncrement;
      updatedEggs.push({
        name: item.name,
        current: newRead,
        needed: item.eggData.chaptersNeeded,
      });

      if (newRead >= item.eggData.chaptersNeeded && !hatched) {
        // Eclosiona el huevo!
        hatched = true;
        const petCatalogItem = CATALOG_ITEMS.find((c) => c.id === item.eggData?.petCatalogId);
        if (petCatalogItem) {
          hatchedPet = {
            ...petCatalogItem,
            equipped: false,
            acquiredAt: new Date().toISOString(),
          };
        }
        return null; // Remover huevo
      }

      return {
        ...item,
        eggData: {
          ...item.eggData,
          chaptersRead: newRead,
        },
      };
    }
    return item;
  });

  const finalInventory = modified.filter((item): item is InventoryItem => item !== null);

  if (hatchedPet) {
    finalInventory.push(hatchedPet);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${INVENTORY_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(finalInventory));
    window.dispatchEvent(new Event("ficnation_inventory_updated"));
  }

  return {
    hatched,
    hatchedPet,
    updatedEggs,
  };
}
