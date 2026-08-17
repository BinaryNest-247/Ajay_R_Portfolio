const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const routeModule = require(path.join(__dirname, '..', 'api', 'contact.js'));

function buildRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.headers['Content-Type'] = 'application/json';
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    }
  };
}

test('returns 400 when required form fields are missing', async () => {
  const req = { method: 'POST', body: { name: 'Ajay', email: 'invalid-email' } };
  const res = buildRes();

  await routeModule(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(String(res.body.message || ''), /valid email/i);
});

test('sends a valid message through the email service', async () => {
  process.env.RESEND_API_KEY = 'test-key';
  process.env.CONTACT_TO_EMAIL = 'travellerlonely194@gmail.com';

  const sendCalls = [];
  const originalSend = global.__RESEND_SEND__;
  global.__RESEND_SEND__ = async (payload) => {
    sendCalls.push(payload);
    return { id: 'email_123' };
  };

  const req = {
    method: 'POST',
    body: {
      name: 'Visitor Name',
      email: 'visitor@example.com',
      message: 'This is a test message.'
    },
    headers: { 'x-forwarded-for': '203.0.113.5' }
  };
  const res = buildRes();

  await routeModule(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(sendCalls.length, 1);
  assert.equal(sendCalls[0].to, 'travellerlonely194@gmail.com');
  assert.equal(sendCalls[0].reply_to, 'visitor@example.com');
  assert.match(sendCalls[0].subject, /Visitor Name/i);
  assert.match(sendCalls[0].html, /Visitor Name/i);

  global.__RESEND_SEND__ = originalSend;
});
