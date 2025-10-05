import dotenv from 'dotenv';
// Load environment variables from backend/.env when running from backend folder
dotenv.config();

import mailer from '../src/utils/mailer';
import { logger } from '../src/utils/logger';

(async () => {
  try {
    // Allow overrides via CLI args or env
    // Usage: ts-node scripts/send_mail.ts recipient@example.com "Subject here" "Body text"
    const [, , argTo, argSubject, argText] = process.argv;
    const to = argTo || process.env.TEST_MAIL_TO || 'praveshunofficial@gmail.com';
    const subject = argSubject || process.env.TEST_MAIL_SUBJECT || 'Test email from SSB Connect (Resend)';
    const text = argText || process.env.TEST_MAIL_TEXT || 'This is a test email sent from the SSB Connect backend using Resend.';
    const html = `<p>${text}</p>`;

    logger.info('Attempting to send test email', { to, subject });
    const ok = await mailer.sendMail({ to, subject, text, html });
    logger.info('Send result', { to, ok });
    if (!ok) {
      console.log('Mailer reported failure (likely fallback or rejected). Check logs for details.');
    } else {
      console.log('Mailer reported success (email sent).');
    }
    process.exit(0);
  } catch (e: any) {
    logger.error('send_mail.ts error', { error: e?.message || e });
    console.error('Error sending email', e);
    process.exit(1);
  }
})();
