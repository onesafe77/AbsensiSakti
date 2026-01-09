import webpush from 'web-push';
import { db } from './db';
import { pushSubscriptions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:onesafe.gecl@gmail.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('✅ Push notification service initialized');
} else {
  console.log('⚠️ Push notification service: VAPID keys not configured');
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  type?: 'news' | 'announcement' | 'shift' | 'leave' | 'simper' | 'general';
  tag?: string;
}

export async function sendPushNotification(employeeId: string, payload: PushPayload): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('Push notification skipped: VAPID keys not configured');
    return false;
  }

  try {
    const subscriptions = await db.select()
      .from(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.employeeId, employeeId),
        eq(pushSubscriptions.isActive, true)
      ));

    if (subscriptions.length === 0) {
      console.log(`No active subscriptions for employee ${employeeId}`);
      return false;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      url: payload.url || '/',
      type: payload.type || 'general',
      tag: payload.tag || `onetalent-${Date.now()}`
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            notificationPayload
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.update(pushSubscriptions)
              .set({ isActive: false })
              .where(eq(pushSubscriptions.id, sub.id));
            console.log(`Subscription expired, marked inactive: ${sub.id}`);
          }
          throw error;
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Push sent to ${successCount}/${subscriptions.length} devices for employee ${employeeId}`);
    return successCount > 0;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('Push notification skipped: VAPID keys not configured');
    return { sent: 0, failed: 0 };
  }

  try {
    const subscriptions = await db.select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.isActive, true));

    if (subscriptions.length === 0) {
      console.log('No active subscriptions found');
      return { sent: 0, failed: 0 };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      url: payload.url || '/',
      type: payload.type || 'general',
      tag: payload.tag || `onetalent-${Date.now()}`
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          notificationPayload
        );
        sent++;
      } catch (error: any) {
        failed++;
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db.update(pushSubscriptions)
            .set({ isActive: false })
            .where(eq(pushSubscriptions.id, sub.id));
        }
      }
    }

    console.log(`Push broadcast: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  } catch (error) {
    console.error('Error broadcasting push notification:', error);
    return { sent: 0, failed: 0 };
  }
}

export async function sendPushToMultiple(employeeIds: string[], payload: PushPayload): Promise<{ sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const employeeId of employeeIds) {
    const success = await sendPushNotification(employeeId, payload);
    if (success) {
      totalSent++;
    } else {
      totalFailed++;
    }
  }

  return { sent: totalSent, failed: totalFailed };
}

export function getVapidPublicKey(): string | undefined {
  return VAPID_PUBLIC_KEY;
}

export class PushNotificationService {
  async sendNotification(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: { title: string; body: string; icon?: string; badge?: string; data?: any }
  ): Promise<boolean> {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.log('Push notification skipped: VAPID keys not configured');
      return false;
    }

    try {
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-72x72.png',
        data: payload.data || {}
      });

      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        },
        notificationPayload
      );
      
      return true;
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }
}
