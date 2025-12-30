// Notification Service - Handles email and SMS notifications

class NotificationService {
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // TODO: Integrate with email service (e.g., SendGrid, AWS SES)
    console.log(`[Email] To: ${to}, Subject: ${subject}`);
    return true;
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    // TODO: Integrate with SMS service (e.g., Twilio)
    console.log(`[SMS] To: ${to}, Message: ${message}`);
    return true;
  }

  async sendCardExpirationReminder(
    email: string,
    phone: string,
    cardName: string,
    expirationDate: string,
    classesRemaining: number
  ): Promise<void> {
    // TODO: Schedule these to run automatically
    const daysUntilExpiration = Math.ceil(
      (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const emailSubject = `Your ${cardName} is expiring soon`;
    const emailBody = `
      Hi there!
      
      Your ${cardName} with ${classesRemaining} remaining classes will expire on ${expirationDate} 
      (${daysUntilExpiration} days from now).
      
      Don't lose your classes! Book your sessions today or purchase a new card.
      
      See you at Estilo Latino Dance Studio!
    `;

    const smsMessage = `Estilo Latino: Your ${cardName} expires in ${daysUntilExpiration} days with ${classesRemaining} classes remaining. Book now!`;

    await this.sendEmail(email, emailSubject, emailBody);
    await this.sendSMS(phone, smsMessage);
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const subject = `Welcome to Estilo Latino Dance Studio!`;
    const body = `
      Hi ${firstName}!
      
      Welcome to Estilo Latino Dance Studio! We're excited to have you join our dance family.
      
      Your account has been created successfully. You can now purchase punch cards and start your 
      salsa and bachata journey with us.
      
      See you on the dance floor!
    `;

    await this.sendEmail(email, subject, body);
  }

  async sendPurchaseConfirmation(
    email: string,
    cardName: string,
    totalClasses: number,
    expirationDate: string,
    price: number
  ): Promise<void> {
    const subject = `Purchase Confirmation - ${cardName}`;
    const body = `
      Thank you for your purchase!
      
      Card Details:
      - Card: ${cardName}
      - Total Classes: ${totalClasses}
      - Expiration Date: ${expirationDate}
      - Price: $${price}
      
      Your card is now active and ready to use. Show your QR code at check-in!
      
      Estilo Latino Dance Studio
    `;

    await this.sendEmail(email, subject, body);
  }

  async sendEmailVerification(email: string, verificationCode: string): Promise<void> {
    // TODO: Implement email verification flow
    const subject = `Verify your email - Estilo Latino Dance Studio`;
    const body = `
      Please verify your email address by entering this code: ${verificationCode}
      
      This code will expire in 15 minutes.
    `;

    await this.sendEmail(email, subject, body);
  }

  async sendSMSVerification(phone: string, verificationCode: string): Promise<void> {
    // TODO: Implement SMS verification flow
    const message = `Estilo Latino verification code: ${verificationCode}. Valid for 15 minutes.`;
    await this.sendSMS(phone, message);
  }
}

export const notificationService = new NotificationService();
