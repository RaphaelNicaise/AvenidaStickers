import React, { useState, useEffect } from 'react';
import { adminApiService } from '../../services/adminApi';
import ToastContainer from '../ui/ToastContainer';
import ConfirmModal from '../ui/ConfirmModal';
import { useToast } from '../../hooks/useToast';

interface StickerSize {
  id: string;
  name: string;
  dimensions: string;
  price: number;
}

interface StickerSizeForm {
  id: string;
  name: string;
  dimensions: string;
  price: number | string;
}

interface SizesData {
  sizes: StickerSize[];
  currency: string;
  updatedAt: string;
}

const SizesManagement: React.FC = () => {
  const [sizesData, setSizesData] = useState<SizesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSize, setEditingSize] = useState<StickerSize | null>(null);
  const [showForm, setShowForm] = useState(false);

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
    loadSizes();
  }, []);

  const loadSizes = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getSizes();
      
      if (response.success) {
        setSizesData(response.data);
      } else {
        setError('Error al cargar los tamaños');
        showError('Error al cargar los tamaños');
      }
    } catch (err) {
      setError('Error de conexión');
      showError('Error de conexión');
      console.error('Error loading sizes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedSizes: StickerSize[]) => {
    try {
      setSaving(true);
      const response = await adminApiService.updateSizes({
        sizes: updatedSizes,
        currency: 'ARS' // Siempre usar pesos argentinos
      });
      
      if (response.success) {
        setSizesData(response.data);
        showSuccess('Configuración de tamaños actualizada exitosamente');
      } else {
        showError('Error al actualizar la configuración');
      }
    } catch (err) {
      showError('Error de conexión al guardar');
      console.error('Error saving sizes:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSize = (size: StickerSize) => {
    setEditingSize(size);
    setShowForm(true);
  };

  const handleAddSize = () => {
    setEditingSize({
      id: '',
      name: '',
      dimensions: '',
      price: 0
    });
    setShowForm(true);
  };

  const handleDeleteSize = (sizeId: string, sizeName: string) => {
    if (!sizesData) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Tamaño',
      message: `¿Estás seguro de que quieres eliminar el tamaño "${sizeName}"? Esta acción no se puede deshacer.`,
      onConfirm: () => confirmDeleteSize(sizeId)
    });
  };

  const confirmDeleteSize = (sizeId: string) => {
    if (!sizesData) return;
    const updatedSizes = sizesData.sizes.filter(size => size.id !== sizeId);
    handleSave(updatedSizes);
  };

  const handleFormSubmit = (formData: StickerSize) => {
    if (!sizesData) return;

    let updatedSizes: StickerSize[];
    
    if (editingSize && sizesData.sizes.find(s => s.id === editingSize.id)) {
      // Editar existente
      updatedSizes = sizesData.sizes.map(size => 
        size.id === editingSize.id ? formData : size
      );
    } else {
      // Agregar nuevo
      // Generar ID si está vacío
      if (!formData.id) {
        formData.id = formData.name.toLowerCase().replace(/\s+/g, '_');
      }
      updatedSizes = [...sizesData.sizes, formData];
    }

    handleSave(updatedSizes);
    setShowForm(false);
    setEditingSize(null);
    showSuccess(editingSize && sizesData.sizes.find(s => s.id === editingSize.id) ? 
      'Tamaño actualizado exitosamente' : 'Tamaño agregado exitosamente');
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-primary-700">Cargando configuración...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={loadSizes}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!sizesData) {
    return <div>No hay datos disponibles</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Tamaños y Precios</h1>
          <p className="text-gray-600">Configura los tamaños disponibles, dimensiones y precios</p>
        </div>
        <button
          onClick={handleAddSize}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Agregar Tamaño</span>
        </button>
      </div>

      {/* Lista de tamaños */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tamaños Configurados</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Dimensiones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Precio
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sizesData.sizes.map((size) => (
                <tr key={size.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-24">
                    {size.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-32">
                    {size.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 w-32">
                    {size.dimensions} cm
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 w-32">
                    ${size.price} ARS
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-24">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditSize(size)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteSize(size.id, size.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {sizesData.sizes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📏</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay tamaños configurados
            </h3>
            <p className="text-gray-600">
              Agrega el primer tamaño para empezar a configurar los precios.
            </p>
          </div>
        )}
      </div>

      {/* Modal del formulario */}
      {showForm && editingSize && (
        <SizeFormModal
          size={editingSize}
          onSave={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingSize(null);
          }}
          saving={saving}
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

interface SizeFormModalProps {
  size: StickerSize;
  onSave: (size: StickerSize) => void;
  onCancel: () => void;
  saving: boolean;
}

const SizeFormModal: React.FC<SizeFormModalProps> = ({ 
  size, 
  onSave, 
  onCancel, 
  saving 
}) => {
  const [formData, setFormData] = useState<StickerSizeForm>(size);
  const { showError } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.name.trim()) {
      showError('El nombre es obligatorio');
      return;
    }
    
    if (!formData.dimensions.trim()) {
      showError('Las dimensiones son obligatorias');
      return;
    }
    
    // Asegurar que price es un número válido
    const priceValue = typeof formData.price === 'string' ? parseInt(formData.price) : formData.price;
    if (!priceValue || isNaN(priceValue) || priceValue <= 0) {
      showError('El precio debe ser mayor a 0');
      return;
    }

    // Asegurar que enviamos el precio como número
    onSave({ ...formData, price: priceValue });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {size.id ? 'Editar Tamaño' : 'Agregar Tamaño'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID del tamaño
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="small, medium, large..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!!size.id} // Solo editable si es nuevo
            />
            <p className="text-xs text-gray-500 mt-1">
              {size.id ? 'No se puede cambiar el ID de un tamaño existente' : 'Identificador único (se generará automáticamente si está vacío)'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Chiquito, Mediano, Grande..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dimensiones *
            </label>
            <input
              type="text"
              value={formData.dimensions}
              onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
              placeholder="4x4, 6x6, 8x8..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Ejemplo: 4x4, 6x6 (se mostrará como "4x4 cm")</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio (ARS) *
            </label>
            <input
              type="number"
              min="1"
              value={formData.price}
              onChange={(e) => {
                const value = e.target.value;
                
                // Si está vacío, permitir temporalmente
                if (value === '') {
                  setFormData({ ...formData, price: '' as any });
                  return;
                }
                
                const numericValue = parseInt(value);
                if (!isNaN(numericValue) && numericValue > 0) {
                  setFormData({ ...formData, price: numericValue });
                }
              }}
              onBlur={(e) => {
                // Al perder el foco, asegurar que hay un valor válido
                const value = e.target.value;
                if (value === '' || parseInt(value) <= 0) {
                  // Volver al valor original del tamaño
                  setFormData({ ...formData, price: size.price });
                }
              }}
              placeholder="200, 300, 400..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-2 px-4 rounded-lg font-medium"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SizesManagement;