import React, { useState, useEffect } from 'react';
import { adminApiService } from '../../services/adminApi';
import StickerForm from './StickerForm';
import ToastContainer from '../ui/ToastContainer';
import ConfirmModal from '../ui/ConfirmModal';
import AdminImage from '../ui/AdminImage';
import { useToast } from '../../hooks/useToast';
import type { Sticker } from '../../types';

interface StickerManagementProps {}

const StickerManagement: React.FC<StickerManagementProps> = () => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  
  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingSticker, setEditingSticker] = useState<Sticker | null>(null);

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

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    // Configurar token del localStorage
    const token = localStorage.getItem('adminToken');
    if (token) {
      adminApiService.setToken(token);
    }
    
    loadData();
  }, []);

  useEffect(() => {
    loadStickers();
  }, [searchQuery, selectedCategory, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stickersRes, categoriesRes] = await Promise.all([
        adminApiService.getStickers({ page: 1, limit: ITEMS_PER_PAGE }),
        adminApiService.getCategories()
      ]);

      if (stickersRes.success) {
        setStickers(stickersRes.data);
        setPagination(stickersRes.pagination);
      }

      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }
    } catch (err) {
      setError('Error al cargar los datos');
      showError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStickers = async () => {
    try {
      setLoading(true);
      const filters: any = { page: currentPage, limit: ITEMS_PER_PAGE };
      
      if (selectedCategory) filters.categories = selectedCategory;
      if (searchQuery) filters.search = searchQuery;

      const response = await adminApiService.getStickers(filters);
      
      if (response.success) {
        setStickers(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError('Error al buscar stickers');
      showError('Error al buscar stickers');
      console.error('Error loading stickers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, id_sticker: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Sticker',
      message: `¿Estás seguro de que quieres eliminar el sticker #${id_sticker}? Esta acción no se puede deshacer.`,
      onConfirm: () => confirmDelete(id, id_sticker)
    });
  };

  const confirmDelete = async (id: string, id_sticker: string) => {
    try {
      const response = await adminApiService.deleteSticker(id);
      if (response.success) {
        await loadStickers();
        showSuccess(`Sticker #${id_sticker} eliminado exitosamente`);
      }
    } catch (err) {
      showError('Error al eliminar el sticker');
      console.error('Error deleting sticker:', err);
    }
  };

  const handleEdit = (sticker: Sticker) => {
    setEditingSticker(sticker);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingSticker(null);
    setShowForm(true);
  };

  if (loading && stickers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-primary-700">Cargando stickers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={loadData}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón agregar */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Stickers</h1>
        <button
          onClick={handleAdd}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Agregar Sticker</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por ID del sticker..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filtro por categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Botón limpiar filtros */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de stickers */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  ID Sticker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">
                  Categorías
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stickers.map((sticker) => (
                <tr key={sticker._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap w-20">
                    <AdminImage
                      imagePath={sticker.imagePath}
                      alt={`Sticker ${sticker.id_sticker}`}
                    />
                  </td>
                  <td className="px-6 py-4 w-48">
                    <div className="text-lg font-bold text-primary-800 font-mono">#{sticker.id_sticker}</div>
                  </td>
                  <td className="px-6 py-4 w-72">
                    <div className="flex flex-wrap gap-1 max-w-72">
                      {sticker.categories && sticker.categories.length > 0 ? (
                        sticker.categories.map((category) => (
                          <span
                            key={category}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 whitespace-nowrap"
                          >
                            {category}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 italic whitespace-nowrap">
                          Sin categoría
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-32">
                    {sticker.createdAt ? new Date(sticker.createdAt).toLocaleDateString('es-AR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-36">
                    <div className="flex justify-end space-x-2">
                      {/* Botón Descargar */}
                      <button
                        onClick={async () => {
                          try {
                            const imageUrl = adminApiService.getImageUrl(sticker.imagePath);
                            const response = await fetch(imageUrl);
                            const blob = await response.blob();
                            
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `sticker_${sticker.id_sticker}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                            
                            showSuccess(`Imagen del sticker #${sticker.id_sticker} descargada exitosamente`);
                          } catch (error) {
                            showError('Error al descargar la imagen');
                            console.error('Download error:', error);
                          }
                        }}
                        className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                        title="Descargar imagen"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      {/* Botón Editar */}
                      <button
                        onClick={() => handleEdit(sticker)}
                        className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Editar sticker"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Botón Eliminar */}
                      <button
                        onClick={() => handleDelete(sticker._id, sticker.id_sticker)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar sticker"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stickers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay stickers disponibles
            </h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory 
                ? 'Prueba ajustar los filtros de búsqueda.'
                : 'Comienza agregando tu primer sticker.'}
            </p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> al{' '}
            <span className="font-medium">
              {Math.min(currentPage * ITEMS_PER_PAGE, pagination.totalStickers)}
            </span> de{' '}
            <span className="font-medium">{pagination.totalStickers}</span> resultados
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-700">
              Página {currentPage} de {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal del formulario */}
      {showForm && (
        <StickerForm
          sticker={editingSticker}
          onSave={() => {
            setShowForm(false);
            setEditingSticker(null);
            loadStickers(); // Recargar lista
            showSuccess(editingSticker ? 'Sticker actualizado exitosamente' : 'Sticker creado exitosamente');
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingSticker(null);
          }}
        />
      )}

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

export default StickerManagement;