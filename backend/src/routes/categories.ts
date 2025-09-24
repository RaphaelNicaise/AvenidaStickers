import { Router, IRouter } from 'express';
import { CategoryController } from '../controllers/categoryController';

const router: IRouter = Router();
const categoryController = new CategoryController();

// Rutas para categorías
router.get('/', categoryController.getAllCategories);
router.post('/', categoryController.addCategory);
router.delete('/:category', categoryController.deleteCategory);

export default router;