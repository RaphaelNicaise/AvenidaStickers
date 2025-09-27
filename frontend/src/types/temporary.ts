import type { Sticker, PersonalizedSticker, StickerSize } from './index';

export interface TemporaryPersonalizedSticker {
  id: string; // ID temporal único
  imageFile?: File; // Para uploads
  imageUrl?: string; // Para Pinterest
  source: 'upload' | 'pinterest';
  originalUrl?: string; // Para Pinterest
  createdAt: Date;
}

// Tipo extendido para manejar stickers temporales en el carrito
export interface TemporaryPersonalizedStickerForCart {
  _id: string;
  id_personalized: string;
  imagePath: string;
  source: 'upload' | 'pinterest';
  originalUrl?: string;
  status: 'temporary' | 'active' | 'published';
  expiresAt?: string; // Fecha de expiración automática
  createdAt: string;
  updatedAt: string;
  isTemporary?: boolean;
  tempData?: TemporaryPersonalizedSticker;
}

export interface CartItemWithTemp {
  id: string;
  sticker?: Sticker | PersonalizedSticker | TemporaryPersonalizedStickerForCart;
  tempSticker?: TemporaryPersonalizedSticker; // Para stickers temporales
  size: StickerSize;
  quantity: number;
  totalPrice: number;
  isPersonalized?: boolean;
}

export interface CartWithTemp {
  items: CartItemWithTemp[];
  totalItems: number;
  totalPrice: number;
}