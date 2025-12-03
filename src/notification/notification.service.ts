import { Injectable, Logger } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private firestore: Firestore;
  private notificationsCollection = 'medicineNotifications';
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

  /**
   * Check for pending notifications when medicine is added to pharmacy
   * This should be called after a pharmacy's medicine inventory is updated
   */
  async checkMedicineAvailability(pharmacyId: string, medicineName: string) {
    try {
      this.logger.log(`🔔 Checking notifications for ${medicineName} at pharmacy ${pharmacyId}`);

      // Find all users subscribed to this medicine at this pharmacy
      const snapshot = await this.firestore
        .collection(this.notificationsCollection)
        .where('pharmacyId', '==', pharmacyId)
        .where('medicineName', '==', medicineName)
        .where('notified', '==', false)
        .get();

      if (snapshot.empty) {
        this.logger.log('No pending notifications found');
        return;
      }

      this.logger.log(`🔔 Found ${snapshot.docs.length} pending notifications - TRIGGERING NOW!`);

      // Process each notification
      const promises = snapshot.docs.map(async (doc) => {
        const notification = doc.data();
        
        // Get user's notification preference
        const userDoc = await this.firestore
          .collection(this.usersCollection)
          .doc(notification.userId)
          .get();

        if (!userDoc.exists) {
          this.logger.warn(`User ${notification.userId} not found`);
          return;
        }

        const userData = userDoc.data();
        
        // Check if user has notifications enabled
        if (userData?.notificationsEnabled === false) {
          this.logger.log(`User ${notification.userId} has notifications disabled`);
          return;
        }

        // TRIGGER THE NOTIFICATION by updating the document with a trigger timestamp
        // This will cause the onSnapshot listener to fire
        this.logger.log(`🔔 TRIGGERING notification for user ${notification.userId}`);
        await this.firestore
          .collection(this.notificationsCollection)
          .doc(doc.id)
          .update({
            triggered: true,
            triggeredAt: new Date(),
          });
        
        this.logger.log(`✅ Notification triggered for "${notification.medicineName}" at ${notification.pharmacyName}`);
      });

      await Promise.all(promises);
      
      this.logger.log('✅ All notifications triggered successfully');
    } catch (error) {
      this.logger.error('❌ Error checking medicine availability:', error);
      throw error;
    }
  }

  /**
   * Get all pending notifications for a pharmacy
   */
  async getPendingNotifications(pharmacyId: string) {
    try {
      const snapshot = await this.firestore
        .collection(this.notificationsCollection)
        .where('pharmacyId', '==', pharmacyId)
        .where('notified', '==', false)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      this.logger.error('Error getting pending notifications:', error);
      return [];
    }
  }
}
