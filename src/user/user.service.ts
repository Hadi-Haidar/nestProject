// src/user/user.service.ts - FIXED VERSION

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private firestore: Firestore;
  private usersCollection = 'users';

  constructor() {
    this.firestore = new Firestore({
      projectId: process.env.FIREBASE_PROJECT_ID,
      credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
  }

  // ========================================
  // CREATE USER (For Testing/Manual Creation)
  // ========================================
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Build user data - ONLY include location if it exists
    const userData: any = {
      name: createUserDto.name,
      email: createUserDto.email,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Only add location if it's provided (don't add undefined)
    if (createUserDto.location) {
      userData.location = createUserDto.location;
    }

    const docRef = await this.firestore.collection(this.usersCollection).add(userData);

    return {
      id: docRef.id,
      ...userData,
    };
  }

  // ========================================
  // GET ALL USERS
  // ========================================
  async findAll(): Promise<User[]> {
    const snapshot = await this.firestore
      .collection(this.usersCollection)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  }

  // ========================================
  // GET USER BY ID
  // ========================================
  async findOne(id: string): Promise<User> {
    const doc = await this.firestore.collection(this.usersCollection).doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as User;
  }

  // ========================================
  // GET USER BY EMAIL
  // ========================================
  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.firestore
      .collection(this.usersCollection)
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
    } as User;
  }

  // ========================================
  // SEARCH USERS BY NAME OR EMAIL
  // ========================================
  async search(query: string): Promise<User[]> {
    const snapshot = await this.firestore.collection(this.usersCollection).get();

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];

    // Filter by name or email (case-insensitive)
    const lowerQuery = query.toLowerCase();
    return users.filter(
      user =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery),
    );
  }

  // ========================================
  // FILTER USERS BY STATUS
  // ========================================
  async findByStatus(status: 'active' | 'banned'): Promise<User[]> {
    const snapshot = await this.firestore
      .collection(this.usersCollection)
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  }

  // ========================================
  // UPDATE USER STATUS (Ban/Unban)
  // ========================================
  async updateStatus(
    id: string,
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<User> {
    const docRef = this.firestore.collection(this.usersCollection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await docRef.update({
      status: updateUserStatusDto.status,
      updatedAt: new Date(),
    });

    return this.findOne(id);
  }

  // ========================================
  // DELETE USER
  // ========================================
  async remove(id: string): Promise<{ message: string }> {
    const docRef = this.firestore.collection(this.usersCollection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const userData = doc.data() as User;
    await docRef.delete();

    return {
      message: `User "${userData.name}" deleted successfully`,
    };
  }

  // ========================================
  // GET USER STATISTICS
  // ========================================
  async getStatistics() {
    const allUsers = await this.findAll();

    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(user => user.status === 'active').length;
    const bannedUsers = allUsers.filter(user => user.status === 'banned').length;
    const usersWithLocation = allUsers.filter(user => user.location).length;

    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      usersWithLocation,
    };
  }
}