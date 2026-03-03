/**
 * Email sender using nodemailer for password reset emails.
 * Ported from backend-python-archive/utils/email_sender.py.
 */

import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import { config } from '../config';

function createTransport(): nodemailer.Transporter | null {
  if (!config.smtp.enabled) return null;

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    ...(config.smtp.useTls && config.smtp.port !== 465
      ? { requireTLS: true }
      : {}),
    ...(config.smtp.user && config.smtp.password
      ? { auth: { user: config.smtp.user, pass: config.smtp.password } }
      : {}),
    connectionTimeout: 10_000,
  });
}

const transporter = createTransport();

export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string,
  shortCode: string,
  expiresMinutes: number,
): Promise<boolean> {
  if (!transporter) {
    console.info('SMTP not configured, skipping email send');
    return false;
  }

  const textContent = `
Password Reset Request

You requested a password reset for your account.

You can reset your password in two ways:

1. Click this link:
${resetUrl}

2. Or use this code on the reset page:
${shortCode}

This code will expire in ${expiresMinutes} minutes.

If you didn't request this, please ignore this email.
`.trim();

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4f46e5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }
        .code-box {
            background-color: white;
            border: 2px solid #4f46e5;
            border-radius: 5px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #4f46e5;
            letter-spacing: 3px;
        }
        .button {
            display: inline-block;
            background-color: #4f46e5;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>You requested a password reset for your account.</p>

            <p><strong>Option 1:</strong> Click the button below to reset your password:</p>
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <p><strong>Option 2:</strong> Or use this code on the reset page:</p>
            <div class="code-box">
                <div class="code">${shortCode}</div>
            </div>

            <p>This code will expire in <strong>${expiresMinutes} minutes</strong>.</p>

            <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>`;

  const mailOptions: Mail.Options = {
    from: config.smtp.from,
    to: toEmail,
    subject: 'Password Reset Request',
    text: textContent,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.info(`Password reset email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${toEmail}:`, error);
    return false;
  }
}
