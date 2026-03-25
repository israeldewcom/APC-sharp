// src/lib/encryption/e2ee.ts (Complete)
import sodium from 'libsodium-wrappers';
import { db } from '../storage/db';

export const initSodium = async () => {
  await sodium.ready;
  return sodium;
};

export const generateKeyPair = async () => {
  const sodium = await initSodium();
  return sodium.crypto_box_keypair();
};

export const deriveSharedSecret = async (
  privateKey: Uint8Array,
  publicKey: Uint8Array
) => {
  const sodium = await initSodium();
  return sodium.crypto_box_beforenm(publicKey, privateKey);
};

export const encryptMessage = async (
  message: string,
  recipientPublicKey: Uint8Array,
  senderPrivateKey: Uint8Array
) => {
  const sodium = await initSodium();
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const encrypted = sodium.crypto_box_easy(
    message,
    nonce,
    recipientPublicKey,
    senderPrivateKey
  );
  return {
    encrypted: sodium.to_base64(encrypted),
    nonce: sodium.to_base64(nonce),
  };
};

export const decryptMessage = async (
  encryptedBase64: string,
  nonceBase64: string,
  senderPublicKey: Uint8Array,
  recipientPrivateKey: Uint8Array
) => {
  const sodium = await initSodium();
  const encrypted = sodium.from_base64(encryptedBase64);
  const nonce = sodium.from_base64(nonceBase64);
  const decrypted = sodium.crypto_box_open_easy(
    encrypted,
    nonce,
    senderPublicKey,
    recipientPrivateKey
  );
  return sodium.to_string(decrypted);
};

// Store user's private key encrypted with their password
export const storePrivateKey = async (privateKey: Uint8Array, password: string) => {
  const sodium = await initSodium();
  const key = await sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    password,
    sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES),
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
  
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const encrypted = sodium.crypto_secretbox_easy(privateKey, nonce, key);
  
  await db.keyStore.put({
    id: 'user_private_key',
    encryptedKey: sodium.to_base64(encrypted),
    nonce: sodium.to_base64(nonce),
    salt: sodium.to_base64(key.slice(0, sodium.crypto_pwhash_SALTBYTES)),
  });
};

export const retrievePrivateKey = async (password: string) => {
  const sodium = await initSodium();
  const stored = await db.keyStore.get('user_public_key');
  if (!stored) return null;
  
  const key = await sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    password,
    sodium.from_base64(stored.salt),
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
  
  const encrypted = sodium.from_base64(stored.encryptedKey);
  const nonce = sodium.from_base64(stored.nonce);
  
  return sodium.crypto_secretbox_open_easy(encrypted, nonce, key);
};

// Exchange public keys for a chat
export const exchangeKeys = async (chatId: string, userId: string) => {
  const myKeyPair = await generateKeyPair();
  const theirPublicKey = await getPublicKey(userId);
  
  if (!theirPublicKey) throw new Error('User public key not found');
  
  const sharedSecret = await deriveSharedSecret(myKeyPair.privateKey, theirPublicKey);
  
  await db.chatKeys.put({
    chatId,
    sharedSecret: sodium.to_base64(sharedSecret),
    createdAt: new Date(),
  });
  
  return sharedSecret;
};
