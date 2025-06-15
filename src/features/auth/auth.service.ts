/**
 * Authentication Feature Business Logic Layer
 * 
 * Auth işlemlerinin tüm iş mantığını içerir.
 * Şifre hash'leme, JWT token yönetimi ve kullanıcı doğrulama işlemleri.
 * 
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@/config';
import { AuthModel } from './auth.model';
import { 
  RegisterInput, 
  LoginInput, 
  ChangePasswordInput 
} from './auth.validation';
import { 
  AuthResponse, 
  TokenPayload, 
  AuthServiceResponse 
} from './auth.types';
import { 
  PASSWORD_SECURITY,
  AUTH_ERROR_MESSAGES,
  AUTH_SUCCESS_MESSAGES 
} from './auth.constants';
import { User } from '@/core/types/database.types';

/**
 * Authentication Service Class
 * 
 * Static metodlarla auth iş mantığını yönetir.
 * Model katmanını kullanarak veritabanı işlemlerini soyutlar.
 */
export class AuthService {
  
  // ==================== USER REGISTRATION ====================
  
  /**
   * User Registration Business Logic
   * 
   * Yeni kullanıcı kaydı için tüm iş mantığını yönetir:
   * - Email/username duplicate kontrolü
   * - Şifre hash'leme (bcrypt, 12 rounds)
   * - Kullanıcı oluşturma
   * - JWT token üretimi
   * 
   * @param userData - Validasyon geçmiş kullanıcı verisi
   * @returns {Promise<AuthServiceResponse<AuthResponse>>} Kayıt sonucu
   */
  static async register(userData: RegisterInput): Promise<AuthServiceResponse<AuthResponse>> {
    try {
      // Email ve username kontrolü - duplicate kayıtları önle
      const { emailExists, usernameExists } = await AuthModel.checkEmailOrUsernameExists(
        userData.email,
        userData.username
      );

      if (emailExists) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.EMAIL_EXISTS,
        };
      }

      if (usernameExists) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.USERNAME_EXISTS,
        };
      }

      // Şifreyi güvenli şekilde hash'le
      const saltRounds = PASSWORD_SECURITY.SALT_ROUNDS;
      const password_hash = await bcrypt.hash(userData.password, saltRounds);

      // Kullanıcıyı veritabanında oluştur
      const user = await AuthModel.createUser({
        ...userData,
        password_hash,
      });

      if (!user) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.USER_CREATION_FAILED,
        };
      }

      // JWT access token oluştur
      const token = this.generateToken(user);

      // Güvenlik: Şifre hash'ini response'dan çıkar
      const { password_hash: _, ...userWithoutPassword } = user;

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
        message: AUTH_SUCCESS_MESSAGES.USER_CREATED,
      };
    } catch (error) {
      console.error('Error in register service:', error);
      return {
        success: false,
        error: 'Kayıt işlemi sırasında bir hata oluştu',
      };
    }
  }

  // ==================== USER LOGIN ====================

  /**
   * User Login Business Logic
   * 
   * Kullanıcı giriş işlemi için tüm iş mantığını yönetir:
   * - Email ile kullanıcı arama
   * - Şifre doğrulama (bcrypt compare)
   * - Son giriş zamanı güncelleme
   * - JWT token üretimi
   * 
   * @param credentials - Validasyon geçmiş giriş bilgileri
   * @returns {Promise<AuthServiceResponse<AuthResponse>>} Giriş sonucu
   */
  static async login(credentials: LoginInput): Promise<AuthServiceResponse<AuthResponse>> {
    try {
      // Email ile kullanıcıyı bul
      const user = await AuthModel.findByEmail(credentials.email);

      if (!user) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS, // Güvenlik: Spesifik bilgi verme
        };
      }

      // Şifre doğrulaması - bcrypt ile güvenli karşılaştırma
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);

      if (!isPasswordValid) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS, // Güvenlik: Spesifik bilgi verme
        };
      }

      // Başarılı giriş - son giriş zamanını güncelle
      await AuthModel.updateLastLogin(user.id);

      // JWT access token oluştur
      const token = this.generateToken(user);

      // Güvenlik: Şifre hash'ini response'dan çıkar
      const { password_hash: _, ...userWithoutPassword } = user;

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
        message: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS,
      };
    } catch (error) {
      console.error('Error in login service:', error);
      return {
        success: false,
        error: 'Giriş işlemi sırasında bir hata oluştu',
      };
    }
  }

  // ==================== PASSWORD MANAGEMENT ====================

  /**
   * Change Password Business Logic
   * 
   * Kullanıcı şifre değiştirme işlemi için iş mantığını yönetir:
   * - Kullanıcı varlık kontrolü
   * - Mevcut şifre doğrulama
   * - Yeni şifre hash'leme
   * - Veritabanı güncelleme
   * 
   * @param userId - Şifresi değiştirilecek kullanıcı ID'si
   * @param passwordData - Validasyon geçmiş şifre verileri
   * @returns {Promise<AuthServiceResponse<void>>} Şifre değiştirme sonucu
   */
  static async changePassword(
    userId: string, 
    passwordData: ChangePasswordInput
  ): Promise<AuthServiceResponse<void>> {
    try {
      // Kullanıcının varlığını kontrol et
      const user = await AuthModel.findById(userId);

      if (!user) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.USER_NOT_FOUND,
        };
      }

      // Mevcut şifre doğrulaması - güvenlik kontrolü
      const isCurrentPasswordValid = await bcrypt.compare(
        passwordData.currentPassword, 
        user.password_hash
      );

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.INVALID_CURRENT_PASSWORD,
        };
      }

      // Yeni şifreyi güvenli şekilde hash'le
      const saltRounds = PASSWORD_SECURITY.SALT_ROUNDS;
      const newPasswordHash = await bcrypt.hash(passwordData.newPassword, saltRounds);

      // Veritabanında şifreyi güncelle
      const updated = await AuthModel.updatePassword(userId, newPasswordHash);

      if (!updated) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.PASSWORD_UPDATE_FAILED,
        };
      }

      return {
        success: true,
        message: AUTH_SUCCESS_MESSAGES.PASSWORD_CHANGED,
      };
    } catch (error) {
      console.error('Error in changePassword service:', error);
      return {
        success: false,
        error: 'Şifre değiştirme işlemi sırasında bir hata oluştu',
      };
    }
  }

  // ==================== USER PROFILE ====================

  /**
   * Get User Profile Business Logic
   * 
   * Kullanıcı profil bilgilerini getirme işlemi.
   * Şifre hash'ini güvenlik amacıyla response'dan çıkarır.
   * 
   * @param userId - Profil bilgileri istenilen kullanıcı ID'si
   * @returns {Promise<AuthServiceResponse<Omit<User, 'password_hash'>>>} Profil bilgileri
   */
  static async getProfile(userId: string): Promise<AuthServiceResponse<Omit<User, 'password_hash'>>> {
    try {
      const user = await AuthModel.findById(userId);

      if (!user) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.USER_NOT_FOUND,
        };
      }

      // Güvenlik: Şifre hash'ini response'dan çıkar
      const { password_hash: _, ...userWithoutPassword } = user;

      return {
        success: true,
        data: userWithoutPassword,
      };
    } catch (error) {
      console.error('Error in getProfile service:', error);
      return {
        success: false,
        error: 'Profil bilgileri alınamadı',
      };
    }
  }

  // ==================== JWT TOKEN MANAGEMENT ====================

  /**
   * Generate JWT Access Token
   * 
   * Kullanıcı bilgilerinden JWT token oluşturur.
   * Token payload'ında kullanıcı ID, email ve rol bilgisi bulunur.
   * 
   * @param user - Token oluşturulacak kullanıcı bilgileri
   * @returns {string} Signed JWT token
   * @private
   */
  private static generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // JWT token'ı config'den alınan secret ve expiration ile oluştur
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT Token
   * 
   * JWT token'ın geçerliliğini kontrol eder ve payload'ı döner.
   * Auth middleware tarafından kullanılır.
   * 
   * @param token - Doğrulanacak JWT token
   * @returns {TokenPayload | null} Token payload'ı veya null (geçersizse)
   * @static
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      return decoded;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }
}