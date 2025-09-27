import nodemailer from 'nodemailer';
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

// Mailgun HTTP API config (preferred when present)
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || process.env.API_KEY || process.env.SMTP_PASS;
let MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || process.env.MAILGUN_SANDBOX_DOMAIN;
// If Mailgun domain isn't explicitly provided, try to derive it from SMTP_USER (e.g. postmaster@<domain>)
if (!MAILGUN_DOMAIN && SMTP_USER && SMTP_USER.includes('@')) {
  MAILGUN_DOMAIN = SMTP_USER.split('@')[1];
}
const MAILGUN_REGION = process.env.MAILGUN_REGION || process.env.MAILGUN_URL_REGION; // 'eu' or undefined

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
  apiLogger.info('SMTP not configured - will attempt Mailgun HTTP API or fallback to logging');
}

// Lazy-initialized Mailgun client (mailgun.js)
let mailgunClient: any = null;
async function initMailgunIfNeeded() {
  if (mailgunClient) return mailgunClient;
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    return null;
  }
  try {
    const FormData = (await import('form-data')).default;
    const Mailgun = (await import('mailgun.js')).default;
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: 'api',
      key: MAILGUN_API_KEY,
      url: MAILGUN_REGION === 'eu' ? 'https://api.eu.mailgun.net' : undefined
    });
    mailgunClient = mg;
    apiLogger.info('Mailgun HTTP client initialized', { domain: MAILGUN_DOMAIN, region: MAILGUN_REGION });
    return mailgunClient;
  } catch (e: any) {
    apiLogger.warn('Failed to initialize Mailgun client (mailgun.js not installed or runtime error)', { error: e?.message || e });
    return null;
  }
}

export async function sendMail(opts: MailOptions) {
  const { to, subject, text, html, from } = opts;
  if (!to) return Promise.resolve(false);

  // Prefer Mailgun HTTP API when configured
  try {
    const mg = await initMailgunIfNeeded();
    if (mg) {
      const fromAddr = from || `SSB Connect <${process.env.FROM_EMAIL || `no-reply@${MAILGUN_DOMAIN}`}>'`;
      try {
        const resp = await mg.messages.create(MAILGUN_DOMAIN, {
          from: fromAddr,
          to: Array.isArray(to) ? to : [to],
          subject,
          text,
          html
        });
        apiLogger.info('Email sent via Mailgun', { to, subject, id: resp.id });
        return true;
      } catch (e: any) {
        apiLogger.error('Mailgun send failed, falling back', { to, subject, error: e?.message || e });
        // fall through to transporter or fallback logging
      }
    }
  } catch (e) {
    apiLogger.error('Unexpected Mailgun error', { error: e instanceof Error ? e.message : e });
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
