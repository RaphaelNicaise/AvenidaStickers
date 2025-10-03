import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para inicializar archivos de configuración desde templates
 * Se ejecuta automáticamente al iniciar la aplicación
 */
export const initializeConfig = (): void => {
  console.log('🔧 Inicializando configuración del proyecto...');
  
  // Directorio de datos
  const dataDir = path.join(__dirname, '../data');
  
  // Asegurar que el directorio de datos existe
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Directorio de datos creado');
  }
  
  // Lista de archivos de configuración a inicializar
  const configFiles = [
    {
      template: 'categories.json.template',
      target: 'categories.json',
      description: 'Categorías de stickers'
    },
    {
      template: 'sticker-sizes.json.template',
      target: 'sticker-sizes.json',
      description: 'Tamaños y precios de stickers'
    }
  ];
  
  configFiles.forEach(({ template, target, description }) => {
    const templatePath = path.join(dataDir, template);
    const targetPath = path.join(dataDir, target);
    
    if (!fs.existsSync(targetPath)) {
      if (fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, targetPath);
        console.log(`✅ ${description} inicializado: ${target}`);
      } else {
        console.warn(`⚠️ Template no encontrado: ${template}`);
      }
    } else {
      console.log(`ℹ️ ${description} ya existe: ${target}`);
    }
  });
  
  console.log('🎉 Configuración inicializada correctamente');
};

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeConfig();
}