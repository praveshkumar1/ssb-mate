import bcrypt from 'bcryptjs';
import { connectDatabase } from '../src/database/connection';
import User from '../src/models/User';
import Session from '../src/models/Session';
import mailer from '../src/utils/mailer';
import { logger, apiLogger } from '../src/utils/logger';

async function run() {
  try {
    await connectDatabase();
    logger.info('Connected DB for test script');

    // Clean up any previous test users
    await User.deleteMany({ email: /test@example.com$/ });

    // Create mentor
    const mentorPassword = await bcrypt.hash('Password123!', 10);
    const mentor = new User({
      email: 'mentor-test@example.com',
      password: mentorPassword,
      firstName: 'Mentor',
      lastName: 'Tester',
      role: 'mentor',
      isActive: true,
      isVerified: true,
      availability: [ new Date(Date.now() + 60*60*1000).toISOString() ]
    });
    await mentor.save();
    logger.info('Created mentor', { id: mentor._id, email: mentor.email });

    // Create mentee
    const menteePassword = await bcrypt.hash('Password123!', 10);
    const mentee = new User({
      email: 'mentee-test@example.com',
      password: menteePassword,
      firstName: 'Mentee',
      lastName: 'Tester',
      role: 'mentee',
      isActive: true,
      isVerified: true
    });
    await mentee.save();
    logger.info('Created mentee', { id: mentee._id, email: mentee.email });

    // Create session
    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    const newSession = new Session({
      title: 'Automated test session',
      description: 'Test booking created by automated script',
      mentorId: mentor._id,
      menteeId: mentee._id,
      sessionType: 'general_mentoring',
      duration: 60,
      scheduledAt,
      meetingLink: 'https://example.com/meet/abc123',
      status: 'scheduled'
    });
    await newSession.save();

    // Populate
    const populated = await Session.findById(newSession._id)
      .populate('mentorId', 'firstName lastName email')
      .populate('menteeId', 'firstName lastName email');

    logger.info('Session created', { id: newSession._id });

    // Update mentor availability similar to route logic
    try {
      const scheduledTime = new Date(scheduledAt).getTime();
      const TOLERANCE_MS = 2 * 60 * 1000;
      const m = await User.findById(mentor._id);
      if (m) {
        const before = Array.isArray(m.availability) ? m.availability.slice() : [] as any[];
        const removed: any[] = [];
        const updated = before.filter((a: any) => {
          try {
            if (!a) return true;
            const candidateIso = typeof a === 'string' ? a : (a.start || a.iso || null);
            if (!candidateIso) return true;
            const candidateTime = new Date(candidateIso).getTime();
            const diff = Math.abs(candidateTime - scheduledTime);
            if (!Number.isFinite(candidateTime) || Number.isNaN(candidateTime)) return true;
            if (diff <= TOLERANCE_MS) {
              removed.push(candidateIso);
              return false;
            }
            return true;
          } catch (err) { return true; }
        });
        m.availability = updated as any;
        await m.save();
        apiLogger.info('Updated mentor availability after booking (script)', { mentorId: m._id, removedSlots: removed, beforeCount: before.length, afterCount: updated.length });
      }
    } catch (e) {
      apiLogger.error('Failed to update mentor availability (script)', { error: e instanceof Error ? e.message : e });
    }

    // Call mailer
    try {
      const coachEmail = (populated?.mentorId as any)?.email;
      const menteeEmail = (populated?.menteeId as any)?.email;
      const sessionUrl = `${process.env.APP_URL || 'http://localhost:3000'}/sessions/${String(populated?._id)}`;
      const p: any = populated;
      const sessionDetailsText = `Title: ${p?.title}\nWhen: ${new Date(p?.scheduledAt).toLocaleString()}\nDuration: ${p?.duration} minutes\nNotes: ${p?.description || ''}\nLink: ${p?.meetingLink || ''}`;

      if (coachEmail) {
        const ok = await mailer.sendMail({ to: coachEmail, subject: `New session booked by ${p?.menteeId?.firstName || 'a user'}`, text: `A session was booked.\n\n${sessionDetailsText}`, html: `<p>A session was booked.</p><pre>${sessionDetailsText}</pre><p><a href="${sessionUrl}">View session</a></p>` });
        logger.info('Coach mailer send result', { ok });
      }
      if (menteeEmail) {
        const ok2 = await mailer.sendMail({ to: menteeEmail, subject: `Session confirmed with ${p?.mentorId?.firstName || 'your mentor'}`, text: `Your session is confirmed.\n\n${sessionDetailsText}`, html: `<p>Your session is confirmed.</p><pre>${sessionDetailsText}</pre><p><a href="${sessionUrl}">View session</a></p>` });
        logger.info('Mentee mailer send result', { ok: ok2 });
      }
    } catch (e) {
      apiLogger.error('Mailer send failed (script)', { error: e instanceof Error ? e.message : e });
    }

    logger.info('Test booking script completed');
    process.exit(0);
  } catch (err) {
    console.error('Test booking script error', err);
    process.exit(1);
  }
}

run();
