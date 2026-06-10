// client/src/utils/crypto.js

// Вспомогательные функции для перевода бинарных данных в строку Base64 и обратно
const bufferToBase64 = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const base64ToBuffer = (base64) => {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
};

/**
 * 1. Генерация пары ключей ECDH для пользователя при регистрации
 */
export async function generateE2EKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256" // Надежная и быстрая эллиптическая кривая
    },
    true, // Разрешить экспорт ключей
    ["deriveKey", "deriveBits"]
  );

  // Экспортируем ключи в JSON Web Key (JWK) формат, чтобы их можно было хранить в виде текста
  const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

  return {
    publicKeyStr: JSON.stringify(publicKeyJwk),
    privateKeyStr: JSON.stringify(privateKeyJwk)
  };
}

/**
 * 2. Генерация общего секретного AES-ключа на основе своего приватного и чужого публичного ключа
 */
async function deriveSharedKey(myPrivateKeyStr, theirPublicKeyStr) {
  const privateKeyJwk = JSON.parse(myPrivateKeyStr);
  const publicKeyJwk = JSON.parse(theirPublicKeyStr);

  const privateKey = await window.crypto.subtle.importKey(
    "jwk", privateKeyJwk, 
    { name: "ECDH", namedCurve: "P-256" }, 
    false, ["deriveKey"]
  );

  const publicKey = await window.crypto.subtle.importKey(
    "jwk", publicKeyJwk, 
    { name: "ECDH", namedCurve: "P-256" }, 
    true, []
  );

  // Вычисляем общий AES ключ для шифрования сообщений
  return await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * 3. Шифрование текста сообщения
 */
export async function encryptMessage(text, myPrivateKeyStr, targetPublicKeyStr) {
  const sharedKey = await deriveSharedKey(myPrivateKeyStr, targetPublicKeyStr);
  
  // IV (вектор инициализации) делает каждое зашифрованное сообщение уникальным, даже если текст одинаковый
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    sharedKey,
    encodedText
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv)
  };
}

/**
 * 4. Расшифровка полученного сообщения
 */
export async function decryptMessage(ciphertextBase64, ivBase64, myPrivateKeyStr, senderPublicKeyStr) {
  try {
    const sharedKey = await deriveSharedKey(myPrivateKeyStr, senderPublicKeyStr);
    const ciphertext = base64ToBuffer(ciphertextBase64);
    const iv = base64ToBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      sharedKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Ошибка дешифрования сообщения. Возможно, неверный ключ.", error);
    return "🚨 [Ошибка декодирования: сообщение повреждено или изменен ключ] 🚨";
  }
}
