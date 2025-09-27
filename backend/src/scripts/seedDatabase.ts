import mongoose from 'mongoose';
import Sticker from '../models/Sticker';
import { connectDB } from '../config/database';

const sampleStickers = [
  {
    name: 'Sticker Anime Naruto',
    description: 'Sticker de alta calidad del personaje Naruto Uzumaki',
    imagePath: '/uploads/sample-naruto.jpg',
    categories: ['anime']
  },
  {
    name: 'Sticker Gaming Mario',
    description: 'Sticker clásico de Super Mario Bros',
    imagePath: '/uploads/sample-mario.jpg', 
    categories: ['gaming']
  },
  {
    name: 'Sticker Meme Pepe',
    description: 'El famoso meme de Pepe the Frog',
    imagePath: '/uploads/sample-pepe.jpg',
    categories: ['memes']
  },
  {
    name: 'Sticker Nature Mountain',
    description: 'Hermoso paisaje de montañas',
    imagePath: '/uploads/sample-mountain.jpg',
    categories: ['nature']
  },
  {
    name: 'Sticker Art Abstract',
    description: 'Arte abstracto colorido',
    imagePath: '/uploads/sample-abstract.jpg',
    categories: ['art']
  },
  {
    name: 'Sticker Gaming Pokémon',
    description: 'Pikachu en estilo retro',
    imagePath: '/uploads/sample-pikachu.jpg',
    categories: ['gaming', 'anime']
  },
  {
    name: 'Sticker Meme Doge',
    description: 'El clásico meme de Doge',
    imagePath: '/uploads/sample-doge.jpg',
    categories: ['memes']
  },
  {
    name: 'Sticker Music Rock',
    description: 'Guitarra eléctrica clásica',
    imagePath: '/uploads/sample-guitar.jpg',
    categories: ['music']
  },
  {
    name: 'Sticker Personalizado 1',
    description: 'Sticker único sin categoría específica',
    imagePath: '/uploads/sample-custom1.jpg',
    categories: []
  },
  {
    name: 'Sticker Especial',
    description: 'Diseño especial exclusivo',
    imagePath: '/uploads/sample-special.jpg',
    categories: []
  }
];

async function seedDatabase() {
  try {
    await connectDB();
    
    // Limpiar colección de stickers
    await Sticker.deleteMany({});
    console.log('🗑️  Colección de stickers limpiada');
    
    // Insertar stickers de prueba
    const insertedStickers = await Sticker.insertMany(sampleStickers);
    console.log(`✅ ${insertedStickers.length} stickers insertados exitosamente`);
    
    console.log('\n📦 Stickers creados:');
    insertedStickers.forEach((sticker, index) => {
      console.log(`${index + 1}. ${sticker.name} - ${sticker.categories.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;