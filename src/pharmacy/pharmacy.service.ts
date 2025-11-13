// src/pharmacy/pharmacy.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { CreatePharmacyDto } from './dto/create-pharmacy.dto';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';
import { Pharmacy } from './entities/pharmacy.entity';
import { PharmacyOwner } from './entities/pharmacy-owner.entity';
import { FirebaseStorageService } from '../firebase/firebase-storage.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PharmacyService {
  private firestore: Firestore;
  private pharmaciesCollection = 'pharmacies';
  private ownersCollection = 'pharmacy-owners';

  constructor(private readonly storageService: FirebaseStorageService) {
    this.firestore = new Firestore({
      projectId: process.env.FIREBASE_PROJECT_ID,
      credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
  }

  // ========================================
  // IMAGE UPLOAD METHODS
  // ========================================

  /**
   * Upload pharmacy image to Firebase Storage
   */
  async uploadPharmacyImage(file: Express.Multer.File): Promise<string> {
    return await this.storageService.uploadImage(file, 'pharmacies');
  }

  /**
   * Delete pharmacy image from Firebase Storage
   */
  async deletePharmacyImage(imageUrl: string): Promise<void> {
    await this.storageService.deleteImage(imageUrl);
  }

  // ========================================
  // CREATE PHARMACY WITH OWNER
  // ========================================
  async create(createPharmacyDto: CreatePharmacyDto, adminId: string) {
    // 1. Check if owner email already exists
    const existingOwner = await this.findOwnerByEmail(createPharmacyDto.ownerEmail);
    if (existingOwner) {
      throw new ConflictException('An owner with this email already exists');
    }

    // 2. Hash the owner password
    const hashedPassword = await bcrypt.hash(createPharmacyDto.ownerPassword, 10);

    // 3. Create Pharmacy Owner first
    const ownerData: Omit<PharmacyOwner, 'id'> = {
      name: createPharmacyDto.ownerName || '',
      email: createPharmacyDto.ownerEmail,
      password: hashedPassword,
      pharmacyId: '', // Will be updated after pharmacy creation
      role: 'pharmacy-owner',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: adminId,
    };

    const ownerRef = await this.firestore.collection(this.ownersCollection).add(ownerData);
    const ownerId = ownerRef.id;

    // 4. Create Pharmacy with owner reference
    const pharmacyData: Omit<Pharmacy, 'id'> = {
      title: createPharmacyDto.title,
      description: createPharmacyDto.description,
      imageUrl: createPharmacyDto.imageUrl || '', // Use uploaded image URL
      location: createPharmacyDto.location,
      ownerId: ownerId,
      workingHours: createPharmacyDto.workingHours,
      status: createPharmacyDto.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: adminId,
    };

    const pharmacyRef = await this.firestore.collection(this.pharmaciesCollection).add(pharmacyData);
    const pharmacyId = pharmacyRef.id;

    // 5. Update owner with pharmacyId
    await ownerRef.update({ pharmacyId });

    // 6. Return pharmacy with owner info
    return {
      pharmacy: {
        id: pharmacyId,
        ...pharmacyData,
      },
      owner: {
        id: ownerId,
        name: ownerData.name,
        email: ownerData.email,
        role: ownerData.role,
        status: ownerData.status,
      },
    };
  }

  // ========================================
  // PHARMACY CRUD OPERATIONS
  // ========================================
  
  // Get all pharmacies
  async findAll(): Promise<Pharmacy[]> {
    const snapshot = await this.firestore.collection(this.pharmaciesCollection).get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Pharmacy[];
  }

  // Get all pharmacies with owner details
  async findAllWithOwners() {
    const pharmacies = await this.findAll();
    
    const pharmaciesWithOwners = await Promise.all(
      pharmacies.map(async (pharmacy) => {
        const owner = await this.findOwnerById(pharmacy.ownerId);
        return {
          ...pharmacy,
          owner: owner ? {
            id: owner.id,
            name: owner.name,
            email: owner.email,
            status: owner.status,
          } : null,
        };
      })
    );

    return pharmaciesWithOwners;
  }

  // Get pharmacy by ID
  async findOne(id: string): Promise<Pharmacy> {
    const doc = await this.firestore.collection(this.pharmaciesCollection).doc(id).get();
    
    if (!doc.exists) {
      throw new NotFoundException(`Pharmacy with ID ${id} not found`);
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Pharmacy;
  }

  // Get pharmacy by ID with owner details
  async findOneWithOwner(id: string) {
    const pharmacy = await this.findOne(id);
    const owner = await this.findOwnerById(pharmacy.ownerId);

    return {
      ...pharmacy,
      owner: owner ? {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        status: owner.status,
      } : null,
    };
  }

  // Update pharmacy (with optional image upload)
  async update(
    id: string,
    updatePharmacyDto: UpdatePharmacyDto,
    file?: Express.Multer.File,
  ) {
    const docRef = this.firestore.collection(this.pharmaciesCollection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Pharmacy with ID ${id} not found`);
    }

    const pharmacy = doc.data() as Pharmacy;

    // Update pharmacy data
    const updateData: any = {
      ...updatePharmacyDto,
      updatedAt: new Date(),
    };

    // If new image file is uploaded
    if (file) {
      // Delete old image if exists
      if (pharmacy.imageUrl) {
        await this.deletePharmacyImage(pharmacy.imageUrl);
      }
      // Upload new image
      updateData.imageUrl = await this.uploadPharmacyImage(file);
    }

    // If updating owner info, update the owner document separately
    if (updatePharmacyDto.ownerEmail || updatePharmacyDto.ownerPassword || updatePharmacyDto.ownerName) {
      await this.updateOwner(pharmacy.ownerId, {
        email: updatePharmacyDto.ownerEmail,
        password: updatePharmacyDto.ownerPassword,
        name: updatePharmacyDto.ownerName,
      });

      // Remove owner fields from pharmacy update
      delete updateData.ownerEmail;
      delete updateData.ownerPassword;
      delete updateData.ownerName;
    }

    await docRef.update(updateData);

    return this.findOneWithOwner(id);
  }

  // Delete pharmacy (also deletes owner and image)
  async remove(id: string): Promise<{ message: string }> {
    const docRef = this.firestore.collection(this.pharmaciesCollection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Pharmacy with ID ${id} not found`);
    }

    const pharmacy = doc.data() as Pharmacy;

    // Delete image from storage if exists
    if (pharmacy.imageUrl) {
      await this.deletePharmacyImage(pharmacy.imageUrl);
    }

    // Delete owner first
    await this.deleteOwner(pharmacy.ownerId);

    // Delete pharmacy
    await docRef.delete();

    return {
      message: `Pharmacy, owner account, and image deleted successfully`,
    };
  }

  // Get pharmacies by status
  async findByStatus(status: 'active' | 'inactive'): Promise<Pharmacy[]> {
    const snapshot = await this.firestore
      .collection(this.pharmaciesCollection)
      .where('status', '==', status)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Pharmacy[];
  }

  // Search pharmacies by title
  async search(query: string): Promise<Pharmacy[]> {
    const snapshot = await this.firestore.collection(this.pharmaciesCollection).get();
    
    const pharmacies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Pharmacy[];

    return pharmacies.filter(pharmacy => 
      pharmacy.title.toLowerCase().includes(query.toLowerCase())
    );
  }

  // ========================================
  // PHARMACY OWNER OPERATIONS
  // ========================================

  /**
   * Get all pharmacy owners
   */
  async findAllOwners(): Promise<PharmacyOwner[]> {
    const snapshot = await this.firestore.collection(this.ownersCollection).get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as PharmacyOwner[];
  }

  // Find owner by email (for duplicate check and login)
  async findOwnerByEmail(email: string): Promise<PharmacyOwner | null> {
    const snapshot = await this.firestore
      .collection(this.ownersCollection)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as PharmacyOwner;
  }

  // Find owner by ID
  async findOwnerById(id: string): Promise<PharmacyOwner | null> {
    const doc = await this.firestore.collection(this.ownersCollection).doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as PharmacyOwner;
  }

  // Update owner
  async updateOwner(
    ownerId: string,
    updateData: { email?: string; password?: string; name?: string },
  ) {
    const ownerRef = this.firestore.collection(this.ownersCollection).doc(ownerId);
    const doc = await ownerRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Owner with ID ${ownerId} not found`);
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (updateData.email) {
      // Check if email is already taken by another owner
      const existingOwner = await this.findOwnerByEmail(updateData.email);
      if (existingOwner && existingOwner.id !== ownerId) {
        throw new ConflictException('Email already in use by another owner');
      }
      updates.email = updateData.email;
    }

    if (updateData.password) {
      updates.password = await bcrypt.hash(updateData.password, 10);
    }

    if (updateData.name) {
      updates.name = updateData.name;
    }

    await ownerRef.update(updates);
  }

  // Delete owner
  async deleteOwner(ownerId: string) {
    const ownerRef = this.firestore.collection(this.ownersCollection).doc(ownerId);
    await ownerRef.delete();
  }

  // Get pharmacy by owner ID (for owner portal)
  async findPharmacyByOwnerId(ownerId: string): Promise<Pharmacy | null> {
    const snapshot = await this.firestore
      .collection(this.pharmaciesCollection)
      .where('ownerId', '==', ownerId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Pharmacy;
  }
}