import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import { apiLogger } from './logger';

type MailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
};

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || (SMTP_USER || 'no-reply@example.com');

// Resend HTTP API (preferred when present)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || FROM_EMAIL;

let transporter: nodemailer.Transporter | null = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
  apiLogger.info('Mailer configured with SMTP host', { host: SMTP_HOST });
} else {
  apiLogger.info('SMTP not configured - will attempt Resend HTTP API or fallback to logging');
}

// Using Resend HTTP API directly to avoid SDK type coupling

export async function sendMail(opts: MailOptions) {
  const { to, subject, text, html, from } = opts;
  if (!to) return Promise.resolve(false);

  // Prefer Resend when configured
  try {
    if (RESEND_API_KEY) {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: from || RESEND_FROM,
          to: Array.isArray(to) ? to : [to],
          subject,
          text,
          html
        })
      });
      const data: any = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        apiLogger.error('Resend send failed, falling back', { to, subject, status: resp.status, data });
      } else {
        apiLogger.info('Email sent via Resend', { to, subject, id: data?.id });
        return true;
      }
    }
  } catch (e: any) {
    apiLogger.error('Unexpected Resend HTTP error', { error: e?.message || e });
  }

  // Fallback to SMTP transporter if available
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: from || FROM_EMAIL,
        to,
        subject,
        text,
        html
      });
      apiLogger.info('Email sent via SMTP', { to, subject, messageId: (info as any).messageId });
      return true;
    } catch (err: any) {
      apiLogger.error('Failed to send email via SMTP', { to, subject, error: err?.message || err });
      return false;
    }
  }

  // Final fallback: log the email
  apiLogger.info('Mailer fallback - email content', { to, subject, text, html });
  return false;
}

export default { sendMail };
