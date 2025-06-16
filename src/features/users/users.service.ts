/**
 * Users Feature Business Logic Layer
 * 
 * Users modülü için tüm iş mantığını yönetir.
 * Controller ve Model katmanları arasında köprü görevi görür.
 * 
 */

import { UsersModel } from './users.model';
import { 
  UsersServiceResponse,
  UsersListResponse,
  UserDetailResponse,
  UsersQueryOptions
} from './users.types';
import {
  GetUsersQueryInput,
  UpdateUserInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput
} from './users.validation';
import { 
  USERS_ERROR_MESSAGES,
  USERS_SUCCESS_MESSAGES,
  USER_ROLES
} from './users.constants';
import { UserWithStats } from '@/core/types/database.types';

/**
 * Users Service Class
 * 
 * Static metodlarla users işlemlerinin iş mantığını yönetir.
 * Validation, authorization ve business rules'ları uygular.
 */
export class UsersService {

  // ==================== USER LISTING ====================

  /**
   * Get Users List Business Logic
   * 
   * Kullanıcı listesi getirme işlemi için iş mantığını yönetir:
   * - Query parametrelerini normalize etme
   * - Pagination hesaplamaları
   * - Kullanıcı listesi getirme
   * 
   * @param queryParams - Validasyon geçmiş query parametreleri
   * @returns {Promise<UsersServiceResponse<UsersListResponse>>} Kullanıcı listesi sonucu
   */
  static async getUsers(queryParams: GetUsersQueryInput): Promise<UsersServiceResponse<UsersListResponse>> {
    try {
      // Query options'ı normalize et
      const queryOptions: UsersQueryOptions = {
        limit: queryParams.limit,
        offset: queryParams.offset,
        search: queryParams.search,
        role: queryParams.role,
        is_active: queryParams.is_active,
        sort: queryParams.sort,
        sort_direction: queryParams.sort_direction,
      };

      // Model katmanından kullanıcı listesini getir
      const { users, total } = await UsersModel.getUsers(queryOptions);

      // Pagination bilgilerini hesapla
      const pagination = {
        total,
        limit: queryOptions.limit,
        offset: queryOptions.offset,
        has_more: queryOptions.offset + queryOptions.limit < total,
      };

      const response: UsersListResponse = {
        users,
        pagination,
      };

      return {
        success: true,
        data: response,
        message: USERS_SUCCESS_MESSAGES.USERS_FETCHED,
      };
    } catch (error) {
      console.error('Error in getUsers service:', error);
      return {
        success: false,
        error: USERS_ERROR_MESSAGES.USERS_FETCH_FAILED,
      };
    }
  }

  /**
   * Get User by ID Business Logic
   * 
   * Kullanıcı detayı getirme işlemi için iş mantığını yönetir:
   * - Kullanıcı varlık kontrolü
   * - İstatistiklerle birlikte kullanıcı bilgilerini getirme
   * 
   * @param userId - Getirilecek kullanıcı ID'si
   * @returns {Promise<UsersServiceResponse<UserDetailResponse>>} Kullanıcı detayı sonucu
   */
  static async getUserById(userId: string): Promise<UsersServiceResponse<UserDetailResponse>> {
    try {
      // Model katmanından kullanıcıyı getir
      const user = await UsersModel.getUserById(userId);

      if (!user) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.USER_NOT_FOUND,
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      console.error('Error in getUserById service:', error);
      return {
        success: false,
        error: USERS_ERROR_MESSAGES.USERS_FETCH_FAILED,
      };
    }
  }

  // ==================== USER UPDATE ====================

  /**
   * Update User Business Logic
   * 
   * Kullanıcı güncelleme işlemi için iş mantığını yönetir:
   * - Kullanıcı varlık kontrolü
   * - Email/username duplicate kontrolü
   * - Yetki kontrolü (admin koruması)
   * - Kullanıcı güncelleme
   * 
   * @param userId - Güncellenecek kullanıcı ID'si
   * @param updateData - Validasyon geçmiş güncelleme verileri
   * @param currentUserId - İşlemi yapan kullanıcı ID'si
   * @returns {Promise<UsersServiceResponse<UserWithStats>>} Güncelleme sonucu
   */
  static async updateUser(
    userId: string, 
    updateData: UpdateUserInput,
    currentUserId: string
  ): Promise<UsersServiceResponse<UserWithStats>> {
    try {
      // Kullanıcının varlığını kontrol et
      const existingUser = await UsersModel.getUserById(userId);

      if (!existingUser) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.USER_NOT_FOUND,
        };
      }

      // Boş güncelleme kontrolü
      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: 'Güncellenecek alan belirtilmedi',
        };
      }

      // Admin kullanıcıları koruma (sadece kendisi güncelleyebilir)
      if (existingUser.role === USER_ROLES.ADMIN && userId !== currentUserId) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.CANNOT_MODIFY_ADMIN,
        };
      }

      // Email/username duplicate kontrolü (sadece değiştirilmek istenen alanlar için)
      if (updateData.email || updateData.username) {
        const duplicateCheck = await UsersModel.checkEmailOrUsernameExistsForUpdate(
          updateData.email,
          updateData.username,
          userId
        );

        if (duplicateCheck.emailExists) {
          return {
            success: false,
            error: USERS_ERROR_MESSAGES.EMAIL_EXISTS,
          };
        }

        if (duplicateCheck.usernameExists) {
          return {
            success: false,
            error: USERS_ERROR_MESSAGES.USERNAME_EXISTS,
          };
        }
      }

      // Kullanıcıyı güncelle
      const updatedUser = await UsersModel.updateUser(userId, updateData);

      if (!updatedUser) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.USER_UPDATE_FAILED,
        };
      }

      // Güncellenmiş kullanıcıyı istatistiklerle birlikte getir
      const userWithStats = await UsersModel.getUserById(userId);

      return {
        success: true,
        data: userWithStats!,
        message: USERS_SUCCESS_MESSAGES.USER_UPDATED,
      };
    } catch (error) {
      console.error('Error in updateUser service:', error);
      return {
        success: false,
        error: USERS_ERROR_MESSAGES.USER_UPDATE_FAILED,
      };
    }
  }

  /**
   * Update User Role Business Logic
   * 
   * Kullanıcı rolü güncelleme işlemi için iş mantığını yönetir:
   * - Kullanıcı varlık kontrolü
   * - Yetki kontrolü (admin koruması)
   * - Rol güncelleme
   * 
   * @param userId - Rolü güncellenecek kullanıcı ID'si
   * @param roleData - Validasyon geçmiş rol verileri
   * @param currentUserId - İşlemi yapan kullanıcı ID'si
   * @returns {Promise<UsersServiceResponse<UserWithStats>>} Rol güncelleme sonucu
   */
  static async updateUserRole(
    userId: string, 
    roleData: UpdateUserRoleInput,
    currentUserId: string
  ): Promise<UsersServiceResponse<UserWithStats>> {
    try {
      // Kullanıcının varlığını kontrol et
      const existingUser = await UsersModel.getUserById(userId);

      if (!existingUser) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.USER_NOT_FOUND,
        };
      }

      // Admin kullanıcıları koruma (sadece kendisi güncelleyebilir)
      if (existingUser.role === USER_ROLES.ADMIN && userId !== currentUserId) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.CANNOT_MODIFY_ADMIN,
        };
      }

      // Kullanıcı rolünü güncelle
      const updatedUser = await UsersModel.updateUserRole(userId, roleData.role);

      if (!updatedUser) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.USER_UPDATE_FAILED,
        };
      }

      // Güncellenmiş kullanıcıyı istatistiklerle birlikte getir
      const userWithStats = await UsersModel.getUserById(userId);

      return {
        success: true,
        data: userWithStats!,
        message: USERS_SUCCESS_MESSAGES.USER_ROLE_UPDATED,
      };
    } catch (error) {
      console.error('Error in updateUserRole service:', error);
      return {
        success: false,
        error: USERS_ERROR_MESSAGES.USER_UPDATE_FAILED,
      };
    }
  }

  /**
   * Update User Status Business Logic
   * 
   * Kullanıcı durumu güncelleme işlemi için iş mantığını yönetir:
   * - Kullanıcı varlık kontrolü
   * - Yetki kontrolü (admin koruması)
   * - Durum güncelleme
   * 
   * @param userId - Durumu güncellenecek kullanıcı ID'si
   * @param statusData - Validasyon geçmiş durum verileri
   * @param currentUserId - İşlemi yapan kullanıcı ID'si
   * @returns {Promise<UsersServiceResponse<UserWithStats>>} Durum güncelleme sonucu
   */
  static async updateUserStatus(
    userId: string, 
    statusData: UpdateUserStatusInput,
    currentUserId: string
  ): Promise<UsersServiceResponse<UserWithStats>> {
    try {
      // Kullanıcının varlığını kontrol et
      const existingUser = await UsersModel.getUserById(userId);

      if (!existingUser) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.USER_NOT_FOUND,
        };
      }

      // Admin kullanıcıları koruma (sadece kendisi güncelleyebilir)
      if (existingUser.role === USER_ROLES.ADMIN && userId !== currentUserId) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.CANNOT_MODIFY_ADMIN,
        };
      }

      // Kullanıcı durumunu güncelle
      const updatedUser = await UsersModel.updateUserStatus(userId, statusData.is_active);

      if (!updatedUser) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.USER_UPDATE_FAILED,
        };
      }

      // Güncellenmiş kullanıcıyı istatistiklerle birlikte getir
      const userWithStats = await UsersModel.getUserById(userId);

      return {
        success: true,
        data: userWithStats!,
        message: USERS_SUCCESS_MESSAGES.USER_STATUS_UPDATED,
      };
    } catch (error) {
      console.error('Error in updateUserStatus service:', error);
      return {
        success: false,
        error: USERS_ERROR_MESSAGES.USER_UPDATE_FAILED,
      };
    }
  }

  // ==================== USER DELETE ====================

  /**
   * Delete User Business Logic
   * 
   * Kullanıcı silme işlemi için iş mantığını yönetir:
   * - Kullanıcı varlık kontrolü
   * - Kendi hesabını silme koruması
   * - Yetki kontrolü (admin koruması)
   * - Soft delete işlemi
   * 
   * @param userId - Silinecek kullanıcı ID'si
   * @param currentUserId - İşlemi yapan kullanıcı ID'si
   * @returns {Promise<UsersServiceResponse<void>>} Silme sonucu
   */
  static async deleteUser(userId: string, currentUserId: string): Promise<UsersServiceResponse<void>> {
    try {
      // Kendi hesabını silme koruması
      if (userId === currentUserId) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.CANNOT_DELETE_SELF,
        };
      }

      // Kullanıcının varlığını kontrol et
      const existingUser = await UsersModel.getUserById(userId);

      if (!existingUser) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.USER_NOT_FOUND,
        };
      }

      // Admin kullanıcıları koruma
      if (existingUser.role === USER_ROLES.ADMIN) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.CANNOT_MODIFY_ADMIN,
        };
      }

      // Kullanıcıyı soft delete yap
      const deleted = await UsersModel.deleteUser(userId);

      if (!deleted) {
        return {
          success: false,
          error: USERS_ERROR_MESSAGES.USER_DELETE_FAILED,
        };
      }

      return {
        success: true,
        message: USERS_SUCCESS_MESSAGES.USER_DELETED,
      };
    } catch (error) {
      console.error('Error in deleteUser service:', error);
      return {
        success: false,
        error: USERS_ERROR_MESSAGES.USER_DELETE_FAILED,
      };
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get Users Statistics Business Logic
   * 
   * Kullanıcı istatistiklerini getirme işlemi.
   * 
   * @returns {Promise<UsersServiceResponse<{total: number, active: number, inactive: number}>>}
   */
  static async getUsersStatistics(): Promise<UsersServiceResponse<{total: number, active: number, inactive: number}>> {
    try {
      const stats = await UsersModel.getUsersStatistics();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error in getUsersStatistics service:', error);
      return {
        success: false,
        error: USERS_ERROR_MESSAGES.USERS_FETCH_FAILED,
      };
    }
  }
} 