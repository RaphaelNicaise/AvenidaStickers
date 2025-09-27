import fs from 'fs';
import path from 'path';

async function cleanUploads() {
  try {
    console.log('🧹 Limpiando archivos de imágenes...');
    
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    
    // Verificar si la carpeta existe
    if (!fs.existsSync(uploadsPath)) {
      console.log('ℹ️  La carpeta de uploads no existe, nada que limpiar');
      return;
    }

    // Leer todos los archivos en la carpeta
    const files = fs.readdirSync(uploadsPath);
    
    if (files.length === 0) {
      console.log('ℹ️  No hay archivos para eliminar en uploads');
      return;
    }

    // Eliminar cada archivo
    for (const file of files) {
      const filePath = path.join(uploadsPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Eliminado: ${file}`);
      }
    }

    console.log(`\n✨ ${files.length} archivos eliminados exitosamente!`);
    console.log('📁 Carpeta uploads limpia y lista para nuevas imágenes');

  } catch (error) {
    console.error('❌ Error durante la limpieza de uploads:', error);
    process.exit(1);
  }
}

// Ejecutar limpieza
cleanUploads();