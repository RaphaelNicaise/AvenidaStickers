import React from 'react';

interface HomeProps {
  onViewCatalog: () => void;
}

export const Home: React.FC<HomeProps> = ({ onViewCatalog }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 relative overflow-hidden">
      {/* Header de navegación responsive */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center justify-center sm:justify-start space-x-3">
              <img 
                src="/logo.png" 
                alt="Avenida Stickers" 
                className="h-8 sm:h-10 w-8 sm:w-10 object-contain"
              />
              <span className="font-bold text-primary-700 text-base sm:text-lg">Avenida Stickers</span>
            </div>
            <button
              onClick={onViewCatalog}
              className="w-full sm:w-auto px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Ver Catálogo
            </button>
          </div>
        </div>
      </div>

      {/* Elementos decorativos de fondo - responsive */}
      <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-primary-200 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-16 sm:bottom-32 left-8 sm:left-16 w-24 sm:w-36 lg:w-48 h-24 sm:h-36 lg:h-48 bg-primary-300 rounded-full opacity-15 blur-2xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 relative z-10 pt-20 sm:pt-32">
        {/* Hero Section responsive */}
        <div className="text-center mb-8 sm:mb-12">
          {/* Logo Grande responsive */}
          <div className="flex flex-col sm:flex-row justify-center items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <img 
              src="/logo.png" 
              alt="Avenida Stickers" 
              className="h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32 object-contain drop-shadow-2xl"
            />
            {/* Instagram responsive */}
            <a
              href="https://www.instagram.com/av.stickerss/"
              target="_blank"
              rel="noopener noreferrer"
              className="sm:ml-6 p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 group"
            >
              <svg 
                className="w-6 h-6 sm:w-8 sm:h-8 text-white group-hover:scale-110 transition-transform duration-200" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>

          {/* Título Principal responsive con SUSE ExtraBold Italic */}
          <h1 className="font-artistic text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold italic text-primary-700 mb-4 sm:mb-6 leading-tight px-4" style={{ fontWeight: '800' }}>
            Avenida
            <span className="block text-primary-500 text-3xl sm:text-4xl md:text-5xl lg:text-7xl">Stickers</span>
          </h1>
          
          {/* Subtítulo responsive */}
          <p className="font-modern text-base sm:text-lg md:text-xl lg:text-2xl text-primary-600 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-4">
            Emprendimiento de <span className="font-semibold text-primary-700">stickers personalizados</span> en <span className="font-semibold text-primary-700">Bahía Blanca</span>
          </p>

          {/* CTA Button responsive - Movido aquí debajo del subtítulo */}
          <div className="mb-12 sm:mb-16">
            <button
              onClick={onViewCatalog}
              className="inline-flex items-center px-6 sm:px-8 lg:px-12 py-3 sm:py-4 bg-gradient-to-r from-primary-500 to-primary-600 
                       text-white font-modern font-semibold text-base sm:text-lg lg:text-xl rounded-full shadow-xl hover:shadow-2xl 
                       transform hover:scale-105 transition-all duration-300 group"
            >
              <span>Ver Catálogo de Stickers</span>
              <svg 
                className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-200" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Información resumida de la Feria responsive */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-card p-4 sm:p-6 lg:p-8 border border-primary-100 mx-4">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="font-artistic text-2xl sm:text-3xl font-semibold text-primary-700 mb-2">
                Feria de Stickers
              </h3>
              <p className="text-sm sm:text-base text-primary-600 font-medium">Todos los fines de semana en Bronx Social Club</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Horarios responsive */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary-500 rounded-xl mb-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-primary-700 mb-2 text-sm sm:text-base">Horarios</h4>
                <p className="text-primary-600 text-sm">Domingos</p>
                <p className="font-bold text-primary-700 text-sm sm:text-base">17:00 - 21:00 hs</p>
              </div>

              {/* Promociones responsive */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary-500 rounded-xl mb-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h4 className="font-semibold text-primary-700 mb-2 text-sm sm:text-base">Promociones</h4>
                <p className="text-primary-600 text-sm">Ofertas especiales</p>
                <p className="font-bold text-primary-700 text-sm sm:text-base">¡Consultá!</p>
              </div>

              {/* Ubicación responsive */}
              <div className="text-center sm:col-span-2 lg:col-span-1">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary-500 rounded-xl mb-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-primary-700 mb-2 text-sm sm:text-base">Ubicación</h4>
                <p className="text-primary-600 text-sm">Bronx Social Club</p>
                <p className="font-bold text-primary-700 text-sm sm:text-base">Casanova al 1000</p>
              </div>
            </div>

            {/* Google Maps responsive */}
            <div className="mt-6 sm:mt-8">
              <div className="w-full h-48 sm:h-56 lg:h-64 rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src="https://maps.google.com/maps?width=720&amp;height=400&amp;hl=en&amp;q=Casanova%201000%20Bahia%20Blanca+(Av%20Stickers)&amp;t=&amp;z=17&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                  title="Bronx Social Club - Casanova al 1000, Bahía Blanca"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};