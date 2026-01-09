import * as cron from 'node-cron';
import { storage } from './storage';
import { LeaveMonitoringService } from './leaveMonitoringService';
import { simperNotificationService } from './services/simperNotificationService';
import { emailService } from './services/emailService';

export function initializeCronJobs() {
  const monitoringService = new LeaveMonitoringService(storage as any);

  // Run every day at 9:00 AM to check for leave reminders
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily leave reminder check...');
    try {
      const result = await monitoringService.sendLeaveReminders();
      console.log(`Leave reminders completed: ${result.sent} sent, ${result.failed} failed`);
    } catch (error) {
      console.error('Error in daily leave reminder job:', error);
    }
  }, {
    timezone: "Asia/Jakarta"
  });

  // Optional: Run every Monday at 8:00 AM for weekly summary
  cron.schedule('0 8 * * 1', async () => {
    console.log('Running weekly leave monitoring summary...');
    try {
      const upcomingLeaves = await monitoringService.checkUpcomingLeaves();
      console.log(`Weekly summary: ${upcomingLeaves.length} upcoming leave reminders to send`);
    } catch (error) {
      console.error('Error in weekly summary job:', error);
    }
  }, {
    timezone: "Asia/Jakarta"
  });

  // Run every day at 7:00 AM WITA to check for SIMPER expired/expiring
  cron.schedule('0 7 * * *', async () => {
    console.log('📧 Running daily SIMPER expiry notification check...');
    try {
      const result = await simperNotificationService.checkAndNotifySimperExpired();
      if (result.sent) {
        console.log(`✅ SIMPER notification sent: ${result.count} employees with expired/expiring SIMPER`);
      } else if (result.count === 0) {
        console.log('✅ No SIMPER expired or expiring soon');
      } else {
        console.log('⚠️ Failed to send SIMPER notification email');
      }
    } catch (error) {
      console.error('❌ Error in SIMPER notification job:', error);
    }
  }, {
    timezone: "Asia/Makassar"
  });

  console.log('Cron jobs initialized for leave monitoring');
  if (emailService.isConfigured()) {
    console.log('📧 SIMPER notification email service: ACTIVE (daily at 7:00 AM WITA)');
  } else {
    console.log('⚠️ SIMPER notification email service: INACTIVE (credentials not configured)');
  }
}