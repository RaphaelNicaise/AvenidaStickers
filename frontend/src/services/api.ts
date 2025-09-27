import type { 
  Sticker, 
  StickersResponse, 
  CategoriesResponse, 
  FilterParams,
  StickerSizesData
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class ApiService {
  private baseURL = API_BASE_URL;

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Obtener todos los stickers con filtros opcionales
  async getStickers(filters?: FilterParams): Promise<StickersResponse> {
    let endpoint = '/api/stickers';
    
    if (filters) {
      const params = new URLSearchParams();
      if (filters.categories) params.append('categories', filters.categories);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    
    return this.request<StickersResponse>(endpoint);
  }

  // Obtener un sticker por ID
  async getStickerById(id: string): Promise<{ success: boolean; data: Sticker }> {
    return this.request<{ success: boolean; data: Sticker }>(`/api/stickers/${id}`);
  }

  // Buscar stickers
  async searchStickers(query: string): Promise<StickersResponse> {
    return this.request<StickersResponse>(`/api/stickers/search?q=${encodeURIComponent(query)}`);
  }

  // Obtener todas las categorías
  async getCategories(): Promise<CategoriesResponse> {
    return this.request<CategoriesResponse>('/api/categories');
  }

  // Crear nueva categoría
  async createCategory(name: string): Promise<{ success: boolean; message: string; data: string[] }> {
    const response = await fetch(`${this.baseURL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Obtener medidas y precios de stickers
  async getStickerSizes(): Promise<{ success: boolean; data: StickerSizesData }> {
    return this.request<{ success: boolean; data: StickerSizesData }>('/api/sizes');
  }

  // Construir URL completa para imágenes
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    
    // Si ya es una URL completa, devolverla tal como está
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Si empieza con /uploads, construir URL completa
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${this.baseURL}/${cleanPath}`;
  }
}

export const apiService = new ApiService();