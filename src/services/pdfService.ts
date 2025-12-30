/**
 * PDF Service
 * 
 * Handles PDF generation for waivers with watermark, logo, and signature.
 * In production, this would use jsPDF library to generate actual PDFs.
 */

import type { WaiverFormData } from './waiverService';
import { WAIVER_CONTENT } from './waiverService';

// Import watermark image
import watermarkImage from 'figma:asset/fa781e3aa36305e51015a8c3d1528c89347466df.png';

class PDFService {
  /**
   * Generate waiver PDF
   * 
   * In production, this would use jsPDF to create a PDF with:
   * - Watermark image as background
   * - Studio logo in header
   * - User information
   * - Waiver content
   * - User signature
   * 
   * For now, this returns a mock PDF data URL
   */
  async generateWaiverPDF(formData: WaiverFormData): Promise<string> {
    // Mock implementation
    // In production, you would use jsPDF like this:
    
    /*
    import jsPDF from 'jspdf';
    
    const pdf = new jsPDF('p', 'mm', 'letter');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add watermark as background
    pdf.addImage(watermarkImage, 'PNG', 0, 0, pageWidth, pageHeight, '', 'NONE', 0.1);
    
    // Add logo
    pdf.addImage(logoImage, 'PNG', pageWidth / 2 - 25, 10, 50, 30);
    
    // Add title
    pdf.setFontSize(18);
    pdf.text('WAIVER AGREEMENT', pageWidth / 2, 50, { align: 'center' });
    
    // Add participant information
    pdf.setFontSize(12);
    let yPos = 70;
    pdf.text(`Name: ${formData.firstName} ${formData.lastName}`, 20, yPos);
    yPos += 8;
    pdf.text(`Email: ${formData.email}`, 20, yPos);
    yPos += 8;
    pdf.text(`Phone: ${formData.phone}`, 20, yPos);
    yPos += 8;
    pdf.text(`Address: ${formData.address}`, 20, yPos);
    yPos += 8;
    pdf.text(`City, State ZIP: ${formData.city}, ${formData.state} ${formData.zipCode}`, 20, yPos);
    yPos += 8;
    pdf.text(`Birthday: ${formData.birthday}`, 20, yPos);
    yPos += 8;
    pdf.text(`Gender: ${formData.gender}`, 20, yPos);
    yPos += 8;
    pdf.text(`Occupation: ${formData.occupation}`, 20, yPos);
    yPos += 15;
    
    // Add waiver content (split into multiple pages if needed)
    pdf.setFontSize(10);
    const waiverLines = pdf.splitTextToSize(WAIVER_CONTENT, pageWidth - 40);
    pdf.text(waiverLines, 20, yPos);
    
    // Add signature on last page
    const totalPages = pdf.getNumberOfPages();
    pdf.setPage(totalPages);
    const lastPageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(formData.signatureDataUrl, 'PNG', 20, lastPageHeight - 60, 80, 30);
    pdf.text(`Signed on: ${formData.signatureDate}`, 20, lastPageHeight - 25);
    
    // Return PDF as data URL
    return pdf.output('dataurlstring');
    */
    
    // Mock return
    console.log('Generated PDF for:', formData.email);
    console.log('Watermark image:', watermarkImage);
    
    return `data:application/pdf;base64,mock-pdf-${formData.email}-${Date.now()}`;
  }

  /**
   * Download PDF to user's device
   */
  async downloadPDF(pdfDataUrl: string, fileName: string): Promise<void> {
    // In production:
    /*
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = fileName;
    link.click();
    */
    
    console.log('Downloaded PDF:', fileName);
  }

  /**
   * Convert PDF to blob for upload
   */
  async pdfToBlob(pdfDataUrl: string): Promise<Blob> {
    // In production:
    /*
    const response = await fetch(pdfDataUrl);
    return await response.blob();
    */
    
    // Mock blob
    return new Blob(['mock-pdf-content'], { type: 'application/pdf' });
  }
}

export const pdfService = new PDFService();
