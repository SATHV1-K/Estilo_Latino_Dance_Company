import { Resend } from 'resend';
import { WaiverFormData } from './pdfGenerator';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Log Email Service Configuration
console.log('📧 Email Service Configuration (Resend):');
console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '***SET***' : 'NOT SET');
console.log('  FROM_EMAIL:', process.env.FROM_EMAIL || 'onboarding@resend.dev (default)');
console.log('  STUDIO_EMAIL:', process.env.STUDIO_EMAIL || 'info@estilolatino.com (default)');

const STUDIO_EMAIL = process.env.STUDIO_EMAIL || 'info@estilolatino.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const STUDIO_NAME = 'Estilo Latino Dance Company';

/**
 * Verify Resend connection (always succeeds if API key is set)
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY is not set');
        return { success: false, error: 'RESEND_API_KEY is not set' };
    }
    console.log('✅ Resend API key is configured');
    return { success: true };
}

/**
 * Send welcome email to new customer with waiver PDF attached
 */
export async function sendWelcomeEmail(
    formData: WaiverFormData,
    pdfBuffer: Buffer
): Promise<boolean> {
    try {
        const { data, error } = await resend.emails.send({
            from: `${STUDIO_NAME} <${FROM_EMAIL}>`,
            to: [formData.email],
            subject: `Welcome to ${STUDIO_NAME}! 💃`,
            html: generateWelcomeEmailHTML(formData),
            attachments: [
                {
                    filename: `Waiver_${formData.firstName}_${formData.lastName}.pdf`,
                    content: pdfBuffer.toString('base64'),
                }
            ]
        });

        if (error) {
            console.error('❌ Resend error sending welcome email:', error);
            return false;
        }

        console.log('✅ Welcome email sent to:', formData.email, 'ID:', data?.id);
        return true;
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        return false;
    }
}

/**
 * Send notification email to studio about new signup
 */
export async function sendStudioNotificationEmail(
    formData: WaiverFormData,
    pdfBuffer: Buffer
): Promise<boolean> {
    try {
        const { data, error } = await resend.emails.send({
            from: `${STUDIO_NAME} System <${FROM_EMAIL}>`,
            to: [STUDIO_EMAIL],
            subject: `New Signup: ${formData.firstName} ${formData.lastName}`,
            html: generateStudioNotificationHTML(formData),
            attachments: [
                {
                    filename: `Waiver_${formData.firstName}_${formData.lastName}.pdf`,
                    content: pdfBuffer.toString('base64'),
                }
            ]
        });

        if (error) {
            console.error('❌ Resend error sending studio notification:', error);
            return false;
        }

        console.log('✅ Studio notification email sent to:', STUDIO_EMAIL, 'ID:', data?.id);
        return true;
    } catch (error) {
        console.error('❌ Error sending studio notification email:', error);
        return false;
    }
}

/**
 * Send both emails (customer welcome + studio notification)
 * NOTE: Studio notification is disabled - PDFs are stored in Supabase instead
 */
export async function sendWaiverEmails(
    formData: WaiverFormData,
    pdfBuffer: Buffer
): Promise<{ customerEmailSent: boolean; studioEmailSent: boolean }> {
    // Only send welcome email to customer
    const customerEmailSent = await sendWelcomeEmail(formData, pdfBuffer);

    // Studio notification disabled - PDFs are stored in Supabase storage
    // If you want to re-enable, uncomment the line below:
    // const studioEmailSent = await sendStudioNotificationEmail(formData, pdfBuffer);
    const studioEmailSent = false;

    return { customerEmailSent, studioEmailSent };
}

/**
 * Generate welcome email HTML for customer
 */
function generateWelcomeEmailHTML(formData: WaiverFormData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffc700, #e6b400); padding: 30px; text-align: center; }
        .header h1 { color: #000; margin: 0; }
        .content { padding: 30px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .highlight { color: #e6b400; font-weight: bold; }
        .button { display: inline-block; padding: 12px 30px; background: #ffc700; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Estilo Latino!</h1>
        </div>
        <div class="content">
            <p>Dear <strong>${formData.firstName}</strong>,</p>
            
            <p>Welcome to the <span class="highlight">Estilo Latino Dance Company</span> family! We're thrilled to have you join us.</p>
            
            <p>Your waiver has been successfully signed and submitted. A copy of your signed waiver is attached to this email for your records.</p>
            
            <h3>What's Next?</h3>
            <ul>
                <li>📅 Check out our class schedule and sign up for your first class</li>
                <li>💳 Purchase a punch card to get started</li>
                <li>👟 Wear comfortable clothes and bring dance shoes or socks</li>
                <li>💧 Don't forget to bring water!</li>
            </ul>
            
            <h3>Your Account Details:</h3>
            <ul>
                <li><strong>Email:</strong> ${formData.email}</li>
                <li><strong>Phone:</strong> ${formData.phone}</li>
            </ul>
            
            <p>We can't wait to see you on the dance floor! If you have any questions, feel free to reply to this email or contact us.</p>
            
            <p>Let's dance! 💃🕺</p>
            
            <p>
                <em>The Estilo Latino Team</em>
            </p>
        </div>
        <div class="footer">
            <p>Estilo Latino Dance Company<br>
            📧 info@estilolatino.com<br>
            Follow us on social media @estilolatinodance</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate notification email HTML for studio
 */
function generateStudioNotificationHTML(formData: WaiverFormData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #333; padding: 20px; text-align: center; }
        .header h1 { color: #ffc700; margin: 0; }
        .content { padding: 20px; background: #f9f9f9; }
        .info-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .info-table td { padding: 8px; border-bottom: 1px solid #ddd; }
        .info-table td:first-child { font-weight: bold; width: 40%; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 New Signup Notification</h1>
        </div>
        <div class="content">
            <p>A new customer has signed up and submitted their waiver!</p>
            
            <table class="info-table">
                <tr><td>Name:</td><td>${formData.firstName} ${formData.lastName}</td></tr>
                <tr><td>Email:</td><td>${formData.email}</td></tr>
                <tr><td>Phone:</td><td>${formData.phone}</td></tr>
                <tr><td>Address:</td><td>${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}</td></tr>
                <tr><td>Birthday:</td><td>${formData.birthday}</td></tr>
                <tr><td>Gender:</td><td>${formData.gender}</td></tr>
                <tr><td>Occupation:</td><td>${formData.occupation}</td></tr>
                <tr><td>How they found us:</td><td>${formData.source}</td></tr>
                <tr><td>Signed on:</td><td>${formData.signatureDate}</td></tr>
            </table>
            
            <p style="margin-top: 20px;">The signed waiver PDF is attached to this email.</p>
        </div>
    </div>
</body>
</html>`;
}
