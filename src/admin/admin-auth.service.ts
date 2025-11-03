import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { FirebaseService } from '../firebase/firebase.service';
import { Admin, AdminResponse } from './entities/admin.entity';
import { RegisterAdminDto, LoginAdminDto } from './dto/admin-auth.dto';

@Injectable()
export class AdminAuthService {
  private firestore: FirebaseFirestore.Firestore;
  private adminCollection = 'admins';

  constructor(private firebaseService: FirebaseService) {
    this.firestore = this.firebaseService.getFirestore();
  }

  async register(registerDto: RegisterAdminDto): Promise<AdminResponse> {
    const { name, email, password } = registerDto;

    // Check if admin already exists
    const existingAdmin = await this.findByEmail(email);
    if (existingAdmin) {
      throw new ConflictException('Admin with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin object
    const admin: Admin = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    const docRef = await this.firestore.collection(this.adminCollection).add(admin);
    
    // Get the created admin with ID
    const createdAdmin = await docRef.get();
    const adminData = createdAdmin.data() as Admin;

    return {
      id: docRef.id,
      name: adminData.name,
      email: adminData.email,
      createdAt: adminData.createdAt,
      updatedAt: adminData.updatedAt,
    };
  }

  async login(loginDto: LoginAdminDto): Promise<AdminResponse> {
    const { email, password } = loginDto;

    // Find admin by email
    const admin = await this.findByEmail(email);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: admin.id!,
      name: admin.name,
      email: admin.email,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  async logout(): Promise<{ message: string }> {
    // Since we're not using JWT or sessions for now,
    // logout is handled on the frontend by clearing stored data
    return { message: 'Logged out successfully' };
  }

  private async findByEmail(email: string): Promise<(Admin & { id: string }) | null> {
    const snapshot = await this.firestore
      .collection(this.adminCollection)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...(doc.data() as Admin),
    };
  }

  async findById(id: string): Promise<AdminResponse | null> {
    const doc = await this.firestore.collection(this.adminCollection).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const adminData = doc.data() as Admin;
    return {
      id: doc.id,
      name: adminData.name,
      email: adminData.email,
      createdAt: adminData.createdAt,
      updatedAt: adminData.updatedAt,
    };
  }
}