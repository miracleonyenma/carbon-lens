// PayID Service Types

export interface PayIDOAuthInitiateResponse {
  authorizationUrl: string;
}

export interface PayIDUserInfo {
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
  kyc_verified: boolean;
  verification_level?: string;
}

export interface KYCVerificationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  country: string;
  address?: {
    street: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  identityNumbers: {
    NIN?: string;
    BVN?: string;
    idNumber?: string;
    idNumberType?: string;
    SSN?: string;
  };
  gender?: "male" | "female" | "other";
}

export interface KYCVerificationResponse {
  sessionId: string;
  provider: "qoreid" | "plaid";
  kycStatus: "pending" | "verified" | "failed";
  verificationLevel?: string;
  shareableUrl?: string;
  kycVerified: boolean;
  message: string;
}

export interface KYCStatusResponse {
  hasSession: boolean;
  isConnected: boolean;
  sessionId?: string;
  kycStatus?: "pending" | "verified" | "failed";
  kycVerified: boolean;
  verificationLevel?: string;
  provider?: "qoreid" | "plaid";
  shareableUrl?: string;
  updatedAt?: string;
}

export interface TokenRefreshResponse {
  success: boolean;
}
