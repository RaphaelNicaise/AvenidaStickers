import React, { useState, useEffect } from 'react';

export const FairGallery: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // Definir las imágenes disponibles en la carpeta feria
  const images = [
    {
      src: '/feria/chicas.jpeg',
      alt: 'Feria de Stickers - Participantes',
      title: 'Ambiente de la Feria'
    },
    {
      src: '/feria/mate.jpeg', 
      alt: 'Feria de Stickers - Stand',
      title: 'Nuestro Stand'
    }
    // Nota: Para agregar más imágenes automáticamente, necesitaríamos una API del backend
    // que liste los archivos de la carpeta /public/feria
  ];

  // Auto-avanzar cada 4 segundos
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false); // Pausar auto-play cuando el usuario interactúa
    
    // Reanudar auto-play después de 8 segundos
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  return (
    <div className="mt-6 sm:mt-8">
      
      {/* Carousel Container */}
      <div className="relative rounded-xl overflow-hidden shadow-lg max-w-2xl mx-auto">
        {/* Images */}
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="w-full flex-shrink-0 relative">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-64 sm:h-80 object-cover"
                loading="lazy"
              />
              {/* Overlay con información */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                <div className="absolute bottom-4 left-4 text-white">
                  <h5 className="font-semibold text-sm sm:text-base mb-1">{image.title}</h5>
                  <div className="flex items-center space-x-2 text-xs sm:text-sm opacity-90">
                    <span>{index + 1} de {images.length}</span>
                    {isAutoPlaying && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>Auto</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
              aria-label="Imagen anterior"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
              aria-label="Imagen siguiente"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots Navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-2xl ${
                  currentIndex === index 
                    ? 'w-8 h-1 bg-white' 
                    : 'w-4 h-1 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
          aria-label={isAutoPlaying ? 'Pausar carousel' : 'Reproducir carousel'}
        >
          {isAutoPlaying ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 14h1m4 0h1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};