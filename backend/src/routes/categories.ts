import { Router, IRouter } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { adminAuth } from '../middleware/adminAuth';

const router: IRouter = Router();
const categoryController = new CategoryController();

// Rutas para categorías
router.get('/', categoryController.getAllCategories); // Público
router.post('/', adminAuth, categoryController.addCategory); // Solo admin
router.delete('/:category', adminAuth, categoryController.deleteCategory); // Solo admin

export default router;