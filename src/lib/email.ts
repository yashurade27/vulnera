import crypto from 'crypto';

// Generate a 6-digit OTP
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP email (placeholder - integrate with actual email service like SendGrid, Resend, etc.)
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    // TODO: Integrate with actual email service
    console.log(`Sending OTP ${otp} to ${email}`);

    // For now, always return true
    // In production, implement actual email sending
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

// Send password reset email (placeholder)
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  try {
    // TODO: Integrate with actual email service
    console.log(`Sending password reset token ${resetToken} to ${email}`);

    // For now, always return true
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}