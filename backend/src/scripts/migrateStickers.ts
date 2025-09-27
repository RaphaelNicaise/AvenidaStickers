import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Schema antiguo (para leer datos existentes)
const OldStickerSchema = new mongoose.Schema({
  name: String,
  imagePath: String,
  categories: [String],
  createdAt: Date,
  updatedAt: Date
}, { collection: 'stickers' });

// Schema nuevo (para escribir datos migrados)
const NewStickerSchema = new mongoose.Schema({
  id_sticker: { type: String, unique: true },
  imagePath: String,
  categories: [String],
  createdAt: Date,
  updatedAt: Date
}, { collection: 'stickers_new' });

const OldSticker = mongoose.model('OldSticker', OldStickerSchema);
const NewSticker = mongoose.model('NewSticker', NewStickerSchema);

async function migrateStickers() {
  try {
    console.log('🔄 Iniciando migración de stickers...');
    
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avenida-stickers';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los stickers existentes
    const oldStickers = await OldSticker.find({}).sort({ createdAt: 1 });
    console.log(`📊 Encontrados ${oldStickers.length} stickers para migrar`);

    if (oldStickers.length === 0) {
      console.log('ℹ️ No hay stickers para migrar');
      process.exit(0);
    }

    // Limpiar colección temporal si existe
    await NewSticker.deleteMany({});
    console.log('🗑️ Limpieza de colección temporal completada');

    // Migrar cada sticker
    let migratedCount = 0;
    for (let i = 0; i < oldStickers.length; i++) {
      const oldSticker = oldStickers[i];
      
      // Generar ID incremental (0001, 0002, etc.)
      const id_sticker = (i + 1).toString().padStart(4, '0');
      
      // Crear nuevo sticker
      const newSticker = new NewSticker({
        id_sticker,
        imagePath: oldSticker.imagePath,
        categories: oldSticker.categories || [],
        createdAt: oldSticker.createdAt || new Date(),
        updatedAt: new Date()
      });

      await newSticker.save();
      migratedCount++;
      
      console.log(`✨ Migrado: "${oldSticker.name}" → Sticker #${id_sticker}`);
    }

    console.log(`\n🎉 Migración completada: ${migratedCount} stickers migrados`);
    console.log('\n⚠️  IMPORTANTE: Ahora debes hacer el intercambio de colecciones:');
    console.log('1. Renombrar "stickers" a "stickers_backup"');
    console.log('2. Renombrar "stickers_new" a "stickers"');
    console.log('3. Verificar que todo funciona correctamente');
    console.log('4. Eliminar "stickers_backup" cuando estés seguro');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Script para intercambiar colecciones (ejecutar después de la migración)
async function swapCollections() {
  try {
    console.log('🔄 Iniciando intercambio de colecciones...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avenida-stickers';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No se pudo obtener la referencia a la base de datos');
    }
    
    // Verificar que stickers_new existe y tiene datos
    const newStickersCount = await db.collection('stickers_new').countDocuments();
    console.log(`📊 Stickers en colección nueva: ${newStickersCount}`);
    
    if (newStickersCount === 0) {
      throw new Error('La colección stickers_new está vacía. Ejecuta primero la migración.');
    }

    // 1. Renombrar stickers a stickers_backup
    try {
      await db.collection('stickers').rename('stickers_backup');
      console.log('✅ Colección original respaldada como "stickers_backup"');
    } catch (error: any) {
      if (error.code === 26) { // NamespaceNotFound
        console.log('ℹ️ Colección "stickers" no existe, continuando...');
      } else {
        throw error;
      }
    }

    // 2. Renombrar stickers_new a stickers
    await db.collection('stickers_new').rename('stickers');
    console.log('✅ Nueva colección activada como "stickers"');

    // Verificar migración
    const finalCount = await db.collection('stickers').countDocuments();
    console.log(`📊 Verificación: ${finalCount} stickers en la colección activa`);

    console.log('\n🎉 Intercambio de colecciones completado exitosamente!');
    console.log('⚠️  Recuerda eliminar "stickers_backup" cuando confirmes que todo funciona');

  } catch (error) {
    console.error('❌ Error durante el intercambio:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Determinar qué operación ejecutar
const operation = process.argv[2];

if (operation === 'swap') {
  swapCollections();
} else if (operation === 'migrate' || !operation) {
  migrateStickers();
} else {
  console.log('❓ Uso:');
  console.log('  npm run migrate        - Migrar stickers a nuevo formato');
  console.log('  npm run migrate swap   - Intercambiar colecciones');
  process.exit(1);
}