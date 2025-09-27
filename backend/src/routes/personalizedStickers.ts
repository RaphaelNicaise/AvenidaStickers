import express, { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { PersonalizedStickerController, cleanupExpiredStickers } from '../controllers/personalizedStickerController';

const router: Router = express.Router();
const personalizedStickerController = new PersonalizedStickerController();

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `personalized-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Rutas para stickers personalizados
router.post('/', upload.single('image'), personalizedStickerController.createPersonalizedSticker);
router.post('/from-pinterest', personalizedStickerController.createPersonalizedStickerFromPinterest);

// Rutas para stickers temporales (para carrito)
router.post('/temporary', upload.single('image'), personalizedStickerController.createTemporaryPersonalizedSticker);
router.post('/temporary/from-pinterest', personalizedStickerController.createTemporaryPersonalizedStickerFromPinterest);
router.post('/confirm-temporary', personalizedStickerController.confirmTemporaryStickers);

// Rutas de gestión
router.get('/', personalizedStickerController.getAllPersonalizedStickers); // Obtener todos (para admin)
router.get('/:id', personalizedStickerController.getPersonalizedStickerById);
router.delete('/:id', personalizedStickerController.deletePersonalizedSticker);
router.post('/:id/publish', personalizedStickerController.publishPersonalizedSticker);
router.post('/cleanup/expired', cleanupExpiredStickers); // Limpieza manual/automática

export default router;