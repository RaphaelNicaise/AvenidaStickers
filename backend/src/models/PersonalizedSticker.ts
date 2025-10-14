import mongoose, { Document, Schema } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import Config from './Config';

export interface IPersonalizedSticker extends Document {
  id_personalized: string; // Formato: P0001, P0002, P0003, etc.
  imagePath: string;
  source: 'upload' | 'pinterest';
  originalUrl?: string; // Solo para Pinterest
  status: 'active' | 'published' | 'temporary'; // temporary: en carrito, active: visible en admin, published: convertido a público
  expiresAt?: Date; // Fecha de expiración automática (solo para status 'active' y 'temporary')
  createdAt: Date;
  updatedAt: Date;
}

const PersonalizedStickerSchema: Schema = new Schema(
  {
    id_personalized: {
      type: String,
      required: [true, 'El ID del sticker personalizado es requerido'],
      unique: [true, 'Ya existe un sticker personalizado con este ID'],
      match: [/^P\d{4}$/, 'El ID del sticker personalizado debe tener formato P0001']
    },
    imagePath: {
      type: String,
      required: [true, 'La imagen del sticker personalizado es requerida']
    },
    source: {
      type: String,
      enum: ['upload', 'pinterest'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'published', 'temporary'],
      default: 'active',
      required: true
    },
    expiresAt: {
      type: Date,
      required: function(this: IPersonalizedSticker) {
        return this.status === 'active' || this.status === 'temporary';
      }
    },
    originalUrl: {
      type: String,
      required: function(this: IPersonalizedSticker) {
        return this.source === 'pinterest';
      }
    }
  },
  {
    timestamps: true,
  }
);

// Índices para mejorar la búsqueda
PersonalizedStickerSchema.index({ id_personalized: 1 });
PersonalizedStickerSchema.index({ createdAt: -1 });
PersonalizedStickerSchema.index({ status: 1 });
PersonalizedStickerSchema.index({ expiresAt: 1 });

// Método para calcular fecha de expiración
PersonalizedStickerSchema.statics.calculateExpirationDate = async function() {
  try {
    const autoDeleteDays = await Config.getValue('personalized_stickers_auto_delete_days', 15);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + autoDeleteDays);
    return expirationDate;
  } catch (error) {
    console.error('Error calculating expiration date:', error);
    // Fallback: 15 días por defecto
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 15);
    return fallbackDate;
  }
};

// Método estático para limpiar stickers expirados
PersonalizedStickerSchema.statics.cleanupExpiredStickers = async function() {
  try {
    const enableAutoDelete = await Config.getValue('enable_auto_delete_personalized', true);
    
    if (!enableAutoDelete) {
      console.log('🔒 Auto-eliminación de stickers personalizados deshabilitada');
      return { deleted: 0, message: 'Auto-eliminación deshabilitada' };
    }

    // Buscar stickers expirados (solo los temporales - los activos ya no deberían expirar)
    const expiredStickers = await this.find({
      status: 'temporary', // Solo eliminar temporales, no activos
      expiresAt: { $lte: new Date() }
    });

    let deletedCount = 0;
    let errors = [];

    for (const sticker of expiredStickers) {
      try {
        // Eliminar archivo de imagen del filesystem
        const fullImagePath = path.join(process.cwd(), 'public', sticker.imagePath);
        if (fs.existsSync(fullImagePath)) {
          fs.unlinkSync(fullImagePath);
          console.log(`🗑️ Imagen expirada eliminada: ${fullImagePath}`);
        }

        // Eliminar registro de la base de datos
        await this.findByIdAndDelete(sticker._id);
        console.log(`⏰ Sticker temporal expirado eliminado: ${sticker.id_personalized}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Error eliminando sticker temporal expirado ${sticker.id_personalized}:`, error);
        errors.push(`Error eliminando ${sticker.id_personalized}: ${(error as Error).message}`);
      }
    }

    const result = {
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `${deletedCount} stickers temporales expirados eliminados`
    };

    if (deletedCount > 0) {
      console.log(`✅ Limpieza automática completada: ${deletedCount} stickers temporales eliminados`);
    }

    return result;
  } catch (error) {
    console.error('❌ Error en limpieza automática de stickers personalizados:', error);
    throw error;
  }
};

// Método estático para generar el próximo ID de sticker personalizado
PersonalizedStickerSchema.statics.generateNextId = async function() {
  const lastSticker = await this.findOne({}, {}, { sort: { 'id_personalized': -1 } });
  
  if (!lastSticker) {
    return 'P0001'; // Primer sticker personalizado
  }
  
  // Extraer el número del ID (P0001 -> 0001)
  const lastNumber = parseInt(lastSticker.id_personalized.substring(1));
  const nextNumber = lastNumber + 1;
  
  // Formato con ceros a la izquierda (4 dígitos) y prefijo P
  return 'P' + nextNumber.toString().padStart(4, '0');
};

export default mongoose.model<IPersonalizedSticker>('PersonalizedSticker', PersonalizedStickerSchema);