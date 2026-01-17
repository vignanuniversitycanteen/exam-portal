import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateAdminManual = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let yPos = 20;

    // --- DESIGN SYSTEM ---
    const colors = {
        primary: [16, 185, 129],   // Emerald 500
        secondary: [79, 70, 229],  // Indigo 600
        dark: [15, 23, 42],        // Slate 900
        slate: [51, 65, 85],       // Slate 700
        light: [248, 250, 252],    // Slate 50
        white: [255, 255, 255],
        grey: [148, 163, 184]      // Slate 400
    };

    const fonts = {
        title: { size: 24, weight: 'bold' },
        header: { size: 16, weight: 'bold' },
        sub: { size: 12, weight: 'bold' },
        body: { size: 10, weight: 'normal' },
        small: { size: 8, weight: 'normal' }
    };

    // --- HELPERS ---

    const checkPageBreak = (spaceNeeded) => {
        if (yPos + spaceNeeded > pageHeight - margin) {
            doc.addPage();
            yPos = 20;
            // Add Header to new pages
            doc.setFontSize(8); doc.setTextColor(...colors.grey);
            doc.text("Admin Manual - Vignan Examination Portal", margin, 10);
            doc.line(margin, 12, pageWidth - margin, 12);
        }
    };

    const drawSectionCard = (title, iconChar) => {
        checkPageBreak(25);
        // Pill Background
        doc.setFillColor(...colors.primary);
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 12, 2, 2, 'F');

        // Icon Circle
        doc.setFillColor(...colors.white);
        doc.circle(margin + 8, yPos + 6, 3, 'F');
        doc.setFontSize(8); doc.setTextColor(...colors.primary);
        doc.text(iconChar, margin + 6.5, yPos + 7.5);

        // Title
        doc.setFontSize(fonts.header.size);
        doc.setTextColor(...colors.white);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin + 15, yPos + 8);
        yPos += 20;
    };

    const drawTimelineStep = (number, title, description) => {
        checkPageBreak(25);
        const x = margin + 5;

        // Line
        doc.setDrawColor(...colors.grey);
        doc.setLineWidth(0.5);
        doc.line(x, yPos, x, yPos + 20);

        // Circle Badge
        doc.setFillColor(...colors.secondary);
        doc.circle(x, yPos + 4, 4, 'F');
        doc.setTextColor(...colors.white);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(String(number), x - 1.2, yPos + 5.2);

        // Content
        doc.setTextColor(...colors.dark);
        doc.setFontSize(11);
        doc.text(title, x + 10, yPos + 4);

        doc.setTextColor(...colors.slate);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(description, pageWidth - margin - x - 10);
        doc.text(descLines, x + 10, yPos + 9);

        yPos += Math.max(20, (descLines.length * 4) + 12);
    };

    const drawTip = (text) => {
        checkPageBreak(15);
        doc.setFillColor(...colors.light);
        doc.setDrawColor(...colors.secondary);
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 15, 1, 1, 'FD');

        doc.setFontSize(8); doc.setTextColor(...colors.secondary); doc.setFont('helvetica', 'bold');
        doc.text("PRO TIP", margin + 5, yPos + 5);

        doc.setFontSize(9); doc.setTextColor(...colors.slate); doc.setFont('helvetica', 'normal');
        doc.text(text, margin + 5, yPos + 10);
        yPos += 20;
    };

    // --- WIREFRAME HELPERS ---
    const drawWindow = (x, y, h, url) => {
        const w = pageWidth - (margin * 2);

        // Drop Shadow
        doc.setFillColor(230);
        doc.rect(x + 2, y + 2, w, h, 'F');

        // Window Frame
        doc.setFillColor(255);
        doc.setDrawColor(200);
        doc.rect(x, y, w, h, 'FD');

        // Title Bar
        doc.setFillColor(222, 225, 230); // Chrome Grey
        doc.rect(x, y, w, 12, 'F');

        // Tab (Active)
        doc.setFillColor(255);
        doc.path([
            { op: 'm', c: [x + 6, y + 10] },
            { op: 'l', c: [x + 8, y + 2] },
            { op: 'l', c: [x + 50, y + 2] },
            { op: 'l', c: [x + 52, y + 10] },
            { op: 'l', c: [x + 6, y + 10] }
        ], 'F');

        // Tab Info
        doc.setFontSize(6); doc.setTextColor(60); doc.text("Portal", x + 15, y + 7);
        doc.setFillColor(...colors.primary); doc.circle(x + 10, y + 6, 1.5, 'F');

        // Traffic Lights
        doc.setFillColor(239, 68, 68); doc.circle(x + w - 16, y + 6, 1.8, 'F');
        doc.setFillColor(251, 191, 36); doc.circle(x + w - 10, y + 6, 1.8, 'F');
        doc.setFillColor(74, 222, 128); doc.circle(x + w - 4, y + 6, 1.8, 'F');

        // Omnibox
        doc.setFillColor(241, 243, 244);
        doc.roundedRect(x + 20, y + 11.5, w - 80, 5, 2.5, 2.5, 'F');
        doc.setFontSize(6); doc.setTextColor(100); doc.text("🔒 " + url, x + 25, y + 15);

        return { w, innerY: y + 20, innerH: h - 20 };
    };

    // --- UI DRAWS ---
    const drawLoginScreen = () => {
        checkPageBreak(65);
        const { w, innerY } = drawWindow(margin, yPos, 45, "https://portal.com/login");
        const boxX = margin + (w / 2) - 20;

        // Login Card
        doc.setFillColor(255); doc.setDrawColor(220);
        doc.roundedRect(boxX, innerY + 5, 40, 25, 1, 1, 'FD');
        // Fields
        doc.setFillColor(240);
        doc.rect(boxX + 4, innerY + 12, 32, 4, 'F');
        doc.rect(boxX + 4, innerY + 18, 32, 4, 'F');
        // Btn
        doc.setFillColor(...colors.primary);
        doc.rect(boxX + 4, innerY + 24, 32, 4, 'F');

        yPos += 55;
    };

    const drawDashboardScreen = () => {
        checkPageBreak(65);
        const { w, innerY } = drawWindow(margin, yPos, 50, "https://portal.com/admin");

        // Sidebar
        doc.setFillColor(...colors.dark);
        doc.rect(margin, innerY, 20, 30, 'F');

        // Stats
        const cardW = 15;
        doc.setFillColor(...colors.secondary); doc.rect(margin + 25, innerY + 5, cardW, 10, 'F');
        doc.setFillColor(...colors.primary); doc.rect(margin + 25 + cardW + 5, innerY + 5, cardW, 10, 'F');

        // Table
        doc.setFillColor(255); doc.setDrawColor(220);
        doc.rect(margin + 25, innerY + 20, w - 30, 15, 'FD');

        yPos += 60;
    };

    const drawReportsScreen = () => {
        checkPageBreak(50);
        const { w, innerY } = drawWindow(margin, yPos, 35, "https://portal.com/reports");

        // Icons
        const cx = margin + 20;
        doc.setFillColor(236, 253, 245); doc.roundedRect(cx, innerY + 5, 20, 15, 1, 1, 'F'); // Excel
        doc.setFillColor(...colors.primary); doc.circle(cx + 10, innerY + 12.5, 3, 'F');

        doc.setFillColor(255, 241, 242); doc.roundedRect(cx + 30, innerY + 5, 20, 15, 1, 1, 'F'); // PDF
        doc.setFillColor(239, 68, 68); doc.circle(cx + 40, innerY + 12.5, 3, 'F');

        yPos += 45;
    };

    // ================= CONTENT START =================

    // --- COVER PAGE ---
    // Background
    doc.setFillColor(...colors.dark);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    // Accent Stripe
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, 15, pageHeight, 'F');

    // Logo / Brand
    doc.setTextColor(...colors.white);
    doc.setFontSize(40); doc.setFont('helvetica', 'bold');
    doc.text("EXAMINATION", 30, 100);
    doc.setTextColor(...colors.primary);
    doc.text("MANUAL", 30, 115);

    doc.setTextColor(200);
    doc.setFontSize(14); doc.setFont('helvetica', 'normal');
    doc.text("For Administrators & Staff", 30, 130);

    doc.setFontSize(10);
    doc.text("• Secure Login", 30, 150);
    doc.text("• Exam Creation", 30, 157);
    doc.text("• Seat Allocation", 30, 164);
    doc.text("• Reports & Logs", 30, 171);

    doc.text(`Version 2.0  |  ${new Date().toLocaleDateString()}`, 30, pageHeight - 20);

    doc.addPage();
    yPos = 20;

    // --- TOC ---
    doc.setFontSize(18); doc.setTextColor(...colors.dark); doc.setFont('helvetica', 'bold');
    doc.text("Table of Contents", margin, yPos);
    yPos += 15;

    const sections = [
        "1. Getting Started", "2. Dashboard & Stats", "3. Creating Exams (Walkthrough)",
        "4. Room Allocation Logic", "5. Permissions & Users", "6. Troubleshooting"
    ];
    sections.forEach((sec, i) => {
        doc.setFontSize(12); doc.setTextColor(...colors.slate);
        doc.text(sec, margin + 5, yPos);
        doc.setDrawColor(220); doc.line(margin + 5, yPos + 3, pageWidth - margin, yPos + 3);
        yPos += 12;
    });

    // --- 1. GETTING STARTED ---
    drawSectionCard("Getting Started", "1");

    doc.setFontSize(10); doc.setTextColor(...colors.slate);
    doc.text("Your gateway to the secure administration environment.", margin, yPos);
    yPos += 10;

    drawLoginScreen();

    drawTimelineStep(1, "Access the Portal", "Navigate to /admin/login. Bookmark this page for quick access.");
    drawTimelineStep(2, "Authenticate", "Enter your username and password. If enabled, complete the MFA challenge.");
    drawTip("Keeping your MFA backup codes in a secure, offline location is highly recommended.");

    // --- 2. DASHBOARD ---
    drawSectionCard("Dashboard Overview", "2");
    drawDashboardScreen();

    doc.text("The Dashboard provides reasonable real-time insights into the exam ecosystem.", margin, yPos);
    yPos += 8;

    autoTable(doc, {
        startY: yPos,
        head: [['Component', 'Function']],
        body: [
            ['KPI Cards', 'Instant view of Active Exams, Total Students, and Room Availability.'],
            ['Recent List', 'Quick access to edit or publish recently created exams.'],
            ['Sidebar', 'Navigation to other modules like User Management and Branch Settings.']
        ],
        theme: 'grid',
        headStyles: { fillColor: colors.dark, textColor: 255 },
        styles: { fontSize: 9, cellPadding: 4 },
    });
    yPos = doc.lastAutoTable.finalY + 15;

    // --- 3. EXAM CREATION ---
    drawSectionCard("Creating an Exam", "3");

    drawTimelineStep(1, "Initiate", "Click the '+ Create Exam' button on the top right of the dashboard.");
    drawTimelineStep(2, "Details", "Fill in Exam Name, Code (e.g., MID-1), Date, and Time slots.");
    drawTimelineStep(3, "Select Cohort", "Choose the Academic Year, Semester, and relevant Branches.");
    drawTimelineStep(4, "Allocation Mode", "Choose 'Auto-Allocate' for AI-based seating or 'Manual' for custom overrides.");

    drawTip("Use the 'Preview' button before Publishing to verify the seating arrangement.");

    // --- 4. REPORTS ---
    drawSectionCard("Reports & Downloads", "4");
    drawReportsScreen();

    drawTimelineStep(1, "Select Exam", "Go to properties of any completed or scheduled exam.");
    drawTimelineStep(2, "Format Choice", "Choose Excel for data processing or PDF for printing.");

    // Footer on all pages (already handled by checkPageBreak)

    doc.save('Admin_Manual_Premium.pdf');
};
