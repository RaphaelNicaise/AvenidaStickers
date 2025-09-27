import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function cleanDatabase() {
  try {
    console.log('🧹 Limpiando base de datos...');
    
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avenida-stickers';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No se pudo obtener la referencia a la base de datos');
    }

    // Obtener todas las colecciones
    const collections = await db.listCollections().toArray();
    console.log(`📊 Encontradas ${collections.length} colecciones`);

    // Eliminar todas las colecciones de stickers
    const collectionsToDelete = collections
      .map(col => col.name)
      .filter(name => 
        name.includes('sticker') || 
        name.includes('Sticker') ||
        name === 'stickers' ||
        name === 'stickers_backup' ||
        name === 'stickers_new'
      );

    if (collectionsToDelete.length === 0) {
      console.log('ℹ️  No hay colecciones de stickers para eliminar');
    } else {
      for (const collectionName of collectionsToDelete) {
        await db.collection(collectionName).drop();
        console.log(`🗑️  Eliminada colección: ${collectionName}`);
      }
    }

    console.log('\n🎉 Base de datos limpiada exitosamente!');
    console.log('✨ Ahora puedes empezar fresh con el nuevo formato de id_sticker');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Reinicia el backend (npm run dev)');
    console.log('2. Los nuevos stickers se crearán automáticamente con formato #0001, #0002, etc.');
    console.log('3. Puedes usar la función de importar desde Pinterest o subir archivos normalmente');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Ejecutar limpieza
cleanDatabase();