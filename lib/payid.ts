import { decryptToken } from "./crypto";

const PAYID_BASE_URL = process.env.PAYID_API_URL!;
const CLIENT_ID = process.env.OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URL!;

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserInfo {
  sub: string;
  pay_tag: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified: boolean;
  phone?: string;
  phone_verified?: boolean;
  kyc_verified?: boolean;
  verification_level?: string;
}

export interface KYCVerifyRequest {
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  provider: "qoreid" | "plaid";
  documentType?: string;
  documentNumber?: string;
  gender?: string;
  gaveConsent?: boolean;
  address?: {
    street: string;
    street2?: string;
    city: string;
    region: string;
    postal_code: string;
    country: string;
  };
  idNumber?: string;
  idNumberType?: string;
}

export interface KYCVerifyResponse {
  sessionId: string;
  status: "pending" | "verified" | "failed";
  provider: string;
  verificationLevel?: string;
  shareableUrl?: string;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const response = await fetch(`${PAYID_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Token exchange failed");
  }

  return response.json();
}

// Refresh access token
export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const decryptedToken = decryptToken(refreshToken);

  const response = await fetch(`${PAYID_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: decryptedToken,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Token refresh failed");
  }

  return response.json();
}

// Get user info from PayID
export async function getUserInfo(accessToken: string): Promise<UserInfo> {
  const decryptedToken = decryptToken(accessToken);

  const response = await fetch(`${PAYID_BASE_URL}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${decryptedToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  return response.json();
}

// Initiate KYC verification
export async function initiateKYCVerification(
  accessToken: string,
  data: KYCVerifyRequest,
): Promise<KYCVerifyResponse> {
  const decryptedToken = decryptToken(accessToken);

  const response = await fetch(`${PAYID_BASE_URL}/api/v1/kyc/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${decryptedToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "KYC verification failed");
  }

  return response.json();
}

// Check KYC status
export async function checkKYCStatus(
  accessToken: string,
  sessionId?: string,
): Promise<KYCVerifyResponse> {
  const decryptedToken = decryptToken(accessToken);
  const url = sessionId
    ? `${PAYID_BASE_URL}/api/v1/kyc/verify/${sessionId}`
    : `${PAYID_BASE_URL}/api/v1/kyc/status`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${decryptedToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to check KYC status");
  }

  return response.json();
}

// Retry KYC verification
export async function retryKYCVerification(
  accessToken: string,
  sessionId: string,
): Promise<KYCVerifyResponse> {
  const decryptedToken = decryptToken(accessToken);

  const response = await fetch(
    `${PAYID_BASE_URL}/api/v1/kyc/retry/${sessionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${decryptedToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "KYC retry failed");
  }

  return response.json();
}
