/**
 * Email Service
 * 
 * Handles sending emails including waiver PDFs to customers.
 * In production, this would integrate with services like SendGrid, AWS SES, or similar.
 */

import type { WaiverFormData } from './waiverService';

export interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  attachments?: {
    filename: string;
    content: string; // Base64 or data URL
    type: string;
  }[];
}

class EmailService {
  /**
   * Send waiver confirmation email with PDF attachment
   */
  async sendWaiverEmail(
    formData: WaiverFormData,
    pdfDataUrl: string
  ): Promise<boolean> {
    const emailContent = this.generateWaiverEmailHTML(formData);
    
    const emailOptions: EmailOptions = {
      to: formData.email,
      subject: 'Estilo Latino Dance Studio - Waiver Confirmation',
      htmlContent: emailContent,
      attachments: [
        {
          filename: `waiver_${formData.lastName}_${formData.firstName}.pdf`,
          content: pdfDataUrl,
          type: 'application/pdf'
        }
      ]
    };

    return this.sendEmail(emailOptions);
  }

  /**
   * Generate HTML content for waiver confirmation email
   */
  private generateWaiverEmailHTML(formData: WaiverFormData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #000000;
            color: #FFC700;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #FFC700;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background-color: #FFC700;
            color: #000000;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .info-box {
            background-color: #fff;
            padding: 20px;
            border-left: 4px solid #FFC700;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Estilo Latino Dance Studio</h1>
          <p>Welcome to Our Dance Family!</p>
        </div>
        
        <div class="content">
          <h2>Hello ${formData.firstName}!</h2>
          
          <p>Thank you for completing your registration and waiver agreement with Estilo Latino Dance Studio.</p>
          
          <div class="info-box">
            <h3>What's Next?</h3>
            <ul>
              <li>Your waiver has been securely stored in our system</li>
              <li>A copy is attached to this email for your records</li>
              <li>You can now purchase punch cards and start attending classes!</li>
            </ul>
          </div>
          
          <p>Your registration details:</p>
          <ul>
            <li><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</li>
            <li><strong>Email:</strong> ${formData.email}</li>
            <li><strong>Waiver Signed:</strong> ${formData.signatureDate}</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="#" class="button">View My Account</a>
          </p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>We can't wait to see you on the dance floor!</p>
          
          <p>
            <strong>Estilo Latino Dance Studio</strong><br>
            📧 info@estilolatinostudio.com<br>
            📱 (555) 123-4567
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Estilo Latino Dance Studio. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send email (mock implementation)
   */
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    // In production, this would integrate with an email service:
    
    /*
    // Example with SendGrid:
    import sgMail from '@sendgrid/mail';
    
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: options.to,
      from: 'noreply@estilolatinostudio.com',
      subject: options.subject,
      html: options.htmlContent,
      attachments: options.attachments
    };
    
    await sgMail.send(msg);
    return true;
    */
    
    /*
    // Example with AWS SES:
    import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
    
    const sesClient = new SESClient({ region: "us-east-1" });
    
    const command = new SendEmailCommand({
      Source: "noreply@estilolatinostudio.com",
      Destination: { ToAddresses: [options.to] },
      Message: {
        Subject: { Data: options.subject },
        Body: { Html: { Data: options.htmlContent } }
      }
    });
    
    await sesClient.send(command);
    return true;
    */
    
    // Mock implementation
    console.log('📧 Email sent successfully!');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Attachments:', options.attachments?.length || 0);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }

  /**
   * Send general notification email
   */
  async sendNotificationEmail(
    to: string,
    subject: string,
    htmlContent: string
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject,
      htmlContent
    });
  }
}

export const emailService = new EmailService();
