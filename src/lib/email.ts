import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate a 6-digit OTP
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP email for email verification
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('EMAIL_USER or EMAIL_PASS not configured');
      return false;
    }

    const mailOptions = {
      from: `"Vulnera Bug Bounty" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Vulnera Bug Bounty Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-code { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { color: #e74c3c; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔒 Verify Your Email</h1>
            <p>Welcome to Vulnera Bug Bounty Platform!</p>
          </div>
          <div class="content">
            <h2>Complete Your Registration</h2>
            <p>Thank you for signing up! To complete your registration and start participating in bug bounties, please verify your email address.</p>

            <p><strong>Your verification code is:</strong></p>
            <div class="otp-code">${otp}</div>

            <p>This code will expire in <strong>10 minutes</strong> for security reasons.</p>

            <p class="warning">⚠️ Do not share this code with anyone. Our team will never ask for your verification code.</p>

            <p>If you didn't create an account with Vulnera, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Vulnera Bug Bounty Platform. All rights reserved.</p>
            <p>Need help? Contact our support team at support@vulnera.com</p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('EMAIL_USER or EMAIL_PASS not configured');
      return false;
    }

    // Create reset URL (adjust domain as needed)
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Vulnera Bug Bounty" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - Vulnera Bug Bounty Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .reset-button { display: inline-block; background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { color: #e74c3c; font-weight: bold; }
            .token-box { background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin: 20px 0; font-family: monospace; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔑 Reset Your Password</h1>
            <p>Secure your Vulnera account</p>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password for your Vulnera Bug Bounty Platform account.</p>

            <p><strong>Click the button below to reset your password:</strong></p>
            <a href="${resetUrl}" class="reset-button">Reset Password</a>

            <p><strong>Or copy and paste this link into your browser:</strong></p>
            <div class="token-box">${resetUrl}</div>

            <p>This link will expire in <strong>1 hour</strong> for security reasons.</p>

            <p class="warning">⚠️ If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>

            <p>For security reasons, this link can only be used once.</p>
          </div>
          <div class="footer">
            <p>© 2025 Vulnera Bug Bounty Platform. All rights reserved.</p>
            <p>Need help? Contact our support team at support@vulnera.com</p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

// Send welcome email after successful registration
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('EMAIL_USER or EMAIL_PASS not configured');
      return false;
    }

    const mailOptions = {
      from: `"Vulnera Bug Bounty" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Vulnera - Start Hunting Bugs!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Vulnera</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .cta-button { display: inline-block; background: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .feature-list { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature-list ul { list-style: none; padding: 0; }
            .feature-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
            .feature-list li:before { content: "✅ "; color: #27ae60; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to Vulnera, ${username}!</h1>
            <p>Your bug hunting journey begins now</p>
          </div>
          <div class="content">
            <h2>You're All Set!</h2>
            <p>Thank you for joining the Vulnera Bug Bounty Platform. Your account has been successfully verified and you're ready to start finding security vulnerabilities.</p>

            <div class="feature-list">
              <h3>🚀 What you can do now:</h3>
              <ul>
                <li>Browse active bug bounty programs</li>
                <li>Submit vulnerability reports</li>
                <li>Track your earnings and reputation</li>
                <li>Connect your Solana wallet for payments</li>
                <li>Join our community of ethical hackers</li>
              </ul>
            </div>

            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vulnerabilities" class="cta-button">Start Hunting Bugs</a>

            <p><strong>💡 Pro Tips:</strong></p>
            <ul>
              <li>Read program scopes carefully before testing</li>
              <li>Provide detailed reproduction steps in your reports</li>
              <li>Follow responsible disclosure guidelines</li>
              <li>Keep your profile updated for better opportunities</li>
            </ul>

            <p>Happy hunting! 🐛</p>
          </div>
          <div class="footer">
            <p>© 2025 Vulnera Bug Bounty Platform. All rights reserved.</p>
            <p>Questions? Visit our <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/help">Help Center</a></p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}