import "server-only"
import crypto from "crypto"
import { IEncryptedCredential } from "@/schema/users";


const keyHex = process.env.ENCRYPTION_KEY;

if (!keyHex) {
    throw new Error("ENCRYPTION_KEY is not configured");
}

if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error("ENCRYPTION_KEY must be exactly 64 hexadecimal characters");
}

const ENCRYPTION_KEY = Buffer.from(keyHex, "hex");

export const encrypt = (text: string): IEncryptedCredential => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        ENCRYPTION_KEY,
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return {
        encrypted: encrypted.toString("base64"),
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64")
    }
}

export const decrypt = ({ encrypted, iv, authTag }: IEncryptedCredential): string => {
    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        ENCRYPTION_KEY,
        Buffer.from(iv, "base64")
    );

    decipher.setAuthTag(Buffer.from(authTag, "base64"));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, "base64")),
        decipher.final()
    ]);
    return decrypted.toString("utf8")
}