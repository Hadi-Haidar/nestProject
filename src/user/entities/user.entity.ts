// src/user/entities/user.entity.ts

export class User {
    id: string;                    // Firestore document ID
    name: string;                  // User full name
    email: string;                 // User email (unique)
    password: string;              // User password (hashed)
    location?: {                   // OPTIONAL - Mobile will add this later
      latitude: number;
      longitude: number;
      address?: string;
    };
    status: 'active' | 'banned';   // User status
    createdAt: Date;
    updatedAt: Date;
  }