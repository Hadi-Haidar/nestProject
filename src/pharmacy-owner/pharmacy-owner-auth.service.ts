// src/pharmacy-owner/pharmacy-owner-auth.service.ts
// This will be used when you create the pharmacy owner portal

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PharmacyService } from '../pharmacy/pharmacy.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PharmacyOwnerAuthService {
  constructor(private pharmacyService: PharmacyService) {}

  // Pharmacy Owner Login
  async login(email: string, password: string) {
    // 1. Find owner by email
    const owner = await this.pharmacyService.findOwnerByEmail(email);
    
    if (!owner) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Check if owner is active
    if (owner.status !== 'active') {
      throw new UnauthorizedException('Account is inactive. Please contact admin.');
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, owner.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Get owner's pharmacy
    const pharmacy = await this.pharmacyService.findPharmacyByOwnerId(owner.id);

    // 5. Return owner info with pharmacy details (don't return password)
    return {
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        status: owner.status,
      },
      pharmacy: pharmacy ? {
        id: pharmacy.id,
        title: pharmacy.title,
        description: pharmacy.description,
        imageUrl: pharmacy.imageUrl,
        location: pharmacy.location,
        workingHours: pharmacy.workingHours,
        status: pharmacy.status,
      } : null,
    };
  }

  // Verify owner token (for future JWT implementation)
  async validateOwner(ownerId: string) {
    const owner = await this.pharmacyService.findOwnerById(ownerId);
    
    if (!owner || owner.status !== 'active') {
      throw new UnauthorizedException('Invalid or inactive owner');
    }

    return owner;
  }
}