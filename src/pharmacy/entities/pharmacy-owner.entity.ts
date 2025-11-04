// src/pharmacy/entities/pharmacy-owner.entity.ts

export class PharmacyOwner {
    id: string;                    // Firestore document ID
    name: string;                  // Owner name
    email: string;                 // Owner email (unique, used for login)
    password: string;              // Hashed password
    pharmacyId: string;            // Reference to their pharmacy
    role: 'pharmacy-owner';        // Role identifier
    status: 'active' | 'inactive'; // Account status
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;             // Admin ID who created this owner
  }