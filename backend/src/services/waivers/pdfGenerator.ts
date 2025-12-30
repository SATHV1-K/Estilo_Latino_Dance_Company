import PDFDocument from 'pdfkit';

// Waiver content text
export const WAIVER_CONTENT = `AGREEMENT, WAIVER, AND RELEASE OF LIABILITY

In exchange for participation in the dance company organized by Estilo Latino Dance Company (ELDC), I agree for my son/daughter and/or myself to the following terms:

1. Assumption of Risk
I understand that participating in a dance or exercise class is a potentially hazardous activity. I recognize that there are inherent risks associated with this activity, including but not limited to: slips, falls, sprains, twists, muscle tears, fractures, broken bones, cardiac incidents, stroke, physical strain, or other medical conditions, including the risk of serious injury or death. I voluntarily assume all such risks, known and appreciated by me.

2. Release of Liability
I assume full responsibility for personal injury to myself and/or my child and further release and discharge Estilo Latino Dance Company, its owners, instructors, staff, partners, and volunteers from any and all liability, including negligence, for injuries, medical conditions, accidents, or damages arising out of my use of or presence upon the facilities. This includes any injury whether caused by the fault of myself, Estilo Latino, or other third parties.

3. Indemnification
I agree to indemnify and defend Estilo Latino against all claims, causes of action, damages, judgements, costs, or expenses, including attorney fees and other litigation costs, which may in any way arise from my use of or presence in the facilities of Estilo Latino Dance Company.

4. Medical Fitness & Physical Contact
I agree that I should not participate in such activity unless I am medically able. I agree to abide by any decision of the instructor relative to my ability to safely participate. I explicitly understand and consent that dance involves professional physical contact and close interaction.

5. Rules, Conduct, and Zero-Tolerance Policy
I agree to observe and obey all rules, warnings, and oral instructions given by ELDC and its employees. I acknowledge that ELDC enforces a Zero-Tolerance Aggression Policy: Any verbal, physical, or psychological aggression toward ELDC personnel results in immediate removal. ELDC reserves the right to deny participation or remove any participant from the premises at its sole discretion.

6. Facility Damages & Security
I agree to pay for all damages to the facilities of Estilo Latino Dance Company caused by my negligent, reckless, or willful actions. I further accept the use of security cameras on the premises and allow ELDC to use recordings for safety, verification, or legal matters.

7. Costumes, Tuition, and Fees
I understand that I am responsible for all tuition, fees, and costume costs. I understand that dance may require costumes, shoes, makeup, registrations, competition fees, travel, and other expenses, and I agree to provide them as needed. All services must be paid prior to participation.

8. Media Consent & Publicity Release
I grant ELDC full and unrestricted permission to capture, use, reproduce, publish, or distribute any photographs, videos, audio, or other media of the Participant taken during classes, rehearsals, events, or performances. I understand these materials may be used in publicity for the studio.

9. Legal Acknowledgment
I agree and acknowledge that I am under no pressure or duress to sign this agreement and have been given a reasonable opportunity to review it. Any legal or equitable claim that may arise from participation shall be resolved under New Jersey law. I acknowledge that if I provide an electronic signature, it is valid under the U.S. ESIGN Act and NJ UETA.

I have read this document and understand it. I further understand that by signing this release, I voluntarily surrender certain legal rights.`;

export interface WaiverFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    birthday: string;
    gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    occupation: string;
    source: string;
    signatureDataUrl: string;
    signatureDate: string;
}

/**
 * Generate a professional waiver PDF
 */
export async function generateWaiverPDF(formData: WaiverFormData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'LETTER',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = doc.page.width - 100; // Account for margins

            // Header
            doc.fontSize(20)
                .font('Helvetica-Bold')
                .text('ESTILO LATINO DANCE COMPANY', { align: 'center' });

            doc.moveDown(0.5);
            doc.fontSize(16)
                .font('Helvetica-Bold')
                .text('WAIVER AGREEMENT', { align: 'center' });

            doc.moveDown();

            // Participant Information Box
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('PARTICIPANT INFORMATION', { underline: true });
            doc.moveDown(0.5);

            doc.font('Helvetica')
                .fontSize(10);

            // Two-column layout for participant info
            const leftX = 50;
            const rightX = 300;
            let y = doc.y;

            doc.text(`Name: ${formData.firstName} ${formData.lastName}`, leftX, y);
            doc.text(`Email: ${formData.email}`, rightX, y);
            y += 15;

            doc.text(`Phone: ${formData.phone}`, leftX, y);
            doc.text(`Birthday: ${formData.birthday}`, rightX, y);
            y += 15;

            doc.text(`Address: ${formData.address}`, leftX, y);
            y += 15;

            doc.text(`City/State/ZIP: ${formData.city}, ${formData.state} ${formData.zipCode}`, leftX, y);
            y += 15;

            doc.text(`Gender: ${formData.gender}`, leftX, y);
            doc.text(`Occupation: ${formData.occupation}`, rightX, y);
            y += 15;

            doc.text(`How did you hear about us: ${formData.source}`, leftX, y);

            doc.moveDown(2);

            // Horizontal line
            doc.moveTo(50, doc.y)
                .lineTo(doc.page.width - 50, doc.y)
                .stroke();
            doc.moveDown();

            // Waiver Content
            doc.fontSize(9)
                .font('Helvetica');

            // Split waiver into paragraphs and add to PDF
            const paragraphs = WAIVER_CONTENT.split('\n\n');
            for (const paragraph of paragraphs) {
                // Check if we need a new page
                if (doc.y > doc.page.height - 150) {
                    doc.addPage();
                }

                if (paragraph.startsWith('AGREEMENT') || /^\d+\./.test(paragraph)) {
                    doc.font('Helvetica-Bold');
                } else {
                    doc.font('Helvetica');
                }

                doc.text(paragraph.trim(), {
                    width: pageWidth,
                    align: 'justify'
                });
                doc.moveDown(0.5);
            }

            // Signature Section (on new page if needed)
            if (doc.y > doc.page.height - 200) {
                doc.addPage();
            }

            doc.moveDown(2);

            // Horizontal line
            doc.moveTo(50, doc.y)
                .lineTo(doc.page.width - 50, doc.y)
                .stroke();
            doc.moveDown();

            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('SIGNATURE', { underline: true });
            doc.moveDown();

            // Add signature image if provided
            if (formData.signatureDataUrl && formData.signatureDataUrl.startsWith('data:image')) {
                try {
                    // Extract base64 data from data URL
                    const base64Data = formData.signatureDataUrl.split(',')[1];
                    const signatureBuffer = Buffer.from(base64Data, 'base64');

                    doc.image(signatureBuffer, {
                        fit: [200, 80],
                        align: 'left'
                    } as any);
                } catch (e) {
                    console.error('Error adding signature image:', e);
                    doc.text('[Signature on file]');
                }
            } else {
                doc.font('Helvetica')
                    .fontSize(10)
                    .text('[Electronic Signature on file]');
            }

            doc.moveDown();
            doc.font('Helvetica')
                .fontSize(10)
                .text(`Signed electronically on: ${formData.signatureDate}`);

            doc.moveDown();
            doc.text(`By: ${formData.firstName} ${formData.lastName}`);

            // Footer
            doc.moveDown(2);
            doc.fontSize(8)
                .fillColor('gray')
                .text('This document was signed electronically and is valid under the U.S. ESIGN Act and NJ UETA.', {
                    align: 'center'
                });
            doc.text(`Document generated on: ${new Date().toISOString()}`, {
                align: 'center'
            });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
