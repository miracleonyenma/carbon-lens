import { SignJWT, jwtVerify } from "jose";

// Use the existing encryption key from the environment variables
const secretKey = process.env.ENCRYPTION_KEY;
if (!secretKey) {
  throw new Error("ENCRYPTION_KEY is not defined in environment variables");
}

export interface SessionPayload {
  userId: string;
  email: string;
  roles: string[];
}

// Convert string key to Uint8Array for jose
const key = new TextEncoder().encode(secretKey);

export async function encryptSession(payload: SessionPayload) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Set expiration to 7 days
    .sign(key);
}

export async function decryptSession(
  input: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
