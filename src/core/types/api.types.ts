/**
 * API Response Types Module
 * 
 * API yanıtları için standart tip tanımlamaları.
 * Tüm API endpoint'leri bu tipleri kullanarak tutarlı yanıtlar döner.
 */

/**
 * Standard API Response Interface
 * 
 * Tüm API yanıtları için temel interface.
 * Generic tip parametresi ile farklı veri tipleri için kullanılabilir.
 * 
 * @template T - Yanıt data tipini belirler (default: any)
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Paginated API Response Interface
 * 
 * Sayfalandırılmış API yanıtları için genişletilmiş interface.
 * Liste dönen endpoint'lerde kullanılır.
 * 
 * @template T - Liste elemanlarının tipini belirler
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

import { Request } from 'express';

/**
 * Request with User Interface
 * 
 * Kimlik doğrulaması yapılmış istekler için genişletilmiş Request interface.
 * Auth middleware tarafından request nesnesine eklenen user bilgisini içerir.
 */
export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
} 