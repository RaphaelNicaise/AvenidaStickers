// Tipos para la API de stickers

export interface StickerCreateDTO {
  name: string;
  description: string;
  categories: string[];
}

export interface StickerUpdateDTO {
  name?: string;
  description?: string;
  categories?: string[];
}

export interface StickerResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  count?: number;
}

export interface StickerQuery {
  categories?: string;
  q?: string; // para búsqueda
}

export const STICKER_CATEGORIES = [
  'anime',
  'gaming', 
  'memes',
  'nature',
  'art',
  'otros'
] as const;

export type StickerCategory = typeof STICKER_CATEGORIES[number];