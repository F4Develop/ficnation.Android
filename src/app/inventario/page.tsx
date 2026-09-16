"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Backpack,
  Sparkles,
  Check,
  Flame,
  Trophy,
  X,
  Shield,
  Bookmark,
  MessageCircle,
  Egg,
  Box,
  LayoutTemplate,
  Award,
  Search,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getUserInventory,
  getUserEquippedCosmetics,
  equipUserItem,
  unequipUserItem,
  unequipAllCosmetics,
  consumeUserItem,
  openChest,
  EquippedCosmetics,
  DEFAULT_EQUIPPED_COSMETICS,
} from "@/lib/inventoryStorage";
import { InventoryItem, ItemType, ItemRarity, CATALOG_ITEMS } from "@/types/inventory";
import { UserAvatarWithFrame } from "@/components/ui/UserAvatarWithFrame";
import { ChestOpeningModal } from "@/components/inventory/ChestOpeningModal";

// Definición de las 8 casillas de equipamiento RPG
interface EquipmentSlotDef {
  key: keyof EquippedCosmetics;
  type: ItemType;
  label: string;
  shortLabel: string;
  icon: string;
  desc: string;
}

const EQUIPMENT_SLOTS: EquipmentSlotDef[] = [
  {
    key: "frameId",
    type: "frame",
    label: "Marco de Avatar",
    shortLabel: "Marco",
    icon: "🖼️",
    desc: "Borde iluminado alrededor de tu foto de perfil",
  },
  {
    key: "auraId",
    type: "aura",
    label: "Aura & Partículas",
    shortLabel: "Aura",
    icon: "✨",
    desc: "Efecto de halo mágico y partículas animadas",
  },
  {
    key: "titleId",
    type: "title",
    label: "Título Honorífico",
    shortLabel: "Título",
    icon: "👑",
    desc: "Distinción que acompaña tu nombre en toda la plataforma",
  },
  {
    key: "petId",
    type: "pet",
    label: "Mascota de Lectura",
    shortLabel: "Mascota",
    icon: "🐾",
    desc: "Compañero animado que flota contigo al leer capítulos",
  },
  {
    key: "bookmarkId",
    type: "bookmark",
    label: "Marcador de Lectura",
    shortLabel: "Marcador",
    icon: "🔖",
    desc: "Cinta decorativa en tu barra de avance de lectura",
  },
  {
    key: "bubbleId",
    type: "bubble",
    label: "Burbuja de Comentarios",
    shortLabel: "Burbuja",
    icon: "💬",
    desc: "Estilo y color exclusivo para tus comentarios",
  },
  {
    key: "bannerFrameId",
    type: "banner_frame",
    label: "Marco de Banner",
    shortLabel: "Banner",
    icon: "🌆",
    desc: "Ribete perimetral que decora la cabecera de tu perfil",
  },
  {
    key: "badgeId",
    type: "badge",
    label: "Insignia de Vitrina",
    shortLabel: "Insignia",
    icon: "🎖️",
    desc: "Medalla conmemorativa visible en tu perfil",
  },
];

const RARITY_COLORS: Record<ItemRarity, { border: string; bg: string; text: string; glow: string }> = {
  comun: {
    border: "border-zinc-400/40",
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    glow: "shadow-zinc-500/10",
  },
  raro: {
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  epico: {
    border: "border-purple-500/50",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    glow: "shadow-purple-500/25",
  },
  legendario: {
    border: "border-amber-400/60",
    bg: "bg-amber-400/10",
    text: "text-amber-300",
    glow: "shadow-amber-400/30",
  },
  mitico: {
    border: "border-rose-500/70",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    glow: "shadow-rose-500/40",
  },
};

export default function InventoryPage() {
  const { user, addXp, addCoins } = useAuth();

  // Estados de inventario y equipamiento real
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equipped, setEquipped] = useState<EquippedCosmetics>(DEFAULT_EQUIPPED_COSMETICS);

  // Filtros de categoría y rareza
  const [activeTab, setActiveTab] = useState<
    "todos" | ItemType | "cosmeticos_all" | "pets_all" | "reading_all" | "chests_consumables"
  >("todos");
  const [rarityFilter, setRarityFilter] = useState<"all" | ItemRarity>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Notificación de acción rápida
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal de inspección de objeto
  const [inspectedItem, setInspectedItem] = useState<InventoryItem | null>(null);

  // Modal de apertura de cofre
  const [openingChestData, setOpeningChestData] = useState<{
    chest: InventoryItem;
    loot: InventoryItem[];
  } | null>(null);

  const loadData = () => {
    if (!user) return;
    const inv = getUserInventory(user.id);
    const eq = getUserEquippedCosmetics(user.id);
    setInventory(inv);
    setEquipped(eq);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("ficnation_inventory_updated", handleUpdate);
    window.addEventListener("ficnation_cosmetics_updated", handleUpdate);

    return () => {
      window.removeEventListener("ficnation_inventory_updated", handleUpdate);
      window.removeEventListener("ficnation_cosmetics_updated", handleUpdate);
    };
  }, [user]);

  // Acciones de Equipamiento
  const handleEquip = (item: InventoryItem) => {
    if (!user) return;
    const res = equipUserItem(user.id, item.id);
    setInventory(res.inventory);
    setEquipped(res.equipped);
    setActionNotice(`⚡ ¡Has equipado "${item.name}" con éxito!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleUnequip = (type: ItemType) => {
    if (!user) return;
    const res = unequipUserItem(user.id, type);
    setInventory(res.inventory);
    setEquipped(res.equipped);
    setActionNotice(`Se ha desequipado el objeto.`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleUnequipAll = () => {
    if (!user) return;
    const res = unequipAllCosmetics(user.id);
    setInventory(res.inventory);
    setEquipped(res.equipped);
    setActionNotice(`🔄 Has desequipado todos los cosméticos.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Uso de consumibles
  const handleUseConsumable = (item: InventoryItem) => {
    if (!user) return;
    const res = consumeUserItem(user.id, item.id);
    if (res.success && res.item) {
      if (res.item.id.startsWith("potion_xp") && res.item.effectValue) {
        addXp(res.item.effectValue, "Uso de Poción de Experiencia");
        setActionNotice(`🧪 ¡Bebiste ${res.item.name}! Has ganado +${res.item.effectValue} XP.`);
      } else if (res.item.id === "coins_pouch" && res.item.effectValue) {
        addCoins(res.item.effectValue, "Bolsa de Monedas");
        setActionNotice(`🪙 ¡Abriste ${res.item.name}! Has ganado +${res.item.effectValue} FicCoins.`);
      } else if (res.item.id === "event_spin_ticket") {
        setActionNotice(`🎫 Tienes ${res.remainingQuantity} Tickets disponibles para la Ruleta en /eventos.`);
      } else if (res.item.id === "potion_streak_freeze") {
        setActionNotice(`🛡️ Escudo de Racha activado. Tu racha diaria de lectura está protegida.`);
      }
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  // Apertura de cofre
  const handleOpenChestAction = (item: InventoryItem) => {
    if (!user) return;
    const result = openChest(user.id, item.id);
    if (result.success && result.loot.length > 0) {
      setOpeningChestData({
        chest: item,
        loot: result.loot,
      });
      loadData();
    } else {
      setActionNotice(result.message);
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // Objetos filtrados de la Mochila
  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      // Filtro por tipo/pestaña
      if (activeTab === "cosmeticos_all") {
        if (!["frame", "aura", "title", "badge", "banner_frame"].includes(item.type)) return false;
      } else if (activeTab === "pets_all") {
        if (item.type !== "pet" && item.type !== "pet_egg") return false;
      } else if (activeTab === "reading_all") {
        if (item.type !== "bookmark" && item.type !== "bubble") return false;
      } else if (activeTab === "chests_consumables") {
        if (item.type !== "chest" && item.type !== "consumable") return false;
      } else if (activeTab !== "todos") {
        if (item.type !== activeTab) return false;
      }

      // Filtro por rareza
      if (rarityFilter !== "all" && item.rarity !== rarityFilter) return false;

      // Filtro por búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [inventory, activeTab, rarityFilter, searchQuery]);

  // Contar cuántos slots están equipados
  const equippedCount = useMemo(() => {
    return Object.values(equipped).filter(Boolean).length;
  }, [equipped]);

  // Buscar definiciones de cosméticos activos para la cabecera
  const equippedFrameItem = CATALOG_ITEMS.find((i) => i.id === equipped.frameId);
  const equippedAuraItem = CATALOG_ITEMS.find((i) => i.id === equipped.auraId);
  const equippedTitleItem = CATALOG_ITEMS.find((i) => i.id === equipped.titleId);
  const equippedPetItem = CATALOG_ITEMS.find((i) => i.id === equipped.petId);
  const equippedBookmarkItem = CATALOG_ITEMS.find((i) => i.id === equipped.bookmarkId);
  const equippedBubbleItem = CATALOG_ITEMS.find((i) => i.id === equipped.bubbleId);
  const equippedBannerFrameItem = CATALOG_ITEMS.find((i) => i.id === equipped.bannerFrameId);
  const equippedBadgeItem = CATALOG_ITEMS.find((i) => i.id === equipped.badgeId);

  return (
    <div className="min-h-screen pb-28 space-y-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">

      {/* ════════════ AVISO DE ACCIÓN FLOTANTE / TOAST ════════════ */}
      {actionNotice && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-3.5 px-5 rounded-2xl border shadow-xl bg-zinc-900/95 border-purple-500/50 text-white text-xs font-bold flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-spin" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ════════════ CABECERA Y HERRAMIENTAS RÁPIDAS ════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border-primary)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                Inventario & Armario RPG
              </h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Gestiona tu equipamiento decorativo y los objetos obtenidos en tu mochila.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border fic-card-secondary text-xs font-bold" style={{ borderColor: "var(--border-primary)" }}>
            <Backpack className="w-3.5 h-3.5 text-purple-400" />
            <span>Mochila: {inventory.length} objetos</span>
          </div>

          <Link
            href="/eventos"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border fic-btn-secondary hover:scale-102 transition-all"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Festival & Eventos</span>
          </Link>
        </div>
      </div>

      {/* ════════════ 1. ESTACIÓN DE EQUIPAMIENTO DEL HÉROE (LOADOUT HUD) ════════════ */}
      <div
        className={`p-5 sm:p-7 rounded-3xl border shadow-xl fic-card relative overflow-hidden transition-all duration-300 ${
          equippedBannerFrameItem?.borderClass || ""
        }`}
        style={{ borderColor: "var(--border-primary)" }}
      >
        {/* Barra superior del HUD de equipamiento */}
        <div className="flex items-center justify-between pb-5 border-b mb-5" style={{ borderColor: "var(--border-primary)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <span>⚔️</span>
              <span>Equipamiento Activo</span>
            </span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {equippedCount} / 8 slots
            </span>
          </div>

          {equippedCount > 0 && (
            <button
              type="button"
              onClick={handleUnequipAll}
              className="text-xs px-2.5 py-1 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer transition-colors"
              title="Quitar todos los cosméticos de sus casillas"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Desequipar Todo</span>
            </button>
          )}
        </div>

        {/* Cuerpo Principal del Loadout: Escenario del Personaje + 8 Casillas RPG */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LADO IZQUIERDO: Escenario Visual del Héroe (Avatar, Mascota, Título, Muestras) */}
          <div className="lg:col-span-4 flex flex-col items-center text-center p-5 rounded-2xl border fic-card-secondary relative" style={{ borderColor: "var(--border-primary)" }}>
            
            {/* Avatar Central con Marco y Aura */}
            <div className="relative mb-3 group">
              <UserAvatarWithFrame
                src={user?.avatar}
                alt={user?.name || "Tú"}
                size="2xl"
                customFrameId={equipped.frameId}
                customAuraId={equipped.auraId}
              />

              {/* Mascota Acompañante flotando */}
              {equippedPetItem && (
                <div
                  className="absolute -bottom-2 -right-3 p-2 rounded-2xl bg-zinc-900/90 border border-purple-500/40 shadow-lg text-2xl animate-bounce-gentle select-none"
                  title={`Mascota Activa: ${equippedPetItem.name}`}
                >
                  {equippedPetItem.icon}
                </div>
              )}
            </div>

            {/* Nombre y Nivel RPG */}
            <div className="space-y-1 w-full">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-lg font-black truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>
                  {user?.name || "Aventurero"}
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full border fic-badge" style={{ borderColor: "var(--border-primary)" }}>
                  Nvl {user?.level || 1}
                </span>
              </div>

              {/* Título Honorífico Activo */}
              <div className="flex items-center justify-center gap-2 pt-0.5">
                {equippedTitleItem ? (
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-3 py-1 rounded-full shadow-xs ${equippedTitleItem.previewClass || "bg-purple-600 text-white font-bold"}`}>
                      {equippedTitleItem.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnequip("title")}
                      className="p-1 rounded-full text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                      title="Quitar título"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                    Sin título cosmético equipado
                  </span>
                )}
              </div>

              {/* Mascota status */}
              {equippedPetItem && (
                <p className="text-[11px] font-mono text-purple-400 pt-1 flex items-center justify-center gap-1 font-bold">
                  <span>{equippedPetItem.icon}</span>
                  <span>{equippedPetItem.name} te acompaña</span>
                </p>
              )}
            </div>

            {/* ─── PREVISUALIZACIÓN DE ELEMENTOS DE LECTURA ─── */}
            <div className="w-full mt-4 pt-4 border-t space-y-3 text-left" style={{ borderColor: "var(--border-primary)" }}>
              
              {/* Muestra de Burbuja de Comentario */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase" style={{ color: "var(--text-muted)" }}>
                  💬 Previsualización de Comentarios:
                </span>
                <div
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    equippedBubbleItem?.previewClass || "fic-card border border-dashed"
                  }`}
                  style={!equippedBubbleItem ? { borderColor: "var(--border-primary)" } : {}}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold opacity-80">{user?.name || "Tú"}</span>
                    {equippedBadgeItem && (
                      <span className="text-xs" title={equippedBadgeItem.name}>
                        {equippedBadgeItem.icon}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-snug">
                    "¡Este capítulo estuvo épico! No puedo esperar al siguiente."
                  </p>
                </div>
              </div>

              {/* Muestra de Marcador de Lectura */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase" style={{ color: "var(--text-muted)" }}>
                  🔖 Marcador de Lectura:
                </span>
                <div className="flex items-center gap-2 p-2 rounded-xl border fic-card" style={{ borderColor: "var(--border-primary)" }}>
                  {equippedBookmarkItem ? (
                    <>
                      <span className="text-base">{equippedBookmarkItem.icon}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${equippedBookmarkItem.previewClass || "bg-purple-600 text-white"}`}>
                        {equippedBookmarkItem.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] italic" style={{ color: "var(--text-muted)" }}>
                      Marcador estándar de FicNation
                    </span>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* LADO DERECHO: Las 8 Casillas de Equipamiento RPG */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {EQUIPMENT_SLOTS.map((slot) => {
                const equippedItemId = equipped[slot.key];
                const equippedItem = CATALOG_ITEMS.find((i) => i.id === equippedItemId);
                const rarityStyle = equippedItem ? RARITY_COLORS[equippedItem.rarity] : null;

                return (
                  <div
                    key={slot.key}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[120px] relative group ${
                      equippedItem
                        ? `${rarityStyle?.bg} ${rarityStyle?.border} shadow-sm`
                        : "fic-card-secondary border-dashed hover:border-purple-500/50"
                    }`}
                    style={!equippedItem ? { borderColor: "var(--border-primary)" } : {}}
                  >
                    {/* Cabecera del Slot */}
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <span className="font-mono font-bold flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        <span>{slot.icon}</span>
                        <span>{slot.shortLabel}</span>
                      </span>

                      {equippedItem && (
                        <button
                          type="button"
                          onClick={() => handleUnequip(slot.type)}
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title={`Desequipar ${slot.shortLabel}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Contenido del Slot */}
                    {equippedItem ? (
                      <div className="py-1">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center text-xl shrink-0">
                            {equippedItem.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black truncate" style={{ color: "var(--text-primary)" }}>
                              {equippedItem.name}
                            </p>
                            <span className={`text-[9px] font-mono font-bold uppercase ${rarityStyle?.text}`}>
                              {equippedItem.rarity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(slot.type);
                          const el = document.getElementById("inventario-mochila-section");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="py-2 text-center w-full hover:opacity-100 opacity-60 transition-opacity cursor-pointer"
                      >
                        <span className="text-xs font-bold text-purple-400 flex items-center justify-center gap-1">
                          <span>+</span>
                          <span>Equipar {slot.shortLabel}</span>
                        </span>
                        <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                          Casilla vacía
                        </p>
                      </button>
                    )}

                    {/* Pie del Slot */}
                    <div className="text-[9px] truncate pt-1 border-t border-white/5 font-mono" style={{ color: "var(--text-muted)" }}>
                      {equippedItem ? "✓ En uso activo" : slot.desc}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ════════════ 2. MOCHILA & ALMACÉN DE OBJETOS (BAG & STORAGE) ════════════ */}
      <div id="inventario-mochila-section" className="space-y-4">
        
        {/* Barra de Filtros, Búsqueda y Pestañas RPG */}
        <div className="p-4 rounded-3xl border fic-card space-y-3" style={{ borderColor: "var(--border-primary)" }}>
          
          {/* Fila 1: Pestañas de Tipo */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
            {[
              { key: "todos", label: "Todo", icon: Backpack },
              { key: "cosmeticos_all", label: "Equipamiento", icon: Shield },
              { key: "frame", label: "Marcos", icon: Sparkles },
              { key: "aura", label: "Auras & FX", icon: Flame },
              { key: "title", label: "Títulos", icon: Trophy },
              { key: "pets_all", label: "Mascotas & Huevos", icon: Egg },
              { key: "reading_all", label: "Estilo Lectura", icon: Bookmark },
              { key: "badge", label: "Insignias", icon: Award },
              { key: "chests_consumables", label: "Cofres & Pociones", icon: Box },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-1.5 py-2 px-3.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? "fic-btn-primary text-white shadow-xs scale-102"
                      : "fic-card-secondary hover:opacity-85"
                  }`}
                  style={!isActive ? { borderColor: "var(--border-primary)", color: "var(--text-primary)" } : {}}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Fila 2: Búsqueda y Filtro por Rareza */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: "var(--border-primary)" }}>
            
            {/* Buscador */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Buscar en la mochila..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs border fic-input focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Píldoras de Rareza */}
            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              <span className="text-[10px] font-mono font-bold uppercase mr-1" style={{ color: "var(--text-muted)" }}>
                Rareza:
              </span>
              {[
                { id: "all", label: "Todas" },
                { id: "comun", label: "Común" },
                { id: "raro", label: "Raro" },
                { id: "epico", label: "Épico" },
                { id: "legendario", label: "Legendario" },
                { id: "mitico", label: "Mítico" },
              ].map((r) => {
                const isSelected = rarityFilter === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRarityFilter(r.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-500 shadow-xs"
                        : "fic-card-secondary hover:opacity-85"
                    }`}
                    style={!isSelected ? { borderColor: "var(--border-primary)", color: "var(--text-muted)" } : {}}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

          </div>

        </div>

        {/* ════════════ CUADRÍCULA DE OBJETOS / ESTADO VACÍO ════════════ */}
        {filteredItems.length === 0 ? (
          <div className="p-10 sm:p-14 text-center rounded-3xl border fic-card space-y-5" style={{ borderColor: "var(--border-primary)" }}>
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center text-4xl shadow-md">
              🎒
            </div>
            
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>
                Tu mochila está limpia y lista para la aventura
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {inventory.length === 0
                  ? "Se han retirado los objetos de prueba. Ahora tu inventario contiene únicamente los cosméticos y reliquias auténticas que ganes en FicNation."
                  : "No hay objetos que coincidan con la búsqueda o el filtro de rareza actual."}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center">
              <Link
                href="/eventos"
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white fic-btn-primary shadow-sm hover:scale-102 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ir al Festival de Eventos</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const isEquippedInSlot =
                (item.type === "frame" && equipped.frameId === item.id) ||
                (item.type === "aura" && equipped.auraId === item.id) ||
                (item.type === "title" && equipped.titleId === item.id) ||
                (item.type === "badge" && equipped.badgeId === item.id) ||
                (item.type === "bookmark" && equipped.bookmarkId === item.id) ||
                (item.type === "bubble" && equipped.bubbleId === item.id) ||
                (item.type === "banner_frame" && equipped.bannerFrameId === item.id) ||
                (item.type === "pet" && equipped.petId === item.id);

              const isCosmetic = [
                "frame",
                "aura",
                "title",
                "badge",
                "bookmark",
                "bubble",
                "banner_frame",
                "pet",
              ].includes(item.type);

              const isConsumable = item.type === "consumable";
              const isChest = item.type === "chest";
              const isEgg = item.type === "pet_egg";

              const rarityStyle = RARITY_COLORS[item.rarity];

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 fic-card relative group ${
                    isEquippedInSlot
                      ? "ring-2 ring-purple-500 shadow-lg"
                      : "hover:scale-102"
                  }`}
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  {/* Badge de Equipado o Cantidad */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    {isEquippedInSlot && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                        <span>EQUIPADO</span>
                      </span>
                    )}

                    {(isConsumable || isChest) && (item.quantity || 1) > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-purple-600 text-white shadow-xs">
                        x{item.quantity}
                      </span>
                    )}
                  </div>

                  {/* Icono y Detalles */}
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setInspectedItem(item)}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl ${rarityStyle.bg} border ${rarityStyle.border} flex items-center justify-center shrink-0 text-3xl shadow-xs transition-transform group-hover:scale-105`}
                    >
                      {item.icon}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${rarityStyle.bg} ${rarityStyle.border} ${rarityStyle.text}`}>
                        {item.rarity}
                      </span>
                      <h4 className="text-xs font-black truncate pt-0.5" style={{ color: "var(--text-primary)" }}>
                        {item.name}
                      </h4>
                      <p className="text-[10px] line-clamp-2" style={{ color: "var(--text-muted)" }}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Barra de Progreso de Huevo de Mascota */}
                  {isEgg && item.eggData && (
                    <div className="space-y-1 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px]">
                      <div className="flex items-center justify-between font-mono font-bold text-purple-300">
                        <span>Incubación:</span>
                        <span>{item.eggData.chaptersRead} / {item.eggData.chaptersNeeded} Caps</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (item.eggData.chaptersRead / item.eggData.chaptersNeeded) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Botones de Acción de la Mochila */}
                  <div className="pt-2 border-t" style={{ borderColor: "var(--border-primary)" }}>
                    {isChest ? (
                      <button
                        type="button"
                        onClick={() => handleOpenChestAction(item)}
                        className="w-full py-2 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-400 to-yellow-300 shadow-md hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>Abrir Cofre</span>
                      </button>
                    ) : isEgg ? (
                      <span className="block text-center text-[10px] font-mono text-purple-300/80 py-1">
                        📖 Lee capítulos para eclosionar
                      </span>
                    ) : isConsumable ? (
                      <button
                        type="button"
                        onClick={() => handleUseConsumable(item)}
                        className="w-full py-2 rounded-xl text-xs font-bold text-white fic-btn-primary shadow-xs hover:scale-102 transition-all cursor-pointer"
                      >
                        🧪 Usar Ahora
                      </button>
                    ) : isCosmetic && isEquippedInSlot ? (
                      <button
                        type="button"
                        onClick={() => handleUnequip(item.type)}
                        className="w-full py-2 rounded-xl text-xs font-bold border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Equipado (Quitar)</span>
                      </button>
                    ) : isCosmetic ? (
                      <button
                        type="button"
                        onClick={() => handleEquip(item)}
                        className="w-full py-2 rounded-xl text-xs font-bold border fic-card-secondary hover:border-purple-500/50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        style={{ color: "var(--text-primary)" }}
                      >
                        <span>⚡</span>
                        <span>Equipar en Slot</span>
                      </button>
                    ) : null}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ════════════ MODAL DE INSPECCIÓN DETALLADA RPG ════════════ */}
      {inspectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setInspectedItem(null)}
        >
          <div
            className="w-full max-w-md p-6 rounded-3xl border shadow-2xl fic-card relative space-y-4 animate-scale-up"
            style={{ borderColor: "var(--border-primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInspectedItem(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ícono gigante con resplandor de rareza */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div
                className={`w-20 h-20 rounded-3xl ${RARITY_COLORS[inspectedItem.rarity].bg} border-2 ${
                  RARITY_COLORS[inspectedItem.rarity].border
                } flex items-center justify-center text-4xl shadow-xl`}
              >
                {inspectedItem.icon}
              </div>

              <div>
                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-0.5 rounded-full border ${
                    RARITY_COLORS[inspectedItem.rarity].bg
                  } ${RARITY_COLORS[inspectedItem.rarity].border} ${RARITY_COLORS[inspectedItem.rarity].text}`}
                >
                  {inspectedItem.rarity}
                </span>
                <h3 className="text-lg font-black mt-1" style={{ color: "var(--text-primary)" }}>
                  {inspectedItem.name}
                </h3>
              </div>
            </div>

            {/* Descripción y Lore */}
            <div className="p-3.5 rounded-2xl fic-card-secondary border text-xs leading-relaxed" style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>
              {inspectedItem.description}
            </div>

            {/* Botón de Acción del Modal */}
            <div className="pt-2">
              {[
                "frame",
                "aura",
                "title",
                "badge",
                "bookmark",
                "bubble",
                "banner_frame",
                "pet",
              ].includes(inspectedItem.type) ? (
                equipped[
                  inspectedItem.type === "frame"
                    ? "frameId"
                    : inspectedItem.type === "aura"
                    ? "auraId"
                    : inspectedItem.type === "title"
                    ? "titleId"
                    : inspectedItem.type === "badge"
                    ? "badgeId"
                    : inspectedItem.type === "bookmark"
                    ? "bookmarkId"
                    : inspectedItem.type === "bubble"
                    ? "bubbleId"
                    : inspectedItem.type === "banner_frame"
                    ? "bannerFrameId"
                    : "petId"
                ] === inspectedItem.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleUnequip(inspectedItem.type);
                      setInspectedItem(null);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Equipado Actualmente (Quitar)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleEquip(inspectedItem);
                      setInspectedItem(null);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white fic-btn-primary shadow-xs hover:scale-102 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>⚡</span>
                    <span>Equipar en Casilla</span>
                  </button>
                )
              ) : inspectedItem.type === "chest" ? (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenChestAction(inspectedItem);
                    setInspectedItem(null);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-400 to-yellow-300 shadow-md hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Abrir Cofre</span>
                </button>
              ) : inspectedItem.type === "consumable" ? (
                <button
                  type="button"
                  onClick={() => {
                    handleUseConsumable(inspectedItem);
                    setInspectedItem(null);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white fic-btn-primary shadow-xs hover:scale-102 transition-all cursor-pointer"
                >
                  🧪 Usar Ahora
                </button>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* ════════════ MODAL DE APERTURA DE COFRE ════════════ */}
      {openingChestData && user && (
        <ChestOpeningModal
          chestItem={openingChestData.chest}
          loot={openingChestData.loot}
          userId={user.id}
          onClose={() => setOpeningChestData(null)}
        />
      )}

    </div>
  );
}
