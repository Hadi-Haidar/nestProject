// src/pharmacy-owner/pharmacy-owner.service.ts

import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { PharmacyMedicine } from './entities/pharmacy-medicine.entity';
import { AddPharmacyMedicineDto } from './dto/add-pharmacy-medicine.dto';
import { UpdatePharmacyMedicineDto } from './dto/update-pharmacy-medicine.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PharmacyOwnerService {
  private firestore: Firestore;
  private pharmacyMedicinesCollection = 'pharmacy-medicines';
  private medicinesCollection = 'medicines';
  private pharmaciesCollection = 'pharmacies';

  constructor(private readonly notificationService: NotificationService) {
    this.firestore = new Firestore({
      projectId: process.env.FIREBASE_PROJECT_ID,
      credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
      },
    });
  }

  // ========================================
  // GET ALL MEDICINES (FROM ADMIN)
  // ========================================
  /**
   * Get all medicines that admin has added
   * Owner can see these to add to their pharmacy
   */
  async getAllAvailableMedicines() {
    const snapshot = await this.firestore
      .collection(this.medicinesCollection)
      .get();

    const medicines = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return medicines;
  }

  // ========================================
  // GET PHARMACY MEDICINES
  // ========================================
  /**
   * Get all medicines for a specific pharmacy with medicine details
   */
  async getPharmacyMedicines(pharmacyId: string, ownerId: string) {
    // Verify ownership
    await this.verifyPharmacyOwnership(pharmacyId, ownerId);

    const snapshot = await this.firestore
      .collection(this.pharmacyMedicinesCollection)
      .where('pharmacyId', '==', pharmacyId)
      .get();

    // Get full medicine details for each pharmacy medicine
    const pharmacyMedicines = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const pharmacyMedicine = { id: doc.id, ...doc.data() } as PharmacyMedicine;
        
        // Get medicine details
        const medicineDoc = await this.firestore
          .collection(this.medicinesCollection)
          .doc(pharmacyMedicine.medicineId)
          .get();

        const medicineData = medicineDoc.exists ? medicineDoc.data() : null;

        return {
          ...pharmacyMedicine,
          medicine: medicineData ? {
            id: medicineDoc.id,
            ...medicineData,
          } : null,
        };
      })
    );

    return pharmacyMedicines;
  }

  // ========================================
  // ADD MEDICINE TO PHARMACY
  // ========================================
  /**
   * Add a medicine to pharmacy's inventory
   */
  async addMedicineToPharmacy(
    pharmacyId: string,
    ownerId: string,
    addPharmacyMedicineDto: AddPharmacyMedicineDto,
  ) {
    // Verify ownership
    await this.verifyPharmacyOwnership(pharmacyId, ownerId);

    // Check if medicine exists in admin's medicines
    const medicineDoc = await this.firestore
      .collection(this.medicinesCollection)
      .doc(addPharmacyMedicineDto.medicineId)
      .get();

    if (!medicineDoc.exists) {
      throw new NotFoundException(`Medicine with ID ${addPharmacyMedicineDto.medicineId} not found`);
    }

    // Check if medicine already added to this pharmacy
    const existingSnapshot = await this.firestore
      .collection(this.pharmacyMedicinesCollection)
      .where('pharmacyId', '==', pharmacyId)
      .where('medicineId', '==', addPharmacyMedicineDto.medicineId)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      throw new ConflictException('This medicine is already added to your pharmacy');
    }

    // Create pharmacy medicine record
    const pharmacyMedicineData: Omit<PharmacyMedicine, 'id'> = {
      pharmacyId,
      medicineId: addPharmacyMedicineDto.medicineId,
      status: addPharmacyMedicineDto.status || 'available',
      addedAt: new Date(),
      updatedAt: new Date(),
      addedBy: ownerId,
    };

    const ref = await this.firestore
      .collection(this.pharmacyMedicinesCollection)
      .add(pharmacyMedicineData);

    // Get medicine details
    const medicineData = medicineDoc.data();

    // Trigger notification check for medicine availability
    const medicineName = medicineData?.title || '';
    if (pharmacyMedicineData.status === 'available' && medicineName) {
      // Get pharmacy name
      const pharmacyDoc = await this.firestore
        .collection(this.pharmaciesCollection)
        .doc(pharmacyId)
        .get();
      
      if (pharmacyDoc.exists) {
        const pharmacyName = pharmacyDoc.data()?.title || '';
        // Check for pending notifications asynchronously (don't await)
        this.notificationService.checkMedicineAvailability(pharmacyId, medicineName)
          .catch(error => console.error('Error checking medicine availability:', error));
      }
    }

    return {
      id: ref.id,
      ...pharmacyMedicineData,
      medicine: {
        id: medicineDoc.id,
        ...medicineData,
      },
    };
  }

  // ========================================
  // UPDATE MEDICINE STATUS
  // ========================================
  /**
   * Update medicine availability status (available/unavailable)
   */
  async updateMedicineStatus(
    pharmacyMedicineId: string,
    pharmacyId: string,
    ownerId: string,
    updateDto: UpdatePharmacyMedicineDto,
  ) {
    // Verify ownership
    await this.verifyPharmacyOwnership(pharmacyId, ownerId);

    const docRef = this.firestore
      .collection(this.pharmacyMedicinesCollection)
      .doc(pharmacyMedicineId);

    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Medicine record not found`);
    }

    const pharmacyMedicine = doc.data() as PharmacyMedicine;

    // Verify this medicine belongs to this pharmacy
    if (pharmacyMedicine.pharmacyId !== pharmacyId) {
      throw new ForbiddenException('You do not have permission to update this medicine');
    }

    // Update status
    const updatedAt = new Date();
    await docRef.update({
      status: updateDto.status,
      updatedAt: updatedAt,
    });

    // If medicine status changed to 'available', check for pending notifications
    if (updateDto.status === 'available' && pharmacyMedicine.status !== 'available') {
      // Get medicine details
      const medicineDoc = await this.firestore
        .collection(this.medicinesCollection)
        .doc(pharmacyMedicine.medicineId)
        .get();
      
      if (medicineDoc.exists) {
        const medicineName = medicineDoc.data()?.title || '';
        if (medicineName) {
          // Trigger notification check asynchronously
          this.notificationService.checkMedicineAvailability(pharmacyId, medicineName)
            .catch(error => console.error('Error checking medicine availability:', error));
        }
      }
    }

    return {
      ...pharmacyMedicine,
      id: doc.id,
      status: updateDto.status,
      updatedAt: updatedAt,
    };
  }

  // ========================================
  // REMOVE MEDICINE FROM PHARMACY
  // ========================================
  /**
   * Remove a medicine from pharmacy's inventory
   */
  async removeMedicineFromPharmacy(
    pharmacyMedicineId: string,
    pharmacyId: string,
    ownerId: string,
  ) {
    // Verify ownership
    await this.verifyPharmacyOwnership(pharmacyId, ownerId);

    const docRef = this.firestore
      .collection(this.pharmacyMedicinesCollection)
      .doc(pharmacyMedicineId);

    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Medicine record not found`);
    }

    const pharmacyMedicine = doc.data() as PharmacyMedicine;

    // Verify this medicine belongs to this pharmacy
    if (pharmacyMedicine.pharmacyId !== pharmacyId) {
      throw new ForbiddenException('You do not have permission to remove this medicine');
    }

    await docRef.delete();

    return {
      message: 'Medicine removed from pharmacy successfully',
    };
  }

  // ========================================
  // HELPER METHODS
  // ========================================
  /**
   * Verify that the owner actually owns this pharmacy
   */
  private async verifyPharmacyOwnership(pharmacyId: string, ownerId: string) {
    const pharmacyDoc = await this.firestore
      .collection(this.pharmaciesCollection)
      .doc(pharmacyId)
      .get();

    if (!pharmacyDoc.exists) {
      throw new NotFoundException('Pharmacy not found');
    }

    const pharmacy = pharmacyDoc.data();

    if (!pharmacy) {
      throw new NotFoundException('Pharmacy data not found');
    }

    if (pharmacy.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to access this pharmacy');
    }

    return true;
  }

  /**
   * Get available medicines not yet added to pharmacy
   */
  async getAvailableMedicinesToAdd(pharmacyId: string, ownerId: string) {
    // Verify ownership
    await this.verifyPharmacyOwnership(pharmacyId, ownerId);

    // Get all medicines
    const allMedicinesSnapshot = await this.firestore
      .collection(this.medicinesCollection)
      .get();

    const allMedicines = allMedicinesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get medicines already added to this pharmacy
    const pharmacyMedicinesSnapshot = await this.firestore
      .collection(this.pharmacyMedicinesCollection)
      .where('pharmacyId', '==', pharmacyId)
      .get();

    const addedMedicineIds = new Set(
      pharmacyMedicinesSnapshot.docs.map(doc => doc.data().medicineId)
    );

    // Filter out medicines already added
    const availableMedicines = allMedicines.filter(
      medicine => !addedMedicineIds.has(medicine.id)
    );

    return availableMedicines;
  }
}

