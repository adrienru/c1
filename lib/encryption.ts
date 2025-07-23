import crypto from "crypto"

const algorithm = "aes-256-cbc"
const iv = crypto.randomBytes(16) // Initialization vector

const encryptionKey = process.env.ENCRYPTION_KEY

if (!encryptionKey) {
  throw new Error("Missing ENCRYPTION_KEY environment variable.")
}

const key = Buffer.from(encryptionKey, "base64") // Ensure key is 32 bytes (256 bits)

export function encryptPassword(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  return iv.toString("hex") + ":" + encrypted
}

export function decryptPassword(encryptedText: string): string {
  const parts = encryptedText.split(":")
  const ivFromEncrypted = Buffer.from(parts[0], "hex")
  const encrypted = parts[1]
  const decipher = crypto.createDecipheriv(algorithm, key, ivFromEncrypted)
  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}
