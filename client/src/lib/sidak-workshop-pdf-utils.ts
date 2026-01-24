import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================
// SIDAK WORKSHOP EQUIPMENT INSPECTION PDF GENERATOR
// Document Code: BIB - HSE - ES - F - 3.02 - 87
// Revision: April 2025/R0
// Portrait format, 3 pages
// ============================================

export interface WorkshopPDFData {
    session: {
        tanggal: string;
        namaWorkshop: string;
        lokasi: string;
        penanggungJawabArea: string;
    };
    equipment: Array<{
        equipmentType: string;
        noRegisterPeralatan: string;
        inspectionResults: Record<string, string>;
        tindakLanjutPerbaikan: string;
        dueDate: string;
    }>;
    inspectors: Array<{
        nama: string;
        perusahaan: string;
        tandaTangan: string;
    }>;
}

// Equipment inspection items by category (matching the PDF template)
const EQUIPMENT_ITEMS: Record<string, { id: string; description: string }[]> = {
    'APAR': [
        { id: '1.1', description: 'Posisi APAR terpasang dengan baik' },
        { id: '1.2', description: 'Tinggi APAR maks 125cm dari lantai' },
        { id: '1.3', description: 'Jarak antar APAR maks 15m' },
        { id: '1.4', description: 'APAR tidak terhalang benda lain' },
        { id: '1.5', description: 'APAR terlihat jelas dan mudah dijangkau' },
        { id: '1.6', description: 'Segel pengaman (pin) utuh' },
        { id: '1.7', description: 'Tekanan gauge dalam area hijau' },
        { id: '1.8', description: 'Kondisi selang baik (tidak retak/bocor)' },
        { id: '1.9', description: 'Nozzle/corong bersih dan tidak tersumbat' },
        { id: '1.10', description: 'Label inspeksi bulanan terisi' },
        { id: '1.11', description: 'Tanggal kadaluarsa masih berlaku' }
    ],
    'COMPRESSOR': [
        { id: '2.1', description: 'Kondisi fisik kompresor baik' },
        { id: '2.2', description: 'Tidak ada kebocoran oli/udara' },
        { id: '2.3', description: 'Filter udara bersih' },
        { id: '2.4', description: 'Level oli sesuai batas' },
        { id: '2.5', description: 'Belt/V-belt dalam kondisi baik' },
        { id: '2.6', description: 'Pressure gauge berfungsi normal' },
        { id: '2.7', description: 'Safety valve berfungsi' },
        { id: '2.8', description: 'Drain valve tidak tersumbat' },
        { id: '2.9', description: 'Motor penggerak berfungsi normal' },
        { id: '2.10', description: 'Kabel listrik dalam kondisi baik' },
        { id: '2.11', description: 'Grounding/pentanahan terpasang' },
        { id: '2.12', description: 'Area sekitar bersih dan bebas hambatan' },
        { id: '2.13', description: 'Regulator tekanan berfungsi' },
        { id: '2.14', description: 'Selang udara tidak retak/bocor' },
        { id: '2.15', description: 'Label inspeksi terisi' }
    ],
    'IMPACT': [
        { id: '3.1.1', description: 'Kondisi fisik impact wrench baik' },
        { id: '3.1.2', description: 'Trigger/pemicu berfungsi normal' },
        { id: '3.1.3', description: 'Socket terpasang dengan benar' },
        { id: '3.1.4', description: 'Selang udara tidak bocor' },
        { id: '3.1.5', description: 'Quick coupler berfungsi baik' },
        { id: '3.1.6', description: 'Tidak ada getaran abnormal' },
        { id: '3.1.7', description: 'Torque sesuai spesifikasi' }
    ],
    'HYDRAULIC JACK': [
        { id: '4.1', description: 'Kondisi fisik hydraulic jack baik' },
        { id: '4.2', description: 'Tidak ada kebocoran oli hidrolik' },
        { id: '4.3', description: 'Pompa berfungsi normal' },
        { id: '4.4', description: 'Release valve berfungsi' },
        { id: '4.5', description: 'Kapasitas angkat tertera jelas' },
        { id: '4.6', description: 'Saddle/kepala jack tidak retak' },
        { id: '4.7', description: 'Base plate stabil' },
        { id: '4.8', description: 'Handle/tuas dalam kondisi baik' }
    ],
    'GERINDA': [
        { id: '5.1', description: 'Kondisi fisik gerinda baik' },
        { id: '5.2', description: 'Guard/pelindung terpasang' },
        { id: '5.3', description: 'Batu gerinda tidak retak/aus' },
        { id: '5.4', description: 'Switch on/off berfungsi' },
        { id: '5.5', description: 'Kabel listrik tidak terkelupas' },
        { id: '5.6', description: 'Plug/colokan dalam kondisi baik' },
        { id: '5.7', description: 'Handle samping terpasang' },
        { id: '5.8', description: 'Tidak ada getaran abnormal' },
        { id: '5.9', description: 'Flange dan nut terpasang erat' }
    ],
    'HAMMER': [
        { id: '6.1', description: 'Kondisi fisik hammer baik' },
        { id: '6.2', description: 'Kepala hammer tidak retak/aus' },
        { id: '6.3', description: 'Gagang tidak retak/patah' },
        { id: '6.4', description: 'Kepala terpasang erat pada gagang' },
        { id: '6.5', description: 'Berat sesuai untuk pekerjaan' },
        { id: '6.6', description: 'Tidak ada jamur/mushrooming' },
        { id: '6.7', description: 'Gagang tidak licin' }
    ],
    'ENGINE WELDING': [
        { id: '7.1', description: 'Kondisi fisik mesin las baik' },
        { id: '7.2', description: 'Kabel las tidak terkelupas' },
        { id: '7.3', description: 'Electrode holder berfungsi' },
        { id: '7.4', description: 'Ground clamp dalam kondisi baik' },
        { id: '7.5', description: 'Pengatur ampere berfungsi' },
        { id: '7.6', description: 'Kipas pendingin berfungsi' },
        { id: '7.7', description: 'Level oli engine sesuai' },
        { id: '7.8', description: 'Tidak ada kebocoran bahan bakar' }
    ],
    'CUTTING TORCH': [
        { id: '8.1', description: 'Kondisi fisik cutting torch baik' },
        { id: '8.2', description: 'Tip/nozzle tidak tersumbat' },
        { id: '8.3', description: 'Valve oxygen berfungsi' },
        { id: '8.4', description: 'Valve acetylene berfungsi' },
        { id: '8.5', description: 'Selang tidak bocor/retak' },
        { id: '8.6', description: 'Flash back arrestor terpasang' },
        { id: '8.7', description: 'Regulator oxygen berfungsi' },
        { id: '8.8', description: 'Regulator acetylene berfungsi' },
        { id: '8.9', description: 'Tabung tersimpan dengan benar' },
        { id: '8.10', description: 'Jarak tabung O2 dan C2H2 > 5m' },
        { id: '8.11', description: 'Tabung dalam kondisi baik' },
        { id: '8.12', description: 'Label dan marking tabung jelas' }
    ],
    'KERANGKENG': [
        { id: '9.1', description: 'Kondisi fisik kerangkeng baik' },
        { id: '9.2', description: 'Struktur tidak bengkok/retak' },
        { id: '9.3', description: 'Las-lasan tidak retak' },
        { id: '9.4', description: 'Pin pengunci tersedia' },
        { id: '9.5', description: 'Ukuran sesuai untuk ban' },
        { id: '9.6', description: 'Tidak ada karat berlebihan' },
        { id: '9.7', description: 'Area penempatan stabil' },
        { id: '9.8', description: 'Label kapasitas tertera' }
    ],
    'GREASE GUN': [
        { id: '10.1', description: 'Kondisi fisik grease gun baik' },
        { id: '10.2', description: 'Handle/tuas tidak rusak' },
        { id: '10.3', description: 'Plunger berfungsi normal' },
        { id: '10.4', description: 'Selang tidak bocor/retak' },
        { id: '10.5', description: 'Coupler/fitting tidak rusak' },
        { id: '10.6', description: 'Cartridge terisi grease' },
        { id: '10.7', description: 'Tidak ada kebocoran grease' },
        { id: '10.8', description: 'Pressure relief valve berfungsi' },
        { id: '10.9', description: 'Bersih dari kontaminasi' }
    ]
};

const EQUIPMENT_ORDER = [
    'APAR',
    'COMPRESSOR',
    'IMPACT',
    'HYDRAULIC JACK',
    'GERINDA',
    'HAMMER',
    'ENGINE WELDING',
    'CUTTING TORCH',
    'KERANGKENG',
    'GREASE GUN'
];

export async function generateSidakWorkshopPDF(data: WorkshopPDFData): Promise<jsPDF> {
    // PORTRAIT format A4 (210mm x 297mm)
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;  // 210mm
    const pageHeight = pdf.internal.pageSize.height; // 297mm
    const margin = 10;
    const availableWidth = pageWidth - (margin * 2);

    // Pre-load logo image once for reuse
    let logoImg: HTMLImageElement | null = null;
    try {
        logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load logo'));
            img.src = '/assets/logo.png';
        });
    } catch (error) {
        console.error('Logo loading failed, will use text fallback:', error);
    }

    // Helper function to draw header on each page
    const drawHeader = (yStart: number): number => {
        let yPosition = yStart;

        // Logo (left)
        if (logoImg) {
            pdf.addImage(logoImg, 'PNG', margin, yPosition, 40, 9);
        } else {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 139);
            pdf.text('PT BORNEO INDOBARA', margin, yPosition + 5);
        }

        // Document code (right)
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.text('BIB - HSE - ES - F - 3.02 - 87', pageWidth - margin, yPosition + 5, { align: 'right' });

        yPosition += 12;

        // Main title with gray background
        pdf.setFillColor(220, 220, 220);
        pdf.rect(margin, yPosition, availableWidth, 10, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text('CHECKLIST INSPEKSI PERALATAN WORKSHOP', pageWidth / 2, yPosition + 4, { align: 'center' });
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7);
        pdf.text('Formulir ini digunakan untuk pencatatan hasil inspeksi workshop', pageWidth / 2, yPosition + 8, { align: 'center' });

        yPosition += 12;

        // Header info table
        const infoData = [
            ['Tanggal', data.session.tanggal || '', 'Nama Workshop', data.session.namaWorkshop || ''],
            ['Lokasi', data.session.lokasi || '', 'Penanggung jawab area', data.session.penanggungJawabArea || '']
        ];

        autoTable(pdf, {
            startY: yPosition,
            body: infoData,
            theme: 'grid',
            tableWidth: availableWidth,
            styles: {
                fontSize: 7,
                cellPadding: 1.5,
                lineWidth: 0.15,
                lineColor: [0, 0, 0],
                textColor: [0, 0, 0],
                valign: 'middle',
            },
            columnStyles: {
                0: { cellWidth: 30, fillColor: [240, 240, 240], fontStyle: 'bold' },
                1: { cellWidth: availableWidth / 2 - 30 },
                2: { cellWidth: 40, fillColor: [240, 240, 240], fontStyle: 'bold' },
                3: { cellWidth: availableWidth / 2 - 40 },
            },
            margin: { left: margin, right: margin },
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 2;

        // Instruction note
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(6.5);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Tuliskan S (sesuai) atau TS (Tidak Sesuai) pada kolom Kesesuaian sesuai hasil pengamatan. Pemeriksaan harus dilakukan permasing-masing peralatan', margin, yPosition + 2);

        return yPosition + 5;
    };

    // Build the table data for all equipment
    const buildTableData = () => {
        const tableRows: any[] = [];

        EQUIPMENT_ORDER.forEach((equipmentType, equipmentIndex) => {
            const items = EQUIPMENT_ITEMS[equipmentType];
            const equipmentData = data.equipment.find(e => e.equipmentType === equipmentType);
            const registerNo = equipmentData?.noRegisterPeralatan || '';

            // Equipment header row (gray background)
            const headerNum = equipmentIndex + 1;
            tableRows.push({
                isHeader: true,
                data: [
                    { content: `${headerNum}`, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } },
                    { content: `${equipmentType} - No Register Peralatan : ${registerNo}`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [200, 200, 200], halign: 'left' } }
                ]
            });

            // Equipment inspection items
            items.forEach((item, itemIndex) => {
                const result = equipmentData?.inspectionResults?.[item.id] || '';
                const tindakLanjut = itemIndex === 0 ? (equipmentData?.tindakLanjutPerbaikan || '') : '';
                const dueDate = itemIndex === 0 ? (equipmentData?.dueDate || '') : '';

                tableRows.push({
                    isHeader: false,
                    data: [item.id, item.description, result, tindakLanjut, dueDate],
                    equipmentRowSpan: itemIndex === 0 ? items.length : 0,
                    equipmentTindakLanjut: equipmentData?.tindakLanjutPerbaikan || '',
                    equipmentDueDate: equipmentData?.dueDate || ''
                });
            });
        });

        return tableRows;
    };

    // Helper function to draw inspector signatures section
    const drawInspectorSignatures = (yStart: number): number => {
        let yPosition = yStart;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text('Inspektur:', margin, yPosition);
        yPosition += 3;

        // Build inspector data for 2 columns with signature cells
        const inspector1 = data.inspectors[0] || { nama: '', perusahaan: '', tandaTangan: '' };
        const inspector2 = data.inspectors[1] || { nama: '', perusahaan: '', tandaTangan: '' };

        const inspectorData = [
            [
                inspector1.nama || '',
                inspector1.perusahaan || '',
                '',
                inspector2.nama || '',
                inspector2.perusahaan || '',
                ''
            ]
        ];

        autoTable(pdf, {
            startY: yPosition,
            head: [[
                'Nama Inspektor', 'Perusahaan', 'Tanda tangan',
                'Nama Inspektor', 'Perusahaan', 'Tanda tangan'
            ]],
            body: inspectorData,
            theme: 'grid',
            tableWidth: availableWidth,
            styles: {
                fontSize: 7,
                cellPadding: 1.5,
                valign: 'middle',
                minCellHeight: 15,
                lineWidth: 0.15,
                lineColor: [0, 0, 0],
            },
            headStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
                minCellHeight: 6,
            },
            columnStyles: {
                0: { cellWidth: availableWidth / 6, halign: 'center' },
                1: { cellWidth: availableWidth / 6, halign: 'center' },
                2: { cellWidth: availableWidth / 6, halign: 'center' },
                3: { cellWidth: availableWidth / 6, halign: 'center' },
                4: { cellWidth: availableWidth / 6, halign: 'center' },
                5: { cellWidth: availableWidth / 6, halign: 'center' },
            },
            didDrawCell: (cellData) => {
                // Signature columns: 2 and 5
                if ((cellData.column.index === 2 || cellData.column.index === 5) && cellData.section === 'body') {
                    const inspectorIndex = cellData.column.index === 2 ? 0 : 1;
                    const inspector = data.inspectors[inspectorIndex];
                    if (inspector?.tandaTangan) {
                        try {
                            const format = inspector.tandaTangan.includes('image/png') ? 'PNG' : 'JPEG';
                            pdf.addImage(
                                inspector.tandaTangan,
                                format,
                                cellData.cell.x + 2,
                                cellData.cell.y + 2,
                                cellData.cell.width - 4,
                                cellData.cell.height - 4,
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

        return (pdf as any).lastAutoTable.finalY;
    };

    // Build all table data
    const allTableData = buildTableData();

    // Prepare flat rows for autoTable
    const flattenedRows: any[] = [];
    allTableData.forEach(row => {
        if (row.isHeader) {
            flattenedRows.push(row.data);
        } else {
            flattenedRows.push(row.data);
        }
    });

    // Draw header on first page
    let yPosition = drawHeader(margin);

    // Column headers for the main table
    const tableHeaders = [['No', 'Deskripsi Pemeriksaan', 'Kesesuaian', 'Tindak Lanjut Perbaikan', 'Due Date']];

    // Use autoTable with page break handling
    autoTable(pdf, {
        startY: yPosition,
        head: tableHeaders,
        body: flattenedRows,
        theme: 'grid',
        tableWidth: availableWidth,
        styles: {
            fontSize: 6.5,
            cellPadding: 1,
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            minCellHeight: 5,
        },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            minCellHeight: 6,
        },
        columnStyles: {
            0: { cellWidth: 12 },  // No
            1: { cellWidth: 80, halign: 'left' },  // Deskripsi Pemeriksaan
            2: { cellWidth: 20 },  // Kesesuaian
            3: { cellWidth: 50, halign: 'left' },  // Tindak Lanjut Perbaikan
            4: { cellWidth: 28 },  // Due Date
        },
        margin: { left: margin, right: margin, bottom: 15 },
        showHead: 'everyPage',
        didDrawPage: (hookData) => {
            // Draw header on new pages
            if (hookData.pageNumber > 1) {
                drawHeader(margin);
            }
        },
        willDrawCell: (hookData) => {
            // Check if this is a header row (equipment header)
            const rowData = hookData.row.raw;
            if (Array.isArray(rowData) && rowData.length > 0) {
                const firstCell = rowData[0];
                if (typeof firstCell === 'object' && firstCell !== null && 'styles' in firstCell) {
                    // This is a header row with styled cells
                    hookData.cell.styles.fillColor = [200, 200, 200];
                    hookData.cell.styles.fontStyle = 'bold';
                }
            }
        },
    });

    // Get final Y position after table
    const finalTableY = (pdf as any).lastAutoTable.finalY;

    // Add inspector signatures on the last page
    // Check if there's enough space, otherwise add a new page
    const remainingSpace = pageHeight - finalTableY - 15;
    if (remainingSpace < 30) {
        pdf.addPage();
        const newYStart = drawHeader(margin) + 5;
        drawInspectorSignatures(newYStart);
    } else {
        drawInspectorSignatures(finalTableY + 5);
    }

    // Draw footers on all pages
    const actualTotalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= actualTotalPages; i++) {
        pdf.setPage(i);
        // Clear and redraw footer with correct page count
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        pdf.text('April 2025/R0', margin, pageHeight - 5);
        pdf.text(`Page ${i} of ${actualTotalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    }

    return pdf;
}

export async function downloadSidakWorkshopAsJpg(data: WorkshopPDFData, filename: string): Promise<void> {
    // Guard against server-side execution
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('JPG download can only be executed in browser environment');
    }

    try {
        // Import PDF.js (Vite compatible)
        const pdfjsLib = await import('pdfjs-dist');

        // Import bundled worker as URL
        const workerSrc = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');

        // Configure PDF.js to use bundled worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.default;

        // Generate the PDF
        const pdf = await generateSidakWorkshopPDF(data);

        // Get PDF as array buffer
        const pdfArrayBuffer = pdf.output('arraybuffer');

        // Load PDF with PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: pdfArrayBuffer });
        const pdfDocument = await loadingTask.promise;

        const totalPages = pdfDocument.numPages;
        const scale = 2.5;

        // Helper function to download a single page as JPG
        const downloadPage = async (pageNum: number): Promise<void> => {
            const page = await pdfDocument.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) {
                throw new Error('Could not get canvas context');
            }

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Fill white background
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);

            // Render PDF page to canvas
            const renderContext = {
                canvas,
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext as any).promise;

            return new Promise((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to create JPG blob'));
                            return;
                        }

                        // Create filename with page number if multiple pages
                        const pageFilename = totalPages > 1
                            ? filename.replace('.jpg', `_Page${pageNum}.jpg`).replace('.jpeg', `_Page${pageNum}.jpeg`)
                            : filename;

                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = pageFilename;
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
        };

        // Download all pages sequentially with a small delay between downloads
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            await downloadPage(pageNum);
            // Small delay between downloads to ensure browser handles them properly
            if (pageNum < totalPages) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    } catch (error) {
        throw new Error(`Failed to generate JPG: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
