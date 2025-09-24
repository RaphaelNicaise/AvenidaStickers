import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import paymentsRoutes from "./routes/payments";
import stickersRoutes from "./routes/stickers";
import categoriesRoutes from "./routes/categories";

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Rutas básicas
app.get('/', (req: express.Request, res: express.Response) => res.send('Backend corriendo 🚀'));

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rutas de la API
app.use('/api/stickers', stickersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use("/payments", paymentsRoutes);

// Rutas de MercadoPago (mantener existentes)
app.get('/success', (req: express.Request, res: express.Response) => {
  res.send('<h1>¡Pago exitoso!</h1>');
});

app.get('/failure', (req: express.Request, res: express.Response) => {
  res.send('<h1>Pago fallido</h1>');
});

app.get('/pending', (req: express.Request, res: express.Response) => {
  res.send('<h1>Pago pendiente</h1>');
});

// Middleware de manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Ruta 404
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

app.listen(PORT, () => {
  console.log(`Server corriendo en http://localhost:${PORT}`);
});