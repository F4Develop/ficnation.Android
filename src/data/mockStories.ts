export type StoryStatus = "completa" | "en_desarrollo" | "cancelada" | "borrador";
export type AgeRating = "TP" | "+13" | "+16" | "+18";
export type StoryType = "tradicional" | "interactiva";
export type OriginType = "original" | "fanfic";

export interface Story {
  id: string;
  title: string;
  author: {
    id?: string;
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
  };
  coverImage?: string;
  coverGradient?: string;
  synopsis: string;
  genre: string;
  tags: string[];
  reads: string;
  votes: string;
  chapters: number;
  completed?: boolean;
  isPublished?: boolean;
  status?: StoryStatus;
  featured?: boolean;
  ageRating?: AgeRating;
  contentWarnings?: string[];
  storyType?: StoryType;
  originType?: OriginType;
  fandom?: string;
}

// Catálogo conectado exclusivamente a la base de datos de Supabase (sin mocks)
export const MOCK_STORIES: Story[] = [];

export const GENRES = [
  { name: "Todos" },
  { name: "Romance" },
  { name: "Fantasía" },
  { name: "Anime / Fanfic" },
  { name: "Acción & Shonen" },
  { name: "Aventura" },
  { name: "Isekai" },
  { name: "Ciencia Ficción" },
  { name: "Misterio & Thriller" },
  { name: "Terror / Sobrenatural" },
  { name: "Drama & Psicológico" },
  { name: "Comedia" },
  { name: "Slice of Life" },
  { name: "Cyberpunk" },
  { name: "Sobrenatural" },
  { name: "BL / Yaoi" },
  { name: "GL / Yuri" },
];
