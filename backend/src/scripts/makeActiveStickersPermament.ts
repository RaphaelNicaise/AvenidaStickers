import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PersonalizedSticker from '../models/PersonalizedSticker';

// Cargar variables de entorno
dotenv.config();

async function removeExpirationFromActiveStickers() {
  try {
    console.log('🔧 Migrando stickers personalizados activos para que sean permanentes...');
    
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avenida-stickers';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Encontrar todos los stickers personalizados activos con fecha de expiración
    const activeStickersWithExpiration = await PersonalizedSticker.find({
      status: 'active',
      expiresAt: { $exists: true }
    });

    console.log(`📊 Encontrados ${activeStickersWithExpiration.length} stickers activos con fecha de expiración`);

    if (activeStickersWithExpiration.length === 0) {
      console.log('ℹ️ No hay stickers activos con fecha de expiración para migrar');
      return;
    }

    // Remover el campo expiresAt de todos los stickers activos
    const result = await PersonalizedSticker.updateMany(
      { 
        status: 'active',
        expiresAt: { $exists: true }
      },
      { 
        $unset: { expiresAt: 1 } // Eliminar el campo expiresAt
      }
    );

    console.log(`✅ Migración completada: ${result.modifiedCount} stickers activos son ahora permanentes`);
    console.log('🎉 Los stickers personalizados activos ya no expiran hasta que se publiquen al catálogo');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Ejecutar migración
if (require.main === module) {
  removeExpirationFromActiveStickers();
}

export { removeExpirationFromActiveStickers };