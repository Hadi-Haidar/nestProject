// src/user/user.service.ts - FIXED VERSION

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Build user data - ONLY include location if it exists
    const userData: any = {
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Only add location if it's provided (don't add undefined)
    if (createUserDto.location) {
      userData.location = createUserDto.location;
    }

    const docRef = await this.firestore.collection(this.usersCollection).add(userData);

    // Return user without password
    const { password, ...userWithoutPassword } = userData;
    return {
      id: docRef.id,
      ...userWithoutPassword,
    };
  }

  // ========================================
  // UPDATE USER PROFILE
  // ========================================
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      console.log('=== UPDATE USER START ===');
      console.log('User ID:', id);
      console.log('Update DTO:', JSON.stringify(updateUserDto, null, 2));

      const docRef = this.firestore.collection(this.usersCollection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      console.log('Existing user data:', doc.data());

      // If email is being updated, check if it's already taken
      if (updateUserDto.email) {
        const existingUser = await this.findByEmail(updateUserDto.email);
        if (existingUser && existingUser.id !== id) {
          throw new ConflictException('Email already in use');
        }
      }

      // Convert DTO to plain object (remove class prototypes)
      // Build update object similar to create() - only include what's provided
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (updateUserDto.name !== undefined) {
        updateData.name = updateUserDto.name;
      }

      if (updateUserDto.email !== undefined) {
        updateData.email = updateUserDto.email;
      }

      if (updateUserDto.location !== undefined) {
        // Convert location DTO to plain object
        updateData.location = {
          latitude: updateUserDto.location.latitude,
          longitude: updateUserDto.location.longitude,
        };
      }

      console.log('Update data to apply:', JSON.stringify(updateData, null, 2));

      await docRef.update(updateData);

      console.log('=== UPDATE SUCCESSFUL ===');

      // Return updated user
      return this.findOne(id);
    } catch (error) {
      console.error('=== UPDATE USER ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', error);
      throw error;
    }
  }

  // ========================================
  // LOGIN USER (Verify credentials)
  // ========================================
  async login(email: string, password: string): Promise<User> {
    const user = await this.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is banned
    if (user.status === 'banned') {
      throw new ConflictException('Your account has been banned');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('Invalid password');
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
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