import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
    SidakPencahayaanSession,
    SidakPencahayaanRecord,
    SidakPencahayaanObserver
} from '@shared/schema';

// ============================================
// SIDAK PENCAHAYAAN PDF GENERATOR
// Form: Pencahayaan
// ============================================

interface SidakPencahayaanData {
    session: SidakPencahayaanSession;
    records: SidakPencahayaanRecord[];
    observers: SidakPencahayaanObserver[];
}

export async function generateSidakPencahayaanPdf(data: SidakPencahayaanData): Promise<jsPDF> {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 10;
    let yPosition = margin;

    // ==================== HEADER WITH LOGO ====================
    try {
        const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = '/assets/logo.png';
        });

        pdf.addImage(logoImg, 'PNG', margin, margin, 45, 10);
    } catch (error) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text('PT BORNEO INDOBARA', margin, yPosition + 6);
    }

    // Form code on top-right
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Formulir Survei Pencahayaan', pageWidth - margin, yPosition + 4, { align: 'right' });

    yPosition += 12;

    // Main title with gray background
    const titleYStart = yPosition;
    pdf.setFillColor(220, 220, 220);
    pdf.rect(margin, titleYStart, pageWidth - (margin * 2), 8, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('SURVEI INTENSITAS CAHAYA', pageWidth / 2, titleYStart + 5.5, { align: 'center' });

    yPosition += 10;

    // Subtitle
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Formulir ini digunakan sebagai catatan hasil pengukuran intensitas cahaya di area kerja PT Borneo Indobara', pageWidth / 2, yPosition + 2, { align: 'center' });

    yPosition += 4;

    // ==================== INFO SECTION ====================
    const infoTableData = [
        [
            'Tanggal',
            data.session.tanggal || '',
            'Lokasi',
            data.session.lokasi || ''
        ],
        [
            'Waktu',
            data.session.waktu || '',
            'Shift',
            data.session.shift || ''
        ],
        [
            'Departemen',
            data.session.departemen || '',
            'Total Titik',
            data.session.totalSampel?.toString() || data.records.length.toString()
        ],
        [
            'Penanggung Jawab',
            data.session.penanggungJawab || '',
            '',
            ''
        ]
    ];

    autoTable(pdf, {
        startY: yPosition,
        body: infoTableData,
        theme: 'grid',
        tableWidth: pageWidth - (margin * 2),
        styles: {
            fontSize: 8,
            cellPadding: 1.5,
            lineWidth: 0.2,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
            valign: 'middle',
        },
        columnStyles: {
            0: { cellWidth: 40, fontStyle: 'bold', fillColor: [255, 255, 255], halign: 'left' },
            1: { cellWidth: (pageWidth - (margin * 2)) / 2 - 40, halign: 'left' },
            2: { cellWidth: 40, fontStyle: 'bold', fillColor: [255, 255, 255], halign: 'left' },
            3: { cellWidth: (pageWidth - (margin * 2)) / 2 - 40, halign: 'left' },
        },
        margin: { left: margin, right: margin },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 2;

    // ==================== MAIN TABLE ====================
    const tableHeaders = [[
        'No',
        'Titik Pengambilan',
        'Sumber Penerangan',
        'Jenis Pengukuran',
        'Intensitas (Lux)',
        'Jarak dr Sumber',
        'Kondisi Visual',
        'Keterangan'
    ]];

    // Generate table data
    const tableData = [];

    // Add actual records
    data.records.forEach((record, index) => {
        tableData.push([
            (index + 1).toString(),
            record.titikPengambilan || '',
            record.sumberPenerangan || '',
            record.jenisPengukuran || '',
            record.intensitasLux?.toString() || '',
            record.jarakDariSumber || '',
            record.secaraVisual || '',
            record.keterangan || ''
        ]);
    });

    // Pad with empty rows to ensure minimum 10 rows
    const minRows = 10;
    while (tableData.length < minRows) {
        tableData.push([
            (tableData.length + 1).toString(),
            '', '', '', '', '', '', ''
        ]);
    }

    const availableWidth = pageWidth - (margin * 2);

    autoTable(pdf, {
        startY: yPosition,
        head: tableHeaders,
        body: tableData,
        theme: 'grid',
        tableWidth: availableWidth,
        styles: {
            fontSize: 8,
            cellPadding: 1,
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.15,
            lineColor: [0, 0, 0],
            minCellHeight: 7,
        },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.25,
            fontSize: 8,
            cellPadding: 2,
            minCellHeight: 10,
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 50, halign: 'left' },
            2: { cellWidth: 35, halign: 'left' },
            3: { cellWidth: 35 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
            6: { cellWidth: 30 },
            7: { cellWidth: 'auto', halign: 'left' },
        },
        margin: { left: margin, right: margin },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 3;

    // ==================== OBSERVER SIGNATURES ====================
    // Create rows for observers (max 8 slots like seatbelt)
    const observerTableData = [
        [
            '1.', data.observers[0]?.nama || '', data.observers[0]?.perusahaan || '', '',
            '3.', data.observers[2]?.nama || '', data.observers[2]?.perusahaan || '', ''
        ],
        [
            '2.', data.observers[1]?.nama || '', data.observers[1]?.perusahaan || '', '',
            '4.', data.observers[3]?.nama || '', data.observers[3]?.perusahaan || '', ''
        ]
    ];

    autoTable(pdf, {
        startY: yPosition,
        head: [[
            'No', 'Nama Pemantau', 'Perusahaan', 'Tanda Tangan',
            'No', 'Nama Pemantau', 'Perusahaan', 'Tanda Tangan'
        ]],
        body: observerTableData,
        theme: 'grid',
        tableWidth: pageWidth - (margin * 2),
        styles: {
            fontSize: 7,
            cellPadding: 1,
            halign: 'left',
            valign: 'middle',
            minCellHeight: 12,
            lineWidth: 0.15,
            lineColor: [0, 0, 0],
        },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            fontSize: 7.5,
            cellPadding: 1,
            minCellHeight: 8,
            lineWidth: 0.25,
            lineColor: [0, 0, 0],
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 70, halign: 'left' },
            2: { cellWidth: 35, halign: 'left' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 10, halign: 'center' },
            5: { cellWidth: 70, halign: 'left' },
            6: { cellWidth: 35, halign: 'left' },
            7: { cellWidth: 25, halign: 'center' },
        },
        didDrawCell: (cellData) => {
            if ((cellData.column.index === 3 || cellData.column.index === 7) && cellData.section === 'body') {
                const rowIndex = cellData.row.index;
                const observerIndex = cellData.column.index === 3 ? rowIndex : rowIndex + 2;
                const observer = data.observers[observerIndex];

                if (observer?.tandaTangan) { // Note: Field is 'tandaTangan' in this schema, 'signatureDataUrl' in others
                    try {
                        const format = observer.tandaTangan.includes('image/png') ? 'PNG' : 'JPEG';
                        const cellX = cellData.cell.x;
                        const cellY = cellData.cell.y;
                        const cellWidth = cellData.cell.width;
                        const cellHeight = cellData.cell.height;

                        pdf.addImage(
                            observer.tandaTangan,
                            format,
                            cellX + 1,
                            cellY + 1,
                            cellWidth - 2,
                            cellHeight - 2,
                            undefined,
                            'FAST'
                        );
                    } catch (error) {
                        console.error('Error adding signature image:', error);
                    }
                }
            }
        },
        margin: { left: margin, right: margin },
    });

    // Add page footer
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const today = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    pdf.text(`${today}`, margin, pageHeight - 5);
    pdf.text('Page 1 of 1', pageWidth - margin, pageHeight - 5, { align: 'right' });

    return pdf;
}

// ============================================
// JPG EXPORT
// ============================================
export async function downloadSidakPencahayaanAsJpg(data: SidakPencahayaanData, filename: string): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('JPG download can only be executed in browser environment');
    }

    try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
        const workerSrc = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');

        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.default;

        const pdf = await generateSidakPencahayaanPdf(data);
        const pdfArrayBuffer = pdf.output('arraybuffer');

        const loadingTask = pdfjsLib.getDocument({ data: pdfArrayBuffer });
        const pdfDocument = await loadingTask.promise;

        const page = await pdfDocument.getPage(1);
        const scale = 2.5;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Could not get canvas context');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        await page.render(renderContext).promise;

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to create JPG blob'));
                        return;
                    }

                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    resolve();
                },
                'image/jpeg',
                0.95
            );
        });
    } catch (error) {
        throw new Error(`Failed to generate JPG: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
