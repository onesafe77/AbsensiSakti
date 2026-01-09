import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
    SidakJarakSession,
    SidakJarakRecord,
    SidakJarakObserver
} from '@shared/schema';

// ============================================
// SIDAK JARAK PDF GENERATOR
// Form: Jarak Aman Unit
// ============================================

interface SidakJarakData {
    session: SidakJarakSession;
    records: SidakJarakRecord[];
    observers: SidakJarakObserver[];
}

export async function generateSidakJarakPdf(data: SidakJarakData): Promise<jsPDF> {
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
    pdf.text('FORM OBSERVASI JARAK IRING UNIT', pageWidth / 2, titleYStart + 5.5, { align: 'center' });

    // Subtitle
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text('Untuk memastikan jarak aman antar unit', pageWidth / 2, titleYStart + 10, { align: 'center' });

    yPosition += 14;

    // ==================== INFO SECTION ====================
    // Symmetrical 50/50 split
    const infoTableData = [
        [
            'Tanggal',
            data.session.tanggal || '',
            'Shift',
            data.session.shift || ''
        ],
        [
            'Lokasi',
            data.session.lokasi || '',
            'Total Sampel',
            (data.session.totalSampel || 0).toString()
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
            { content: 'No', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'No Unit', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'Tipe Unit', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'Lokasi Muatan', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'Lokasi Kosongan', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'Unit Depan', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'Jarak (m)', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } },
            { content: 'Keterangan', styles: { halign: 'center' as 'center', valign: 'middle' as 'middle' } }
        ]
    ];

    const tableData = [];
    data.records.forEach((record, index) => {
        tableData.push([
            (index + 1).toString(),
            record.noKendaraan || '',
            record.tipeUnit || '',
            record.lokasiMuatan || '',
            record.lokasiKosongan || '',
            record.nomorLambungUnit || '',
            record.jarakAktualKedua || '',
            record.keterangan || ''
        ]);
    });

    const minRows = 10;
    while (tableData.length < minRows) {
        tableData.push([
            (tableData.length + 1).toString(),
            '', '', '', '', '', '', ''
        ]);
    }

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
            1: { cellWidth: 30 },
            2: { cellWidth: 30 },
            3: { cellWidth: 40 },
            4: { cellWidth: 40 },
            5: { cellWidth: 30 },
            6: { cellWidth: 25, halign: 'center' as 'center' },
            7: { cellWidth: 'auto' },
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

    // Helper to get observer chunks
    const getObserver = (idx: number) => data.observers[idx] || null;

    // We display 4 observers per block/row if possible, but let's stick to the 2x2 grid approach from reference if needed
    // Assuming matching other forms layout:
    const observerTableData = [
        [
            { content: '1', styles: { halign: 'center' as 'center' } },
            getObserver(0)?.nama || '',
            '', // Tanda Tangan placeholder
            { content: '2', styles: { halign: 'center' as 'center' } },
            getObserver(1)?.nama || '',
            ''
        ],
        [
            { content: '3', styles: { halign: 'center' as 'center' } },
            getObserver(2)?.nama || '',
            '',
            { content: '4', styles: { halign: 'center' as 'center' } },
            getObserver(3)?.nama || '',
            ''
        ]
    ];

    autoTable(pdf, {
        startY: yPosition,
        head: [[
            { content: 'NO', styles: { halign: 'center' as 'center' } },
            'NAMA', 'TANDA TANGAN',
            { content: 'NO', styles: { halign: 'center' as 'center' } },
            'NAMA', 'TANDA TANGAN'
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
            0: { cellWidth: 10 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 40 },
            3: { cellWidth: 10 },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 40 },
        },
        didDrawCell: (cellData) => {
            if ((cellData.column.index === 2 || cellData.column.index === 5) && cellData.section === 'body') {
                const rowIndex = cellData.row.index;
                // row 0 -> obs 0 (col 2) and obs 1 (col 5)
                // row 1 -> obs 2 (col 2) and obs 3 (col 5)
                let observerIndex = -1;
                if (rowIndex === 0) observerIndex = cellData.column.index === 2 ? 0 : 1;
                if (rowIndex === 1) observerIndex = cellData.column.index === 2 ? 2 : 3;

                const observer = getObserver(observerIndex);

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
export async function downloadSidakJarakAsJpg(data: SidakJarakData, filename: string): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('JPG download can only be executed in browser environment');
    }

    try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
        const workerSrc = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');

        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.default;

        const pdf = await generateSidakJarakPdf(data);
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
