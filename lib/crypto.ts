import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be exactly 32 characters");
}

const KEY = Buffer.from(ENCRYPTION_KEY, "utf8");

// Generate PKCE code verifier
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

// Generate PKCE code challenge
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

// Generate state for CSRF protection
export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Encrypt token using AES-256-GCM
export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

// Decrypt token
export function decryptToken(encryptedToken: string): string {
  const [ivHex, encrypted, authTag] = encryptedToken.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
