import { Request, Response } from 'express';
import Sticker from '../models/Sticker';
import PersonalizedSticker from '../models/PersonalizedSticker';
import * as fs from 'fs';
import * as path from 'path';

const categoriesPath = path.join(__dirname, '../data/categories.json');
const sizesPath = path.join(__dirname, '../data/sticker-sizes.json');

export class AdminController {
  // Validar clave de administrador
  public async validateAdminKey(req: Request, res: Response): Promise<void> {
    try {
      const { adminKey } = req.body;
      const envAdminKey = process.env.ADMIN_KEY;

      if (!envAdminKey) {
        res.status(500).json({
          success: false,
          message: 'Configuración de administrador no disponible'
        });
        return;
      }

      if (adminKey === envAdminKey) {
        res.json({
          success: true,
          message: 'Acceso autorizado',
          token: envAdminKey
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Clave de administrador incorrecta'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en la autenticación',
        error: (error as Error).message
      });
    }
  }

  // Obtener estadísticas del dashboard
  public async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const totalStickers = await Sticker.countDocuments();
      
      // Obtener categorías
      const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
      const { categories } = JSON.parse(categoriesData);
      
      // Obtener tamaños
      const sizesData = fs.readFileSync(sizesPath, 'utf8');
      const { sizes } = JSON.parse(sizesData);

      // Estadísticas por categoría
      const categoryStats = await Sticker.aggregate([
        { $unwind: { path: '$categories', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$categories', 'Sin categoría'] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.json({
        success: true,
        data: {
          totalStickers,
          totalCategories: categories.length,
          totalSizes: sizes.length,
          categoryStats,
          recentStickers: await Sticker.find().sort({ createdAt: -1 }).limit(5)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: (error as Error).message
      });
    }
  }

  // Obtener configuración de tamaños
  public async getSizes(req: Request, res: Response): Promise<void> {
    try {
      const sizesData = fs.readFileSync(sizesPath, 'utf8');
      const sizes = JSON.parse(sizesData);
      
      res.json({
        success: true,
        data: sizes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener configuración de tamaños',
        error: (error as Error).message
      });
    }
  }

  // Actualizar configuración de tamaños
  public async updateSizes(req: Request, res: Response): Promise<void> {
    try {
      const { sizes, currency } = req.body;

      if (!sizes || !Array.isArray(sizes)) {
        res.status(400).json({
          success: false,
          message: 'Configuración de tamaños inválida'
        });
        return;
      }

      // Validar estructura de cada tamaño
      const validSizes = sizes.every(size => 
        size.id && size.name && size.dimensions && typeof size.price === 'number'
      );

      if (!validSizes) {
        res.status(400).json({
          success: false,
          message: 'Estructura de tamaños inválida'
        });
        return;
      }

      const newConfig = {
        sizes,
        currency: currency || 'ARS',
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(sizesPath, JSON.stringify(newConfig, null, 2));

      res.json({
        success: true,
        message: 'Configuración de tamaños actualizada exitosamente',
        data: newConfig
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar configuración de tamaños',
        error: (error as Error).message
      });
    }
  }

  // Reiniciar catálogo completo (configuración avanzada)
  public async resetCatalog(req: Request, res: Response): Promise<void> {
    try {
      const { adminPassword } = req.body;
      const envAdminKey = process.env.ADMIN_KEY;

      // Validar contraseña de administrador
      if (!envAdminKey || adminPassword !== envAdminKey) {
        res.status(401).json({
          success: false,
          message: 'Contraseña de administrador incorrecta'
        });
        return;
      }

      console.log('🔄 Iniciando reinicio completo del catálogo...');

      // 1. Eliminar todos los stickers de la base de datos
      const deletedStickers = await Sticker.deleteMany({});
      console.log(`✅ Eliminados ${deletedStickers.deletedCount} stickers de la base de datos`);

      // 2. Eliminar todos los stickers personalizados
      const deletedPersonalized = await PersonalizedSticker.deleteMany({});
      console.log(`✅ Eliminados ${deletedPersonalized.deletedCount} stickers personalizados`);

      // 3. Limpiar directorio de uploads
      const uploadsPath = path.join(__dirname, '../../public/uploads');
      if (fs.existsSync(uploadsPath)) {
        const files = fs.readdirSync(uploadsPath);
        let deletedFiles = 0;
        
        files.forEach(file => {
          const filePath = path.join(uploadsPath, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            deletedFiles++;
          }
        });
        console.log(`✅ Eliminados ${deletedFiles} archivos de uploads`);
      }

      // 4. Restaurar categorías a las predeterminadas
      const defaultCategories = {
        categories: [
          'argentina',
          'art',
          'breaking bad',
          'gaming',
          'música',
          'personalizados'
        ]
      };
      fs.writeFileSync(categoriesPath, JSON.stringify(defaultCategories, null, 2));
      console.log('✅ Categorías restauradas a valores predeterminados');

      // 5. Mantener configuración actual de tamaños y precios (NO restaurar)
      console.log('ℹ️ Configuración de tamaños y precios mantenida sin cambios');

      console.log('🎉 Reinicio del catálogo completado exitosamente');

      res.json({
        success: true,
        message: 'Catálogo reiniciado exitosamente. Todos los datos han sido eliminados y las categorías restauradas a valores predeterminados. La configuración de precios se mantuvo sin cambios.',
        data: {
          deletedStickers: deletedStickers.deletedCount,
          deletedPersonalized: deletedPersonalized.deletedCount,
          resetCategories: defaultCategories.categories.length,
          pricesPreserved: true
        }
      });
    } catch (error) {
      console.error('❌ Error durante el reinicio del catálogo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reiniciar el catálogo',
        error: (error as Error).message
      });
    }
  }
}