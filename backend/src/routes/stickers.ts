import { Router } from 'express';
import { StickerController } from '../controllers/stickerController';
import { singleImageUpload } from '../config/upload';

const router: any = Router();
const stickerController = new StickerController();

// Rutas públicas (lectura)
router.get('/', stickerController.getAllStickers.bind(stickerController));
router.get('/search', stickerController.searchStickers.bind(stickerController));
router.get('/:id', stickerController.getStickerById.bind(stickerController));

// Rutas de administración (CRUD completo)
router.post('/', singleImageUpload, stickerController.createSticker.bind(stickerController));
router.put('/:id', singleImageUpload, stickerController.updateSticker.bind(stickerController));
router.delete('/:id', stickerController.deleteSticker.bind(stickerController));

export default router;