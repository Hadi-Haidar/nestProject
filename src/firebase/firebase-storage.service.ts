// src/medicine/firebase-storage.service.ts

import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Bucket } from '@google-cloud/storage';

@Injectable()
export class FirebaseStorageService {
  private bucket: Bucket;

  constructor() {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // e.g., "your-project.appspot.com"
      });
    }

    // Explicitly pass bucket name since Firebase might be initialized elsewhere without storageBucket
    this.bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
  }

  /**
   * Upload image to Firebase Storage
   * @param file - Multer file object
   * @param folder - Folder name in storage (e.g., 'medicines')
   * @returns Public URL of uploaded image
   */
  async uploadImage(file: Express.Multer.File, folder: string = 'medicines'): Promise<string> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${folder}/${timestamp}-${file.originalname}`;

      // Create file reference
      const fileUpload = this.bucket.file(filename);

      // Upload file
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      // Make file publicly accessible
      await fileUpload.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${filename}`;

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Delete image from Firebase Storage
   * @param imageUrl - Full URL of the image
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const filename = this.extractFilenameFromUrl(imageUrl);
      
      if (!filename) {
        return;
      }

      // Delete file
      await this.bucket.file(filename).delete();
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error, just log it (image might already be deleted)
    }
  }

  /**
   * Extract filename from Firebase Storage URL
   * @param url - Full URL
   * @returns Filename or null
   */
  private extractFilenameFromUrl(url: string): string | null {
    try {
      const bucketName = this.bucket.name;
      const baseUrl = `https://storage.googleapis.com/${bucketName}/`;
      
      if (url.startsWith(baseUrl)) {
        return url.replace(baseUrl, '');
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}