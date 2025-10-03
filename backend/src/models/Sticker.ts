import mongoose, { Document, Schema } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Función para leer las categorías del archivo JSON
function getValidCategories(): string[] {
  try {
    const categoriesPath = path.join(__dirname, '../data/categories.json');
    
    // Si el archivo no existe, crearlo desde el template
    if (!fs.existsSync(categoriesPath)) {
      const templatePath = path.join(__dirname, '../data/categories.template.json');
      if (fs.existsSync(templatePath)) {
        console.log('📋 Inicializando categories.json desde template...');
        fs.copyFileSync(templatePath, categoriesPath);
        console.log('✅ categories.json creado exitosamente');
      } else {
        console.warn('⚠️ Template categories.template.json no encontrado, creando archivo básico');
        const defaultCategories = { categories: ['personalizados'] };
        fs.writeFileSync(categoriesPath, JSON.stringify(defaultCategories, null, 2));
      }
    }
    
    const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
    const { categories } = JSON.parse(categoriesData);
    return categories;
  } catch (error) {
    console.warn('❌ Error al leer categories.json, usando categorías por defecto:', error);
    return ['personalizados'];
  }
}

export interface ISticker extends Document {
  id_sticker: string; // Formato: 0001, 0002, 0003, etc.
  imagePath: string;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

const StickerSchema: Schema = new Schema(
  {
    id_sticker: {
      type: String,
      required: [true, 'El ID del sticker es requerido'],
      unique: [true, 'Ya existe un sticker con este ID'],
      validate: {
        validator: function(value: string) {
          // Permitir tanto IDs numéricos (0001, 0002) como IDs personalizados (P0001, P0002)
          return /^\d{4}$/.test(value) || /^P\d{4}$/.test(value);
        },
        message: 'El ID del sticker debe ser un número de 4 dígitos (ej: 0001) o un ID personalizado (ej: P0001)'
      }
    },
    imagePath: {
      type: String,
      required: [true, 'La imagen del sticker es requerida']
    },
    categories: {
      type: [String],
      default: [],
      validate: {
        validator: function(categories: string[]) {
          // Si no hay categorías, es válido
          if (!categories || categories.length === 0) {
            return true;
          }
          
          // Si hay categorías, validar que todas existan en el archivo JSON
          const validCategories = getValidCategories();
          return categories.every(cat => validCategories.includes(cat));
        },
        message: 'Una o más categorías no son válidas. Categorías disponibles: ' + getValidCategories().join(', ')
      }
    }
  },
  {
    timestamps: true,
  }
);

// Índices para mejorar la búsqueda
StickerSchema.index({ id_sticker: 1 });
StickerSchema.index({ categories: 1 });

// Método estático para generar el próximo ID de sticker
StickerSchema.statics.generateNextId = async function() {
  const lastSticker = await this.findOne({}, {}, { sort: { 'id_sticker': -1 } });
  
  if (!lastSticker) {
    return '0001'; // Primer sticker
  }
  
  const lastId = parseInt(lastSticker.id_sticker);
  const nextId = lastId + 1;
  
  // Formato con ceros a la izquierda (4 dígitos)
  return nextId.toString().padStart(4, '0');
};

export default mongoose.model<ISticker>('Sticker', StickerSchema);