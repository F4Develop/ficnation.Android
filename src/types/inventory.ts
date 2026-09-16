export type ItemType =
  | "frame"
  | "aura"
  | "title"
  | "badge"
  | "bookmark"
  | "bubble"
  | "banner_frame"
  | "pet_egg"
  | "pet"
  | "chest"
  | "consumable";

export type ItemRarity = "comun" | "raro" | "epico" | "legendario" | "mitico";

export interface PetEggData {
  chaptersRead: number;
  chaptersNeeded: number;
  petCatalogId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  previewClass?: string;
  borderClass?: string;
  glowClass?: string;
  equipped?: boolean;
  quantity?: number;
  acquiredAt: string;
  effectValue?: number;
  eggData?: PetEggData;
  lootPool?: string[]; // Para cofres
}

export interface MonthlyEventData {
  id: string;
  title: string;
  subtitle: string;
  monthName: string;
  year: number;
  endDate: string;
  bannerImage: string;
  themeColor: string;
  totalQuests: number;
  completedQuests: number;
}

export const CURRENT_MONTHLY_EVENT: MonthlyEventData = {
  id: "event_sep_2026",
  title: "Festival Cósmico: El Despertar Astral",
  subtitle: "Gira la Ruleta, abre Cofres de Reliquia y completa Trivias para ganar recompensas exclusivas.",
  monthName: "Septiembre",
  year: 2026,
  endDate: "2026-09-30T23:59:59Z",
  bannerImage: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80",
  themeColor: "from-purple-600 via-pink-600 to-indigo-600",
  totalQuests: 3,
  completedQuests: 1,
};

export const CATALOG_ITEMS: Omit<InventoryItem, "acquiredAt" | "equipped">[] = [
  // ════════════════════════════════════════════════════════════════════════════
  // 1. MARCOS DE AVATAR (FRAMES)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "frame_cosmic",
    name: "Aura Cósmica",
    description: "Un resplandor celestial con destellos púrpuras y polvo de estrellas que envuelve tu avatar.",
    type: "frame",
    rarity: "legendario",
    icon: "🌌",
    borderClass: "ring-4 ring-purple-500 ring-offset-2 ring-offset-[#080511]",
    glowClass: "shadow-[0_0_20px_rgba(168,85,247,0.75)] animate-pulse",
  },
  {
    id: "frame_dragon",
    name: "Llamas de Dragón",
    description: "Fuego ardiente forjado en las profundidades míticas para escritores apasionados.",
    type: "frame",
    rarity: "epico",
    icon: "🔥",
    borderClass: "ring-4 ring-amber-500 ring-offset-2 ring-offset-[#080511]",
    glowClass: "shadow-[0_0_20px_rgba(245,158,11,0.75)]",
  },
  {
    id: "frame_cyber",
    name: "Ciberpunk Neón",
    description: "Borde holográfico cian y fucsia de pulso tecnológico futurista.",
    type: "frame",
    rarity: "epico",
    icon: "⚡",
    borderClass: "ring-4 ring-cyan-400 ring-offset-2 ring-offset-[#080511]",
    glowClass: "shadow-[0_0_20px_rgba(6,182,212,0.75)]",
  },
  {
    id: "frame_gold",
    name: "Corona de Oro Imperial",
    description: "Un marco de la realeza con oro puro pulido y destellos imperiales.",
    type: "frame",
    rarity: "mitico",
    icon: "👑",
    borderClass: "ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#080511]",
    glowClass: "shadow-[0_0_25px_rgba(234,179,8,0.9)] animate-pulse",
  },
  {
    id: "frame_sakura",
    name: "Brisa de Sakura",
    description: "Aura rosada etérea inspirada en pétalos de cerezo flotando al viento.",
    type: "frame",
    rarity: "raro",
    icon: "🌸",
    borderClass: "ring-4 ring-pink-400 ring-offset-2 ring-offset-[#080511]",
    glowClass: "shadow-[0_0_15px_rgba(244,114,182,0.6)]",
  },
  {
    id: "frame_void",
    name: "Abismo Estelar",
    description: "Misteriosas sombras del vacío cósmico con energía dimensional profunda.",
    type: "frame",
    rarity: "legendario",
    icon: "🌑",
    borderClass: "ring-4 ring-indigo-600 ring-offset-2 ring-offset-[#080511]",
    glowClass: "shadow-[0_0_20px_rgba(79,70,229,0.8)]",
  },
  {
    id: "frame_frost",
    name: "Hielo Arcano",
    description: "Escarcha cristalina y ventisca helada que congela el contorno de tu foto.",
    type: "frame",
    rarity: "epico",
    icon: "❄️",
    borderClass: "ring-4 ring-sky-300 ring-offset-2 ring-offset-[#080511]",
    glowClass: "shadow-[0_0_18px_rgba(125,211,252,0.8)]",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 2. AURAS Y EFECTOS DE AVATAR (AURAS & FX)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "aura_stars",
    name: "Polvo de Estrellas",
    description: "Partículas estelares giratorias de color violeta y dorado.",
    type: "aura",
    rarity: "legendario",
    icon: "✨",
    previewClass: "aura-stars",
  },
  {
    id: "aura_flames",
    name: "Llamas Carmesí Vivas",
    description: "Fuego fatuo ascendente que emana calor y ferocidad.",
    type: "aura",
    rarity: "epico",
    icon: "🔥",
    previewClass: "aura-flames",
  },
  {
    id: "aura_sakura",
    name: "Pétalos de Sakura",
    description: "Pétalos de cerezo flotando en un suave remolino primaveral.",
    type: "aura",
    rarity: "raro",
    icon: "🌸",
    previewClass: "aura-sakura",
  },
  {
    id: "aura_neon_matrix",
    name: "Matriz Ciberpunk",
    description: "Código binario y chispas cian de alta frecuencia.",
    type: "aura",
    rarity: "epico",
    icon: "⚡",
    previewClass: "aura-neon",
  },
  {
    id: "aura_bubbles",
    name: "Burbujas Arcanas",
    description: "Esferas de maná azul translúcido con brillo etéreo.",
    type: "aura",
    rarity: "comun",
    icon: "🫧",
    previewClass: "aura-bubbles",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 3. TÍTULOS DE PERFIL (TITLES)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "title_king",
    name: "👑 Cronista Supremo",
    description: "Demuestra supremacía absoluta en el arte de contar historias.",
    type: "title",
    rarity: "mitico",
    icon: "👑",
    previewClass: "bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black",
  },
  {
    id: "title_cosmic",
    name: "🌌 Viajero Cósmico",
    description: "Aquel que ha explorado los confines de la imaginación y múltiples dimensiones.",
    type: "title",
    rarity: "legendario",
    icon: "🌌",
    previewClass: "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold",
  },
  {
    id: "title_blade",
    name: "⚔️ Espadachín de Letras",
    description: "Tus palabras cortan con precisión en cada clímax de la trama.",
    type: "title",
    rarity: "epico",
    icon: "⚔️",
    previewClass: "bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold",
  },
  {
    id: "title_night_reader",
    name: "☕ Devorador de Fics a las 3 AM",
    description: "Dedicado a los lectores nocturnos que no pueden soltar el siguiente capítulo.",
    type: "title",
    rarity: "raro",
    icon: "☕",
    previewClass: "bg-gradient-to-r from-indigo-800 to-slate-800 text-amber-300 font-bold",
  },
  {
    id: "title_roleplay",
    name: "🎭 Maestro del Rol",
    description: "Dominador de los comandos T/N y la personificación de mundos inmersivos.",
    type: "title",
    rarity: "raro",
    icon: "🎭",
    previewClass: "bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold",
  },
  {
    id: "title_abyss",
    name: "💀 Señor del Abismo",
    description: "Afinidad con historias oscuras, tragedias y villanos inolvidables.",
    type: "title",
    rarity: "epico",
    icon: "💀",
    previewClass: "bg-gradient-to-r from-zinc-900 to-purple-950 text-purple-300 border border-purple-500/40 font-bold",
  },
  {
    id: "title_muse",
    name: "🌸 Musa Celestial",
    description: "Inspiración pura para novelistas románticos y soñadores.",
    type: "title",
    rarity: "epico",
    icon: "🌸",
    previewClass: "bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold",
  },
  {
    id: "title_star",
    name: "✨ Estrella Fugaz",
    description: "Un destello que ilumina las noches de lectura.",
    type: "title",
    rarity: "comun",
    icon: "✨",
    previewClass: "bg-zinc-800 text-amber-300 font-bold border border-amber-500/40",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 4. HUEVOS Y MASCOTAS DE LECTURA (PET EGGS & PETS)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "egg_ink_dragon",
    name: "Huevo de Dragón de Tinta",
    description: "Un huevo cubierto de caligrafía misteriosa. Incúbalo leyendo 3 capítulos para ver nacer a tu Dragón.",
    type: "pet_egg",
    rarity: "legendario",
    icon: "🥚",
    eggData: {
      chaptersRead: 0,
      chaptersNeeded: 3,
      petCatalogId: "pet_ink_dragon",
    },
  },
  {
    id: "egg_astral_cat",
    name: "Huevo de Gato Astral",
    description: "Late con luz celestial suave. Incúbalo leyendo 2 capítulos para obtener tu compañero felino.",
    type: "pet_egg",
    rarity: "epico",
    icon: "🥚",
    eggData: {
      chaptersRead: 0,
      chaptersNeeded: 2,
      petCatalogId: "pet_astral_cat",
    },
  },
  {
    id: "egg_paper_slime",
    name: "Huevo de Slime de Papel",
    description: "Hecho de hojas de manuscrito vivas. Solo necesita 1 capítulo para eclosionar.",
    type: "pet_egg",
    rarity: "raro",
    icon: "🥚",
    eggData: {
      chaptersRead: 0,
      chaptersNeeded: 1,
      petCatalogId: "pet_paper_slime",
    },
  },
  // Mascotas eclosionadas
  {
    id: "pet_ink_dragon",
    name: "Dragón de Tinta",
    description: "Un pequeño dragón que vuela a tu lado al leer. Escupe fuego de tinta en los momentos emocionantes.",
    type: "pet",
    rarity: "legendario",
    icon: "🐉",
    previewClass: "text-purple-400 animate-bounce-gentle",
  },
  {
    id: "pet_astral_cat",
    name: "Gato Astral",
    description: "Un felino cósmico con cola de cometa. Ronronea cuando lees capítulos largos.",
    type: "pet",
    rarity: "epico",
    icon: "🐱",
    previewClass: "text-pink-400 animate-bounce-gentle",
  },
  {
    id: "pet_paper_slime",
    name: "Slime de Papel",
    description: "Una masa adorable hecha de hojas de fanfic que da saltitos de alegría.",
    type: "pet",
    rarity: "raro",
    icon: "📜",
    previewClass: "text-amber-300 animate-bounce-gentle",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 5. MARCADORES DE LIBROS (READING BOOKMARKS)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "bookmark_crimson_silk",
    name: "Cinta de Seda Carmesí",
    description: "Un elegante marcador de seda roja con ribetes dorados para lectores clásicos.",
    type: "bookmark",
    rarity: "raro",
    icon: "🔖",
    previewClass: "bg-red-600 text-amber-200 border-amber-400/50",
  },
  {
    id: "bookmark_golden_feather",
    name: "Pluma de Oro Antiguo",
    description: "Una pluma forjada en oro de 24k que brilla en la esquina de tu lectura.",
    type: "bookmark",
    rarity: "legendario",
    icon: "🪶",
    previewClass: "bg-gradient-to-b from-amber-400 to-yellow-600 text-black",
  },
  {
    id: "bookmark_constellation",
    name: "Constelación Estelar",
    description: "Un marcador holográfico que proyecta constelaciones al avanzar de página.",
    type: "bookmark",
    rarity: "epico",
    icon: "🌌",
    previewClass: "bg-gradient-to-b from-purple-600 via-indigo-700 to-pink-600 text-white",
  },
  {
    id: "bookmark_sakura_petal",
    name: "Hoja de Sakura Eterna",
    description: "Un marcador translúcido con pétalos secos de cerezo aromático.",
    type: "bookmark",
    rarity: "comun",
    icon: "🌸",
    previewClass: "bg-pink-500/80 text-white",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 6. BURBUJAS DE COMENTARIO PERSONALIZADAS (COMMENT BUBBLE SKINS)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "bubble_parchment",
    name: "Burbuja Pergamino Clásico",
    description: "Tus comentarios lucen como cartas de pergamino antiguo con tinta sepia.",
    type: "bubble",
    rarity: "raro",
    icon: "📜",
    previewClass: "bg-[#f5ebd7] text-[#2d241e] border-[#c4a482] font-serif shadow-md",
  },
  {
    id: "bubble_cyberpunk",
    name: "Burbuja Neón Ciberpunk",
    description: "Borde cian reactivo con fondo oscuro y tipografía futurista.",
    type: "bubble",
    rarity: "epico",
    icon: "⚡",
    previewClass: "bg-[#0b132b] text-[#5bc0be] border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]",
  },
  {
    id: "bubble_cosmic_crystal",
    name: "Burbuja Cristal Cósmico",
    description: "Diseño translúcido violeta con destellos mágicos para opinar con estilo.",
    type: "bubble",
    rarity: "legendario",
    icon: "🔮",
    previewClass: "bg-gradient-to-r from-purple-950/80 to-pink-950/80 text-purple-200 border-purple-400/50 shadow-lg",
  },
  {
    id: "bubble_gold_vip",
    name: "Burbuja Oro VIP Imperial",
    description: "El comentario más lujoso posible: borde dorado real con reflejos metálicos.",
    type: "bubble",
    rarity: "mitico",
    icon: "👑",
    previewClass: "bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 text-amber-200 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 7. MARCOS DE BANNER DE PERFIL (BANNER FRAMES)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "banner_frame_astral",
    name: "Borde Astral Resplandeciente",
    description: "Un marco que ilumina la cabecera de tu perfil con energía celestial.",
    type: "banner_frame",
    rarity: "legendario",
    icon: "🌌",
    borderClass: "ring-4 ring-purple-500/80 shadow-[0_0_30px_rgba(168,85,247,0.5)]",
  },
  {
    id: "banner_frame_ivy",
    name: "Marco de Hiedra Fantástica",
    description: "Bordes entrelazados de enredaderas místicas para perfiles de fantasía.",
    type: "banner_frame",
    rarity: "raro",
    icon: "🌿",
    borderClass: "ring-4 ring-emerald-600/70 shadow-lg",
  },
  {
    id: "banner_frame_gold_imperial",
    name: "Borde Dorado Imperial",
    description: "Marquetería de oro fino que enmarca tu banner como una obra de museo.",
    type: "banner_frame",
    rarity: "mitico",
    icon: "👑",
    borderClass: "ring-4 ring-amber-400 shadow-[0_0_35px_rgba(234,179,8,0.7)]",
  },
  {
    id: "banner_frame_neon",
    name: "Borde Neón Synthwave",
    description: "Líneas de neón rosa y magenta inspiradas en los años 80.",
    type: "banner_frame",
    rarity: "epico",
    icon: "🌆",
    borderClass: "ring-4 ring-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.6)]",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 8. PINES E INSIGNIAS DE VITRINA (BADGES & PINS)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "badge_festival_2026",
    name: "Emblema Astral 2026",
    description: "Insignia conmemorativa exclusiva de la Temporada 1 del Festival Cósmico.",
    type: "badge",
    rarity: "legendario",
    icon: "🌟",
  },
  {
    id: "badge_gold_quill",
    name: "Pin Pluma de Oro",
    description: "Distinción para aquellos apasionados de la escritura constante.",
    type: "badge",
    rarity: "epico",
    icon: "🪶",
  },
  {
    id: "badge_night_owl",
    name: "Pin Búho Nocturno",
    description: "Reconocimiento a quienes leen historias bajo la luz de la luna.",
    type: "badge",
    rarity: "raro",
    icon: "🦉",
  },
  {
    id: "badge_roleplay_hero",
    name: "Medalla Maestro del Rol",
    description: "Otorgada por dominar las aventuras Reader-Insert y tramas interactivas.",
    type: "badge",
    rarity: "raro",
    icon: "🎭",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 9. COFRES DEL TESORO (CHESTS / MYSTERY BOXES)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "chest_wooden",
    name: "Cofre de Madera Rúnica",
    description: "Un cofre común que contiene pociones de XP, tickets de ruleta o marcadores de libro.",
    type: "chest",
    rarity: "comun",
    icon: "📦",
    lootPool: ["potion_xp_small", "bookmark_sakura_petal", "event_spin_ticket", "title_star"],
  },
  {
    id: "chest_iron",
    name: "Cofre de Hierro Forjado",
    description: "Cofre resistente que puede soltar huevos de mascota, marcos raros y burbujas de pergamino.",
    type: "chest",
    rarity: "raro",
    icon: "🧰",
    lootPool: ["egg_paper_slime", "frame_sakura", "bubble_parchment", "coins_pouch", "title_night_reader"],
  },
  {
    id: "chest_gold",
    name: "Cofre de Oro Imperial",
    description: "Cofre del tesoro brillante que garantiza objetos épicos o legendarios.",
    type: "chest",
    rarity: "epico",
    icon: "🪙",
    lootPool: ["frame_dragon", "egg_astral_cat", "bookmark_constellation", "bubble_cyberpunk", "aura_flames"],
  },
  {
    id: "chest_cosmic",
    name: "Cofre Cósmico Ancestral",
    description: "La joya suprema: contiene reliquias míticas como el Huevo de Dragón, Corona de Oro y Burbuja VIP.",
    type: "chest",
    rarity: "mitico",
    icon: "💎",
    lootPool: ["egg_ink_dragon", "frame_gold", "bubble_gold_vip", "banner_frame_gold_imperial", "title_king"],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 10. CONSUMIBLES (POTIONS, TICKETS, COINS, STREAK FREEZE)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "potion_xp_large",
    name: "Poción de XP Mayor",
    description: "Otorga inmediatamente +500 puntos de Experiencia al beberla.",
    type: "consumable",
    rarity: "epico",
    icon: "🧪",
    effectValue: 500,
  },
  {
    id: "potion_xp_small",
    name: "Frasco de XP Menor",
    description: "Otorga inmediatamente +150 puntos de Experiencia al beberla.",
    type: "consumable",
    rarity: "comun",
    icon: "⚗️",
    effectValue: 150,
  },
  {
    id: "potion_streak_freeze",
    name: "Escudo de Racha Diaria",
    description: "Protege tu racha de lectura si un día no puedes conectarte a leer o escribir.",
    type: "consumable",
    rarity: "raro",
    icon: "🛡️",
    effectValue: 1,
  },
  {
    id: "coins_pouch",
    name: "Bolsa de FicCoins",
    description: "Contiene 100 FicCoins para propinas y regalos virtuales.",
    type: "consumable",
    rarity: "raro",
    icon: "🪙",
    effectValue: 100,
  },
  {
    id: "event_spin_ticket",
    name: "Ticket Astral",
    description: "Otorga 1 giro adicional gratuito en los minijuegos de evento.",
    type: "consumable",
    rarity: "raro",
    icon: "🎫",
    effectValue: 1,
  },
];
