import type { PersonalizedSticker, ApiResponse } from '../types';

class PersonalizedStickerApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Si hay FormData, no establecer Content-Type (se establece automáticamente con boundary)
    if (options.body instanceof FormData) {
      const headers = config.headers as Record<string, string>;
      delete headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async createPersonalizedSticker(formData: FormData): Promise<ApiResponse<PersonalizedSticker>> {
    return this.request<ApiResponse<PersonalizedSticker>>('/api/personalized-stickers', {
      method: 'POST',
      body: formData
    });
  }

  // Nuevos métodos para stickers temporales
  async createTemporaryPersonalizedSticker(formData: FormData): Promise<ApiResponse<PersonalizedSticker>> {
    return this.request<ApiResponse<PersonalizedSticker>>('/api/personalized-stickers/temporary', {
      method: 'POST',
      body: formData
    });
  }

  async createTemporaryPersonalizedStickerFromPinterest(data: { 
    pinterestUrl: string; 
  }): Promise<ApiResponse<PersonalizedSticker>> {
    return this.request<ApiResponse<PersonalizedSticker>>('/api/personalized-stickers/temporary/from-pinterest', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async confirmTemporaryStickers(stickerIds: string[]): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/personalized-stickers/confirm-temporary', {
      method: 'POST',
      body: JSON.stringify({ stickerIds })
    });
  }

  async createPersonalizedStickerFromPinterest(data: { 
    pinterestUrl: string; 
  }): Promise<ApiResponse<PersonalizedSticker>> {
    return this.request<ApiResponse<PersonalizedSticker>>('/api/personalized-stickers/from-pinterest', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getPersonalizedStickerById(id: string): Promise<ApiResponse<PersonalizedSticker>> {
    return this.request<ApiResponse<PersonalizedSticker>>(`/api/personalized-stickers/${id}`);
  }

  async getAllPersonalizedStickers(): Promise<ApiResponse<PersonalizedSticker[]>> {
    return this.request<ApiResponse<PersonalizedSticker[]>>('/api/personalized-stickers');
  }

  async deletePersonalizedSticker(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/api/personalized-stickers/${id}`, {
      method: 'DELETE'
    });
  }

  async publishPersonalizedSticker(id: string, categories: string[] = []): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/personalized-stickers/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ categories })
    });
  }

  getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${this.baseUrl}${imagePath}`;
  }
}

export const personalizedStickerApiService = new PersonalizedStickerApiService();