import React from 'react';

interface CategoryFiltersProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onClearFilters: () => void;
}

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  categories,
  selectedCategories,
  onCategoryToggle,
  onClearFilters,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-soft p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-base sm:text-lg font-semibold text-primary-800">
          Filtrar por Categoría
        </h3>
        {selectedCategories.length > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-primary-500 hover:text-primary-700 font-medium 
                     transition-colors duration-200 self-start sm:self-auto"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Opción para stickers sin categoría */}
        <button
          key="sin-categoria"
          onClick={() => onCategoryToggle('sin-categoria')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 
                     border-2 italic ${
            selectedCategories.includes('sin-categoria')
              ? 'border-gray-500 bg-gray-500 text-white shadow-soft'
              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          Sin categoría
          {selectedCategories.includes('sin-categoria') && (
            <span className="ml-1 sm:ml-2 text-gray-200">✓</span>
          )}
        </button>
        
        {/* Categorías normales */}
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category);
          return (
            <button
              key={category}
              onClick={() => onCategoryToggle(category)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 
                         border-2 capitalize ${
                isSelected
                  ? 'border-primary-500 bg-primary-500 text-white shadow-soft'
                  : 'border-primary-200 bg-white text-primary-600 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              {category}
              {isSelected && (
                <span className="ml-1 sm:ml-2 text-primary-200">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedCategories.length > 0 && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-primary-100">
          <p className="text-xs sm:text-sm text-primary-600">
            <span className="font-medium">{selectedCategories.length}</span> 
            {selectedCategories.length === 1 ? ' categoría seleccionada' : ' categorías seleccionadas'}
          </p>
        </div>
      )}
    </div>
  );
};