import dotenv from 'dotenv';
dotenv.config({ path: 'd:/Downloads/ssb_connect/backend/.env' });

import mailer from '../src/utils/mailer';
import { logger } from '../src/utils/logger';

(async () => {
  try {
    const to = 'praveshunofficial@gmail.com';
    const subject = 'Test email from SSB Connect (Mailgun sandbox)';
    const text = 'This is a test email sent from the SSB Connect backend using your Mailgun sandbox SMTP settings.';
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
