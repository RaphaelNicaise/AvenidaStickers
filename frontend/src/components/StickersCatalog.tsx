import { useState, useEffect } from 'react';
import { StickerCard } from './StickerCard';
import { CategoryFilters } from './CategoryFilters';
import { Pagination } from './Pagination';
import { apiService } from '../services/api';
import type { Sticker, PaginationInfo } from '../types';

interface StickersCatalogProps {
  onBackToHome: () => void;
  onViewCart: () => void;
  cartCount: number;
  onAddToCart: (sticker: Sticker) => void;
  onCreatePersonalizedSticker?: () => void;
}

export const StickersCatalog: React.FC<StickersCatalogProps> = ({ 
  onBackToHome,
  onViewCart,
  cartCount, 
  onAddToCart,
  onCreatePersonalizedSticker
}) => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 24;

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
    loadStickers(1); // Cargar primera página inicial
  }, []);

  // Debounce para búsqueda y resetear página cuando cambian filtros
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1); // Resetear a página 1 cuando cambian los filtros
      loadStickers(1);
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(debounceTimer);
  }, [selectedCategories, searchQuery]);

  // Cargar stickers cuando cambia la página (solo para navegación de páginas)
  useEffect(() => {
    // Solo cargar cuando la página cambió y no es por filtros
    loadStickers(currentPage);
  }, [currentPage]);

  const loadCategories = async () => {
    try {
      const categoriesRes = await apiService.getCategories();
      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadStickers = async (page: number = currentPage) => {
    try {
      setLoading(true);
      const filters: { categories?: string; search?: string; page: number; limit: number } = {
        page,
        limit: ITEMS_PER_PAGE
      };
      
      if (selectedCategories.length > 0) {
        filters.categories = selectedCategories.join(',');
      }
      
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      const response = await apiService.getStickers(filters);
      
      if (response.success) {
        setStickers(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Error loading stickers:', err);
      setError('Error al buscar stickers');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || (pagination && page > pagination.totalPages)) {
      return; // Evitar páginas inválidas
    }
    
    if (page === currentPage) {
      return; // No hacer nada si ya estamos en esa página
    }
    
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">Cargando stickers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-card p-8 max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-primary-800 mb-2">Oops!</h2>
          <p className="text-primary-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              loadStickers(1);
              loadCategories();
            }}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 mr-4"
          >
            Reintentar
          </button>
          <button 
            onClick={onBackToHome}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header del Catálogo responsive */}
      <div className="bg-white shadow-soft border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-0 sm:h-16 space-y-4 sm:space-y-0">
            {/* Botón Volver + Logo responsive */}
            <div className="flex items-center justify-between sm:justify-start space-x-4">
              <button
                onClick={onBackToHome}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Volver</span>
              </button>
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo.png" 
                  alt="Avenida Stickers" 
                  className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                />
                <h1 className="text-lg sm:text-xl font-bold text-primary-700">
                  Avenida Stickers
                </h1>
              </div>
            </div>

            {/* Search Bar responsive */}
            <div className="flex-1 sm:max-w-lg sm:mx-8 order-last sm:order-none">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-4 w-4 sm:h-5 sm:w-5 text-primary-400" 
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-8 sm:pl-10 pr-3 py-2 text-sm sm:text-base border border-primary-200 rounded-lg 
                           focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                           bg-primary-50 text-primary-900 placeholder-primary-400
                           transition duration-200"
                />
              </div>
            </div>

            {/* Botones de acción (Personalizado + Carrito) responsive */}
            <div className="flex items-center justify-center sm:justify-end space-x-2">
              {/* Botón Sticker Personalizado */}
              {onCreatePersonalizedSticker && (
                <button 
                  onClick={onCreatePersonalizedSticker}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium 
                           transition duration-200 shadow-soft flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Personalizado</span>
                  <span className="sm:hidden">+</span>
                </button>
              )}
              
              {/* Botón Carrito */}
              <button 
                onClick={onViewCart}
                className="relative bg-primary-500 hover:bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition duration-200 shadow-soft flex items-center space-x-2"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" 
                  />
                </svg>
                <span>Carrito</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Filtros de categorías */}
        <CategoryFilters
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          onClearFilters={handleClearFilters}
        />

        {/* Resultados */}
        <div className="mb-4 sm:mb-6">
          <p className="text-primary-700 font-medium text-sm sm:text-base">
            {stickers.length === 0 
              ? 'No se encontraron stickers' 
              : pagination
              ? `${pagination.totalStickers} sticker${pagination.totalStickers !== 1 ? 's' : ''} encontrado${pagination.totalStickers !== 1 ? 's' : ''}`
              : `${stickers.length} sticker${stickers.length !== 1 ? 's' : ''} encontrado${stickers.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* Grid de stickers */}
        {stickers.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {stickers.map((sticker) => (
                <StickerCard
                  key={sticker._id}
                  sticker={sticker}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
            
            {/* Paginación */}
            {pagination && (
              <Pagination 
                pagination={pagination} 
                onPageChange={handlePageChange} 
              />
            )}
          </>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <div className="text-primary-300 text-6xl sm:text-8xl mb-3 sm:mb-4">🔍</div>
            <h3 className="text-lg sm:text-xl font-semibold text-primary-800 mb-2">
              No hay stickers disponibles
            </h3>
            <p className="text-primary-600 max-w-md mx-auto text-sm sm:text-base px-4">
              {selectedCategories.length > 0 || searchQuery 
                ? 'Prueba ajustando los filtros de búsqueda o categorías.'
                : 'Parece que aún no hay stickers disponibles. ¡Vuelve pronto!'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};