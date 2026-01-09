import { emailService } from './emailService';
import { storage } from '../storage';

interface SimperExpiredData {
  employeeName: string;
  nik: string;
  simperBibExpiredDate: string | null;
  simperTiaExpiredDate: string | null;
  bibStatus: 'expired' | 'expiring_soon' | 'ok';
  tiaStatus: 'expired' | 'expiring_soon' | 'ok';
  bibDaysRemaining: number | null;
  tiaDaysRemaining: number | null;
}

class SimperNotificationService {
  private readonly NOTIFICATION_EMAIL = 'gecl.hse@gmail.com';
  private readonly WARNING_DAYS = 30;

  async checkAndNotifySimperExpired(): Promise<{ sent: boolean; count: number }> {
    console.log('🔍 Checking for expired/expiring SIMPER...');

    try {
      const simperData = await this.getSimperExpiryData();
      
      const expiredOrExpiring = simperData.filter(
        s => s.bibStatus !== 'ok' || s.tiaStatus !== 'ok'
      );

      if (expiredOrExpiring.length === 0) {
        console.log('✅ No SIMPER expired or expiring soon');
        return { sent: false, count: 0 };
      }

      console.log(`⚠️ Found ${expiredOrExpiring.length} employees with SIMPER issues`);

      const emailHtml = this.generateEmailHtml(expiredOrExpiring);
      const emailText = this.generateEmailText(expiredOrExpiring);

      const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const sent = await emailService.sendEmail({
        to: this.NOTIFICATION_EMAIL,
        subject: `⚠️ Notifikasi SIMPER Expired/Akan Expired - ${today}`,
        html: emailHtml,
        text: emailText,
      });

      return { sent, count: expiredOrExpiring.length };
    } catch (error) {
      console.error('❌ Error checking SIMPER expiry:', error);
      return { sent: false, count: 0 };
    }
  }

  private async getSimperExpiryData(): Promise<SimperExpiredData[]> {
    const allSimper = await storage.getAllSimperMonitoring();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allSimper.map(simper => {
      const bibExpiry = simper.simperBibExpiredDate ? new Date(simper.simperBibExpiredDate) : null;
      const tiaExpiry = simper.simperTiaExpiredDate ? new Date(simper.simperTiaExpiredDate) : null;

      let bibDaysRemaining: number | null = null;
      let tiaDaysRemaining: number | null = null;
      let bibStatus: 'expired' | 'expiring_soon' | 'ok' = 'ok';
      let tiaStatus: 'expired' | 'expiring_soon' | 'ok' = 'ok';

      if (bibExpiry) {
        bibDaysRemaining = Math.ceil((bibExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (bibDaysRemaining < 0) {
          bibStatus = 'expired';
        } else if (bibDaysRemaining <= this.WARNING_DAYS) {
          bibStatus = 'expiring_soon';
        }
      }

      if (tiaExpiry) {
        tiaDaysRemaining = Math.ceil((tiaExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (tiaDaysRemaining < 0) {
          tiaStatus = 'expired';
        } else if (tiaDaysRemaining <= this.WARNING_DAYS) {
          tiaStatus = 'expiring_soon';
        }
      }

      return {
        employeeName: simper.employeeName,
        nik: simper.nik,
        simperBibExpiredDate: simper.simperBibExpiredDate,
        simperTiaExpiredDate: simper.simperTiaExpiredDate,
        bibStatus,
        tiaStatus,
        bibDaysRemaining,
        tiaDaysRemaining,
      };
    }).filter(s => s.bibStatus !== 'ok' || s.tiaStatus !== 'ok');
  }

  private generateEmailHtml(data: SimperExpiredData[]): string {
    const expiredBib = data.filter(s => s.bibStatus === 'expired');
    const expiringBib = data.filter(s => s.bibStatus === 'expiring_soon');
    const expiredTia = data.filter(s => s.tiaStatus === 'expired');
    const expiringTia = data.filter(s => s.tiaStatus === 'expiring_soon');

    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0; opacity: 0.9; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .section { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e5e7eb; }
    .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
    .expired { color: #dc2626; }
    .warning { color: #f59e0b; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .status-expired { background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    .status-warning { background: #fffbeb; color: #d97706; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .summary { display: flex; gap: 20px; margin-bottom: 15px; }
    .summary-card { flex: 1; background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
    .summary-number { font-size: 28px; font-weight: bold; }
    .summary-label { font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Notifikasi SIMPER Expired</h1>
      <p>${today}</p>
    </div>
    
    <div class="content">
      <div class="summary">
        <div class="summary-card">
          <div class="summary-number expired">${expiredBib.length + expiredTia.length}</div>
          <div class="summary-label">Sudah Expired</div>
        </div>
        <div class="summary-card">
          <div class="summary-number warning">${expiringBib.length + expiringTia.length}</div>
          <div class="summary-label">Akan Expired (≤30 hari)</div>
        </div>
      </div>

      ${expiredBib.length > 0 ? `
      <div class="section">
        <div class="section-title expired">🔴 SIMPER BIB - SUDAH EXPIRED (${expiredBib.length})</div>
        <table>
          <tr><th>Nama</th><th>NIK</th><th>Tanggal Expired</th><th>Status</th></tr>
          ${expiredBib.map(s => `
          <tr>
            <td>${s.employeeName}</td>
            <td>${s.nik}</td>
            <td>${s.simperBibExpiredDate}</td>
            <td><span class="status-expired">Expired ${Math.abs(s.bibDaysRemaining || 0)} hari</span></td>
          </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}

      ${expiringBib.length > 0 ? `
      <div class="section">
        <div class="section-title warning">🟡 SIMPER BIB - AKAN EXPIRED (${expiringBib.length})</div>
        <table>
          <tr><th>Nama</th><th>NIK</th><th>Tanggal Expired</th><th>Sisa Hari</th></tr>
          ${expiringBib.map(s => `
          <tr>
            <td>${s.employeeName}</td>
            <td>${s.nik}</td>
            <td>${s.simperBibExpiredDate}</td>
            <td><span class="status-warning">${s.bibDaysRemaining} hari lagi</span></td>
          </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}

      ${expiredTia.length > 0 ? `
      <div class="section">
        <div class="section-title expired">🔴 SIMPER TIA - SUDAH EXPIRED (${expiredTia.length})</div>
        <table>
          <tr><th>Nama</th><th>NIK</th><th>Tanggal Expired</th><th>Status</th></tr>
          ${expiredTia.map(s => `
          <tr>
            <td>${s.employeeName}</td>
            <td>${s.nik}</td>
            <td>${s.simperTiaExpiredDate}</td>
            <td><span class="status-expired">Expired ${Math.abs(s.tiaDaysRemaining || 0)} hari</span></td>
          </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}

      ${expiringTia.length > 0 ? `
      <div class="section">
        <div class="section-title warning">🟡 SIMPER TIA - AKAN EXPIRED (${expiringTia.length})</div>
        <table>
          <tr><th>Nama</th><th>NIK</th><th>Tanggal Expired</th><th>Sisa Hari</th></tr>
          ${expiringTia.map(s => `
          <tr>
            <td>${s.employeeName}</td>
            <td>${s.nik}</td>
            <td>${s.simperTiaExpiredDate}</td>
            <td><span class="status-warning">${s.tiaDaysRemaining} hari lagi</span></td>
          </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>Email ini dikirim otomatis oleh sistem OneTalent GECL</p>
      <p>Silakan update data SIMPER di aplikasi untuk menghentikan notifikasi</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateEmailText(data: SimperExpiredData[]): string {
    const expiredBib = data.filter(s => s.bibStatus === 'expired');
    const expiringBib = data.filter(s => s.bibStatus === 'expiring_soon');
    const expiredTia = data.filter(s => s.tiaStatus === 'expired');
    const expiringTia = data.filter(s => s.tiaStatus === 'expiring_soon');

    let text = '=== NOTIFIKASI SIMPER EXPIRED ===\n\n';

    if (expiredBib.length > 0) {
      text += 'SIMPER BIB - SUDAH EXPIRED:\n';
      expiredBib.forEach(s => {
        text += `- ${s.employeeName} (${s.nik}) - Expired: ${s.simperBibExpiredDate}\n`;
      });
      text += '\n';
    }

    if (expiringBib.length > 0) {
      text += 'SIMPER BIB - AKAN EXPIRED:\n';
      expiringBib.forEach(s => {
        text += `- ${s.employeeName} (${s.nik}) - Expired: ${s.simperBibExpiredDate} (${s.bibDaysRemaining} hari lagi)\n`;
      });
      text += '\n';
    }

    if (expiredTia.length > 0) {
      text += 'SIMPER TIA - SUDAH EXPIRED:\n';
      expiredTia.forEach(s => {
        text += `- ${s.employeeName} (${s.nik}) - Expired: ${s.simperTiaExpiredDate}\n`;
      });
      text += '\n';
    }

    if (expiringTia.length > 0) {
      text += 'SIMPER TIA - AKAN EXPIRED:\n';
      expiringTia.forEach(s => {
        text += `- ${s.employeeName} (${s.nik}) - Expired: ${s.simperTiaExpiredDate} (${s.tiaDaysRemaining} hari lagi)\n`;
      });
    }

    return text;
  }
}

export const simperNotificationService = new SimperNotificationService();
