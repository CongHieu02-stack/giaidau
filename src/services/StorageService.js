/**
 * Storage Service
 * SRP: Handles file uploads to Supabase Storage
 */
import { supabase } from '../config/supabase.js';
import { Result } from '../utils/result.js';

export class StorageService {
  constructor() {
    this.client = supabase;
  }

  /**
   * Upload an avatar image to the 'avatars' bucket
   * @param {File} file The file to upload
   * @param {string} userId The user's ID
   */
  async uploadAvatar(file, userId) {
    try {
      if (!file) return Result.err('Không có file nào được chọn');

      // Create a unique file name using user ID and current timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await this.client.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Storage upload error:', error);
        return Result.err(error.message);
      }

      // Get public URL
      const { data: publicUrlData } = this.client.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return Result.ok(publicUrlData.publicUrl);
    } catch (err) {
      console.error('Upload exception:', err);
      return Result.err(err.message || 'Lỗi khi upload ảnh');
    }
  }
}

export const storageService = new StorageService();
