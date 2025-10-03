import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import Sticker from '../models/Sticker';

const categoriesPath = path.join(__dirname, '../data/categories.json');

export class CategoryController {
  // Obtener todas las categorías
  public async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
      const { categories } = JSON.parse(categoriesData);
      
      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener las categorías',
        error: (error as Error).message
      });
    }
  }

  // Obtener categorías con conteo de stickers (solo las que tienen stickers)
  public async getCategoriesWithCount(req: Request, res: Response): Promise<void> {
    try {
      // Obtener conteo de stickers por categoría
      const categoryCounts = await Sticker.aggregate([
        { $unwind: '$categories' },
        {
          $group: {
            _id: '$categories',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } } // Ordenar por cantidad descendente
      ]);

      // Obtener conteo de stickers sin categoría
      const uncategorizedCount = await Sticker.countDocuments({
        $or: [
          { categories: { $exists: false } },
          { categories: { $size: 0 } }
        ]
      });

      // Construir respuesta
      const categoriesWithCount = categoryCounts.map(item => ({
        name: item._id,
        count: item.count
      }));

      // Agregar "sin categoría" si hay stickers sin categoría
      if (uncategorizedCount > 0) {
        categoriesWithCount.push({
          name: 'sin-categoria',
          count: uncategorizedCount
        });
      }

      res.json({
        success: true,
        data: categoriesWithCount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener las categorías con conteo',
        error: (error as Error).message
      });
    }
  }

  // Agregar una nueva categoría
  public async addCategory(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          message: 'El nombre de la categoría es requerido'
        });
        return;
      }

      const categoryName = name.trim().toLowerCase();

      // Leer categorías actuales
      const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
      const { categories } = JSON.parse(categoriesData);

      // Verificar si ya existe
      if (categories.includes(categoryName)) {
        res.status(400).json({
          success: false,
          message: 'La categoría ya existe'
        });
        return;
      }

      // Agregar nueva categoría
      categories.push(categoryName);
      categories.sort(); // Mantener orden alfabético

      // Guardar archivo
      fs.writeFileSync(categoriesPath, JSON.stringify({ categories }, null, 2));

      res.status(201).json({
        success: true,
        message: `Categoría '${categoryName}' agregada exitosamente`,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al agregar la categoría',
        error: (error as Error).message
      });
    }
  }

  // Eliminar una categoría
  public async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;

      // Leer categorías actuales
      const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
      const { categories } = JSON.parse(categoriesData);

      // Verificar si existe
      const categoryIndex = categories.indexOf(category);
      if (categoryIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
        return;
      }

      // Remover categoría del archivo JSON
      categories.splice(categoryIndex, 1);

      // Remover la categoría de todos los stickers que la tengan
      await Sticker.updateMany(
        { categories: category },
        { $pull: { categories: category } }
      );

      // Guardar archivo actualizado
      fs.writeFileSync(categoriesPath, JSON.stringify({ categories }, null, 2));

      res.json({
        success: true,
        message: `Categoría eliminada exitosamente y removida de todos los stickers`,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la categoría',
        error: (error as Error).message
      });
    }
  }
}