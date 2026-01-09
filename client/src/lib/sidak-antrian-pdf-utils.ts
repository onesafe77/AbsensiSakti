import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
    SidakAntrianSession,
    SidakAntrianRecord,
    SidakAntrianObserver
} from '@shared/schema';

// ============================================
// SIDAK ANTRIAN PDF GENERATOR
// Form: Antrian Unit
// ============================================

interface SidakAntrianData {
    session: SidakAntrianSession;
    records: SidakAntrianRecord[];
    observers: SidakAntrianObserver[];
}

export async function generateSidakAntrianPdf(data: SidakAntrianData): Promise<jsPDF> {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width; // 297mm
    const pageHeight = pdf.internal.pageSize.height; // 210mm
    const margin = 10;
    const availableWidth = pageWidth - (margin * 2); // 277mm
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

    // Document Code (Top Right)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('BIB - HSE - PPO - F - xxx - xx', pageWidth - margin, yPosition + 6, { align: 'right' });

    yPosition += 12;

    // ==================== TITLE SECTION ====================
    const titleYStart = yPosition;
    pdf.setFillColor(220, 220, 220); // Light gray background
    pdf.rect(margin, titleYStart, availableWidth, 12, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('OBSERVASI ANTRIAN', pageWidth / 2, titleYStart + 5.5, { align: 'center' });

    // Subtitle
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text('Untuk mengetahui kepatuhan driver saat kondisi antrian', pageWidth / 2, titleYStart + 10, { align: 'center' });

    yPosition += 14;

    // ==================== INFO SECTION ====================
    // Symmetrical 50/50 split
    const infoTableData = [
        [
            'Tanggal Pelaksanaan',
            data.session.tanggalPelaksanaan || '',
            'Perusahaan',
            data.session.perusahaan || ''
        ],
        [
            'Jam Pelaksanaan',
            data.session.jamPelaksanaan || '',
            'Departemen',
            data.session.departemen || ''
        ],
        [
            'Shift',
            data.session.shift || '',
            'Lokasi',
            data.session.lokasi || ''
        ]
    ];

    autoTable(pdf, {
        startY: yPosition,
        body: infoTableData,
        theme: 'plain',
        tableWidth: availableWidth,
        styles: {
            fontSize: 8,
            cellPadding: 1.5,
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
            valign: 'middle',
        },
        columnStyles: {
            0: { cellWidth: 40, fillColor: [240, 240, 240] },
            1: { cellWidth: availableWidth / 2 - 40 },
            2: { cellWidth: 40, fillColor: [240, 240, 240] },
            3: { cellWidth: availableWidth / 2 - 40 },
        },
        margin: { left: margin, right: margin },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 2;

    // ==================== MAIN TABLE ====================
    const tableHeaders = [
        [
            { content: 'NO', rowspan: 2, styles: { valign: 'middle' as 'middle', halign: 'center' as 'center' } },
            { content: 'Nama-NIK\n(contoh : Gede - C-024955)', rowspan: 2, styles: { valign: 'middle' as 'middle', halign: 'center' as 'center' } },
            { content: 'No lambung\n(contoh : RBT 4023)', rowspan: 2, styles: { valign: 'middle' as 'middle', halign: 'center' as 'center' } },
            { content: 'Apakah driver sudah\nmengaktifkan\nhandbrake?', colspan: 2, styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'Apakah jarak\nantar unit\naman?', colspan: 2, styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'Keterangan', rowspan: 2, styles: { valign: 'middle' as 'middle', halign: 'center' as 'center' } }
        ],
        [
            { content: 'Ya', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'Tidak', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'Ya', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'Tidak', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } }
        ]
    ];

    const tableData = [];
    data.records.forEach((record, index) => {
        tableData.push([
            (index + 1).toString(),
            record.namaNik || '',
            record.noLambung || '',
            record.handbrakeAktif ? 'V' : '',    // Ya
            !record.handbrakeAktif ? 'V' : '',   // Tidak
            record.jarakUnitAman ? 'V' : '',     // Ya
            !record.jarakUnitAman ? 'V' : '',    // Tidak
            record.keterangan || ''
        ]);
    });

    const minRows = 15;
    while (tableData.length < minRows) {
        tableData.push([
            (tableData.length + 1).toString(),
            '', '', '', '', '', '', ''
        ]);
    }

    // MAIN TABLE: Fixed logic (User preferred this)
    autoTable(pdf, {
        startY: yPosition,
        head: tableHeaders,
        body: tableData,
        theme: 'grid',
        tableWidth: availableWidth,
        styles: {
            fontSize: 8,
            cellPadding: 1,
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            minCellHeight: 6,
            textColor: [0, 0, 0]
        },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            fontSize: 8,
            cellPadding: 1,
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' as 'center' },
            1: { cellWidth: 60 },
            2: { cellWidth: 40, halign: 'center' as 'center' },
            3: { cellWidth: 15, halign: 'center' as 'center' },
            4: { cellWidth: 15, halign: 'center' as 'center' },
            5: { cellWidth: 15, halign: 'center' as 'center' },
            6: { cellWidth: 15, halign: 'center' as 'center' },
            7: { cellWidth: 107 }, // Fixed width specifically for Main Table
        },
        margin: { left: margin, right: margin },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 3;

    // ==================== OBSERVER SECTION ====================
    pdf.setFillColor(220, 220, 220);
    pdf.rect(margin, yPosition, availableWidth, 6, 'F');
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.rect(margin, yPosition, availableWidth, 6, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('OBSERVER', pageWidth / 2, yPosition + 4, { align: 'center' });

    yPosition += 6;

    const observerTableData = [
        [
            { content: '1', styles: { halign: 'center' as 'center' } },
            data.observers[0]?.nama || '',
            data.observers[0]?.jabatan || '',
            '',
            { content: '3', styles: { halign: 'center' as 'center' } },
            data.observers[2]?.nama || '',
            data.observers[2]?.jabatan || '',
            ''
        ],
        [
            { content: '2', styles: { halign: 'center' as 'center' } },
            data.observers[1]?.nama || '',
            data.observers[1]?.jabatan || '',
            '',
            { content: '4', styles: { halign: 'center' as 'center' } },
            data.observers[3]?.nama || '',
            data.observers[3]?.jabatan || '',
            ''
        ]
    ];

    autoTable(pdf, {
        startY: yPosition,
        head: [[
            { content: 'NO', styles: { halign: 'center' as 'center' } },
            'NAMA', 'JABATAN', 'TANDA TANGAN',
            { content: 'NO', styles: { halign: 'center' as 'center' } },
            'NAMA', 'JABATAN', 'TANDA TANGAN'
        ]],
        body: observerTableData,
        theme: 'grid',
        tableWidth: availableWidth,
        showHead: 'firstPage',
        styles: {
            fontSize: 8,
            cellPadding: 1,
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
            minCellHeight: 12,
        },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
        },
        columnStyles: {
            // OBSERVER: Force AUTO only for NAMA to handle filling the remaining space
            // Block 1
            0: { cellWidth: 10 },
            1: { cellWidth: 'auto' }, // NAMA: Auto expand
            2: { cellWidth: 40 },
            3: { cellWidth: 30 },
            // Block 2
            4: { cellWidth: 10 },
            5: { cellWidth: 'auto' }, // NAMA: Auto expand
            6: { cellWidth: 40 },
            7: { cellWidth: 30 },
        },
        didDrawCell: (cellData) => {
            if ((cellData.column.index === 3 || cellData.column.index === 7) && cellData.section === 'body') {
                const rowIndex = cellData.row.index;
                const observerIndex = cellData.column.index === 3 ? rowIndex : rowIndex + 2;
                const observer = data.observers[observerIndex];

                if (observer?.tandaTangan) {
                    try {
                        const format = observer.tandaTangan.includes('image/png') ? 'PNG' : 'JPEG';
                        const padding = 2;
                        pdf.addImage(
                            observer.tandaTangan,
                            format,
                            cellData.cell.x + padding,
                            cellData.cell.y + padding,
                            cellData.cell.width - (padding * 2),
                            cellData.cell.height - (padding * 2),
                            undefined,
                            'FAST'
                        );
                    } catch (error) {
                        // ignore
                    }
                }
            }
        },
        margin: { left: margin, right: margin },
    });

    // Add page footer
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Januari 2020/R0', margin, pageHeight - 5);
    pdf.text('Page 1 of 1', pageWidth - margin, pageHeight - 5, { align: 'right' });

    return pdf;
}

// ============================================
// JPG EXPORT
// ============================================
export async function downloadSidakAntrianAsJpg(data: SidakAntrianData, filename: string): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('JPG download can only be executed in browser environment');
    }

    try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
        const workerSrc = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');

        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.default;

        const pdf = await generateSidakAntrianPdf(data);
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
