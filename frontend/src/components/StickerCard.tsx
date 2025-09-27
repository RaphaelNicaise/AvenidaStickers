import React, { useState } from 'react';
import type { Sticker } from '../types';
import { apiService } from '../services/api';

interface StickerCardProps {
  sticker: Sticker;
  onAddToCart: (sticker: Sticker) => void;
}

export const StickerCard: React.FC<StickerCardProps> = ({ sticker, onAddToCart }) => {
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleAddToCart = async () => {
    if (isAdding || justAdded) return;
    
    console.log('🎯 StickerCard: handleAddToCart called for sticker:', sticker.id_sticker);
    
    setIsAdding(true);
    
    // Feedback háptico si está disponible
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Simular un pequeño delay para mostrar el estado de carga
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('🎯 StickerCard: Calling onAddToCart with sticker:', sticker.id_sticker);
    onAddToCart(sticker);
    
    setIsAdding(false);
    setJustAdded(true);
    
    // Segundo feedback háptico para confirmar
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
    
    // Resetear el estado después de 1.2 segundos con transición suave
    setTimeout(() => {
      setJustAdded(false);
    }, 1200);
  };

  // Función para verificar si la imagen es PNG
  const isPngImage = (imagePath: string): boolean => {
    return imagePath.toLowerCase().endsWith('.png');
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-card hover:shadow-lg transition-all duration-500 overflow-hidden group transform hover:-translate-y-1 ${
        justAdded ? 'ring-2 ring-green-300 ring-opacity-40 shadow-green-100/50 shadow-xl' : ''
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setShowAllCategories(false);
      }}
    >
      {/* Imagen del sticker */}
      <div className={`relative aspect-square overflow-hidden transition-all duration-500 ${
        isPngImage(sticker.imagePath) ? 'bg-gray-100' : 'bg-primary-50'
      } ${justAdded ? 'bg-green-50' : ''}`}>
        {!imageError ? (
          <img
            src={apiService.getImageUrl(sticker.imagePath)}
            alt={`Sticker ${sticker.id_sticker}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 sm:w-12 sm:h-12 text-primary-300" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
        )}
        
        {/* Overlay de categorías solo al hover */}
        {sticker.categories && sticker.categories.length > 0 && isHovering && (
          <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
            {showAllCategories ? (
              // Mostrar todas las categorías
              sticker.categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-black/70 text-white backdrop-blur-sm capitalize shadow-sm"
                >
                  {category}
                </span>
              ))
            ) : (
              // Mostrar solo las primeras 3 + botón de expandir
              <>
                {sticker.categories.slice(0, 3).map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-black/70 text-white backdrop-blur-sm capitalize shadow-sm"
                  >
                    {category}
                  </span>
                ))}
                {sticker.categories.length > 3 && (
                  <button
                    type="button"
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-black/70 text-white backdrop-blur-sm shadow-sm hover:bg-black/90 transition-colors focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllCategories(true);
                    }}
                    title="Ver todas las categorías"
                  >
                    ⋯
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Contenido de la tarjeta - ahora solo ID y botón */}
      <div className="p-2 sm:p-3">
        {/* ID del sticker */}
        <h3 className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 font-mono">
          #{sticker.id_sticker}
        </h3>

        {/* Botón agregar al carrito */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || justAdded}
          className={`w-full font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg 
                   transition-all duration-300 flex items-center justify-center space-x-1 sm:space-x-2 shadow-soft text-xs sm:text-sm
                   transform active:scale-95 relative overflow-hidden ${
            justAdded 
              ? 'bg-green-500 text-white shadow-lg scale-105' 
              : isAdding 
                ? 'bg-primary-400 text-white cursor-not-allowed' 
                : 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {/* Efecto de ondas al hacer click */}
          <div className={`absolute inset-0 bg-white/20 rounded-full transform transition-all duration-500 ${
            isAdding ? 'scale-150 opacity-0' : 'scale-0 opacity-100'
          }`}></div>
          
          {/* Icono del carrito */}
          <div className="relative z-10 flex items-center space-x-1 sm:space-x-2">
            {justAdded ? (
              // Icono de check cuando se agregó
              <>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">¡Agregado!</span>
                <span className="sm:hidden">✓</span>
              </>
            ) : isAdding ? (
              // Spinner cuando está agregando
              <>
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Agregando...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              // Icono normal del carrito
              <>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" 
                  />
                </svg>
                <span className="hidden sm:inline">Agregar</span>
                <span className="sm:hidden">+</span>
              </>
            )}
          </div>
          
          {/* Efecto de partículas más sutil cuando se agrega exitosamente */}
          {justAdded && (
            <>
              <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-white/80 rounded-full animate-ping opacity-60"></div>
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white/80 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.15s' }}></div>
              <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-white/80 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.3s' }}></div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};