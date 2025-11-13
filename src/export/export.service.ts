// src/export/export.service.ts - FIXED

import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  private firestore: Firestore;

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
  // EXPORT MEDICINES
  // ========================================
  async exportMedicines() {
    // Fetch all medicines
    const snapshot = await this.firestore
      .collection('medicines')
      .orderBy('createdAt', 'desc')
      .get();

    const medicines = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Medicines');

    // Define columns
    worksheet.columns = [
      { header: 'Medicine Name', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created Date', key: 'createdAt', width: 20 },
      { header: 'Updated Date', key: 'updatedAt', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    medicines.forEach((medicine: any) => {
      worksheet.addRow({
        title: medicine.title,
        description: medicine.description,
        status: medicine.status === 'active' ? 'Active' : 'Inactive',
        createdAt: this.formatDate(medicine.createdAt),
        updatedAt: this.formatDate(medicine.updatedAt),
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    // Generate buffer - FIXED
    return await workbook.xlsx.writeBuffer();
  }

  // ========================================
  // EXPORT PHARMACY OWNERS
  // ========================================
  async exportPharmacyOwners() {
    // Fetch all pharmacy owners
    const ownersSnapshot = await this.firestore
      .collection('pharmacy-owners')
      .orderBy('createdAt', 'desc')
      .get();

    const owners = ownersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch all pharmacies to get pharmacy names
    const pharmaciesSnapshot = await this.firestore
      .collection('pharmacies')
      .get();

    const pharmacies = pharmaciesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Create a map of ownerId -> pharmacy name
    const ownerPharmacyMap = new Map();
    pharmacies.forEach((pharmacy: any) => {
      ownerPharmacyMap.set(pharmacy.ownerId, pharmacy.title);
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pharmacy Owners');

    // Define columns
    worksheet.columns = [
      { header: 'Owner Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Pharmacy Name', key: 'pharmacyName', width: 30 },
      { header: 'Created Date', key: 'createdAt', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    owners.forEach((owner: any) => {
      worksheet.addRow({
        name: owner.name,
        email: owner.email,
        status: owner.status === 'active' ? 'Active' : 'Inactive',
        pharmacyName: ownerPharmacyMap.get(owner.id) || 'N/A',
        createdAt: this.formatDate(owner.createdAt),
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    // Generate buffer - FIXED
    return await workbook.xlsx.writeBuffer();
  }

  // ========================================
  // EXPORT PHARMACIES
  // ========================================
  async exportPharmacies() {
    // Fetch all pharmacies
    const pharmaciesSnapshot = await this.firestore
      .collection('pharmacies')
      .orderBy('createdAt', 'desc')
      .get();

    const pharmacies = pharmaciesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch all pharmacy owners to get owner names and emails
    const ownersSnapshot = await this.firestore
      .collection('pharmacy-owners')
      .get();

    const owners = ownersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Create a map of ownerId -> owner info
    const ownerMap = new Map();
    owners.forEach((owner: any) => {
      ownerMap.set(owner.id, {
        name: owner.name,
        email: owner.email,
      });
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pharmacies');

    // Define columns
    worksheet.columns = [
      { header: 'Pharmacy Name', key: 'title', width: 30 },
      { header: 'Location', key: 'location', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Owner Name', key: 'ownerName', width: 30 },
      { header: 'Owner Email', key: 'ownerEmail', width: 35 },
      { header: 'Created Date', key: 'createdAt', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    pharmacies.forEach((pharmacy: any) => {
      const owner = ownerMap.get(pharmacy.ownerId);
      const location = pharmacy.location?.address || 
        (pharmacy.location?.latitude && pharmacy.location?.longitude
          ? `${pharmacy.location.latitude.toFixed(4)}, ${pharmacy.location.longitude.toFixed(4)}`
          : 'N/A');

      worksheet.addRow({
        title: pharmacy.title,
        location: location,
        status: pharmacy.status === 'active' ? 'Active' : 'Inactive',
        ownerName: owner?.name || 'N/A',
        ownerEmail: owner?.email || 'N/A',
        createdAt: this.formatDate(pharmacy.createdAt),
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    // Generate buffer - FIXED
    return await workbook.xlsx.writeBuffer();
  }

  // ========================================
  // HELPER: FORMAT DATE
  // ========================================
  private formatDate(date: any): string {
    if (!date) return 'N/A';

    try {
      let dateObj: Date;

      // Handle Firestore Timestamp
      if (date._seconds || date.seconds) {
        const seconds = date._seconds || date.seconds;
        dateObj = new Date(seconds * 1000);
      } else {
        dateObj = new Date(date);
      }

      // Check if valid
      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }

      // Format: MM/DD/YYYY HH:MM
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'N/A';
    }
  }
}