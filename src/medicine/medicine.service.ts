// src/medicine/medicine.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { Medicine } from './entities/medicine.entity';
import { FirebaseStorageService } from '../firebase/firebase-storage.service';

@Injectable()
export class MedicineService {
  private firestore: Firestore;
  private medicinesCollection = 'medicines';

  constructor(private firebaseStorageService: FirebaseStorageService) {
    this.firestore = new Firestore({
      projectId: process.env.FIREBASE_PROJECT_ID,
      credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
  }

  // ========================================
  // CREATE MEDICINE
  // ========================================
  async create(
    createMedicineDto: CreateMedicineDto,
    frontImage: Express.Multer.File,
    backImage: Express.Multer.File,
    adminId: string,
  ) {
    // Validate images
    if (!frontImage || !backImage) {
      throw new BadRequestException('Both front and back images are required');
    }

    try {
      // Upload images to Firebase Storage
      const frontImageUrl = await this.firebaseStorageService.uploadImage(
        frontImage,
        'medicines/front',
      );
      const backImageUrl = await this.firebaseStorageService.uploadImage(
        backImage,
        'medicines/back',
      );

      // Create medicine document
      const medicineData: Omit<Medicine, 'id'> = {
        title: createMedicineDto.title,
        description: createMedicineDto.description,
        frontImageUrl,
        backImageUrl,
        status: createMedicineDto.status || 'available',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminId,
      };

      const docRef = await this.firestore
        .collection(this.medicinesCollection)
        .add(medicineData);

      return {
        id: docRef.id,
        ...medicineData,
      };
    } catch (error) {
      console.error('Error creating medicine:', error);
      throw new BadRequestException('Failed to create medicine');
    }
  }

  // ========================================
  // GET ALL MEDICINES
  // ========================================
  async findAll(): Promise<Medicine[]> {
    const snapshot = await this.firestore
      .collection(this.medicinesCollection)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Medicine[];
  }

  // ========================================
  // GET MEDICINE BY ID
  // ========================================
  async findOne(id: string): Promise<Medicine> {
    const doc = await this.firestore
      .collection(this.medicinesCollection)
      .doc(id)
      .get();

    if (!doc.exists) {
      throw new NotFoundException(`Medicine with ID ${id} not found`);
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Medicine;
  }

  // ========================================
  // UPDATE MEDICINE
  // ========================================
  async update(
    id: string,
    updateMedicineDto: UpdateMedicineDto,
    frontImage?: Express.Multer.File,
    backImage?: Express.Multer.File,
  ) {
    const docRef = this.firestore.collection(this.medicinesCollection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Medicine with ID ${id} not found`);
    }

    const currentData = doc.data() as Medicine;
    const updateData: any = {
      ...updateMedicineDto,
      updatedAt: new Date(),
    };

    try {
      // If new front image provided, upload and delete old
      if (frontImage) {
        const newFrontImageUrl = await this.firebaseStorageService.uploadImage(
          frontImage,
          'medicines/front',
        );
        updateData.frontImageUrl = newFrontImageUrl;

        // Delete old front image
        if (currentData.frontImageUrl) {
          await this.firebaseStorageService.deleteImage(
            currentData.frontImageUrl,
          );
        }
      }

      // If new back image provided, upload and delete old
      if (backImage) {
        const newBackImageUrl = await this.firebaseStorageService.uploadImage(
          backImage,
          'medicines/back',
        );
        updateData.backImageUrl = newBackImageUrl;

        // Delete old back image
        if (currentData.backImageUrl) {
          await this.firebaseStorageService.deleteImage(
            currentData.backImageUrl,
          );
        }
      }

      await docRef.update(updateData);

      return this.findOne(id);
    } catch (error) {
      console.error('Error updating medicine:', error);
      throw new BadRequestException('Failed to update medicine');
    }
  }

  // ========================================
  // DELETE MEDICINE
  // ========================================
  async remove(id: string): Promise<{ message: string }> {
    const docRef = this.firestore.collection(this.medicinesCollection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Medicine with ID ${id} not found`);
    }

    const medicineData = doc.data() as Medicine;

    try {
      // Delete images from Firebase Storage
      if (medicineData.frontImageUrl) {
        await this.firebaseStorageService.deleteImage(
          medicineData.frontImageUrl,
        );
      }
      if (medicineData.backImageUrl) {
        await this.firebaseStorageService.deleteImage(
          medicineData.backImageUrl,
        );
      }

      // Delete medicine document
      await docRef.delete();

      return {
        message: `Medicine "${medicineData.title}" deleted successfully`,
      };
    } catch (error) {
      console.error('Error deleting medicine:', error);
      throw new BadRequestException('Failed to delete medicine');
    }
  }

  // ========================================
  // SEARCH MEDICINES BY TITLE
  // ========================================
  async search(query: string): Promise<Medicine[]> {
    const snapshot = await this.firestore
      .collection(this.medicinesCollection)
      .get();

    const medicines = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Medicine[];

    // Filter by title (case-insensitive)
    return medicines.filter(medicine =>
      medicine.title.toLowerCase().includes(query.toLowerCase()),
    );
  }

  // ========================================
  // GET MEDICINES BY STATUS
  // ========================================
  async findByStatus(status: 'available' | 'unavailable'): Promise<Medicine[]> {
    const snapshot = await this.firestore
      .collection(this.medicinesCollection)
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Medicine[];
  }
}