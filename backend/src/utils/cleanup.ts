import PersonalizedSticker from '../models/PersonalizedSticker';
import fs from 'fs/promises';
import path from 'path';

/**
 * Limpia los stickers personalizados temporales que han expirado
 */
export const cleanupExpiredTemporaryStickers = async (): Promise<void> => {
  try {
    console.log('🧹 Iniciando limpieza de stickers temporales expirados...');
    
    // Buscar stickers temporales expirados
    const expiredStickers = await PersonalizedSticker.find({
      status: 'temporary',
      expiresAt: { $lt: new Date() }
    });

    console.log(`📊 Encontrados ${expiredStickers.length} stickers expirados`);

    for (const sticker of expiredStickers) {
      try {
        // Eliminar archivo de imagen si existe
        if (sticker.imagePath) {
          const fullPath = path.resolve(sticker.imagePath);
          try {
            await fs.access(fullPath);
            await fs.unlink(fullPath);
            console.log(`🗑️ Imagen eliminada: ${sticker.imagePath}`);
          } catch (fileError) {
            console.log(`⚠️ No se pudo eliminar la imagen (posiblemente ya eliminada): ${sticker.imagePath}`);
          }
        }

        // Eliminar documento de la base de datos
        await PersonalizedSticker.findByIdAndDelete(sticker._id);
        console.log(`✅ Sticker temporal eliminado: ${sticker.id_personalized}`);
        
      } catch (error) {
        console.error(`❌ Error al eliminar sticker ${sticker.id_personalized}:`, error);
      }
    }

    console.log(`🎉 Limpieza completada. ${expiredStickers.length} stickers temporales eliminados`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza de stickers temporales:', error);
    throw error;
  }
};

/**
 * Programa la limpieza automática para ejecutarse cada hora
 */
export const scheduleCleanup = (): NodeJS.Timeout => {
  console.log('⏰ Programando limpieza automática cada hora...');
  
  // Ejecutar limpieza inmediatamente al iniciar
  cleanupExpiredTemporaryStickers().catch(error => {
    console.error('Error en limpieza inicial:', error);
  });
  
  // Programar limpieza cada hora (3600000 ms = 1 hora)
  return setInterval(async () => {
    try {
      await cleanupExpiredTemporaryStickers();
    } catch (error) {
      console.error('Error en limpieza programada:', error);
    }
  }, 3600000); // 1 hora
};

/**
 * Para testing - limpieza manual
 */
export const manualCleanup = async (): Promise<{ deleted: number; errors: string[] }> => {
  try {
    const expiredStickers = await PersonalizedSticker.find({
      status: 'temporary',
      expiresAt: { $lt: new Date() }
    });

    const result = {
      deleted: 0,
      errors: [] as string[]
    };

    for (const sticker of expiredStickers) {
      try {
        if (sticker.imagePath) {
          const fullPath = path.resolve(sticker.imagePath);
          try {
            await fs.access(fullPath);
            await fs.unlink(fullPath);
          } catch {
            // Archivo ya no existe, continuar
          }
        }

        await PersonalizedSticker.findByIdAndDelete(sticker._id);
        result.deleted++;
        
      } catch (error) {
        const errorMessage = `Error eliminando ${sticker.id_personalized}: ${error}`;
        result.errors.push(errorMessage);
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Error en limpieza manual: ${error}`);
  }
};