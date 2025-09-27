const fetch = require('node-fetch');

const BASE = process.env.BASE || 'http://localhost:8080';

async function postJSON(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }
  return { status: res.status, body: json };
}

(async () => {
  try {
    console.log('Registering mentor...');
    const mentorData = {
      email: 'mentor-test@example.com',
      password: 'Password123!',
      firstName: 'Mentor',
      lastName: 'Tester',
      role: 'mentor'
    };
    const r1 = await postJSON('/api/auth/register', mentorData);
    console.log('Mentor register:', r1.status, JSON.stringify(r1.body));
    const mentorId = r1.body?.data?.user?._id || (r1.body?.data?.user?.id) || null;
    if (!mentorId) {
      console.error('Failed to get mentorId, aborting');
      process.exit(1);
    }

    console.log('Registering mentee...');
    const menteeData = {
      email: 'mentee-test@example.com',
      password: 'Password123!',
      firstName: 'Mentee',
      lastName: 'Tester',
      role: 'mentee'
    };
    const r2 = await postJSON('/api/auth/register', menteeData);
    console.log('Mentee register:', r2.status, JSON.stringify(r2.body));
    const menteeToken = r2.body?.data?.token || null;
    if (!menteeToken) {
      console.error('Failed to get mentee token, aborting');
      process.exit(1);
    }

    console.log('Creating session as mentee...');
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const sessionBody = {
      title: 'Test booking session',
      description: 'This is a test booking created by automated test script.',
      mentorId: mentorId,
      sessionType: 'general_mentoring',
      duration: 60,
      scheduledAt,
      meetingLink: 'https://example.com/meet/123'
    };

    const r3 = await postJSON('/api/sessions', sessionBody, menteeToken);
    console.log('Create session:', r3.status, JSON.stringify(r3.body, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('Test booking failed', e);
    process.exit(1);
  }
})();
