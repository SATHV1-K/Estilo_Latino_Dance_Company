// QR Code Service - Uses the actual qr_code from the database
// Backend generates QR codes in format: ELDC_USER_{uuid}_{timestamp}_{random}

class QRService {
  /**
   * Generate a QR code image URL using a free API service
   * This creates a real scannable QR code
   */
  generateQRCodeImageUrl(qrData: string): string {
    // Use QR Server API (free, no API key required)
    const encodedData = encodeURIComponent(qrData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
  }

  /**
   * Generate SVG placeholder with the code text (fallback if image fails)
   */
  generateQRCodeSVG(qrData: string): string {
    // Show the check-in code prominently as fallback
    const size = 200;

    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;
    svg += `<rect x="10" y="10" width="${size - 20}" height="${size - 20}" fill="none" stroke="black" stroke-width="2"/>`;

    // Show code segments
    const displayCode = qrData.length > 20 ? qrData.substring(qrData.length - 12) : qrData;

    svg += `<text x="${size / 2}" y="${size / 2 - 20}" text-anchor="middle" font-family="monospace" font-size="10" fill="black">Scan or use code:</text>`;
    svg += `<text x="${size / 2}" y="${size / 2 + 10}" text-anchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="black">${displayCode}</text>`;
    svg += `<text x="${size / 2}" y="${size / 2 + 35}" text-anchor="middle" font-family="monospace" font-size="8" fill="#666">Show this to staff</text>`;

    svg += '</svg>';
    return svg;
  }

  /**
   * Validate if the qr_code string looks valid (matches backend format)
   */
  validateQRCode(qrCode: string): boolean {
    if (!qrCode) return false;
    return qrCode.startsWith('ELDC_USER_') || qrCode.startsWith('ELDC_FAMILY_MEMBER_');
  }

  /**
   * Parse a QR code to extract entity information (mirrors backend parseQRCode)
   */
  parseQRCode(qrCode: string): {
    type: 'user' | 'family_member' | null;
    entityId: string | null;
    isValid: boolean;
  } {
    if (!qrCode || !qrCode.startsWith('ELDC_')) {
      return { type: null, entityId: null, isValid: false };
    }

    const parts = qrCode.split('_');
    if (parts.length < 4) {
      return { type: null, entityId: null, isValid: false };
    }

    if (parts[1] === 'USER') {
      return {
        type: 'user',
        entityId: parts[2],
        isValid: true
      };
    } else if (parts[1] === 'FAMILY' && parts[2] === 'MEMBER') {
      return {
        type: 'family_member',
        entityId: parts[3],
        isValid: true
      };
    }

    return { type: null, entityId: null, isValid: false };
  }
}

export const qrService = new QRService();
