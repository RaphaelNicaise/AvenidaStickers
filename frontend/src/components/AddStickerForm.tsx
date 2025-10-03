import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface AddStickerFormProps {
  onBackToCatalog: () => void;
}

export const AddStickerForm: React.FC<AddStickerFormProps> = ({ onBackToCatalog }) => {
  const [formData, setFormData] = useState({
    name: '',
    categories: [] as string[]
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para las sugerencias de categorías
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Cargar categorías disponibles
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiService.getCategories();
        setAvailableCategories(response.data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Función para obtener sugerencias de categorías
  const getCategorySuggestions = (input: string) => {
    if (!input.trim()) return [];
    
    const inputLower = input.toLowerCase();
    return availableCategories.filter(category => 
      category.toLowerCase().includes(inputLower) && 
      !formData.categories.includes(category)
    ).slice(0, 5);
  };

  // Manejar navegación por teclado en sugerencias
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const suggestions = getCategorySuggestions(newCategoryName);
    
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddNewCategory();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else {
          handleAddNewCategory();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Seleccionar una sugerencia
  const selectSuggestion = (suggestion: string) => {
    setNewCategoryName(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    // Auto-agregar la categoría sugerida
    setTimeout(() => {
      if (!formData.categories.includes(suggestion)) {
        setFormData(prev => ({
          ...prev,
          categories: [...prev.categories, suggestion]
        }));
        setNewCategoryName('');
      }
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      setIsAddingCategory(true);
      const response = await apiService.createCategory(newCategoryName.trim());
      
      if (response.success) {
        setAvailableCategories(response.data);
        setNewCategoryName('');
        setMessage(`Categoría "${newCategoryName}" agregada exitosamente`);
        // Agregar automáticamente la nueva categoría a la selección
        const categoryToAdd = newCategoryName.trim().toLowerCase();
        setFormData(prev => ({
          ...prev,
          categories: [...prev.categories, categoryToAdd]
        }));
      }
    } catch (error) {
      setError('Error al agregar la categoría');
      console.error('Error adding category:', error);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      
      // Límite de 20 archivos en formulario público
      if (filesArray.length > 20) {
        setError('Máximo 20 archivos permitidos por vez');
        return;
      }
      
      setSelectedFiles(filesArray);
      setSelectedFile(null); // Limpiar selección individual si se usa selección múltiple
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      // Validaciones básicas
      if (!formData.name.trim()) {
        throw new Error('El nombre es requerido');
      }
      if (!selectedFile && selectedFiles.length === 0) {
        throw new Error('La imagen es requerida');
      }

      // Si hay múltiples archivos, procesar cada uno
      if (selectedFiles.length > 0) {
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          try {
            const submitData = new FormData();
            submitData.append('name', `${formData.name.trim()} ${i + 1}`);
            submitData.append('categories', formData.categories.join(', '));
            submitData.append('image', file);

            const response = await fetch('http://localhost:4000/api/stickers', {
              method: 'POST',
              body: submitData
            });

            const result = await response.json();
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (err) {
            errorCount++;
          }
        }
        
        if (successCount > 0) {
          setMessage(`¡${successCount} sticker${successCount > 1 ? 's' : ''} agregado${successCount > 1 ? 's' : ''} exitosamente!${errorCount > 0 ? ` (${errorCount} fallaron)` : ''}`);
        }
        if (errorCount === selectedFiles.length) {
          throw new Error('Error al agregar los stickers');
        }
      } else {
        // Procesar archivo individual
        const submitData = new FormData();
        submitData.append('name', formData.name.trim());
        submitData.append('categories', formData.categories.join(', '));
        submitData.append('image', selectedFile!);

        const response = await fetch('http://localhost:4000/api/stickers', {
          method: 'POST',
          body: submitData
        });

        const result = await response.json();

        if (result.success) {
          setMessage('¡Sticker agregado exitosamente!');
        } else {
          throw new Error(result.message || 'Error al agregar el sticker');
        }
      }

      // Limpiar formulario
      setFormData({
        name: '',
        categories: []
      });
      setSelectedFile(null);
      setSelectedFiles([]);
      // Resetear input file
      const fileInput = document.getElementById('images') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Agregar Nuevo Sticker</h1>
      
      <button 
        onClick={onBackToCatalog} 
        style={{ 
          marginBottom: '20px',
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.backgroundColor = '#5a6268';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.backgroundColor = '#6c757d';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }}
      >
        <span>←</span>
        <span>Volver al Catálogo</span>
      </button>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Nombre del sticker:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>
            Categorías:
          </label>
          
          {/* Lista de categorías existentes */}
          <div style={{ 
            maxHeight: '250px', 
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '15px'
          }}>
            {availableCategories.length > 0 ? availableCategories.map(category => (
              <div key={category} style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: formData.categories.includes(category) ? '#e7f3ff' : 'transparent'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{category}</span>
                </label>
              </div>
            )) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No hay categorías disponibles</p>
            )}
          </div>
          
          {/* Mini input para agregar nueva categoría */}
          <div style={{ 
            padding: '15px', 
            border: '2px dashed #007bff',
            borderRadius: '6px',
            backgroundColor: '#f8f9fa',
            position: 'relative'
          }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#007bff' }}>
              Crear nueva categoría:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                    setSelectedSuggestionIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(newCategoryName.length > 0)}
                  onBlur={() => {
                    // Delay para permitir clic en sugerencias
                    setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Nombre de la categoría"
                  style={{ 
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                
                {/* Sugerencias dropdown - solo mostrar si hay sugerencias */}
                {showSuggestions && newCategoryName.length > 0 && getCategorySuggestions(newCategoryName).length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '2px'
                  }}>
                    {getCategorySuggestions(newCategoryName).map((suggestion, index) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          border: 'none',
                          backgroundColor: index === selectedSuggestionIndex ? '#e3f2fd' : 'white',
                          color: index === selectedSuggestionIndex ? '#1976d2' : '#333',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          fontSize: '14px'
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        <span style={{ fontWeight: 'bold' }}>{suggestion}</span>
                        <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                          {suggestion.toLowerCase().startsWith(newCategoryName.toLowerCase()) ? 'Empieza con' : 'Contiene'} "{newCategoryName}"
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddNewCategory}
                disabled={isAddingCategory || !newCategoryName.trim()}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #007bff',
                  backgroundColor: '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: (isAddingCategory || !newCategoryName.trim()) ? 0.6 : 1,
                  minWidth: '100px'
                }}
              >
                {isAddingCategory ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>

          {/* Mostrar categorías seleccionadas */}
          {formData.categories.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Categorías seleccionadas:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {formData.categories.map(category => (
                  <span 
                    key={category}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '14px',
                      textTransform: 'capitalize'
                    }}
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="image" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Imagen:
          </label>
          
          {/* Contenedor de botón de carga */}
          <div style={{ marginBottom: '15px' }}>
            <input
              type="file"
              id="images"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  if (files.length === 1) {
                    setSelectedFile(files[0]);
                    setSelectedFiles([]);
                  } else {
                    handleMultipleFilesChange(e);
                  }
                }
              }}
              style={{ display: 'none' }}
            />
            <label 
              htmlFor="images"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%', 
                padding: '16px',
                border: '2px solid #007bff',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#f8f9fa',
                color: '#007bff',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e7f3ff';
                e.currentTarget.style.borderColor = '#0056b3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#007bff';
              }}
            >
              📁 Subir Archivos
            </label>
            <p style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '8px',
              textAlign: 'center'
            }}>
              Selecciona desde 1 hasta 20 archivos de imagen (JPG, PNG, WebP)
            </p>
          </div>

          {/* Preview de archivo individual */}
          {selectedFile && (
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                Archivo seleccionado: {selectedFile.name}
              </p>
              <img 
                src={URL.createObjectURL(selectedFile)} 
                alt="Preview" 
                style={{ 
                  maxWidth: '300px', 
                  maxHeight: '300px', 
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          )}

          {/* Preview de múltiples archivos */}
          {selectedFiles.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                {selectedFiles.length} archivos seleccionados:
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                gap: '10px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9'
              }}>
                {selectedFiles.map((file, index) => (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Preview ${index + 1}`} 
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'cover',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        marginBottom: '5px'
                      }}
                    />
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      wordBreak: 'break-word'
                    }}>
                      {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '15px', 
            backgroundColor: loading ? '#6c757d' : '#28a745', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Agregando...' : 'Agregar Sticker'}
        </button>
      </form>

      {message && (
        <div style={{ 
          color: '#155724', 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ 
          color: '#721c24', 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};