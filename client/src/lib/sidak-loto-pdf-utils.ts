import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SidakLotoSession, SidakLotoRecord, SidakLotoObserver } from '@shared/schema';

interface SidakLotoData {
    session: SidakLotoSession;
    records: SidakLotoRecord[];
    observers: SidakLotoObserver[];
}

export async function generateSidakLotoPdf(data: SidakLotoData): Promise<jsPDF> {
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

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('BIB - HSE - PPO - F - xxx - xx', pageWidth - margin, yPosition + 6, { align: 'right' });

    yPosition += 12;

    pdf.setFillColor(220, 220, 220);
    pdf.rect(margin, yPosition, availableWidth, 12, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('OBSERVASI LOTO (Lock Out Tag Out)', pageWidth / 2, yPosition + 5.5, { align: 'center' });
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text('Untuk memantau kepatuhan prosedur LOTO', pageWidth / 2, yPosition + 10, { align: 'center' });

    yPosition += 14;

    const infoData = [
        ['Tanggal', data.session.tanggal || '', 'Lokasi', data.session.lokasi || ''],
        ['Waktu', data.session.waktu || '', 'Total Sampel', (data.session.totalSampel || data.records.length).toString()],
        ['Shift', data.session.shift || '', '', '']
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

    const tableHeaders = [['No', 'Nama - NIK', 'No Lambung', 'Tipe Unit', 'Lock?', 'Tag?', 'Ada Bahaya?', 'Keterangan']];
    const tableData = data.records.map((record, idx) => [
        (idx + 1).toString(),
        record.namaNik || '',
        record.noLambung || '',
        record.tipeUnit || '',
        record.lockApplied ? 'V' : 'X',
        record.tagApplied ? 'V' : 'X',
        record.hazardIdentified ? 'V' : 'X',
        record.keterangan || ''
    ]);

    while (tableData.length < 10) {
        tableData.push([(tableData.length + 1).toString(), '', '', '', '', '', '', '']);
    }

    autoTable(pdf, {
        startY: yPosition,
        head: tableHeaders,
        body: tableData,
        theme: 'grid',
        tableWidth: availableWidth,
        styles: { fontSize: 8, cellPadding: 1, halign: 'center', valign: 'middle', lineWidth: 0.15, minCellHeight: 7 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 65, halign: 'left' },
            2: { cellWidth: 30 },
            3: { cellWidth: 35 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 25 },
            7: { cellWidth: 'auto', halign: 'left' },
        },
        margin: { left: margin, right: margin },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 3;

    const getObs = (i: number) => data.observers[i] || null;
    const obsData = [
        ['1', getObs(0)?.nama || '', '', '3', getObs(2)?.nama || '', ''],
        ['2', getObs(1)?.nama || '', '', '4', getObs(3)?.nama || '', ''],
    ];

    autoTable(pdf, {
        startY: yPosition,
        head: [['No', 'Nama Pemantau', 'Tanda Tangan', 'No', 'Nama Pemantau', 'Tanda Tangan']],
        body: obsData,
        theme: 'grid',
        tableWidth: availableWidth,
        styles: { fontSize: 7, cellPadding: 1, valign: 'middle', minCellHeight: 12, lineWidth: 0.15 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 40 },
            3: { cellWidth: 10, halign: 'center' },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 40 },
        },
        didDrawCell: (cellData) => {
            if ((cellData.column.index === 2 || cellData.column.index === 5) && cellData.section === 'body') {
                const obsIdx = cellData.column.index === 2 ? cellData.row.index : cellData.row.index + 2;
                const obs = getObs(obsIdx);
                if (obs?.tandaTangan) {
                    try {
                        pdf.addImage(obs.tandaTangan, obs.tandaTangan.includes('png') ? 'PNG' : 'JPEG', cellData.cell.x + 1, cellData.cell.y + 1, cellData.cell.width - 2, cellData.cell.height - 2, undefined, 'FAST');
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

export async function downloadSidakLotoAsJpg(data: SidakLotoData, filename: string): Promise<void> {
    if (typeof window === 'undefined') throw new Error('Browser only');
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
    const workerSrc = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.default;

    const pdf = await generateSidakLotoPdf(data);
    const pdfDocument = await pdfjsLib.getDocument({ data: pdf.output('arraybuffer') }).promise;
    const page = await pdfDocument.getPage(1);
    const viewport = page.getViewport({ scale: 2.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;

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
