// Simple E2EE utilities (placeholder for real implementation)
export function generateKeyPair() {
  return {
    publicKey: 'pk_' + Math.random().toString(36).substring(2),
    privateKey: 'sk_' + Math.random().toString(36).substring(2)
  };
}

export function encryptMessage(message, publicKey) {
  // In real app, use libsodium or similar
  return btoa(message + '|' + publicKey);
}

export function decryptMessage(encryptedMessage, privateKey) {
  // In real app, use libsodium or similar
  try {
    const decoded = atob(encryptedMessage);
    return decoded.split('|')[0];
  } catch {
    return encryptedMessage;
  }
}
