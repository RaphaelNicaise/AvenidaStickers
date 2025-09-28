import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { personalizedStickerApiService } from '../services/personalizedStickerApi';
import type { Cart, StickerSize, Sticker, PersonalizedSticker } from '../types';
import { StickerCard } from './StickerCard';
import PersonalizedStickerForm from './PersonalizedStickerForm';
import CartImage from './ui/CartImage';
import { calculateTotalPrice, getDisplayPrice } from '../utils/priceCalculator';
import { useToast } from '../hooks/useToast';

interface CartProps {
  cart: Cart;
  loading: boolean;
  onUpdateCart: (cart: Cart) => void;
  onBackToCatalog: () => void;
  onAddToCart: (sticker: Sticker) => void;
}

export const CartComponent: React.FC<CartProps> = ({
  cart,
  loading,
  onUpdateCart,
  onBackToCatalog,
  onAddToCart,
}) => {
  const [stickerSizes, setStickerSizes] = useState<StickerSize[]>([]);
  const [recommendedStickers, setRecommendedStickers] = useState<Sticker[]>([]);
  const [showPersonalizedForm, setShowPersonalizedForm] = useState(false);
  // Estado para manejar los valores temporales de cantidad en los inputs
  const [temporaryQuantities, setTemporaryQuantities] = useState<Record<string, string>>({});

  const { showError, showSuccess } = useToast();

  // Función para verificar si la imagen es PNG
  const isPngImage = (imagePath: string): boolean => {
    return imagePath.toLowerCase().endsWith('.png');
  };

  // Función para verificar si un sticker es personalizado
  const isPersonalizedSticker = (sticker: Sticker | PersonalizedSticker): sticker is PersonalizedSticker => {
    return 'id_personalized' in sticker;
  };

  // Función para obtener el ID del sticker
  const getStickerId = (sticker: Sticker | PersonalizedSticker | any): string => {
    // Mostrar ID normal para stickers temporales ya que ahora tienen IDs reales
    return isPersonalizedSticker(sticker) ? sticker.id_personalized : sticker?.id_sticker || 'Unknown';
  };

  // Función para manejar la creación de stickers personalizados temporales
  const handlePersonalizedStickerCreated = (personalizedSticker: PersonalizedSticker) => {
    // Por defecto, agregar con tamaño medium si está disponible, o el primer tamaño disponible
    const defaultSize = stickerSizes.find(size => size.id === 'medium') || stickerSizes[0];
    
    if (defaultSize) {
      const cartItem = {
        id: `personalized-${personalizedSticker._id}-${Date.now()}`,
        sticker: personalizedSticker,
        size: defaultSize,
        quantity: 1,
        totalPrice: calculateTotalPrice(defaultSize, 1, true),
        isPersonalized: true,
      };

      const updatedItems = [...cart.items, cartItem];
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

      onUpdateCart({
        ...cart,
        items: updatedItems,
        totalItems,
        totalPrice,
      });

      setShowPersonalizedForm(false);
    }
  };

  useEffect(() => {
    const loadStickerSizes = async () => {
      try {
        const response = await apiService.getStickerSizes();
        console.log('📏 Loaded sticker sizes from backend:', response.data?.sizes);
        // El backend devuelve { success: true, data: { sizes: [...], currency, updatedAt } }
        setStickerSizes(response.data?.sizes || []);
      } catch (error) {
        console.error('Error loading sticker sizes:', error);
      }
    };

    loadStickerSizes();
  }, []);

  // Cargar stickers recomendados basados en las categorías del carrito
  useEffect(() => {
    const loadRecommendations = async () => {
      if (cart.items.length === 0) {
        setRecommendedStickers([]);
        return;
      }

      try {
        // IDs de stickers que ya están en el carrito
        const cartStickerIds = cart.items.map(item => item.sticker._id);

        // Obtener todas las categorías de los stickers normales del carrito (no personalizados)
        const cartCategories = cart.items.reduce((categories: string[], item) => {
          if (!isPersonalizedSticker(item.sticker) && item.sticker.categories) {
            item.sticker.categories.forEach((cat: string) => {
              if (!categories.includes(cat)) {
                categories.push(cat);
              }
            });
          }
          return categories;
        }, []);

        let recommended: Sticker[] = [];
        
        // Intentar obtener stickers por categorías similares primero
        if (cartCategories.length > 0) {
          const response = await apiService.getStickers({ 
            categories: cartCategories.join(','),
            limit: 20 // Obtener más para tener opciones para filtrar
          });
          
          // Filtrar stickers que no estén ya en el carrito
          recommended = response.data.filter(sticker => 
            !cartStickerIds.includes(sticker._id)
          );
        }

        // Si no tenemos suficientes recomendaciones (menos de 6), completar con stickers aleatorios
        if (recommended.length < 6) {
          const allStickersResponse = await apiService.getStickers({ 
            limit: 20 // Obtener más para tener opciones
          });
          const availableStickers = allStickersResponse.data.filter(sticker => 
            !cartStickerIds.includes(sticker._id) && 
            !recommended.some(rec => rec._id === sticker._id)
          );
          
          // Agregar stickers aleatorios hasta completar 6
          const remainingSlots = 6 - recommended.length;
          const additionalStickers = availableStickers.slice(0, remainingSlots);
          recommended = [...recommended, ...additionalStickers];
        }

        // Limitar a 6 recomendaciones máximo
        setRecommendedStickers(recommended.slice(0, 6));
      } catch (error) {
        console.error('Error loading recommendations:', error);
        // En caso de error, intentar cargar stickers aleatorios
        try {
          const cartStickerIds = cart.items.map(item => item.sticker._id);
          const response = await apiService.getStickers({ limit: 12 });
          const availableStickers = response.data.filter(sticker => 
            !cartStickerIds.includes(sticker._id)
          ).slice(0, 6);
          setRecommendedStickers(availableStickers);
        } catch (fallbackError) {
          console.error('Error loading fallback recommendations:', fallbackError);
          setRecommendedStickers([]);
        }
      }
    };

    loadRecommendations();
  }, [cart.items]);

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedItems = cart.items.map(item => {
      if (item.id === itemId) {
        const totalPrice = calculateTotalPrice(item.size, newQuantity, item.isPersonalized || false);
        return { ...item, quantity: newQuantity, totalPrice };
      }
      return item;
    });

    const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    onUpdateCart({
      ...cart,
      items: updatedItems,
      totalItems,
      totalPrice,
    });
  };

  const updateItemSize = (itemId: string, newSize: StickerSize) => {
    const updatedItems = cart.items.map(item => {
      if (item.id === itemId) {
        const totalPrice = calculateTotalPrice(newSize, item.quantity, item.isPersonalized || false);
        return { ...item, size: newSize, totalPrice };
      }
      return item;
    });

    const totalPrice = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    onUpdateCart({
      ...cart,
      items: updatedItems,
      totalPrice,
    });
  };

  const removeItem = (itemId: string) => {
    const updatedItems = cart.items.filter(item => item.id !== itemId);
    const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    onUpdateCart({
      ...cart,
      items: updatedItems,
      totalItems,
      totalPrice,
    });
  };

  const clearCart = () => {
    onUpdateCart({
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  };

  const generateWhatsAppMessage = () => {
    let message = `¡Hola! Me gustaría hacer un pedido de stickers:\n\n`;
    
    cart.items.forEach((item, index) => {
      const stickerId = getStickerId(item.sticker);
      message += `${index + 1}. Sticker #${stickerId} - ${item.size.name} (${item.size.dimensions}cm) x${item.quantity}\n`;
    });

    message += `\nTotal: ${cart.totalItems} stickers\n\n`;
    message += `¡Gracias! 😊`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppOrder = async () => {
    try {
      // Verificar si hay stickers temporales que necesiten ser confirmados
      const temporaryStickers = cart.items.filter(item => 
        item.sticker && (item.sticker as any).status === 'temporary'
      );

      if (temporaryStickers.length > 0) {
        showSuccess('Confirmando stickers personalizados...');
        
        // Obtener IDs de stickers temporales
        const stickerIds = temporaryStickers.map(item => item.sticker._id);
        
        // Confirmar stickers temporales (convertir a activos)
        await personalizedStickerApiService.confirmTemporaryStickers(stickerIds);
        
        showSuccess('Stickers personalizados confirmados correctamente');
      }

      // Generar y abrir el mensaje de WhatsApp
      const message = generateWhatsAppMessage();
      const whatsappUrl = `https://wa.me/5492914705787?text=${message}`;
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      showError('Error al procesar el pedido');
      console.error('Error in handleWhatsAppOrder:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header del Carrito */}
      <div className="bg-white shadow-soft border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-0 sm:h-16 space-y-3 sm:space-y-0">
            {/* Navegación */}
            <div className="flex items-center justify-center sm:justify-start space-x-4 order-2 sm:order-1">
              <button
                onClick={onBackToCatalog}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Volver al Catálogo</span>
              </button>
            </div>

            {/* Título */}
            <div className="flex items-center justify-center space-x-3 order-1 sm:order-2">
              <div className="text-primary-400 text-2xl sm:text-3xl">🛒</div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary-800">Mi Carrito</h1>
            </div>

            {/* Contador de stickers y acciones */}
            <div className="flex items-center justify-center sm:justify-end space-x-4 order-3">
              <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                {cart.totalItems} stickers
              </div>
              {cart.items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors duration-200"
                >
                  Vaciar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {cart.items.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-primary-300 text-6xl sm:text-8xl mb-4">🛒</div>
            <h3 className="text-xl sm:text-2xl font-semibold text-primary-800 mb-2">
              Tu carrito está vacío
            </h3>
            <p className="text-primary-600 max-w-md mx-auto mb-6 px-4">
              ¡Explora nuestro catálogo y encuentra los stickers perfectos para ti!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={onBackToCatalog}
                className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 
                         text-white font-medium rounded-lg transition-colors duration-200"
              >
                Ver Catálogo
              </button>
              <button
                onClick={() => setShowPersonalizedForm(true)}
                className="inline-flex items-center px-6 py-3 bg-purple-500 hover:bg-purple-600 
                         text-white font-medium rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 4v16m8-8H4" />
                </svg>
                Crear Personalizado
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Layout principal con dos columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Lista de productos - 2/3 del ancho en desktop */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Container con scroll para los items del carrito */}
                <div className="bg-white rounded-lg shadow-card overflow-hidden">
                  <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg shadow-sm p-4">
                        <div className="flex items-center space-x-4">
                          {/* Imagen del sticker */}
                          <CartImage
                            imagePath={item.sticker.imagePath}
                            alt={`Sticker ${getStickerId(item.sticker)}`}
                            isPng={isPngImage(item.sticker.imagePath)}
                          />

                          {/* Información del producto en una sola fila compacta */}
                          <div className="flex-grow min-w-0">
                            {/* ID del sticker */}
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm text-gray-500 font-mono truncate text-left">
                                #{getStickerId(item.sticker)}
                              </h3>
                              {/* Etiqueta de personalizado */}
                              {item.isPersonalized && (
                                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                  Personalizado +20%
                                </span>
                              )}
                            </div>
                            
                            {/* Controles en una sola línea */}
                            <div className="flex items-center justify-between mt-1">
                              {/* Selector de tamaño */}
                              <div className="flex items-center space-x-1">
                                {stickerSizes.map((size) => (
                                  <button
                                    key={size.id}
                                    onClick={() => updateItemSize(item.id, size)}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                      item.size.id === size.id
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                                    }`}
                                  >
                                    <div className="text-center">
                                      <div className="font-semibold">{size.name}</div>
                                      <div className="text-xs opacity-75">{size.dimensions}cm</div>
                                    </div>
                                  </button>
                                ))}
                              </div>

                              {/* Cantidad */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                  className="w-7 h-7 rounded-full bg-primary-100 hover:bg-primary-200 
                                           text-primary-700 flex items-center justify-center transition-colors
                                           text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max="10000"
                                  value={temporaryQuantities[item.id] !== undefined ? temporaryQuantities[item.id] : item.quantity}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    
                                    // Permitir valores vacíos temporalmente
                                    if (value === '') {
                                      setTemporaryQuantities(prev => ({ ...prev, [item.id]: '' }));
                                      return;
                                    }
                                    
                                    // Actualizar valor temporal
                                    setTemporaryQuantities(prev => ({ ...prev, [item.id]: value }));
                                    
                                    // Si es un número válido, actualizar inmediatamente
                                    const newQuantity = parseInt(value);
                                    if (!isNaN(newQuantity) && newQuantity >= 1 && newQuantity <= 10000) {
                                      updateItemQuantity(item.id, newQuantity);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Al perder el foco, asegurar que hay un valor válido
                                    const value = e.target.value;
                                    if (value === '' || parseInt(value) < 1) {
                                      updateItemQuantity(item.id, 1);
                                    }
                                    // Limpiar valor temporal
                                    setTemporaryQuantities(prev => {
                                      const newState = { ...prev };
                                      delete newState[item.id];
                                      return newState;
                                    });
                                  }}
                                  className="w-16 text-center text-sm font-semibold text-primary-800 
                                           border border-primary-200 rounded focus:ring-2 focus:ring-primary-500 
                                           focus:border-primary-500 focus:outline-none"
                                />
                                <button
                                  onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                  className="w-7 h-7 rounded-full bg-primary-100 hover:bg-primary-200 
                                           text-primary-700 flex items-center justify-center transition-colors
                                           text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={item.quantity >= 10000}
                                >
                                  +
                                </button>
                              </div>

                              {/* Precio y eliminar */}
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <div className="text-sm font-bold text-primary-700">
                                    ${item.totalPrice}
                                  </div>
                                  <div className="text-xs text-primary-500">
                                    ${getDisplayPrice(item.size, item.isPersonalized || false)} c/u
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 rounded"
                                  title="Eliminar item"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resumen del pedido - 1/3 del ancho en desktop */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-card p-4 sticky top-4">
                  <h2 className="text-lg font-bold text-primary-800 mb-4">Resumen</h2>
                  
                  {/* Total simplificado */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary-700">Cantidad total:</span>
                      <span className="text-sm font-semibold text-primary-800">{cart.totalItems}</span>
                    </div>
                    <div className="border-t border-primary-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-primary-800">Total:</span>
                        <span className="text-lg font-bold text-primary-700">${cart.totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón para stickers personalizados */}
                  <div className="mb-4">
                    <button
                      onClick={() => setShowPersonalizedForm(true)}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-3 
                               rounded-lg transition-all duration-200 flex items-center justify-center space-x-2
                               shadow hover:shadow-lg transform hover:scale-[1.02] text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Agregar Sticker Personalizado</span>
                    </button>
                  </div>

                  {/* Nota sobre coordinación */}
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start space-x-2">
                      <div className="text-primary-500 mt-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-primary-700 font-medium mb-1">
                          Coordinación por WhatsApp
                        </p>
                        <p className="text-xs text-primary-600">
                          Envío y pago se coordinan por WhatsApp.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botón de pedido */}
                  <button
                    onClick={handleWhatsAppOrder}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-3 
                             rounded-lg transition-all duration-200 flex items-center justify-center space-x-2
                             shadow hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109z"/>
                    </svg>
                    <span className="text-sm font-semibold">Hacer Pedido</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Sección de recomendaciones */}
            {recommendedStickers.length > 0 && (
              <div className="mt-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-primary-800 mb-2">
                    No te olvides de llevarte estos
                  </h3>
                  <p className="text-primary-600">
                    Stickers que podrían interesarte basados en tu selección
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {recommendedStickers.map((sticker) => (
                    <StickerCard
                      key={sticker._id}
                      sticker={sticker}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal para stickers personalizados */}
      {showPersonalizedForm && (
        <PersonalizedStickerForm
          onStickerCreated={handlePersonalizedStickerCreated}
          onCancel={() => setShowPersonalizedForm(false)}
        />
      )}
    </div>
  );
};