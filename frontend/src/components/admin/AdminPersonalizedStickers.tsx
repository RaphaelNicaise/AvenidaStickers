import React, { useState, useEffect } from 'react';
import { personalizedStickerApiService } from '../../services/personalizedStickerApi';
import AdminImage from '../ui/AdminImage';
import { useToast } from '../../hooks/useToast';
import type { PersonalizedSticker } from '../../types';

const AdminPersonalizedStickers: React.FC = () => {
  const [stickers, setStickers] = useState<PersonalizedSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    dateFrom: '',
    dateTo: ''
  });

  const { showError, showSuccess } = useToast();

  useEffect(() => {
    loadStickers();
  }, []);

  const loadStickers = async () => {
    try {
      setLoading(true);
      const response = await personalizedStickerApiService.getAllPersonalizedStickers();
      if (response.success && response.data) {
        setStickers(response.data);
      }
    } catch (error: any) {
      showError('Error al cargar stickers personalizados');
      console.error('Error loading personalized stickers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (stickerId: string) => {
    try {
      const response = await personalizedStickerApiService.publishPersonalizedSticker(stickerId, ['personalizados']);
      if (response.success) {
        showSuccess('Sticker publicado exitosamente');
        loadStickers(); // Recargar lista
      }
    } catch (error: any) {
      showError('Error al publicar sticker');
      console.error('Error publishing sticker:', error);
    }
  };

  const handleDelete = async (stickerId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este sticker?')) {
      return;
    }

    try {
      const response = await personalizedStickerApiService.deletePersonalizedSticker(stickerId);
      if (response.success) {
        showSuccess('Sticker eliminado exitosamente');
        loadStickers(); // Recargar lista
      }
    } catch (error: any) {
      showError('Error al eliminar sticker');
      console.error('Error deleting sticker:', error);
    }
  };

  const handleDownload = (imagePath: string, stickerId: string) => {
    // Construir URL completa si imagePath es relativo
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const fullImageUrl = imagePath.startsWith('http') 
      ? imagePath 
      : `${baseUrl}${imagePath}`;
      
    const link = document.createElement('a');
    link.href = fullImageUrl;
    link.download = `sticker-${stickerId}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrar stickers basado en los filtros activos
  const filteredStickers = stickers.filter(sticker => {
    const matchesSearch = !filters.search || 
      sticker.id_personalized.toLowerCase().includes(filters.search.toLowerCase()) ||
      sticker.source.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesSource = !filters.source || sticker.source === filters.source;
    
    const stickerDate = new Date(sticker.createdAt);
    const matchesDateFrom = !filters.dateFrom || stickerDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || stickerDate <= new Date(filters.dateTo + 'T23:59:59');
    
    return matchesSearch && matchesSource && matchesDateFrom && matchesDateTo;
  });

  const clearFilters = () => {
    setFilters({
      search: '',
      source: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Cargando stickers personalizados...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Gestión de Stickers Personalizados
        </h2>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por ID o fuente
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="P0001, upload, pinterest..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro por fuente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuente
              </label>
              <select
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las fuentes</option>
                <option value="upload">Upload</option>
                <option value="pinterest">Pinterest</option>
              </select>
            </div>

            {/* Fecha desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Botón limpiar filtros */}
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <p className="text-gray-600">
          Total: {stickers.length} stickers | Mostrando: {filteredStickers.length}
        </p>
      </div>

      {filteredStickers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">
            {stickers.length === 0 ? 'No hay stickers personalizados' : 'No se encontraron stickers que coincidan con los filtros'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expira
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStickers.map((sticker) => (
                <tr key={sticker._id} className="hover:bg-gray-50">
                  {/* Imagen */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-16 h-16 flex-shrink-0">
                      <AdminImage
                        imagePath={sticker.imagePath}
                        alt={`Sticker ${sticker.id_personalized}`}
                      />
                    </div>
                  </td>

                  {/* ID */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {sticker.id_personalized}
                    </div>
                  </td>

                  {/* Fuente */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sticker.source === 'pinterest' 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {sticker.source === 'pinterest' ? 'Pinterest' : 'Upload'}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sticker.status === 'temporary'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sticker.status === 'temporary' ? 'Temporal' : 'Activo'}
                    </span>
                  </td>

                  {/* Fecha creación */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sticker.createdAt).toLocaleDateString('es-ES')}
                  </td>

                  {/* Fecha expiración */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sticker.expiresAt 
                      ? new Date(sticker.expiresAt).toLocaleDateString('es-ES')
                      : '-'
                    }
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {sticker.status === 'active' && (
                        <button
                          onClick={() => handlePublish(sticker._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          title="Publicar"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Publicar
                        </button>
                      )}
                      
                      {sticker.status === 'temporary' && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          En carrito
                        </span>
                      )}
                      
                      {sticker.status !== 'temporary' && (
                        <button
                          onClick={() => handleDownload(sticker.imagePath, sticker.id_personalized)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Descargar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(sticker._id)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      )}
    </div>
  );
};

export default AdminPersonalizedStickers;