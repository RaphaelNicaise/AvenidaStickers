import { Router, IRouter } from 'express';
import { AdminController } from '../controllers/adminController';
import { adminAuth } from '../middleware/adminAuth';

const router: IRouter = Router();
const adminController = new AdminController();

// Ruta de autenticación (sin middleware de auth)
router.post('/auth', adminController.validateAdminKey);

// Todas las demás rutas requieren autenticación
router.use(adminAuth);

// Dashboard y estadísticas
router.get('/dashboard', adminController.getDashboardStats);

// Gestión de tamaños
router.get('/sizes', adminController.getSizes);
router.put('/sizes', adminController.updateSizes);

// Configuración avanzada
router.post('/reset-catalog', adminController.resetCatalog);

export default router;