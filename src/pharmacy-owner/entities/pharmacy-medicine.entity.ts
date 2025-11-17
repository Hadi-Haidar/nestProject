// src/pharmacy-owner/entities/pharmacy-medicine.entity.ts

export class PharmacyMedicine {
  id: string;                     // Firestore document ID
  pharmacyId: string;             // Reference to pharmacy
  medicineId: string;             // Reference to medicine
  status: 'available' | 'unavailable'; // Availability status at this pharmacy
  addedAt: Date;                  // When medicine was added to pharmacy
  updatedAt: Date;                // Last update
  addedBy: string;                // Pharmacy owner ID who added it
}

