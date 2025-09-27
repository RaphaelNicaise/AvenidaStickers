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
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
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
      if (!selectedFile) {
        throw new Error('La imagen es requerida');
      }

      // Crear FormData para envío
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      // Convertir las categorías seleccionadas a string separado por comas
      submitData.append('categories', formData.categories.join(', '));
      submitData.append('image', selectedFile);

      // Enviar al backend
      const response = await fetch('http://localhost:4000/api/stickers', {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        setMessage('¡Sticker agregado exitosamente!');
        // Limpiar formulario
        setFormData({
          name: '',
          categories: []
        });
        setSelectedFile(null);
        // Resetear input file
        const fileInput = document.getElementById('image') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result.message || 'Error al agregar el sticker');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Agregar Nuevo Sticker</h1>
      
      <button onClick={onBackToCatalog} style={{ 
        marginBottom: '20px',
        padding: '8px 16px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}>
        ← Volver al Catálogo
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
            maxHeight: '200px', 
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
            backgroundColor: '#f8f9fa'
          }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#007bff' }}>
              Crear nueva categoría:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nombre de la categoría"
                style={{ 
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewCategory();
                  }
                }}
              />
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
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleFileChange}
            style={{ 
              width: '100%', 
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            required
          />
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