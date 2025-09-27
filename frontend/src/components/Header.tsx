import React from 'react';

interface HeaderProps {
  onSearchChange: (query: string) => void;
  searchQuery: string;
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onSearchChange, searchQuery, cartCount = 0 }) => {
  return (
    <header className="bg-white shadow-soft border-b border-primary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="Avenida Stickers" 
              className="h-10 w-10 object-contain"
            />
            <h1 className="text-2xl font-bold text-primary-700">
              Avenida Stickers
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg 
                  className="h-5 w-5 text-primary-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar stickers..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-primary-200 rounded-lg 
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                         bg-primary-50 text-primary-900 placeholder-primary-400
                         transition duration-200"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <a 
              href="#" 
              className="text-primary-600 hover:text-primary-700 font-medium transition duration-200"
            >
              Inicio
            </a>
            <a 
              href="#" 
              className="text-primary-600 hover:text-primary-700 font-medium transition duration-200"
            >
              Categorías
            </a>
            <button className="relative bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition duration-200 shadow-soft flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6.5" 
                />
              </svg>
              <span>Carrito</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};