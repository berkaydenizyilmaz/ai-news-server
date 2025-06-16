/**
 * Error Handler Middleware Module
 * 
 * Express uygulaması için merkezi hata yakalama ve işleme middleware'i.
 * Tüm hataları standart bir formatta işler ve istemciye uygun yanıt döner.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import config from '@/core/config';
import { 
  HTTP_STATUS, 
  ENVIRONMENT_TYPES, 
  ERROR_HANDLER_MESSAGES 
} from '@/core/constants';

/**
 * API Error Interface
 * 
 * Standart Error nesnesini API için özelleştirir.
 * HTTP durum kodu ve operasyonel hata bilgisi ekler.
 */
export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global Error Handler Middleware
 * 
 * Uygulama genelinde yakalanan tüm hataları işler.
 * Development ortamında stack trace gösterir.
 * Hataları loglar ve istemciye uygun yanıt döner.
 * 
 * @param err - Yakalanan hata nesnesi
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || ERROR_HANDLER_MESSAGES.INTERNAL_SERVER_ERROR;
  
  // Development ortamında stack trace göster
  const response: any = {
    success: false,
    message,
    ...(config.nodeEnv === ENVIRONMENT_TYPES.DEVELOPMENT && { stack: err.stack }),
  };
  
  // Log the error
  console.error(`Error ${statusCode}: ${message}`);
  if (config.nodeEnv === ENVIRONMENT_TYPES.DEVELOPMENT) {
    console.error(err.stack);
  }
  
  res.status(statusCode).json(response);
};

/**
 * Create API Error Helper
 * 
 * Özelleştirilmiş API hatası oluşturur.
 * HTTP durum kodu ve operasyonel hata bilgisi ekler.
 * 
 * @param message - Hata mesajı
 * @param statusCode - HTTP durum kodu (default: 500)
 * @returns {ApiError} Özelleştirilmiş hata nesnesi
 */
export const createError = (message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR): ApiError => {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}; 