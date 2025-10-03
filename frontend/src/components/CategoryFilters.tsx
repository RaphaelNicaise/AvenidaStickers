import React from 'react';

interface CategoryWithCount {
  name: string;
  count: number;
}

interface CategoryFiltersProps {
  categories: CategoryWithCount[];
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

      <div className="max-h-48 overflow-y-auto pr-2">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.name);
            const isSinCategoria = category.name === 'sin-categoria';
            
            return (
              <button
                key={category.name}
                onClick={() => onCategoryToggle(category.name)}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 
                           border ${isSinCategoria ? 'italic' : 'capitalize'} ${
                  isSelected
                    ? isSinCategoria
                      ? 'border-gray-500 bg-gray-500 text-white shadow-sm'
                      : 'border-primary-500 bg-primary-500 text-white shadow-sm'
                    : isSinCategoria
                      ? 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                      : 'border-primary-200 bg-white text-primary-600 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <span>{isSinCategoria ? 'Sin categoría' : category.name}</span>
                  <span className={`text-xs ${
                    isSelected 
                      ? isSinCategoria ? 'text-gray-200' : 'text-primary-200'
                      : isSinCategoria ? 'text-gray-400' : 'text-primary-400'
                  }`}>
                    {category.count}
                  </span>
                  {isSelected && (
                    <span className={`ml-1 ${
                      isSinCategoria ? 'text-gray-200' : 'text-primary-200'
                    }`}>✓</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
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