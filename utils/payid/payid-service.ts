import { HttpClient, isApiResponse } from "@/utils/aevr/http-client";
import type {
  PayIDOAuthInitiateResponse,
  PayIDUserInfo,
  KYCVerificationRequest,
  KYCVerificationResponse,
  KYCStatusResponse,
  TokenRefreshResponse,
} from "./types";

export class PayIDService extends HttpClient {
  /**
   * Initiate OAuth flow
   * Returns authorization URL to redirect user to PayID
   */
  async initiateOAuth(data?: {
    ref?: string;
    returnUrl?: string;
  }): Promise<PayIDOAuthInitiateResponse> {
    const response = await this.post<PayIDOAuthInitiateResponse>(
      "/api/v1/payid/oauth/initiate",
      data || {},
    );

    if (isApiResponse<PayIDOAuthInitiateResponse>(response)) {
      return response.data;
    }

    return response as PayIDOAuthInitiateResponse;
  }

  /**
   * Request OAuth Magic Link from PayID API proxy
   * Dispatches a magic link to the user's email that redirects securely through the PayID OAuth flow
   */
  async requestOAuthMagicLink(data: {
    email: string;
    shouldCreate?: boolean;
    firstName?: string;
    lastName?: string;
  }): Promise<{ success: boolean; message: string; data?: unknown }> {
    const response = await this.post<{
      success: boolean;
      message: string;
      data?: unknown;
    }>("/api/v1/payid/oauth/login/magic-link/request", data);

    if (isApiResponse<{ success: boolean; message: string }>(response)) {
      return response.data;
    }

    return response as { success: boolean; message: string };
  }

  /**
   * Get PayID user information
   */
  async getUserInfo(): Promise<PayIDUserInfo> {
    const response = await this.get<PayIDUserInfo>("/api/v1/payid/userinfo");

    if (isApiResponse<PayIDUserInfo>(response)) {
      return response.data;
    }

    return response as PayIDUserInfo;
  }

  /**
   * Refresh expired access token
   */
  async refreshToken(): Promise<TokenRefreshResponse> {
    const response = await this.post<TokenRefreshResponse>(
      "/api/v1/payid/oauth/token/refresh",
      {},
    );

    if (isApiResponse<TokenRefreshResponse>(response)) {
      return response.data;
    }

    return response as TokenRefreshResponse;
  }

  /**
   * Initiate KYC verification
   */
  async initiateKYC(
    data: KYCVerificationRequest,
  ): Promise<KYCVerificationResponse> {
    const response = await this.post<KYCVerificationResponse>(
      "/api/v1/payid/kyc/verify",
      data,
    );

    if (isApiResponse<KYCVerificationResponse>(response)) {
      return response.data;
    }

    return response as KYCVerificationResponse;
  }

  /**
   * Get current user's KYC status
   */
  async getKYCStatus(): Promise<KYCStatusResponse> {
    const response = await this.get<KYCStatusResponse>(
      "/api/v1/payid/kyc/status",
    );

    if (isApiResponse<KYCStatusResponse>(response)) {
      return response.data;
    }

    return response as KYCStatusResponse;
  }

  /**
   * Get KYC status for a specific session
   */
  async getKYCSessionStatus(sessionId: string): Promise<KYCStatusResponse> {
    const response = await this.get<KYCStatusResponse>(
      `/api/v1/payid/kyc/status/${sessionId}`,
    );

    if (isApiResponse<KYCStatusResponse>(response)) {
      return response.data;
    }

    return response as KYCStatusResponse;
  }

  /**
   * Retry failed KYC verification
   */
  async retryKYC(sessionId: string): Promise<KYCVerificationResponse> {
    const response = await this.post<KYCVerificationResponse>(
      `/api/v1/payid/kyc/retry/${sessionId}`,
      {},
    );

    if (isApiResponse<KYCVerificationResponse>(response)) {
      return response.data;
    }

    return response as KYCVerificationResponse;
  }

  /**
   * Poll KYC status until verification completes or times out
   * @param sessionId - The KYC session ID to poll
   * @param maxAttempts - Maximum number of polling attempts (default: 20)
   * @param interval - Interval between polls in milliseconds (default: 3000)
   */
  async pollKYCStatus(
    sessionId: string,
    maxAttempts: number = 20,
    interval: number = 3000,
  ): Promise<{ verified: boolean; status: KYCStatusResponse }> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getKYCSessionStatus(sessionId);

      if (status.kycStatus === "verified") {
        return { verified: true, status };
      }

      if (status.kycStatus === "failed") {
        return { verified: false, status };
      }

      // Still pending, wait before next poll
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    // Timeout
    const finalStatus = await this.getKYCSessionStatus(sessionId);
    return { verified: false, status: finalStatus };
  }
}
