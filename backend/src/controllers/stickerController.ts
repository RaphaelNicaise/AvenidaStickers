import { Request, Response } from 'express';
import Sticker, { ISticker } from '../models/Sticker';
import path from 'path';
import fs from 'fs';
import { 
  extractPinterestImageUrl, 
  downloadImage, 
  saveOptimizedImage, 
  isValidPinterestUrl 
} from '../utils/pinterestUtils';

// Extender Request para incluir file de multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export class StickerController {
  // Obtener todos los stickers
  public async getAllStickers(req: Request, res: Response): Promise<void> {
    try {
      const { categories, search, page = 1, limit = 12 } = req.query;
      
      // Convertir page y limit a números
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      
      // Validar parámetros de paginación
      if (pageNumber < 1 || limitNumber < 1 || limitNumber > 100) {
        res.status(400).json({
          success: false,
          message: 'Parámetros de paginación inválidos. Page >= 1, Limit entre 1 y 100'
        });
        return;
      }
      
      const skip = (pageNumber - 1) * limitNumber;
      
      // Construir el filtro
      let filter: any = {};
      
      // Filtro por categorías
      if (categories) {
        const categoriesArray = (categories as string).split(',');
        
        // Verificar si se solicita filtrar por stickers sin categoría
        if (categoriesArray.includes('sin-categoria')) {
          // Crear filtro para stickers con categorías vacías O que contengan las otras categorías seleccionadas
          const otherCategories = categoriesArray.filter(cat => cat !== 'sin-categoria');
          
          if (otherCategories.length > 0) {
            // Si hay otras categorías seleccionadas además de "sin-categoria"
            filter.$or = [
              { categories: { $size: 0 } }, // Sin categorías
              { categories: { $in: otherCategories } } // Con categorías específicas
            ];
          } else {
            // Solo se seleccionó "sin-categoria"
            filter.categories = { $size: 0 };
          }
        } else {
          // Filtro normal por categorías específicas
          filter.categories = { $in: categoriesArray };
        }
      }

      // Filtro por búsqueda (id_sticker, categorías)
      if (search && typeof search === 'string' && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { id_sticker: searchRegex },
          { categories: { $in: [searchRegex] } }
        ];
      }

      // Ejecutar consulta con paginación y contar total
      const [stickers, totalStickers] = await Promise.all([
        Sticker.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber),
        Sticker.countDocuments(filter)
      ]);
      
      // Calcular información de paginación
      const totalPages = Math.ceil(totalStickers / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;
      
      res.json({
        success: true,
        data: stickers,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalStickers,
          limit: limitNumber,
          hasNextPage,
          hasPrevPage
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener los stickers',
        error: (error as Error).message
      });
    }
  }

  // Obtener un sticker por ID
  public async getStickerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sticker = await Sticker.findById(id);

      if (!sticker) {
        res.status(404).json({
          success: false,
          message: 'Sticker no encontrado'
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
        message: 'Error al obtener el sticker',
        error: (error as Error).message
      });
    }
  }

  // Crear un nuevo sticker
  public async createSticker(req: MulterRequest, res: Response): Promise<void> {
    try {
      const { categories } = req.body;
      
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
      
      // Generar el próximo ID de sticker
      const nextId = await (Sticker as any).generateNextId();

      // Parsear categories - puede venir como string JSON, string separado por comas, o array
      let parsedCategories: string[] = [];
      if (categories) {
        if (typeof categories === 'string') {
          try {
            // Intentar parsear como JSON primero
            const jsonParsed = JSON.parse(categories);
            if (Array.isArray(jsonParsed)) {
              parsedCategories = jsonParsed.map((cat: string) => cat.trim().toLowerCase());
            }
          } catch {
            // Si no es JSON válido, asumir que es string separado por comas
            parsedCategories = categories.split(',').map((cat: string) => cat.trim().toLowerCase());
          }
        } else if (Array.isArray(categories)) {
          parsedCategories = categories.map((cat: string) => cat.trim().toLowerCase());
        }
      }

      const sticker: ISticker = new Sticker({
        id_sticker: nextId,
        imagePath,
        categories: parsedCategories
      });

      const savedSticker = await sticker.save();

      res.status(201).json({
        success: true,
        message: 'Sticker creado exitosamente',
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
        message: 'Error al crear el sticker',
        error: (error as Error).message
      });
    }
  }

  // Actualizar un sticker
  public async updateSticker(req: MulterRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { categories } = req.body;

      const updateData: any = {};

      // Parsear categories si está presente
      if (categories !== undefined) {
        let parsedCategories: string[] = [];
        if (typeof categories === 'string') {
          try {
            // Intentar parsear como JSON primero
            const jsonParsed = JSON.parse(categories);
            if (Array.isArray(jsonParsed)) {
              parsedCategories = jsonParsed.map((cat: string) => cat.trim().toLowerCase());
            }
          } catch {
            // Si no es JSON válido, asumir que es string separado por comas
            parsedCategories = categories.split(',').map((cat: string) => cat.trim().toLowerCase());
          }
        } else if (Array.isArray(categories)) {
          parsedCategories = categories.map((cat: string) => cat.trim().toLowerCase());
        }
        updateData.categories = parsedCategories;
      }

      // Remover campos undefined
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );

      // Si hay nueva imagen
      if (req.file) {
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

        const oldSticker = await Sticker.findById(id);
        if (oldSticker) {
          // Eliminar imagen anterior
          const oldImagePath = path.join(process.cwd(), 'public', oldSticker.imagePath);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updateData.imagePath = `/uploads/${req.file.filename}`;
      }

      const sticker = await Sticker.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!sticker) {
        res.status(404).json({
          success: false,
          message: 'Sticker no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Sticker actualizado exitosamente',
        data: sticker
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar el sticker',
        error: (error as Error).message
      });
    }
  }

  // Eliminar un sticker
  public async deleteSticker(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sticker = await Sticker.findByIdAndDelete(id);

      if (!sticker) {
        res.status(404).json({
          success: false,
          message: 'Sticker no encontrado'
        });
        return;
      }

      // Eliminar la imagen del filesystem
      const imagePath = path.join(process.cwd(), 'public', sticker.imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      res.json({
        success: true,
        message: 'Sticker eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el sticker',
        error: (error as Error).message
      });
    }
  }

  // Buscar stickers
  public async searchStickers(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      
      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Parámetro de búsqueda requerido'
        });
        return;
      }

      const searchRegex = new RegExp(q as string, 'i');
      
      const stickers = await Sticker.find({
        $or: [
          { id_sticker: searchRegex },
          { categories: { $in: [searchRegex] } }
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
        message: 'Error al buscar stickers',
        error: (error as Error).message
      });
    }
  }

  // Importar sticker desde Pinterest
  public async createStickerFromPinterest(req: Request, res: Response): Promise<void> {
    try {
      const { pinterestUrl, categories } = req.body;

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

      // Validar categorías
      const validCategories = Array.isArray(categories) ? categories : [];

      console.log(`🔍 Procesando Pinterest URL: ${pinterestUrl}`);

      // Paso 1: Extraer URL de la imagen
      console.log('📥 Extrayendo URL de imagen...');
      const imageUrl = await extractPinterestImageUrl(pinterestUrl);
      console.log(`🖼️ URL de imagen extraída: ${imageUrl}`);

      // Paso 2: Descargar la imagen
      console.log('⬇️ Descargando imagen...');
      const imageBuffer = await downloadImage(imageUrl);
      console.log(`📦 Imagen descargada: ${imageBuffer.length} bytes`);

      // Generar el próximo ID de sticker
      const nextId = await (Sticker as any).generateNextId();
      
      // Paso 3: Procesar y guardar la imagen
      console.log('🔧 Procesando y guardando imagen...');
      const imagePath = await saveOptimizedImage(imageBuffer, nextId);
      console.log(`💾 Imagen guardada en: ${imagePath}`);

      // Paso 4: Crear sticker en la base de datos
      const newSticker = new Sticker({
        id_sticker: nextId,
        imagePath,
        categories: validCategories,
        source: 'pinterest',
        originalUrl: pinterestUrl,
        createdAt: new Date()
      });

      const savedSticker = await newSticker.save();
      console.log(`✅ Sticker creado con ID: ${savedSticker._id}`);

      res.status(201).json({
        success: true,
        message: 'Sticker importado desde Pinterest exitosamente',
        data: savedSticker
      });

    } catch (error) {
      console.error('❌ Error al importar desde Pinterest:', error);
      
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
        message: 'Error al importar desde Pinterest',
        error: errorMessage
      });
    }
  }
}