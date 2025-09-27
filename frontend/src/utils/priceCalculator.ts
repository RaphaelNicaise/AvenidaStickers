import type { StickerSize } from '../types';

/**
 * Calcula el precio para un sticker, aplicando un incremento del 20% si es personalizado
 * @param basePrice - Precio base del tamaño
 * @param isPersonalized - Si es un sticker personalizado
 * @returns Precio final con incremento aplicado si corresponde
 */
export const calculateStickerPrice = (basePrice: number, isPersonalized: boolean = false): number => {
  console.log(`💰 Calculating price: basePrice=${basePrice}, isPersonalized=${isPersonalized}`);
  if (isPersonalized) {
    // Agregar 20% al precio base para stickers personalizados
    const finalPrice = Math.round(basePrice * 1.2);
    console.log(`💰 Final price with 20% markup: ${finalPrice}`);
    return finalPrice;
  }
  console.log(`💰 Final price (no markup): ${basePrice}`);
  return basePrice;
};

/**
 * Calcula el precio total para un item del carrito
 * @param size - Tamaño del sticker con precio base
 * @param quantity - Cantidad
 * @param isPersonalized - Si es personalizado
 * @returns Precio total calculado
 */
export const calculateTotalPrice = (
  size: StickerSize, 
  quantity: number, 
  isPersonalized: boolean = false
): number => {
  const unitPrice = calculateStickerPrice(size.price, isPersonalized);
  return unitPrice * quantity;
};

/**
 * Obtiene el precio unitario para mostrar en la UI
 * @param size - Tamaño del sticker
 * @param isPersonalized - Si es personalizado
 * @returns Precio unitario formateado
 */
export const getDisplayPrice = (size: StickerSize, isPersonalized: boolean = false): number => {
  return calculateStickerPrice(size.price, isPersonalized);
};