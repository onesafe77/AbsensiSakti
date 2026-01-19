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

/**
 * Send WhatsApp message with image via Notifyme.id API (POST with JSON body)
 */
export async function sendWhatsAppImage(params: {
    phone: string;
    message: string;
    imageUrl: string;
}): Promise<SendMessageResult> {
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
        const body = {
            apikey: apiKey,
            receiver: normalizedPhone,
            mtype: 'image',
            text: params.message,
            url: params.imageUrl
        };

        console.log(`[WhatsApp] Sending image to ${normalizedPhone}`);

        const response = await fetch(NOTIFYME_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();

        if (response.ok) {
            console.log(`[WhatsApp] Image sent: ${normalizedPhone}`);
            return { success: true, response: data };
        } else {
            console.error(`[WhatsApp] Image failed: ${JSON.stringify(data)}`);
            return { success: false, error: data.message || 'Send failed', response: data };
        }
    } catch (error) {
        console.error(`[WhatsApp] Image error:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Send WhatsApp message with video via Notifyme.id API (POST with JSON body)
 */
export async function sendWhatsAppVideo(params: {
    phone: string;
    message: string;
    videoUrl: string;
}): Promise<SendMessageResult> {
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
        const body = {
            apikey: apiKey,
            receiver: normalizedPhone,
            mtype: 'video',
            text: params.message,
            url: params.videoUrl
        };

        console.log(`[WhatsApp] Sending video to ${normalizedPhone}`);

        const response = await fetch(NOTIFYME_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();

        if (response.ok) {
            console.log(`[WhatsApp] Video sent: ${normalizedPhone}`);
            return { success: true, response: data };
        } else {
            console.error(`[WhatsApp] Video failed: ${JSON.stringify(data)}`);
            return { success: false, error: data.message || 'Send failed', response: data };
        }
    } catch (error) {
        console.error(`[WhatsApp] Video error:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Delay helper for batch processing
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Blast WhatsApp message to multiple recipients with batch processing
 * Sends in batches of 10 with 5 second delay between batches
 */
export async function blastWhatsApp(params: {
    phones: string[];
    message: string;
    type: 'text' | 'image' | 'video';
    mediaUrls?: string[]; // For multiple images or single video
}): Promise<{
    totalRecipients: number;
    sent: number;
    failed: number;
    failedNumbers: string[];
}> {
    const { phones, message, type, mediaUrls } = params;
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 5000; // 5 seconds

    let sent = 0;
    let failed = 0;
    const failedNumbers: string[] = [];

    console.log(`[WhatsApp Blast] Starting blast to ${phones.length} recipients (type: ${type})`);

    for (let i = 0; i < phones.length; i += BATCH_SIZE) {
        const batch = phones.slice(i, i + BATCH_SIZE);
        console.log(`[WhatsApp Blast] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(phones.length / BATCH_SIZE)}`);

        for (const phone of batch) {
            let result: SendMessageResult;

            if (type === 'text') {
                result = await sendWhatsAppMessage({ phone, message });
            } else if (type === 'image' && mediaUrls && mediaUrls.length > 0) {
                // Send each image separately
                for (const imageUrl of mediaUrls) {
                    result = await sendWhatsAppImage({ phone, message, imageUrl });
                    if (!result.success) break;
                    await delay(500); // Small delay between images
                }
            } else if (type === 'video' && mediaUrls && mediaUrls.length > 0) {
                result = await sendWhatsAppVideo({ phone, message, videoUrl: mediaUrls[0] });
            } else {
                result = { success: false, error: 'Invalid type or missing media' };
            }

            if (result!.success) {
                sent++;
            } else {
                failed++;
                failedNumbers.push(phone);
            }
        }

        // Delay between batches (except for last batch)
        if (i + BATCH_SIZE < phones.length) {
            console.log(`[WhatsApp Blast] Waiting ${BATCH_DELAY / 1000}s before next batch...`);
            await delay(BATCH_DELAY);
        }
    }

    console.log(`[WhatsApp Blast] Complete: ${sent} sent, ${failed} failed`);
    return { totalRecipients: phones.length, sent, failed, failedNumbers };
}

