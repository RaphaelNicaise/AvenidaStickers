import { Router } from 'express';
import { StickerController } from '../controllers/stickerController';
import { singleImageUpload } from '../config/upload';
import { adminAuth } from '../middleware/adminAuth';

const router: any = Router();
const stickerController = new StickerController();

// Rutas públicas (lectura)
router.get('/', stickerController.getAllStickers.bind(stickerController));
router.get('/search', stickerController.searchStickers.bind(stickerController));
router.get('/:id', stickerController.getStickerById.bind(stickerController));

// Rutas de administración (CRUD completo) - requieren autenticación
router.post('/', adminAuth, singleImageUpload, stickerController.createSticker.bind(stickerController));
router.post('/from-pinterest', adminAuth, stickerController.createStickerFromPinterest.bind(stickerController));
router.put('/:id', adminAuth, singleImageUpload, stickerController.updateSticker.bind(stickerController));
router.delete('/:id', adminAuth, stickerController.deleteSticker.bind(stickerController));

export default router;