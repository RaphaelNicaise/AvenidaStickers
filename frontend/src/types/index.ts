export interface Sticker {
  _id: string;
  id_sticker: string; // Formato: 0001, 0002, 0003, etc.
  imagePath: string;
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PersonalizedSticker {
  _id: string;
  id_personalized: string; // Formato: P0001, P0002, P0003, etc.
  imagePath: string;
  source: 'upload' | 'pinterest';
  originalUrl?: string;
  status: 'active' | 'published' | 'temporary';
  expiresAt?: string; // Fecha de expiración automática (solo para status 'active' y 'temporary')
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

// Tipos para paginación
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalStickers: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface StickersResponse {
  success: boolean;
  data: Sticker[];
  pagination: PaginationInfo;
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
  count: number;
}

export interface FilterParams {
  categories?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Tipos para medidas de stickers
export interface StickerSize {
  id: string; // Cambiado de 'small' | 'medium' | 'large' para permitir IDs dinámicos
  name: string;
  dimensions: string;
  price: number;
}

export interface StickerSizesData {
  sizes: StickerSize[];
  currency: string;
  updatedAt: string;
}

// Tipos para el carrito
export interface CartItem {
  id: string; // ID único del item en el carrito
  sticker: Sticker | PersonalizedSticker;
  size: StickerSize;
  quantity: number;
  totalPrice: number; // size.price * quantity
  isPersonalized?: boolean; // Para distinguir entre normales y personalizados
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// Constantes para precios por tamaño (mantenido por compatibilidad)
export const STICKER_PRICES = {
  small: 200,
  medium: 300,
  large: 400
} as const;

export type StickerSizeId = string; // Cambiado para permitir IDs dinámicos