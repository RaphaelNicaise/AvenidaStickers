import { Request, Response } from 'express';
import PersonalizedSticker, { IPersonalizedSticker } from '../models/PersonalizedSticker';
import Sticker from '../models/Sticker';
import path from 'path';
import fs from 'fs';
import { 
  extractPinterestImageUrl, 
  downloadImage, 
  saveOptimizedImage, 
  isValidPinterestUrl 
} from '../utils/pinterestUtils';
import { manualCleanup } from '../utils/cleanup';

// Extender Request para incluir file de multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export class PersonalizedStickerController {
  
  // Crear un sticker personalizado TEMPORAL desde archivo (para carrito)
  public async createTemporaryPersonalizedSticker(req: MulterRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'La imagen es requerida'
        });
        return;
      }

      // Validar que sea una imagen
      if (!req.file.mimetype.startsWith('image/')) {
        // Eliminar archivo si no es imagen
        const filePath = path.join(process.cwd(), 'public', 'uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(400).json({
          success: false,
          message: 'Solo se permiten archivos de imagen'
        });
        return;
      }

      // Procesar imagen con Sharp para mejor calidad
      const originalPath = path.join(process.cwd(), 'public', 'uploads', req.file.filename);
      const processedFilename = `processed_${req.file.filename.replace(/\.[^/.]+$/, '.jpg')}`;
      const processedPath = path.join(process.cwd(), 'public', 'uploads', processedFilename);

      let imagePath: string;
      try {
        // Importar sharp dinámicamente
        const sharp = (await import('sharp')).default;
        
        await sharp(originalPath)
          .resize({
            width: 2048,
            height: 2048,
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({
            quality: 90,
            progressive: true,
            mozjpeg: true
          })
          .toFile(processedPath);

        // Eliminar archivo original
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }

        imagePath = `/uploads/${processedFilename}`;
      } catch (sharpError) {
        // Si falla Sharp, usar imagen original
        console.warn('Sharp processing failed, using original:', sharpError);
        imagePath = `/uploads/${req.file.filename}`;
      }
      
      // Generar el próximo ID de sticker personalizado
      const nextId = await (PersonalizedSticker as any).generateNextId();
      
      // Calcular fecha de expiración (1 hora para temporales)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      const personalizedSticker: IPersonalizedSticker = new PersonalizedSticker({
        id_personalized: nextId,
        imagePath,
        source: 'upload',
        status: 'temporary', // Marcar como temporal
        expiresAt
      });

      const savedSticker = await personalizedSticker.save();

      res.status(201).json({
        success: true,
        message: 'Sticker personalizado temporal creado exitosamente',
        data: savedSticker
      });
    } catch (error) {
      // Si hay error, eliminar la imagen subida
      if (req.file) {
        const filePath = path.join(process.cwd(), 'public', 'uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(400).json({
        success: false,
        message: 'Error al crear el sticker personalizado temporal',
        error: (error as Error).message
      });
    }
  }

  // Crear un sticker personalizado desde archivo (método original para admin)
  public async createPersonalizedSticker(req: MulterRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'La imagen es requerida'
        });
        return;
      }

      // Validar que sea una imagen
      if (!req.file.mimetype.startsWith('image/')) {
        // Eliminar archivo si no es imagen
        const filePath = path.join(process.cwd(), 'public', 'uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(400).json({
          success: false,
          message: 'Solo se permiten archivos de imagen'
        });
        return;
      }

      const imagePath = `/uploads/${req.file.filename}`;
      
      // Generar el próximo ID de sticker personalizado
      const nextId = await (PersonalizedSticker as any).generateNextId();
      
      // Calcular fecha de expiración
      const expiresAt = await (PersonalizedSticker as any).calculateExpirationDate();

      const personalizedSticker: IPersonalizedSticker = new PersonalizedSticker({
        id_personalized: nextId,
        imagePath,
        source: 'upload',
        expiresAt
      });

      const savedSticker = await personalizedSticker.save();

      res.status(201).json({
        success: true,
        message: 'Sticker personalizado creado exitosamente',
        data: savedSticker
      });
    } catch (error) {
      // Si hay error, eliminar la imagen subida
      if (req.file) {
        const filePath = path.join(process.cwd(), 'public', 'uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(400).json({
        success: false,
        message: 'Error al crear el sticker personalizado',
        error: (error as Error).message
      });
    }
  }

  // Crear sticker personalizado desde Pinterest
  public async createPersonalizedStickerFromPinterest(req: Request, res: Response): Promise<void> {
    try {
      const { pinterestUrl } = req.body;

      // Validar parámetros requeridos
      if (!pinterestUrl) {
        res.status(400).json({
          success: false,
          message: 'URL de Pinterest es requerida'
        });
        return;
      }

      // Validar URL de Pinterest
      if (!isValidPinterestUrl(pinterestUrl)) {
        res.status(400).json({
          success: false,
          message: 'URL de Pinterest inválida. Asegúrate de usar un enlace de pin válido.'
        });
        return;
      }

      console.log(`🔍 Procesando Pinterest URL para sticker personalizado: ${pinterestUrl}`);

      // Generar el próximo ID de sticker personalizado
      const nextId = await (PersonalizedSticker as any).generateNextId();

      // Paso 1: Extraer URL de la imagen
      console.log('📥 Extrayendo URL de imagen...');
      const imageUrl = await extractPinterestImageUrl(pinterestUrl);
      console.log(`🖼️ URL de imagen extraída: ${imageUrl}`);

      // Paso 2: Descargar la imagen
      console.log('⬇️ Descargando imagen...');
      const imageBuffer = await downloadImage(imageUrl);
      console.log(`📦 Imagen descargada: ${imageBuffer.length} bytes`);

      // Paso 3: Procesar y guardar la imagen
      console.log('🔧 Procesando y guardando imagen...');
      const imagePath = await saveOptimizedImage(imageBuffer, nextId);
      console.log(`💾 Imagen guardada en: ${imagePath}`);
      
      // Calcular fecha de expiración
      const expiresAt = await (PersonalizedSticker as any).calculateExpirationDate();

      // Paso 4: Crear sticker personalizado en la base de datos
      const newSticker = new PersonalizedSticker({
        id_personalized: nextId,
        imagePath,
        source: 'pinterest',
        originalUrl: pinterestUrl,
        expiresAt,
        createdAt: new Date()
      });

      const savedSticker = await newSticker.save();
      console.log(`✅ Sticker personalizado creado con ID: ${savedSticker._id}`);

      res.status(201).json({
        success: true,
        message: 'Sticker personalizado importado desde Pinterest exitosamente',
        data: savedSticker
      });

    } catch (error) {
      console.error('❌ Error al importar sticker personalizado desde Pinterest:', error);
      
      // Enviar error específico al cliente
      const errorMessage = (error as Error).message;
      let statusCode = 500;
      
      if (errorMessage.includes('inválida') || errorMessage.includes('extraer')) {
        statusCode = 400;
      } else if (errorMessage.includes('descargar') || errorMessage.includes('procesar')) {
        statusCode = 502; // Bad Gateway - problema con recurso externo
      }

      res.status(statusCode).json({
        success: false,
        message: 'Error al importar sticker personalizado desde Pinterest',
        error: errorMessage
      });
    }
  }

  // Crear sticker personalizado TEMPORAL desde Pinterest (para carrito)
  public async createTemporaryPersonalizedStickerFromPinterest(req: Request, res: Response): Promise<void> {
    try {
      const { pinterestUrl } = req.body;

      // Validar parámetros requeridos
      if (!pinterestUrl) {
        res.status(400).json({
          success: false,
          message: 'URL de Pinterest es requerida'
        });
        return;
      }

      // Validar URL de Pinterest
      if (!isValidPinterestUrl(pinterestUrl)) {
        res.status(400).json({
          success: false,
          message: 'URL de Pinterest inválida. Asegúrate de usar un enlace de pin válido.'
        });
        return;
      }

      console.log(`🔍 Procesando Pinterest URL para sticker temporal: ${pinterestUrl}`);

      // Generar el próximo ID de sticker personalizado
      const nextId = await (PersonalizedSticker as any).generateNextId();

      // Paso 1: Extraer URL de la imagen
      console.log('📥 Extrayendo URL de imagen...');
      const imageUrl = await extractPinterestImageUrl(pinterestUrl);
      console.log(`🖼️ URL de imagen extraída: ${imageUrl}`);

      // Paso 2: Descargar la imagen
      console.log('⬇️ Descargando imagen...');
      const imageBuffer = await downloadImage(imageUrl);
      console.log(`📦 Imagen descargada: ${imageBuffer.length} bytes`);

      // Paso 3: Procesar y guardar la imagen
      console.log('🔧 Procesando y guardando imagen...');
      const imagePath = await saveOptimizedImage(imageBuffer, nextId);
      console.log(`💾 Imagen guardada en: ${imagePath}`);
      
      // Calcular fecha de expiración temporal (1 hora)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Paso 4: Crear sticker personalizado temporal en la base de datos
      const newSticker = new PersonalizedSticker({
        id_personalized: nextId,
        imagePath,
        source: 'pinterest',
        originalUrl: pinterestUrl,
        status: 'temporary', // Marcar como temporal
        expiresAt,
        createdAt: new Date()
      });

      const savedSticker = await newSticker.save();
      console.log(`✅ Sticker personalizado temporal creado con ID: ${savedSticker._id}`);

      res.status(201).json({
        success: true,
        message: 'Sticker personalizado temporal importado desde Pinterest exitosamente',
        data: savedSticker
      });

    } catch (error) {
      console.error('❌ Error al importar sticker personalizado temporal desde Pinterest:', error);
      
      // Enviar error específico al cliente
      const errorMessage = (error as Error).message;
      let statusCode = 500;
      
      if (errorMessage.includes('inválida') || errorMessage.includes('extraer')) {
        statusCode = 400;
      } else if (errorMessage.includes('descargar') || errorMessage.includes('procesar')) {
        statusCode = 502; // Bad Gateway - problema con recurso externo
      }

      res.status(statusCode).json({
        success: false,
        message: 'Error al importar sticker personalizado temporal desde Pinterest',
        error: errorMessage
      });
    }
  }

  // Confirmar stickers temporales (convertir a activos)
  public async confirmTemporaryStickers(req: Request, res: Response): Promise<void> {
    try {
      const { stickerIds } = req.body;

      if (!stickerIds || !Array.isArray(stickerIds)) {
        res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs de stickers'
        });
        return;
      }

      // Actualizar stickers de temporary a active
      const result = await PersonalizedSticker.updateMany(
        { 
          _id: { $in: stickerIds },
          status: 'temporary'
        },
        { 
          status: 'active',
          expiresAt: await (PersonalizedSticker as any).calculateExpirationDate() // 15 días
        }
      );

      res.json({
        success: true,
        message: `${result.modifiedCount} stickers confirmados exitosamente`,
        data: {
          confirmedCount: result.modifiedCount
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al confirmar stickers temporales',
        error: (error as Error).message
      });
    }
  }

  // Obtener un sticker personalizado por ID
  public async getPersonalizedStickerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sticker = await PersonalizedSticker.findById(id);

      if (!sticker) {
        res.status(404).json({
          success: false,
          message: 'Sticker personalizado no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: sticker
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener el sticker personalizado',
        error: (error as Error).message
      });
    }
  }

  // Obtener todos los stickers personalizados (para admin)
  public async getAllPersonalizedStickers(req: Request, res: Response): Promise<void> {
    try {
      // Para admin, mostrar solo stickers activos y temporales no expirados
      // Los publicados ya no existen en esta colección
      const stickers = await PersonalizedSticker.find({
        $or: [
          { status: 'active' },
          { 
            status: 'temporary',
            expiresAt: { $gt: new Date() } // Solo temporales no expirados
          }
        ]
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: stickers,
        count: stickers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener los stickers personalizados',
        error: (error as Error).message
      });
    }
  }

  // Eliminar sticker personalizado
  public async deletePersonalizedSticker(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sticker = await PersonalizedSticker.findById(id);

      if (!sticker) {
        res.status(404).json({
          success: false,
          message: 'Sticker personalizado no encontrado'
        });
        return;
      }

      // Eliminar archivo de imagen del filesystem
      const fullImagePath = path.join(process.cwd(), 'public', sticker.imagePath);
      if (fs.existsSync(fullImagePath)) {
        fs.unlinkSync(fullImagePath);
        console.log(`🗑️ Imagen eliminada: ${fullImagePath}`);
      }

      // Eliminar de la base de datos
      await PersonalizedSticker.findByIdAndDelete(id);
      console.log(`🗑️ Sticker personalizado eliminado: ${sticker.id_personalized}`);

      res.json({
        success: true,
        message: 'Sticker personalizado eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el sticker personalizado',
        error: (error as Error).message
      });
    }
  }

  // Publicar sticker personalizado (convertir a sticker público)
  public async publishPersonalizedSticker(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { categories = [] } = req.body; // Array de categorías adicionales

      const personalizedSticker = await PersonalizedSticker.findById(id);

      if (!personalizedSticker) {
        res.status(404).json({
          success: false,
          message: 'Sticker personalizado no encontrado'
        });
        return;
      }

      if (personalizedSticker.status === 'published') {
        res.status(400).json({
          success: false,
          message: 'Este sticker ya ha sido publicado'
        });
        return;
      }

      // Validar categorías adicionales (opcional)
      const additionalCategories = Array.isArray(categories) ? categories : [];
      
      // SIEMPRE agregar la categoría "personalizados" y las categorías adicionales
      const finalCategories = ['personalizados', ...additionalCategories];
      
      // Remover duplicados si existen
      const uniqueCategories = [...new Set(finalCategories)];

      // Crear nuevo sticker público MANTENIENDO el ID con P
      const publicSticker = new Sticker({
        id_sticker: personalizedSticker.id_personalized, // ¡Mantener el ID con P!
        imagePath: personalizedSticker.imagePath, // Reutilizar la misma imagen
        categories: uniqueCategories
      });

      await publicSticker.save();
      console.log(`📤 Sticker personalizado publicado: ${personalizedSticker.id_personalized} con categorías: ${uniqueCategories.join(', ')}`);

      // Eliminar el sticker personalizado después de publicarlo exitosamente
      // Ya que ahora existe como sticker público
      await PersonalizedSticker.findByIdAndDelete(id);
      console.log(`🗑️ Sticker personalizado eliminado de la colección de personalizados: ${personalizedSticker.id_personalized}`);

      res.json({
        success: true,
        message: 'Sticker personalizado publicado exitosamente en el catálogo público',
        data: {
          publishedSticker: publicSticker,
          publishedWithCategories: uniqueCategories
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al publicar el sticker personalizado',
        error: (error as Error).message
      });
    }
  }

  // Ejecutar limpieza automática de stickers expirados
  public async cleanupExpiredStickers(req: Request, res: Response): Promise<void> {
    try {
      const result = await (PersonalizedSticker as any).cleanupExpiredStickers();
      
      res.json({
        success: true,
        message: result.message,
        data: {
          deletedCount: result.deleted,
          errors: result.errors
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en la limpieza automática',
        error: (error as Error).message
      });
    }
  }

  // Extraer solo la URL de imagen de Pinterest (sin guardar el sticker)
  public async extractPinterestImageUrl(req: Request, res: Response): Promise<void> {
    try {
      const { pinterestUrl } = req.body;

      // Validar parámetros requeridos
      if (!pinterestUrl) {
        res.status(400).json({
          success: false,
          message: 'URL de Pinterest es requerida'
        });
        return;
      }

      // Validar URL de Pinterest
      if (!isValidPinterestUrl(pinterestUrl)) {
        res.status(400).json({
          success: false,
          message: 'URL de Pinterest inválida. Asegúrate de usar un enlace de pin válido.'
        });
        return;
      }

      console.log(`🔍 Extrayendo URL de imagen de Pinterest: ${pinterestUrl}`);

      // Extraer URL de la imagen
      const imageUrl = await extractPinterestImageUrl(pinterestUrl);
      console.log(`🖼️ URL de imagen extraída: ${imageUrl}`);

      res.status(200).json({
        success: true,
        message: 'URL de imagen extraída exitosamente',
        data: {
          imageUrl,
          originalUrl: pinterestUrl
        }
      });

    } catch (error) {
      console.error('❌ Error al extraer URL de imagen de Pinterest:', error);
      
      res.status(400).json({
        success: false,
        message: 'Error al extraer la URL de imagen de Pinterest',
        error: (error as Error).message
      });
    }
  }
}

// Endpoint para limpieza manual de stickers temporales expirados
export const cleanupExpiredStickers = async (req: Request, res: Response) => {
  try {
    console.log('🧹 Iniciando limpieza manual de stickers temporales expirados...');
    
    const result = await manualCleanup();
    
    res.json({
      success: true,
      message: `Limpieza completada. ${result.deleted} stickers eliminados.`,
      data: {
        deleted: result.deleted,
        errors: result.errors
      }
    });
    
  } catch (error) {
    console.error('❌ Error en limpieza manual:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error durante la limpieza de stickers temporales',
      error: (error as Error).message
    });
  }
};