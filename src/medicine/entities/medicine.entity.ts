// src/medicine/entities/medicine.entity.ts

export class Medicine {
    id: string;                    // Firestore document ID
    title: string;                 // Medicine name
    description: string;           // Medicine description/usage
    frontImageUrl: string;         // Front image URL from Firebase Storage (required)
    backImageUrl?: string;         // Back image URL from Firebase Storage (optional)
    status: 'available' | 'unavailable'; // Medicine status
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;             // Admin ID who created it
  }