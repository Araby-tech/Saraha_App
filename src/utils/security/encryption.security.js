// encryption.security.js

import CryptoJS from "crypto-js";

// Encrypt
export const generateEncryption = async ({
    plaintext = "",
    secret = process.env.ENCRYPTION_SECRET
} = {}) => {
    return CryptoJS.AES.encrypt(plaintext, secret).toString();
};

// Decrypt
export const decryptEncryption = async ({
    cipherText = "",
    secret = process.env.ENCRYPTION_SECRET
} = {}) => {
    return CryptoJS.AES.decrypt(cipherText, secret).toString(CryptoJS.enc.Utf8);
};
