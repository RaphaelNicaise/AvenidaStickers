import React, { useState, useEffect } from 'react';
import { adminApiService } from '../../services/adminApi';
import ToastContainer from '../ui/ToastContainer';
import ConfirmModal from '../ui/ConfirmModal';
import { useToast } from '../../hooks/useToast';

interface CategoryManagementProps {}

const CategoryManagement: React.FC<CategoryManagementProps> = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para búsqueda y formulario
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Estados para confirmación y notificaciones
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      adminApiService.setToken(token);
    }
    loadCategories();
  }, []);

  useEffect(() => {
    // Filtrar categorías cuando cambia la búsqueda
    const filtered = categories.filter(category =>
      category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories, searchQuery]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getCategories();
      
      if (response.success) {
        // Ordenar alfabéticamente
        const sortedCategories = response.data.sort((a: string, b: string) => 
          a.toLowerCase().localeCompare(b.toLowerCase())
        );
        setCategories(sortedCategories);
      } else {
        setError('Error al cargar las categorías');
        showError('Error al cargar las categorías');
      }
    } catch (err) {
      setError('Error de conexión');
      showError('Error de conexión');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const categoryName = newCategoryName.trim().toLowerCase();
    
    if (!categoryName) {
      showError('El nombre de la categoría es obligatorio');
      return;
    }

    if (categories.includes(categoryName)) {
      showError('Esta categoría ya existe');
      return;
    }

    try {
      setIsAdding(true);
      const response = await adminApiService.createCategory(categoryName);
      
      if (response.success) {
        setCategories(response.data.sort((a: string, b: string) => 
          a.toLowerCase().localeCompare(b.toLowerCase())
        ));
        setNewCategoryName('');
        showSuccess(`Categoría "${categoryName}" agregada exitosamente`);
      } else {
        showError('Error al crear la categoría');
      }
    } catch (err) {
      showError('Error de conexión al crear la categoría');
      console.error('Error creating category:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = (categoryName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Categoría',
      message: `¿Estás seguro de que quieres eliminar la categoría "${categoryName}"? Esta acción también eliminará esta categoría de todos los stickers que la tengan asignada y no se puede deshacer.`,
      onConfirm: () => confirmDeleteCategory(categoryName)
    });
  };

  const confirmDeleteCategory = async (categoryName: string) => {
    try {
      const response = await adminApiService.deleteCategory(categoryName);
      
      if (response.success) {
        setCategories(response.data.sort((a: string, b: string) => 
          a.toLowerCase().localeCompare(b.toLowerCase())
        ));
        showSuccess(`Categoría "${categoryName}" eliminada exitosamente`);
      } else {
        showError('Error al eliminar la categoría');
      }
    } catch (err) {
      showError('Error de conexión al eliminar la categoría');
      console.error('Error deleting category:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-primary-700">Cargando categorías...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={loadCategories}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
          <p className="text-gray-600">Administra las categorías disponibles para los stickers</p>
        </div>
        <div className="text-sm text-gray-500">
          {categories.length} categorías totales
        </div>
      </div>

      {/* Agregar nueva categoría */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Agregar Nueva Categoría</h2>
        <div className="flex space-x-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nombre de la nueva categoría..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory();
              }
            }}
          />
          <button
            onClick={handleAddCategory}
            disabled={isAdding || !newCategoryName.trim()}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-lg flex items-center space-x-2"
          >
            {isAdding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Agregando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Búsqueda y Lista de categorías - combinados en un solo contenedor */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Búsqueda integrada */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Categorías Disponibles</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="block w-40 pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs px-2 py-1 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
          
          {searchQuery && (
            <div className="mt-2 text-xs text-gray-600">
              {filteredCategories.length} de {categories.length} categorías
            </div>
          )}
        </div>

        {filteredCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mr-3"></div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {category}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium w-20">
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title={`Eliminar categoría "${category}"`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">🏷️</div>
            <h3 className="text-md font-semibold text-gray-900 mb-1">
              {searchQuery ? 'No se encontraron categorías' : 'No hay categorías disponibles'}
            </h3>
            <p className="text-sm text-gray-600">
              {searchQuery 
                ? 'Prueba ajustar tu término de búsqueda.'
                : 'Agrega tu primera categoría usando el formulario de arriba.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Contenedor de notificaciones */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={removeToast}
      />
    </div>
  );
};

export default CategoryManagement;