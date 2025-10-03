# Backend - Avenida Stickers

API REST para la tienda de stickers online construida con Node.js, Express, TypeScript y MongoDB.

## 🛠️ Tecnologías

- **Node.js** + **Express** - Servidor y API REST
- **TypeScript** - Tipado estático
- **MongoDB** + **Mongoose** - Base de datos
- **Multer** - Manejo de archivos de imágenes
- **MercadoPago** - Procesamiento de pagos
- **CORS** - Cross-Origin Resource Sharing

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuraciones (DB, uploads, MercadoPago)
│   ├── controllers/     # Controladores de la API
│   ├── models/          # Modelos de MongoDB
│   ├── routes/          # Rutas de la API
│   ├── scripts/         # Scripts de utilidad
│   └── index.ts         # Punto de entrada del servidor
├── types/               # Definiciones de tipos TypeScript
├── public/uploads/      # Archivos de imágenes subidos
└── package.json
```

## 🚀 Instalación y Configuración

### 1. Instalar dependencias
```bash
cd backend
pnpm install
```

### 2. Configurar variables de entorno
Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Edita `.env` con tus configuraciones:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/avenida-stickers
TEST_MP_ACCESS_TOKEN=tu_token_de_mercadopago
```

### 3. Iniciar MongoDB
Asegúrate de tener MongoDB corriendo localmente o configura una conexión remota.

### 4. Poblar la base de datos (opcional)
```bash
pnpm run seed
```

### 5. Iniciar el servidor
```bash
# Desarrollo (con hot reload)
pnpm run dev

# Producción
pnpm run build
pnpm start
```

El servidor estará disponible en `http://localhost:4000`

## 📚 API Endpoints

### Stickers
- `GET /api/stickers` - Obtener todos los stickers
  - Query params: `categories`
- `GET /api/stickers/:id` - Obtener sticker por ID
- `GET /api/stickers/search?q=term` - Buscar stickers
- `POST /api/stickers` - Crear nuevo sticker (con imagen)
- `PUT /api/stickers/:id` - Actualizar sticker
- `DELETE /api/stickers/:id` - Eliminar sticker

### Categorías
- `GET /api/categories` - Obtener todas las categorías
- `POST /api/categories` - Crear nueva categoría
- `DELETE /api/categories/:name` - Eliminar categoría

### Pagos (MercadoPago) (a)
- `POST /payments/create-preference` - Crear preferencia de pago

### Utilidadrear nueva categoría
- `DELETE /api/categories/:name` - Eliminar categoría
- `GET /` - Mensaje de bienvenida
- `GET /health` - Health check
- `GET /uploads/:filename` - Servir imágenes estáticas

## 📝 Modelo de Datos

### Sticker
```typescript
{
  name: string;           // Nombre del sticker
  description: string;    // Descripción
  imagePath: string;      // Ruta de la imagen
  categories: string[];   // Lista de slugs de categorías (ej: ['anime', 'gaming'])
  createdAt: Date;        // Fecha de creación
  updatedAt: Date;        // Fecha de actualización
}
```

### Category
Las categorías se almacenan como una simple lista de nombres en el archivo `src/data/categories.json`:

```json
{
  "categories": ["anime", "gaming", "memes", "nature", "art", "music"]
}
```

**Nota**: Los precios se definirán por tamaño (chico, mediano, grande) en el carrito de compras. No hay manejo de stock ya que los stickers se producen bajo demanda. Cada sticker puede tener múltiples categorías que deben existir en el sistema.

### Categorías Disponibles
Las categorías se manejan dinámicamente desde un archivo JSON. Algunas categorías iniciales incluyen:
- `anime` - Stickers de anime y manga japonés 🎌
- `gaming` - Stickers de videojuegos y consolas 🎮  
- `memes` - Los memes más populares de internet 😂
- `nature` - Paisajes y elementos naturales 🌿
- `art` - Diseños artísticos y creativos 🎨
- `music` - Instrumentos, bandas y símbolos musicales 🎵

**Gestión**: Las categorías pueden agregarse o eliminarse dinámicamente usando los endpoints de `/api/categories`.

**Nota**: Un sticker puede pertenecer a múltiples categorías simultáneamente.

## 🔧 Scripts Disponibles

- `pnpm run dev` - Iniciar en modo desarrollo
- `pnpm run build` - Compilar TypeScript
- `pnpm run start` - Iniciar servidor compilado
- `pnpm run seed` - Poblar base de datos con datos de ejemplo
- `pnpm run init:config` - Inicializar archivos de configuración desde templates
- `pnpm run clean` - Limpiar base de datos
- `pnpm run clean:uploads` - Limpiar archivos subidos
- `pnpm run migrate` - Migrar datos de stickers

## 📁 Manejo de Archivos

Las imágenes se suben a la carpeta `publc/uploads/` y se sirven estáticamente en `/uploads/:filename`.

Restricciones:
- Solo archivos de imagen
- Tamaño máximo: 5MB
- Nombres únicos automáticos con timestamp

## ⚠️ Notas Importantes

- Las rutas de MercadoPago (`/payments/*`) están configuradas y no deben modificarse
- Las imágenes se almacenan localmente en el filesystem
- El servidor usa CORS para permitir conexiones desde el frontend
- Los tipos TypeScript están en la carpeta `types/`

## 🐛 Debugging

Para debugging, el servidor devuelve información detallada de errores en modo desarrollo (`NODE_ENV=development`).