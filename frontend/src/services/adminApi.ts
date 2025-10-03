import type { Sticker } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class AdminApiService {
  private baseURL = API_BASE_URL;
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token de autenticación inválido');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Error de conexión con el servidor');
      }
      throw error;
    }
  }

  // Autenticación
  async login(adminKey: string): Promise<{ success: boolean; token: string; message: string }> {
    return this.request('/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({ adminKey })
    });
  }

  // Dashboard
  async getDashboardStats(): Promise<any> {
    if (!this.token) {
      throw new Error('No hay token de autenticación disponible');
    }
    return this.request('/api/admin/dashboard');
  }

  // Gestión de Stickers
  async getStickers(filters?: {
    categories?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
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
    
    return this.request(endpoint);
  }

  async createSticker(formData: FormData): Promise<{ success: boolean; data: Sticker; message: string }> {
    const response = await fetch(`${this.baseURL}/api/stickers`, {
      method: 'POST',
      headers: {
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createStickerFromPinterest(data: { 
    pinterestUrl: string; 
    categories: string[] 
  }): Promise<{ success: boolean; data: Sticker; message: string }> {
    return this.request('/api/stickers/from-pinterest', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSticker(id: string, formData: FormData): Promise<{ success: boolean; data: Sticker; message: string }> {
    const response = await fetch(`${this.baseURL}/api/stickers/${id}`, {
      method: 'PUT',
      headers: {
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteSticker(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/stickers/${id}`, {
      method: 'DELETE'
    });
  }

  // Gestión de Categorías
  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    return this.request('/api/categories');
  }

  async createCategory(name: string): Promise<{ success: boolean; message: string; data: string[] }> {
    return this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  async deleteCategory(category: string): Promise<{ success: boolean; message: string; data: string[] }> {
    return this.request(`/api/categories/${encodeURIComponent(category)}`, {
      method: 'DELETE'
    });
  }

  // Gestión de Tamaños
  async getSizes(): Promise<any> {
    return this.request('/api/admin/sizes');
  }

  async updateSizes(data: { sizes: any[]; currency: string }): Promise<any> {
    return this.request('/api/admin/sizes', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
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

  // Reiniciar catálogo completo (configuración avanzada)
  async resetCatalog(adminPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/admin/reset-catalog', {
      method: 'POST',
      body: JSON.stringify({ adminPassword })
    });
  }
}

export const adminApiService = new AdminApiService();