// src/pharmacy/entities/pharmacy.entity.ts

export class Pharmacy {
  id: string;                    // Firestore document ID
  title: string;                 // Pharmacy name
  description: string;           // Short description
  imageUrl: string;              // Pharmacy image URL
  location: {
    latitude: number;            // Map coordinates
    longitude: number;
    address?: string;            // Optional address text
  };
  ownerId: string;               // Reference to PharmacyOwner document
  workingHours: {
    day: string;                 // e.g., "Monday", "Tuesday"
    isOpen: boolean;             // Is pharmacy open this day?
    openTime?: string;           // e.g., "08:00"
    closeTime?: string;          // e.g., "20:00"
  }[];
  status: 'active' | 'inactive'; // Pharmacy status
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;             // Admin ID who created it
}