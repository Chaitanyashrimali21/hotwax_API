const crypto = require('crypto');

const encryptionKey = process.env.ENCRYPTION_KEY; // Securely stored key

function encryptCreditCard(creditCardNumber) {
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, Buffer.alloc(16, 0)); // IV for randomness
  let encrypted = cipher.update(creditCardNumber, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptCreditCard(encryptedCreditCard) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, Buffer.alloc(16, 0)); // Same IV for decryption
  let decrypted = decipher.update(encryptedCreditCard, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}