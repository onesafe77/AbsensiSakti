/**
 * WhatsApp Service using Notifyme.id API
 * Endpoint: https://app.notif.my.id/api/v2/send-message
 */

const NOTIFYME_API_URL = 'https://app.notif.my.id/api/v2/send-message';

interface SendMessageParams {
    phone: string;
    message: string;
}

interface SendMessageResult {
    success: boolean;
    error?: string;
    response?: any;
}

/**
 * Normalize phone number to 62xxxx format
 */
export function normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    // Convert 08xxx to 628xxx
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }
    // Add 62 if not present
    if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
}

/**
 * Send WhatsApp message via Notifyme.id API
 */
export async function sendWhatsAppMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const apiKey = process.env.NOTIFYME_API_KEY;

    if (!apiKey) {
        console.error('[WhatsApp] API key not configured');
        return { success: false, error: 'API key not configured' };
    }

    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone) {
        return { success: false, error: 'Invalid phone number' };
    }

    try {
        const url = new URL(NOTIFYME_API_URL);
        url.searchParams.append('apikey', apiKey);
        url.searchParams.append('mtype', 'text');
        url.searchParams.append('receiver', normalizedPhone);
        url.searchParams.append('text', params.message);

        console.log(`[WhatsApp] Sending to ${normalizedPhone}`);

        const response = await fetch(url.toString(), { method: 'GET' });
        const data = await response.json();

        if (response.ok) {
            console.log(`[WhatsApp] Success: ${normalizedPhone}`);
            return { success: true, response: data };
        } else {
            console.error(`[WhatsApp] Failed: ${JSON.stringify(data)}`);
            return { success: false, error: data.message || 'Send failed', response: data };
        }
    } catch (error) {
        console.error(`[WhatsApp] Error:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Send notification to admin (OneTalent GECL)
 */
export async function sendAdminNotification(message: string): Promise<SendMessageResult> {
    const adminPhone = process.env.NOTIFYME_ADMIN_PHONE || '6285126406588';
    return sendWhatsAppMessage({ phone: adminPhone, message });
}

/**
 * Generate SIMPER reminder message
 */
export function generateSimperReminderMessage(params: {
    name: string;
    docType: 'SIMPOL' | 'SIMPER BIB' | 'SIMPER TIA';
    daysLeft: number;
    expiredDate: string;
}): string {
    const { name, docType, daysLeft, expiredDate } = params;

    if (daysLeft < 0) {
        // Already expired
        return `⚠️ *PERINGATAN ${docType} EXPIRED*

Halo ${name},

${docType} Anda sudah *EXPIRED* ${Math.abs(daysLeft)} hari yang lalu (${expiredDate}).

Segera urus perpanjangannya!

- OneTalent GECL`;
    }

    const urgency = daysLeft <= 7 ? '🔴 URGENT' : daysLeft <= 14 ? '🟠 PENTING' : '🟡 REMINDER';

    return `${urgency} *Reminder ${docType}*

Halo ${name},

${docType} Anda akan expired dalam *${daysLeft} hari* (${expiredDate}).

Mohon segera urus perpanjangannya.

- OneTalent GECL`;
}

/**
 * Generate message for admin when SIMPER is ready
 */
export function generateAdminProgressMessage(params: {
    employeeName: string;
    employeeId: string;
    docType: string;
    status: string;
}): string {
    return `📋 *Update Status ${params.docType}*

Karyawan: ${params.employeeName}
NIK: ${params.employeeId}
Status: ${params.status}

- OneTalent System`;
}

/**
 * Generate pickup notification message
 */
export function generatePickupMessage(params: {
    name: string;
    docType: string;
}): string {
    return `📦 *${params.docType} Siap Diambil*

Halo ${params.name},

${params.docType} Anda sudah selesai diproses dan dapat diambil di kantor.

Terima kasih,
- OneTalent HR System`;
}
