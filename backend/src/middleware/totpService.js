const crypto = require('crypto');

// Base32 decode; needed because TOTP secrets are base32 encoded
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32Decode = (str) => {
  str = str.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  let output = [];

  for (let i = 0; i < str.length; i++) {
    value = (value << 5) | BASE32_CHARS.indexOf(str[i]);
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
};

const base32Encode = (buffer) => {
  let output = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_CHARS[(value << (5 - bits)) & 31];
  return output;
};

// Generate a random TOTP secret
const generateSecret = () => {
  const buffer = crypto.randomBytes(20); // 160 bits
  return base32Encode(buffer);
};

// Generate a TOTP code for a given secret and time window
const generateTotp = (secret, window = 0) => {
  const counter = Math.floor(Date.now() / 1000 / 30) + window;

  // Counter as 8-byte big-endian buffer
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter & 0xffffffff, 4);

  const keyBuffer = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', keyBuffer).update(counterBuffer).digest();

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
};

// Check current window and ±1 window for clock drift
const verifyTotp = (secret, token) => {
  for (let w = -1; w <= 1; w++) {
    if (generateTotp(secret, w) === token) return true;
  }
  return false;
};

// Generate an otpauth URL that encodes into a QR code
const generateOtpauthUrl = (secret, email, issuer = 'GIUNexus') => {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
};

// Print QR code to console as ASCII (no library)
// Uses a simple URL-based approach, prints the otpauth URL
// In M2 we just log the URL and secret; M3 will show actual QR
const printQrToConsole = (secret, email) => {
  const url = generateOtpauthUrl(secret, email);
  console.log('\n========== TOTP SETUP ==========');
  console.log(`User: ${email}`);
  console.log(`Secret: ${secret}`);
  console.log(`Scan this URL with your authenticator app:`);
  console.log(url);
  console.log('=================================\n');
};

module.exports = { generateSecret, generateTotp, verifyTotp, generateOtpauthUrl, printQrToConsole };