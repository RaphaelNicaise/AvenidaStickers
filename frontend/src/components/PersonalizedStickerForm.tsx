import React, { useState } from 'react';
import { personalizedStickerApiService } from '../services/personalizedStickerApi';
import { useToast } from '../hooks/useToast';
import type { PersonalizedSticker } from '../types';

interface PersonalizedStickerFormProps {
  onStickerCreated: (sticker: PersonalizedSticker) => void;
  onCancel: () => void;
}

const PersonalizedStickerForm: React.FC<PersonalizedStickerFormProps> = ({ 
  onStickerCreated, 
  onCancel 
}) => {
  const [importMode, setImportMode] = useState<'file' | 'pinterest'>('file');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const { showError, showSuccess } = useToast();

  // Función para validar URL de Pinterest
  const isValidPinterestUrl = (url: string): boolean => {
    const pinterestRegex = /^https?:\/\/(www\.)?(pinterest\.com|ar\.pinterest\.com|pinterest\.ar)\/pin\/\d+/;
    return pinterestRegex.test(url);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        showError('La imagen no puede superar los 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        showError('Solo se permiten archivos de imagen');
        return;
      }

      setImageFile(file);
      setImageFiles([]); // Limpiar selección múltiple
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      
      // Límite de 20 archivos en formulario público
      if (filesArray.length > 20) {
        showError('Máximo 20 archivos permitidos por vez');
        return;
      }
      
      // Validar cada archivo
      for (const file of filesArray) {
        if (file.size > 10 * 1024 * 1024) {
          showError(`El archivo ${file.name} supera los 10MB`);
          return;
        }
        
        if (!file.type.startsWith('image/')) {
          showError(`El archivo ${file.name} no es una imagen válida`);
          return;
        }
      }

      setImageFiles(filesArray);
      setImageFile(null); // Limpiar selección individual
      setImagePreview(''); // Limpiar preview individual
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile && imageFiles.length === 0) {
      showError('Por favor selecciona una imagen');
      return;
    }

    try {
      setLoading(true);
      
      // Si hay múltiples archivos, procesar cada uno
      if (imageFiles.length > 0) {
        let successCount = 0;
        let errorCount = 0;
        const createdStickers: PersonalizedSticker[] = [];
        
        for (const file of imageFiles) {
          try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await personalizedStickerApiService.createTemporaryPersonalizedSticker(formData);
            
            if (response.success && response.data) {
              successCount++;
              createdStickers.push(response.data);
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }
        
        if (successCount > 0) {
          showSuccess(`¡${successCount} sticker${successCount > 1 ? 's' : ''} personalizado${successCount > 1 ? 's' : ''} agregado${successCount > 1 ? 's' : ''} al carrito!${errorCount > 0 ? ` (${errorCount} fallaron)` : ''}`);
          // Enviar el primer sticker creado como callback (para mantener compatibilidad)
          if (createdStickers.length > 0) {
            onStickerCreated(createdStickers[0]);
          }
        }
        if (errorCount === imageFiles.length) {
          throw new Error('Error al crear stickers personalizados');
        }
      } else {
        // Procesar archivo individual (lógica original)
        const formData = new FormData();
        formData.append('image', imageFile!);

        const response = await personalizedStickerApiService.createTemporaryPersonalizedSticker(formData);
        
        if (response.success && response.data) {
          showSuccess('¡Sticker personalizado agregado al carrito!');
          onStickerCreated(response.data);
        }
      }
    } catch (error: any) {
      showError(error.message || 'Error al crear sticker personalizado temporal');
    } finally {
      setLoading(false);
    }
  };

  const handlePinterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pinterestUrl.trim()) {
      showError('La URL de Pinterest es requerida');
      return;
    }

    if (!isValidPinterestUrl(pinterestUrl)) {
      showError('URL de Pinterest inválida');
      return;
    }

    try {
      setLoading(true);

      // Crear un sticker temporal desde Pinterest que se guardará en la BD
      const response = await personalizedStickerApiService.createTemporaryPersonalizedStickerFromPinterest({
        pinterestUrl: pinterestUrl.trim()
      });
      
      if (response.success && response.data) {
        showSuccess('¡Sticker personalizado de Pinterest agregado al carrito!');
        onStickerCreated(response.data);
      }
    } catch (error: any) {
      showError(error.message || 'Error al importar desde Pinterest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Agregar Sticker Personalizado
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Selector de modo */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setImportMode('file')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                importMode === 'file'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📁 Subir Archivo
            </button>
            <button
              type="button"
              onClick={() => setImportMode('pinterest')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                importMode === 'pinterest'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <img src="/pinterest.png" alt="Pinterest" className="w-4 h-4" />
                <span>Pinterest</span>
              </div>
            </button>
          </div>

          <form onSubmit={importMode === 'pinterest' ? handlePinterestSubmit : handleFileSubmit} className="space-y-4">
            {importMode === 'file' ? (
              /* Modo archivo */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen del sticker personalizado *
                  </label>
                  
                  {/* Botón unificado de carga */}
                  <div className="mb-4">
                    <input
                      type="file"
                      id="personalized-images"
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
                      htmlFor="personalized-images"
                      className="flex items-center justify-center gap-3 w-full p-4 border-2 border-primary-300 rounded-lg 
                               text-center cursor-pointer bg-primary-50 text-primary-600 font-medium 
                               hover:bg-primary-100 hover:border-primary-400 transition-all duration-200"
                    >
                      <span>📁 Subir Archivos</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Selecciona desde 1 hasta 20 archivos. Máximo 10MB por archivo. Formatos: JPG, PNG, GIF, WebP
                    </p>
                  </div>
                </div>

                {/* Preview de imagen individual */}
                {imagePreview && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vista previa
                    </label>
                    <div className="flex justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-48 object-contain border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Preview de múltiples archivos */}
                {imageFiles.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {imageFiles.length} archivos seleccionados
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="text-center">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover border border-gray-200 rounded-md mb-1"
                          />
                          <p className="text-xs text-gray-600 truncate">
                            {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
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

                {/* Preview de URL válida */}
                {pinterestUrl && isValidPinterestUrl(pinterestUrl) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-700">URL válida</p>
                        <p className="text-xs text-green-600">Se descargará desde Pinterest</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  loading || 
                  (importMode === 'file' && !imageFile && imageFiles.length === 0) || 
                  (importMode === 'pinterest' && (!pinterestUrl.trim() || !isValidPinterestUrl(pinterestUrl)))
                }
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creando...' : 'Crear Sticker'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedStickerForm;