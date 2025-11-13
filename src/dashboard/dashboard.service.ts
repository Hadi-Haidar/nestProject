// src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class DashboardService {
  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Get comprehensive dashboard statistics
   */
  async getStats() {
    const db = this.firebaseService.getFirestore();

    try {
      // Fetch all collections in parallel
      const [usersSnapshot, pharmaciesSnapshot, ownersSnapshot, medicinesSnapshot] =
        await Promise.all([
          db.collection('users').get(),
          db.collection('pharmacies').get(),
          db.collection('pharmacy-owners').get(),
          db.collection('medicines').get(),
        ]);

      // Calculate user statistics
      const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const totalUsers = users.length;
      const bannedUsers = users.filter((user: any) => user.status === 'banned').length;

      // Calculate pharmacy statistics
      const pharmacies = pharmaciesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const totalPharmacies = pharmacies.length;
      const activePharmacies = pharmacies.filter((p: any) => p.status === 'active').length;
      const inactivePharmacies = pharmacies.filter((p: any) => p.status === 'inactive').length;

      // Calculate pharmacy owners
      const totalPharmacyOwners = ownersSnapshot.size;

      // Calculate medicine statistics
      const medicines = medicinesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const totalMedicines = medicines.length;
      const activeMedicines = medicines.filter((m: any) => m.status === 'available').length;
      const unavailableMedicines = medicines.filter((m: any) => m.status === 'unavailable').length;

      // Calculate new registrations this month
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      const newUsersThisMonth = users.filter((user: any) => {
        const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return createdAt >= firstDayOfMonth;
      }).length;

      const newPharmaciesThisMonth = pharmacies.filter((pharmacy: any) => {
        const createdAt = pharmacy.createdAt?.toDate ? pharmacy.createdAt.toDate() : new Date(pharmacy.createdAt);
        return createdAt >= firstDayOfMonth;
      }).length;

      return {
        totalUsers,
        totalPharmacies,
        totalPharmacyOwners,
        activePharmacies,
        inactivePharmacies,
        bannedUsers,
        newUsersThisMonth,
        newPharmaciesThisMonth,
        totalMedicines,
        activeMedicines,
        unavailableMedicines,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get user growth data for the last 12 months
   */
  async getUserGrowthData() {
    const db = this.firebaseService.getFirestore();

    try {
      const usersSnapshot = await db.collection('users').get();
      const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Get last 12 months
      const monthsData = this.getLast12Months();
      const growthData = monthsData.map((monthInfo) => {
        const count = users.filter((user: any) => {
          const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
          return createdAt <= monthInfo.endDate;
        }).length;
        return count;
      });

      return {
        labels: monthsData.map((m) => m.label),
        data: growthData,
      };
    } catch (error) {
      console.error('Error fetching user growth data:', error);
      throw new Error('Failed to fetch user growth data');
    }
  }

  /**
   * Get pharmacy registration trend for the last 12 months
   */
  async getPharmacyTrendData() {
    const db = this.firebaseService.getFirestore();

    try {
      const pharmaciesSnapshot = await db.collection('pharmacies').get();
      const pharmacies = pharmaciesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Get last 12 months
      const monthsData = this.getLast12Months();
      const trendData = monthsData.map((monthInfo) => {
        const count = pharmacies.filter((pharmacy: any) => {
          const createdAt = pharmacy.createdAt?.toDate ? pharmacy.createdAt.toDate() : new Date(pharmacy.createdAt);
          return createdAt <= monthInfo.endDate;
        }).length;
        return count;
      });

      return {
        labels: monthsData.map((m) => m.label),
        data: trendData,
      };
    } catch (error) {
      console.error('Error fetching pharmacy trend data:', error);
      throw new Error('Failed to fetch pharmacy trend data');
    }
  }

  /**
   * Get user activity data for the last 7 days
   * Note: This is a placeholder. In a real app, you'd track user login/activity events
   */
  async getUserActivityData() {
    const db = this.firebaseService.getFirestore();

    try {
      // For now, we'll return user registration counts for the last 7 days
      const usersSnapshot = await db.collection('users').get();
      const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const last7Days = this.getLast7Days();
      const activityData = last7Days.map((dayInfo) => {
        const count = users.filter((user: any) => {
          const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
          return createdAt >= dayInfo.startDate && createdAt <= dayInfo.endDate;
        }).length;
        return count;
      });

      return {
        labels: last7Days.map((d) => d.label),
        data: activityData,
      };
    } catch (error) {
      console.error('Error fetching user activity data:', error);
      throw new Error('Failed to fetch user activity data');
    }
  }

  /**
   * Get pharmacy status distribution
   */
  async getPharmacyStatusData() {
    const db = this.firebaseService.getFirestore();

    try {
      const pharmaciesSnapshot = await db.collection('pharmacies').get();
      const pharmacies = pharmaciesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const activeCount = pharmacies.filter((p: any) => p.status === 'active').length;
      const inactiveCount = pharmacies.filter((p: any) => p.status === 'inactive').length;

      return {
        labels: ['Active', 'Inactive'],
        data: [activeCount, inactiveCount],
        colors: ['#10b981', '#ef4444'],
      };
    } catch (error) {
      console.error('Error fetching pharmacy status data:', error);
      throw new Error('Failed to fetch pharmacy status data');
    }
  }

  /**
   * Get user status distribution
   */
  async getUserStatusData() {
    const db = this.firebaseService.getFirestore();

    try {
      const usersSnapshot = await db.collection('users').get();
      const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const activeCount = users.filter((u: any) => u.status === 'active').length;
      const bannedCount = users.filter((u: any) => u.status === 'banned').length;

      return {
        labels: ['Active', 'Banned'],
        data: [activeCount, bannedCount],
        colors: ['#3b82f6', '#f59e0b'],
      };
    } catch (error) {
      console.error('Error fetching user status data:', error);
      throw new Error('Failed to fetch user status data');
    }
  }

  /**
   * Get most active pharmacies
   * Note: This is a placeholder. In a real app, you'd track actual pharmacy activity
   */
  async getTopPharmacies() {
    const db = this.firebaseService.getFirestore();

    try {
      const pharmaciesSnapshot = await db.collection('pharmacies').get();
      const pharmacies = pharmaciesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // For now, we'll use a simple metric (just show first 6 pharmacies)
      // In a real app, you'd track orders, views, or other activity metrics
      const topPharmacies = pharmacies
        .filter((p: any) => p.status === 'active')
        .slice(0, 6)
        .map((p: any) => ({
          name: p.title,
          // Placeholder activity count - in real app, query actual activity
          activity: Math.floor(Math.random() * 400) + 100,
        }));

      return {
        labels: topPharmacies.map((p) => p.name),
        data: topPharmacies.map((p) => p.activity),
      };
    } catch (error) {
      console.error('Error fetching top pharmacies:', error);
      throw new Error('Failed to fetch top pharmacies');
    }
  }

  /**
   * Helper: Get last 12 months data structure
   */
  private getLast12Months(): Array<{ label: string; startDate: Date; endDate: Date }> {
    const months: Array<{ label: string; startDate: Date; endDate: Date }> = [];
    const currentDate = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      months.push({
        label: date.toLocaleString('default', { month: 'short' }),
        startDate: date,
        endDate: endDate,
      });
    }

    return months;
  }

  /**
   * Helper: Get last 7 days data structure
   */
  private getLast7Days(): Array<{ label: string; startDate: Date; endDate: Date }> {
    const days: Array<{ label: string; startDate: Date; endDate: Date }> = [];
    const currentDate = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);

      const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      days.push({
        label: date.toLocaleString('default', { weekday: 'short' }),
        startDate: startDate,
        endDate: endDate,
      });
    }

    return days;
  }

  /**
   * Get monthly comparison data
   */
  async getMonthlyComparison() {
    const db = this.firebaseService.getFirestore();

    try {
      const currentDate = new Date();
      const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0, 23, 59, 59);

      const [usersSnapshot, pharmaciesSnapshot, medicinesSnapshot] = await Promise.all([
        db.collection('users').get(),
        db.collection('pharmacies').get(),
        db.collection('medicines').get(),
      ]);

      const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const pharmacies = pharmaciesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const medicines = medicinesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Current month counts
      const currentMonthUsers = users.filter((u: any) => {
        const createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        return createdAt >= currentMonthStart;
      }).length;

      const currentMonthPharmacies = pharmacies.filter((p: any) => {
        const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
        return createdAt >= currentMonthStart;
      }).length;

      const currentMonthMedicines = medicines.filter((m: any) => {
        const createdAt = m.createdAt?.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
        return createdAt >= currentMonthStart;
      }).length;

      // Previous month counts
      const previousMonthUsers = users.filter((u: any) => {
        const createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        return createdAt >= previousMonthStart && createdAt <= previousMonthEnd;
      }).length;

      const previousMonthPharmacies = pharmacies.filter((p: any) => {
        const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
        return createdAt >= previousMonthStart && createdAt <= previousMonthEnd;
      }).length;

      const previousMonthMedicines = medicines.filter((m: any) => {
        const createdAt = m.createdAt?.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
        return createdAt >= previousMonthStart && createdAt <= previousMonthEnd;
      }).length;

      return {
        currentMonth: {
          users: currentMonthUsers,
          pharmacies: currentMonthPharmacies,
          medicines: currentMonthMedicines,
        },
        previousMonth: {
          users: previousMonthUsers,
          pharmacies: previousMonthPharmacies,
          medicines: previousMonthMedicines,
        },
      };
    } catch (error) {
      console.error('Error fetching monthly comparison:', error);
      throw new Error('Failed to fetch monthly comparison data');
    }
  }
}

