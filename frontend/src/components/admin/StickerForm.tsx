import React, { useState, useEffect } from 'react';
import { adminApiService } from '../../services/adminApi';
import { useToast } from '../../hooks/useToast';
import type { Sticker } from '../../types';

interface StickerFormProps {
  sticker?: Sticker | null;
  onSave: () => void;
  onCancel: () => void;
}

const StickerForm: React.FC<StickerFormProps> = ({ sticker, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    imagePath: '',
    categories: [] as string[]
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Estados para Pinterest
  const [importMode, setImportMode] = useState<'file' | 'pinterest'>('pinterest');
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [processingPinterest, setProcessingPinterest] = useState(false);

  const { showError, showSuccess } = useToast();

  // Función para validar URL de Pinterest
  const isValidPinterestUrl = (url: string): boolean => {
    const pinterestRegex = /^https?:\/\/(www\.)?(pinterest\.com|ar\.pinterest\.com|pinterest\.ar)\/pin\/\d+/;
    return pinterestRegex.test(url);
  };

  // Handler para envío de Pinterest
  const handlePinterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pinterestUrl.trim()) {
      showError('La URL de Pinterest es requerida');
      return;
    }
    
    if (!isValidPinterestUrl(pinterestUrl)) {
      showError('La URL de Pinterest no es válida. Debe ser un enlace directo a un pin.');
      return;
    }
    
    if (formData.categories.length === 0) {
      showError('Debes seleccionar al menos una categoría');
      return;
    }
    
    try {
      setProcessingPinterest(true);
      setLoading(true);
      
      await adminApiService.createStickerFromPinterest({
        pinterestUrl: pinterestUrl,
        categories: formData.categories
      });
      
      showSuccess('¡Sticker importado desde Pinterest exitosamente!');
      onSave();
    } catch (error: any) {
      console.error('Error importing from Pinterest:', error);
      showError(error.message || 'Error al importar desde Pinterest');
    } finally {
      setProcessingPinterest(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    
    if (sticker) {
      setFormData({
        imagePath: sticker.imagePath,
        categories: sticker.categories || []
      });
      
      if (sticker.imagePath) {
        setImagePreview(adminApiService.getImageUrl(sticker.imagePath));
      }
    }
  }, [sticker]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await adminApiService.getCategories();
      if (response.success) {
        setAvailableCategories(response.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageFiles([]); // Limpiar selección múltiple
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      setImageFiles(filesArray);
      setImageFile(null); // Limpiar selección individual
      setImagePreview(''); // Limpiar preview individual
    }
  };

  const handleQuickAddCategory = (category: string) => {
    if (!formData.categories.includes(category)) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, category]
      }));
    }
  };

  const handleAddCategoryToSticker = async () => {
    const categoryName = newCategory.trim().toLowerCase();
    
    if (!categoryName) return;
    
    // Verificar si ya está asignada al sticker
    if (formData.categories.includes(categoryName)) {
      showError('Esta categoría ya está asignada');
      setNewCategory('');
      return;
    }

    // Si no existe en las disponibles, crearla primero
    if (!availableCategories.includes(categoryName)) {
      try {
        const response = await adminApiService.createCategory(categoryName);
        if (response.success) {
          setAvailableCategories(response.data);
        }
      } catch (err) {
        console.error('Error creating category:', err);
        // Continuar agregando la categoría aunque no se pudo crear en el servidor
      }
    }

    // Agregar al sticker
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, categoryName]
    }));
    
    setNewCategory('');
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat !== categoryToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sticker && !imageFile && imageFiles.length === 0) {
      showError('La imagen es obligatoria para stickers nuevos');
      return;
    }

    try {
      setLoading(true);
      
      // Si hay múltiples archivos, procesar cada uno
      if (imageFiles.length > 0) {
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          try {
            const submitFormData = new FormData();
            
            // Enviar categorías como JSON string
            if (formData.categories.length > 0) {
              submitFormData.append('categories', JSON.stringify(formData.categories));
            } else {
              submitFormData.append('categories', JSON.stringify([]));
            }
            
            submitFormData.append('image', file);

            const response = await adminApiService.createSticker(submitFormData);

            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (err) {
            errorCount++;
          }
        }
        
        if (successCount > 0) {
          showSuccess(`${successCount} sticker${successCount > 1 ? 's' : ''} creado${successCount > 1 ? 's' : ''} exitosamente${errorCount > 0 ? ` (${errorCount} fallaron)` : ''}`);
          onSave();
        }
        if (errorCount === imageFiles.length) {
          showError('Error al crear los stickers');
        }
        return;
      }

      // Lógica original para archivo individual o edición
      const submitFormData = new FormData();
      
      // Enviar categorías como JSON string
      if (formData.categories.length > 0) {
        submitFormData.append('categories', JSON.stringify(formData.categories));
      } else {
        // Enviar array vacío si no hay categorías
        submitFormData.append('categories', JSON.stringify([]));
      }
      
      if (imageFile) {
        submitFormData.append('image', imageFile);
      }

      let response;
      if (sticker) {
        response = await adminApiService.updateSticker(sticker._id, submitFormData);
      } else {
        response = await adminApiService.createSticker(submitFormData);
      }

      if (response.success) {
        showSuccess(sticker ? 'Sticker actualizado exitosamente' : 'Sticker creado exitosamente');
        onSave();
      } else {
        showError('Error al guardar el sticker: ' + (response.message || 'Error desconocido'));
      }
    } catch (err) {
      console.error('Error saving sticker:', err);
      showError('Error de conexión al guardar el sticker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {sticker ? `Editar Sticker #${sticker.id_sticker}` : 'Agregar Sticker'}
              </h2>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs de método de importación - solo para stickers nuevos */}
            {!sticker && (
              <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setImportMode('file')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      importMode === 'file'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    📁 Subir Archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('pinterest')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      importMode === 'pinterest'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <img src="/pinterest.png" alt="Pinterest" className="w-4 h-4" />
                      <span>Desde Pinterest</span>
                    </div>
                  </button>
                </div>
              </div>
            )}          <form onSubmit={importMode === 'pinterest' ? handlePinterestSubmit : handleSubmit} className="space-y-6">
            {/* Contenido condicional según el modo */}
            {importMode === 'pinterest' ? (
              /* Modo Pinterest */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Pinterest *
                  </label>
                  <input
                    type="url"
                    value={pinterestUrl}
                    onChange={(e) => setPinterestUrl(e.target.value)}
                    placeholder="https://ar.pinterest.com/pin/123456789..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pega aquí el enlace completo del pin de Pinterest
                  </p>
                </div>

                {/* Preview de URL si es válida */}
                {pinterestUrl && isValidPinterestUrl(pinterestUrl) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-700">URL válida</p>
                        <p className="text-xs text-green-600">Se descargará desde: {pinterestUrl}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advertencia si URL no es válida */}
                {pinterestUrl && !isValidPinterestUrl(pinterestUrl) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-red-700">URL inválida</p>
                        <p className="text-xs text-red-600">Debe ser un enlace de pin de Pinterest</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Modo archivo tradicional */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen {!sticker && '*'}
                </label>
                
                {imagePreview && (
                  <div className="mb-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}
                
                {/* Contenedor de botones de carga - solo para stickers nuevos */}
                {!sticker ? (
                  <div className="space-y-4">
                    <div>
                      {/* Botón unificado para admin (sin límite) */}
                      <input
                        type="file"
                        id="admin-images"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            if (files.length === 1) {
                              handleImageChange(e);
                            } else {
                              handleMultipleImagesChange(e);
                            }
                          }
                        }}
                        className="hidden"
                      />
                      <label 
                        htmlFor="admin-images"
                        className="flex items-center justify-center gap-3 w-full p-4 border-2 border-dashed border-primary-300 rounded-lg 
                                 text-center cursor-pointer bg-primary-50 text-primary-600 font-medium 
                                 hover:bg-primary-100 hover:border-primary-400 transition-all duration-200"
                      >
                        <span>📁 Subir Archivos</span>
                        {/* Ícono de información */}
                        <span 
                          title="Admin: Sin límite de archivos"
                          className="inline-flex items-center justify-center w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full cursor-help"
                        >
                          ∞
                        </span>
                      </label>
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        Modo Admin: Sin límite de archivos. Selecciona las imágenes que necesites.
                      </p>
                    </div>

                    {/* Preview de múltiples archivos */}
                    {imageFiles.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          {imageFiles.length} archivos seleccionados:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                          {imageFiles.map((file, index) => (
                            <div key={index} className="text-center">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover border border-gray-200 rounded-md mb-1"
                              />
                              <p className="text-xs text-gray-600 truncate">
                                {file.name.length > 12 ? file.name.substring(0, 12) + '...' : file.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Para editar stickers existentes, usar input tradicional */
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                )}
                
                {!sticker && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selecciona una imagen en formato JPG, PNG o WebP
                  </p>
                )}
              </div>
            )}

            {/* Gestión de categorías */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorías
              </label>
              
              {/* Input para agregar categorías */}
              <div className="mb-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Escribe el nombre de una categoría..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategoryToSticker();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategoryToSticker}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                  >
                    Agregar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Escribe el nombre y presiona Enter o haz clic en Agregar
                </p>
              </div>

              {/* Categorías asignadas */}
              {formData.categories.length > 0 ? (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Categorías asignadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map((category, index) => (
                      <span
                        key={`${category}-${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 border border-primary-200"
                      >
                        {category}
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4 text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-gray-400 text-2xl mb-2">🏷️</div>
                  <p className="text-gray-600 text-sm">
                    No hay categorías asignadas. Escribe arriba para agregar.
                  </p>
                </div>
              )}

              {/* Categorías sugeridas */}
              {!loadingCategories && availableCategories.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">Categorías disponibles (clic para agregar):</p>
                  <div className="max-h-40 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {availableCategories
                        .filter(category => !formData.categories.includes(category))
                        .map(category => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => handleQuickAddCategory(category)}
                            className="px-3 py-2 text-sm bg-white hover:bg-primary-50 text-gray-700 hover:text-primary-700 rounded-lg border border-gray-300 hover:border-primary-300 transition-colors text-left"
                          >
                            + {category}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {loadingCategories && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                  <span className="text-sm text-gray-600 mt-2">Cargando categorías...</span>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-3 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-3 px-4 rounded-lg font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {importMode === 'pinterest' && processingPinterest ? 'Importando desde Pinterest...' : 'Guardando...'}
                  </div>
                ) : (
                  importMode === 'pinterest' ? 'Crear Sticker' : (sticker ? 'Actualizar Sticker' : 'Crear Sticker')
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StickerForm;