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
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&display=swap');

            body {
              font-family: 'JetBrains Mono', monospace;
              line-height: 1.6;
              color: #0f172a;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }

            .header {
              background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
              color: #1f2937;
              padding: 40px 30px;
              text-align: center;
              border-radius: 12px 12px 0 0;
              font-family: 'Instrument Serif', serif;
            }

            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 400;
            }

            .header p {
              margin: 8px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
            }

            .content {
              background: #f8fafc;
              padding: 40px 30px;
              border-radius: 0 0 12px 12px;
              border: 1px solid #e2e8f0;
              border-top: none;
            }

            .content h2 {
              font-family: 'Instrument Serif', serif;
              font-size: 24px;
              font-weight: 400;
              color: #1e293b;
              margin: 0 0 20px 0;
            }

            .content p {
              color: #64748b;
              margin: 16px 0;
              line-height: 1.7;
            }

            .otp-code {
              background: #ffffff;
              border: 2px solid #fbbf24;
              border-radius: 12px;
              padding: 24px;
              text-align: center;
              font-size: 36px;
              font-weight: 600;
              color: #92400e;
              letter-spacing: 6px;
              margin: 24px 0;
              font-family: 'JetBrains Mono', monospace;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }

            .highlight {
              color: #f59e0b;
              font-weight: 600;
            }

            .warning {
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
              color: #dc2626;
              font-size: 14px;
            }

            .warning strong {
              color: #b91c1c;
            }

            .footer {
              text-align: center;
              margin-top: 32px;
              color: #94a3b8;
              font-size: 14px;
              line-height: 1.5;
            }

            .footer p {
              margin: 8px 0;
            }

            .footer a {
              color: #f59e0b;
              text-decoration: none;
            }

            .footer a:hover {
              text-decoration: underline;
            }
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

            <p>This code will expire in <span class="highlight">10 minutes</span> for security reasons.</p>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong> Do not share this code with anyone. Our team will never ask for your verification code.
            </div>

            <p>If you didn't create an account with Vulnera, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Vulnera Bug Bounty Platform. All rights reserved.</p>
            <p>Need help? Contact our support team at <a href="mailto:support@vulnera.com">support@vulnera.com</a></p>
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
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&display=swap');

            body {
              font-family: 'JetBrains Mono', monospace;
              line-height: 1.6;
              color: #0f172a;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }

            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: #ffffff;
              padding: 40px 30px;
              text-align: center;
              border-radius: 12px 12px 0 0;
              font-family: 'Instrument Serif', serif;
            }

            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 400;
            }

            .header p {
              margin: 8px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
            }

            .content {
              background: #f8fafc;
              padding: 40px 30px;
              border-radius: 0 0 12px 12px;
              border: 1px solid #e2e8f0;
              border-top: none;
            }

            .content h2 {
              font-family: 'Instrument Serif', serif;
              font-size: 24px;
              font-weight: 400;
              color: #1e293b;
              margin: 0 0 20px 0;
            }

            .content p {
              color: #64748b;
              margin: 16px 0;
              line-height: 1.7;
            }

            .reset-button {
              display: inline-block;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: #ffffff;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 24px 0;
              font-family: 'JetBrains Mono', monospace;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              transition: all 0.2s ease;
            }

            .reset-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
            }

            .token-box {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
              font-family: 'JetBrains Mono', monospace;
              word-break: break-all;
              color: #475569;
              font-size: 14px;
              line-height: 1.4;
            }

            .highlight {
              color: #dc2626;
              font-weight: 600;
            }

            .warning {
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
              color: #dc2626;
              font-size: 14px;
            }

            .warning strong {
              color: #b91c1c;
            }

            .footer {
              text-align: center;
              margin-top: 32px;
              color: #94a3b8;
              font-size: 14px;
              line-height: 1.5;
            }

            .footer p {
              margin: 8px 0;
            }

            .footer a {
              color: #f59e0b;
              text-decoration: none;
            }

            .footer a:hover {
              text-decoration: underline;
            }
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

            <p>This link will expire in <span class="highlight">1 hour</span> for security reasons.</p>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </div>

            <p>For security reasons, this link can only be used once.</p>
          </div>
          <div class="footer">
            <p>© 2025 Vulnera Bug Bounty Platform. All rights reserved.</p>
            <p>Need help? Contact our support team at <a href="mailto:support@vulnera.com">support@vulnera.com</a></p>
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
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&display=swap');

            body {
              font-family: 'JetBrains Mono', monospace;
              line-height: 1.6;
              color: #0f172a;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }

            .header {
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: #ffffff;
              padding: 40px 30px;
              text-align: center;
              border-radius: 12px 12px 0 0;
              font-family: 'Instrument Serif', serif;
            }

            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 400;
            }

            .header p {
              margin: 8px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
            }

            .content {
              background: #f8fafc;
              padding: 40px 30px;
              border-radius: 0 0 12px 12px;
              border: 1px solid #e2e8f0;
              border-top: none;
            }

            .content h2 {
              font-family: 'Instrument Serif', serif;
              font-size: 24px;
              font-weight: 400;
              color: #1e293b;
              margin: 0 0 20px 0;
            }

            .content p {
              color: #64748b;
              margin: 16px 0;
              line-height: 1.7;
            }

            .feature-list {
              background: #ffffff;
              padding: 24px;
              border-radius: 12px;
              margin: 24px 0;
              border: 1px solid #e2e8f0;
            }

            .feature-list h3 {
              font-family: 'Instrument Serif', serif;
              font-size: 20px;
              font-weight: 400;
              color: #1e293b;
              margin: 0 0 16px 0;
            }

            .feature-list ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }

            .feature-list li {
              padding: 8px 0;
              border-bottom: 1px solid #f1f5f9;
              color: #475569;
            }

            .feature-list li:before {
              content: "✅ ";
              color: #22c55e;
              font-weight: 600;
              margin-right: 8px;
            }

            .feature-list li:last-child {
              border-bottom: none;
            }

            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: #ffffff;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 24px 0;
              font-family: 'JetBrains Mono', monospace;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              transition: all 0.2s ease;
            }

            .cta-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
            }

            .highlight {
              color: #16a34a;
              font-weight: 600;
            }

            .pro-tips {
              background: #ecfdf5;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
            }

            .pro-tips strong {
              color: #166534;
              font-family: 'Instrument Serif', serif;
            }

            .pro-tips ul {
              margin: 12px 0 0 0;
              padding-left: 20px;
            }

            .pro-tips li {
              color: #166534;
              margin: 6px 0;
            }

            .footer {
              text-align: center;
              margin-top: 32px;
              color: #94a3b8;
              font-size: 14px;
              line-height: 1.5;
            }

            .footer p {
              margin: 8px 0;
            }

            .footer a {
              color: #f59e0b;
              text-decoration: none;
            }

            .footer a:hover {
              text-decoration: underline;
            }
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

            <div class="pro-tips">
              <strong>💡 Pro Tips:</strong>
              <ul>
                <li>Read program scopes carefully before testing</li>
                <li>Provide detailed reproduction steps in your reports</li>
                <li>Follow responsible disclosure guidelines</li>
                <li>Keep your profile updated for better opportunities</li>
              </ul>
            </div>

            <p class="highlight">Happy hunting! 🐛</p>
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