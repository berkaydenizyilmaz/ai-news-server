/**
 * Express Types Module
 * 
 * Express için özelleştirilmiş tip tanımlamaları.
 * Request ve Response tiplerini genişletir.
 */

import { Request as ExpressRequest } from 'express';
import { TokenPayload } from '@/features/auth/auth.types';

/**
 * Extended Express Request
 * Express.Request tipini AuthUser ile genişletir
 */
export interface Request extends ExpressRequest {
  user?: TokenPayload;
} 