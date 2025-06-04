/**
 * Application Configuration Module
 * 
 * Uygulama genelindeki tüm yapılandırmaları yönetir.
 * Environment variables'ları okur ve tip güvenli hale getirir.
 * 
 */

import dotenv from 'dotenv';

// .env dosyasını yükle - uygulama başlangıcında çalışmalı
dotenv.config();

/**
 * Main Application Configuration Object
 * 
 * Tüm environment variables'ları merkezi bir yerde toplar.
 * Tip güvenliği sağlar ve default değerler atar.
 */
export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3000'), // HTTP server port
  nodeEnv: process.env.NODE_ENV || 'development', // Çalışma ortamı
  
  // Database Configuration (Supabase)
  supabase: {
    url: process.env.SUPABASE_URL!, // Supabase project URL (required)
    anonKey: process.env.SUPABASE_ANON_KEY!, // Public anon key (required)
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin service key (required)
  },
  
  // JWT Authentication Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key', // JWT signing secret
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', // Token expiration time
  } as const,
  
  // Cloudinary File Upload Configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!, // Cloudinary cloud name (required)
    apiKey: process.env.CLOUDINARY_API_KEY!, // Cloudinary API key (required)
    apiSecret: process.env.CLOUDINARY_API_SECRET!, // Cloudinary API secret (required)
  },
  
  // AI Service Configuration (Google Gemini)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY!, // Google Gemini API key (required)
  },
} as const;

// Default export - backward compatibility
export default config; 