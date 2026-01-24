import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SidakDigitalSession, SidakDigitalRecord, SidakDigitalObserver } from '@shared/schema';

interface SidakDigitalData {
    session: SidakDigitalSession;
    records: SidakDigitalRecord[];
    observers: SidakDigitalObserver[];
}

export async function generateSidakDigitalPDF(data: SidakDigitalData): Promise<jsPDF> {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 10;
    const availableWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    try {
        const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = '/assets/logo.png';
        });
        pdf.addImage(logoImg, 'PNG', margin, margin, 45, 10);
    } catch {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('PT BORNEO INDOBARA', margin, yPosition + 6);
    }

    // Official document code (top right)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('BIB – HSE – ES – F – 3.02 – 88', pageWidth - margin, yPosition + 3, { align: 'right' });
    pdf.text('April 2025/R0', pageWidth - margin, yPosition + 7, { align: 'right' });

    yPosition += 14;

    // Official title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('INSPEKSI KEBERADAAN DAN FUNGSI PENGAWAS DIGITALISASI', pageWidth / 2, yPosition, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text('Formulir ini digunakan sebagai catatan hasil inspeksi keberadaan dan fungsi pengawas Digitalisasi', pageWidth / 2, yPosition + 5, { align: 'center' });
    pdf.text('yang dilaksanakan di PT Borneo Indobara', pageWidth / 2, yPosition + 9, { align: 'center' });

    yPosition += 16;

    // Info table - 4 column layout matching template
    const infoData = [
        ['Tanggal', data.session.tanggal || '', 'Lokasi', data.session.lokasi || ''],
        ['Shift', data.session.shift || '', 'Waktu sampai', data.session.waktu || ''],
        ['', '', 'Jumlah Sampel', (data.session.totalSampel || data.records.length).toString()]
    ];

    autoTable(pdf, {
        startY: yPosition,
        body: infoData,
        theme: 'plain',
        tableWidth: availableWidth,
        styles: { fontSize: 8, cellPadding: 1.5, lineWidth: 0.1, lineColor: [0, 0, 0] },
        columnStyles: {
            0: { cellWidth: 40, fillColor: [240, 240, 240] },
            1: { cellWidth: availableWidth / 2 - 40 },
            2: { cellWidth: 40, fillColor: [240, 240, 240] },
            3: { cellWidth: availableWidth / 2 - 40 },
        },
        margin: { left: margin, right: margin },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 2;

    // Main data table with 13 columns matching template
    // Columns: No, Nama, NIK, Perusahaan, Q1, Q2, Q3, Q4, Q5, Q6, Q7, Keterangan
    const tableHeaders = [['No', 'Nama', 'NIK', 'Perusahaan', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Ket']];
    const tableData = data.records.map((record, idx) => [
        (idx + 1).toString(),
        record.nama || '',
        record.nik || '',
        record.perusahaan || '',
        // Use V/X for checkmark columns (matching template style)
        record.q1_lokasiKerja ? 'V' : 'X',
        record.q2_sapHazard ? 'V' : 'X',
        record.q3_sapInspeksi ? 'V' : 'X',
        record.q4_sapObservasi ? 'V' : 'X',
        record.q5_validasiFamous ? 'V' : 'X',
        record.q6_identifikasiBahaya ? 'V' : 'X',
        record.q7_prosedurKeselamatan ? 'V' : 'X',
        record.keterangan || ''
    ]);

    // Ensure minimum 10 rows
    while (tableData.length < 10) {
        tableData.push([(tableData.length + 1).toString(), '', '', '', '', '', '', '', '', '', '', '']);
    }

    autoTable(pdf, {
        startY: yPosition,
        head: tableHeaders,
        body: tableData,
        theme: 'grid',
        tableWidth: availableWidth,
        styles: { fontSize: 7, cellPadding: 1, halign: 'center', valign: 'middle', lineWidth: 0.15, minCellHeight: 6 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 35, halign: 'left' },
            2: { cellWidth: 20 },
            3: { cellWidth: 30, halign: 'left' },
            4: { cellWidth: 10 },
            5: { cellWidth: 10 },
            6: { cellWidth: 10 },
            7: { cellWidth: 10 },
            8: { cellWidth: 10 },
            9: { cellWidth: 10 },
            10: { cellWidth: 10 },
            11: { cellWidth: 'auto', halign: 'left' },
        },
        margin: { left: margin, right: margin },
    });

    // Add Legend for Questions
    const finalY = (pdf as any).lastAutoTable.finalY + 2;
    pdf.setFontSize(7);
    pdf.text('Keterangan Pertanyaan:', margin, finalY);
    pdf.text('Q1: Apakah pengawas berada di lokasi kerja sesuai tugasnya dan aktif mengawasi?', margin, finalY + 4);
    pdf.text('Q2: Apakah pengawas telah mengerjakan SAP pelaporan hazard?', margin, finalY + 8);
    pdf.text('Q3: Apakah pengawas telah mengerjakan SAP pelaporan inspeksi?', margin, finalY + 12);
    pdf.text('Q4: Apakah pengawas telah mengerjakan SAP pelaporan observasi?', margin, finalY + 16);
    pdf.text('Q5: Apakah pengawas telah melakukan validasi pada semua temuan yang ada pada Famous?', margin + 100, finalY + 4);
    pdf.text('Q6: Apakah pengawas mampu mengidentifikasi potensi bahaya dan segera mengambil tindakan korektif?', margin + 100, finalY + 8);
    pdf.text('Q7: Apakah pengawas memastikan pekerja mengikuti prosedur keselamatan dan aturan kerja?', margin + 100, finalY + 12);

    yPosition = finalY + 20;

    // Observer sign-off section - 2 rows x 4 columns (max 8 observers)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Inspektur/Pemantau:', margin, yPosition);
    yPosition += 4;

    const getObs = (i: number) => data.observers[i] || null;
    const obsData = [
        [
            '1', getObs(0)?.nama || '', getObs(0)?.perusahaan || '', '',
            '2', getObs(1)?.nama || '', getObs(1)?.perusahaan || '', '',
            '3', getObs(2)?.nama || '', getObs(2)?.perusahaan || '', '',
            '4', getObs(3)?.nama || '', getObs(3)?.perusahaan || '', ''
        ],
        [
            '5', getObs(4)?.nama || '', getObs(4)?.perusahaan || '', '',
            '6', getObs(5)?.nama || '', getObs(5)?.perusahaan || '', '',
            '7', getObs(6)?.nama || '', getObs(6)?.perusahaan || '', '',
            '8', getObs(7)?.nama || '', getObs(7)?.perusahaan || '', ''
        ],
    ];

    autoTable(pdf, {
        startY: yPosition,
        head: [[
            'No', 'Nama Pemantau', 'Perusahaan', 'Tanda Tangan',
            'No', 'Nama Pemantau', 'Perusahaan', 'Tanda Tangan',
            'No', 'Nama Pemantau', 'Perusahaan', 'Tanda Tangan',
            'No', 'Nama Pemantau', 'Perusahaan', 'Tanda Tangan'
        ]],
        body: obsData,
        theme: 'grid',
        tableWidth: availableWidth,
        styles: { fontSize: 6, cellPadding: 1, valign: 'middle', minCellHeight: 12, lineWidth: 0.15 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            // Group 1
            0: { cellWidth: 6, halign: 'center' },
            1: { cellWidth: 20 },
            2: { cellWidth: 15 },
            3: { cellWidth: 18 },
            // Group 2
            4: { cellWidth: 6, halign: 'center' },
            5: { cellWidth: 20 },
            6: { cellWidth: 15 },
            7: { cellWidth: 18 },
            // Group 3
            8: { cellWidth: 6, halign: 'center' },
            9: { cellWidth: 20 },
            10: { cellWidth: 15 },
            11: { cellWidth: 18 },
            // Group 4
            12: { cellWidth: 6, halign: 'center' },
            13: { cellWidth: 20 },
            14: { cellWidth: 15 },
            15: { cellWidth: 18 },
        },
        didDrawCell: (cellData) => {
            // Signature columns: 3, 7, 11, 15
            if ([3, 7, 11, 15].includes(cellData.column.index) && cellData.section === 'body') {
                const obsIdx = cellData.row.index * 4 + Math.floor(cellData.column.index / 4);
                const obs = getObs(obsIdx);
                if (obs?.tandaTangan) {
                    try {
                        pdf.addImage(obs.tandaTangan, obs.tandaTangan.includes('png') ? 'PNG' : 'JPEG',
                            cellData.cell.x + 1, cellData.cell.y + 1,
                            cellData.cell.width - 2, cellData.cell.height - 2, undefined, 'FAST');
                    } catch { }
                }
            }
        },
        margin: { left: margin, right: margin },
    });

    pdf.setFontSize(8);
    pdf.text('Page 1 of 1', pageWidth - margin, pageHeight - 5, { align: 'right' });

    return pdf;
}

export async function downloadSidakDigitalAsJpg(data: SidakDigitalData, filename: string): Promise<void> {
    if (typeof window === 'undefined') throw new Error('Browser only');
    const pdfjsLib = await import('pdfjs-dist');
    const workerSrc = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.default;

    const pdf = await generateSidakDigitalPDF(data);
    const pdfDocument = await pdfjsLib.getDocument({ data: pdf.output('arraybuffer') }).promise;
    const page = await pdfDocument.getPage(1);
    const viewport = page.getViewport({ scale: 2.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport } as any).promise;

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Failed'));
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
            resolve();
        }, 'image/jpeg', 0.95);
    });
}
