import mongoose, { Document, Schema } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Función para leer las categorías del archivo JSON
function getValidCategories(): string[] {
  try {
    const categoriesPath = path.join(__dirname, '../data/categories.json');
    const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
    const { categories } = JSON.parse(categoriesData);
    return categories;
  } catch (error) {
    console.warn('Error al leer categories.json, usando categorías por defecto');
    return ['anime', 'gaming', 'memes', 'nature', 'art', 'otros'];
  }
}

export interface ISticker extends Document {
  name: string;
  description: string;
  imagePath: string;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

const StickerSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del sticker es requerido'],
      trim: true,
      maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
    },
    description: {
      type: String,
      required: [true, 'La descripción del sticker es requerida'],
      trim: true,
      maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
    },
    imagePath: {
      type: String,
      required: [true, 'La imagen del sticker es requerida']
    },
    categories: {
      type: [String],
      required: [true, 'Las categorías del sticker son requeridas'],
      validate: {
        validator: function(categories: string[]) {
          if (!categories || categories.length === 0) {
            return false;
          }
          
          // Validar que todas las categorías existan en el archivo JSON
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
StickerSchema.index({ name: 1 });
StickerSchema.index({ categories: 1 });

export default mongoose.model<ISticker>('Sticker', StickerSchema);