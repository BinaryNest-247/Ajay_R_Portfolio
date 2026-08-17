const { Resend } = require('resend');

const sanitize = (value = '') => String(value).trim();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getClientIp = (req) => {
  const headers = req.headers || {};
  const forwarded = headers['x-forwarded-for'] || headers['x-real-ip'] || '';
  const ip = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0].trim();
  return ip || 'unknown';
};

const normalizeBody = (req) => {
  if (!req || !req.body) {
    return {};
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }

  return req.body;
};

const rateLimitWindowMs = 60 * 1000;
const rateLimitMaxRequests = 5;
const requestTracker = new Map();

function checkRateLimit(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const existing = requestTracker.get(ip) || { count: 0, windowStart: now };

  if (now - existing.windowStart > rateLimitWindowMs) {
    requestTracker.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (existing.count >= rateLimitMaxRequests) {
    return { allowed: false, retryAfterSeconds: Math.ceil((rateLimitWindowMs - (now - existing.windowStart)) / 1000) };
  }

  existing.count += 1;
  requestTracker.set(ip, existing);
  return { allowed: true };
}

function getResendClient() {
  if (global.__RESEND_CLIENT__) {
    return global.__RESEND_CLIENT__;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return null;
  }

  global.__RESEND_CLIENT__ = new Resend(key);
  return global.__RESEND_CLIENT__;
}

function buildResendPayload(payload) {
  const toEmail = process.env.CONTACT_TO_EMAIL || 'travellerlonely194@gmail.com';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 16px;">New portfolio contact message</h2>
      <p><strong>Visitor Name:</strong> ${payload.name}</p>
      <p><strong>Visitor Email:</strong> ${payload.email}</p>
      <p><strong>Submission Time:</strong> ${payload.submittedAt}</p>
      <p><strong>Visitor Message:</strong></p>
      <div style="padding: 16px; border-radius: 12px; background: #f3f4f6; white-space: pre-wrap;">${payload.message}</div>
    </div>
  `;

  return {
    from: process.env.RESEND_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>',
    to: toEmail,
    reply_to: payload.email,
    subject: `New contact message from ${payload.name}`,
    html,
    text: [
      `Visitor Name: ${payload.name}`,
      `Visitor Email: ${payload.email}`,
      `Date and time of submission: ${payload.submittedAt}`,
      '',
      'Visitor Message:',
      payload.message
    ].join('\n')
  };
}

async function sendContactEmail(payload) {
  const resend = getResendClient();
  if (!resend) {
    throw new Error('Missing RESEND_API_KEY');
  }

  const emailPayload = buildResendPayload(payload);
  return resend.emails.send(emailPayload);
}

module.exports = async function handler(req, res) {
  if (!req || !req.method) {
    return res.status(400).json({ message: 'Invalid request.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const rateLimitResult = checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      message: 'Too many messages sent. Please wait a moment and try again.'
    });
  }

  const body = normalizeBody(req);
  const name = sanitize(body.name);
  const email = sanitize(body.email).toLowerCase();
  const message = sanitize(body.message);

  if (!name) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  if (!message) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  const submittedAt = new Date().toISOString();

  try {
    const sendFn = global.__RESEND_SEND__ || sendContactEmail;
    const emailPayload = buildResendPayload({
      name,
      email,
      message,
      submittedAt,
      ip: getClientIp(req)
    });

    const result = await sendFn(emailPayload);

    if (result && result.error) {
      return res.status(500).json({ message: 'Unable to send your message. Please try again.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully! I\'ll get back to you soon.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to send your message. Please try again.' });
  }
};
