// src/firebase/firebase.service.ts

import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private db: admin.firestore.Firestore;

  constructor() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // ADD THIS LINE
      });
    }

    this.db = admin.firestore();
  }

  // Get Firestore instance
  getFirestore(): admin.firestore.Firestore {
    return this.db;
  }

  // Example: Get all documents from a collection
  async getCollection(collectionName: string) {
    try {
      const snapshot = await this.db.collection(collectionName).get();
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      return documents;
    } catch (error) {
      throw new Error(`Error getting collection: ${error.message}`);
    }
  }

  // Example: Get a single document
  async getDocument(collectionName: string, documentId: string) {
    try {
      const doc = await this.db.collection(collectionName).doc(documentId).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Error getting document: ${error.message}`);
    }
  }

  // Example: Create a document
  async createDocument(collectionName: string, data: any) {
    try {
      const docRef = await this.db.collection(collectionName).add(data);
      return { id: docRef.id, ...data };
    } catch (error) {
      throw new Error(`Error creating document: ${error.message}`);
    }
  }

  // Example: Update a document
  async updateDocument(collectionName: string, documentId: string, data: any) {
    try {
      await this.db.collection(collectionName).doc(documentId).update(data);
      return { id: documentId, ...data };
    } catch (error) {
      throw new Error(`Error updating document: ${error.message}`);
    }
  }

  // Example: Delete a document
  async deleteDocument(collectionName: string, documentId: string) {
    try {
      await this.db.collection(collectionName).doc(documentId).delete();
      return { id: documentId, deleted: true };
    } catch (error) {
      throw new Error(`Error deleting document: ${error.message}`);
    }
  }
}