import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import sharp from 'sharp';

/**
 * Valida si una URL es de Pinterest
 */
export function isValidPinterestUrl(url: string): boolean {
  const pinterestPatterns = [
    /^https?:\/\/(www\.)?pinterest\.com\/pin\/\d+/,
    /^https?:\/\/(ar|es|br|mx)\.pinterest\.com\/pin\/\d+/,
    /^https?:\/\/pin\.it\/[a-zA-Z0-9]+/
  ];

  return pinterestPatterns.some(pattern => pattern.test(url));
}

/**
 * Función auxiliar para hacer request HTTP
 */
function makeRequest(url: string, options: any = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...options.headers
      },
      timeout: options.timeout || 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Función auxiliar para descargar archivo binario
 */
function downloadBinary(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://pinterest.com/'
      },
      timeout: 15000
    };

    const req = client.request(requestOptions, (res) => {
      const chunks: Buffer[] = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Download timeout'));
    });

    req.end();
  });
}

/**
 * Extrae la URL de la imagen desde una URL de Pinterest
 */
export async function extractPinterestImageUrl(pinterestUrl: string): Promise<string> {
  try {
    // Validar que sea una URL de Pinterest válida
    if (!isValidPinterestUrl(pinterestUrl)) {
      throw new Error('URL de Pinterest inválida');
    }

    // Hacer request a Pinterest
    const html = await makeRequest(pinterestUrl);

    // Buscar diferentes patrones de URL de imagen en el HTML
    const patterns = [
      /"url":\s*"([^"]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"]*)?)"/, // JSON data
      /property="og:image"\s+content="([^"]+)"/, // Open Graph meta tag
      /"contentUrl":\s*"([^"]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"]*)?)"/, // Schema.org
      /data-test-id="pin-image"[^>]+src="([^"]+)"/, // Pinterest specific
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        // Limpiar la URL (remover escapes)
        let imageUrl = match[1].replace(/\\u002F/g, '/').replace(/\\"/g, '"');
        
        // Verificar que la URL sea válida
        if (imageUrl.startsWith('http')) {
          return imageUrl;
        }
      }
    }

    throw new Error('No se pudo extraer la URL de la imagen de Pinterest');
  } catch (error) {
    console.error('Error al extraer imagen de Pinterest:', error);
    throw new Error(`Error al procesar Pinterest: ${(error as Error).message}`);
  }
}

/**
 * Descarga una imagen desde una URL
 */
export async function downloadImage(imageUrl: string): Promise<Buffer> {
  try {
    return await downloadBinary(imageUrl);
  } catch (error) {
    console.error('Error al descargar imagen:', error);
    throw new Error('Error al descargar la imagen');
  }
}

/**
 * Procesa y guarda una imagen optimizada con Sharp
 */
export async function saveOptimizedImage(imageBuffer: Buffer, customName?: string): Promise<string> {
  try {
    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const baseName = customName ? customName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'pinterest';
    
    const filename = `${baseName}_${timestamp}_${randomSuffix}.jpg`; // Siempre guardar como JPG para mejor compresión

    // Crear directorio de uploads si no existe
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);

    // Procesar imagen con Sharp para mantener buena calidad
    await sharp(imageBuffer)  
      .resize({
        width: 2048,  // Máximo ancho
        height: 2048, // Máximo alto
        fit: 'inside', // Mantener proporción
        withoutEnlargement: true // No agrandar imágenes pequeñas
      })
      .jpeg({
        quality: 90, // Alta calidad (90%)
        progressive: true,
        mozjpeg: true // Mejor compresión
      })
      .toFile(filePath);

    // Retornar la ruta relativa para la base de datos
    return `uploads/${filename}`;
  } catch (error) {
    console.error('Error al procesar imagen:', error);
    throw new Error('Error al procesar y guardar la imagen');
  }
}

/**
 * Extrae el ID del pin desde la URL
 */
export function extractPinId(pinterestUrl: string): string | null {
  const match = pinterestUrl.match(/\/pin\/(\d+)/);
  return match ? match[1] : null;
}