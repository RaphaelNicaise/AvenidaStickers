import { Request, Response } from 'express';
import Sticker, { ISticker } from '../models/Sticker';
import path from 'path';
import fs from 'fs';

// Extender Request para incluir file de multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export class StickerController {
  // Obtener todos los stickers
  public async getAllStickers(req: Request, res: Response): Promise<void> {
    try {
      const { categories } = req.query;
      
      // Construir el filtro
      let filter: any = {};
      
      if (categories) {
        const categoriesArray = (categories as string).split(',');
        filter.categories = { $in: categoriesArray };
      }

      const stickers = await Sticker.find(filter).sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: stickers,
        count: stickers.length
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
      const { name, description, categories } = req.body;
      
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

      // Parsear categories - puede venir como string o array
      let parsedCategories: string[] = [];
      if (categories) {
        if (typeof categories === 'string') {
          parsedCategories = categories.split(',').map((cat: string) => cat.trim());
        } else if (Array.isArray(categories)) {
          parsedCategories = categories;
        }
      }

      const sticker: ISticker = new Sticker({
        name,
        description,
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
      const { name, description, categories } = req.body;

      const updateData: any = {
        name,
        description
      };

      // Parsear categories si está presente
      if (categories !== undefined) {
        let parsedCategories: string[] = [];
        if (typeof categories === 'string') {
          parsedCategories = categories.split(',').map((cat: string) => cat.trim());
        } else if (Array.isArray(categories)) {
          parsedCategories = categories;
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
          { name: searchRegex },
          { description: searchRegex },
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
}