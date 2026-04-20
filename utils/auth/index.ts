import { RegisterOptions } from "./types";

export interface AuthConfig {
  baseUrl: string;
  clientId: string;
  redirectUri: string;
}

export class AuthService {
  constructor(private _config: AuthConfig) {}

  async loginWithPassword(
    data: unknown,
  ): Promise<{ success: boolean; redirectUrl?: string }> {
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      return {
        success: true,
        redirectUrl:
          (data as { returnUrl?: string })?.returnUrl || "/dashboard",
      };
    } catch (error: unknown) {
      console.error(error);
      throw error;
    }
  }

  async requestMagicLink(
    email: string,
    returnUrl?: string,
    shouldCreate?: boolean, // VERY IMPORTANT (this allows us to create an account if no account exists for this email)
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch("/api/v1/auth/magic-link/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, shouldCreate, returnUrl }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      return { success: true, message: result.message };
    } catch (error: unknown) {
      console.error(error);
      throw error;
    }
  }

  async requestOtp(
    email: string,
    shouldCreate?: boolean, // VERY IMPORTANT (this allows us to create an account if no account exists for this email)
    returnUrl?: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch("/api/v1/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, shouldCreate, returnUrl }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      return { success: true, message: result.message };
    } catch (error: unknown) {
      console.error(error);
      throw error;
    }
  }

  async verifyOtp(
    email: string,
    otp: string,
    returnUrl?: string,
  ): Promise<string | undefined> {
    try {
      const response = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, returnUrl }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      return result.redirectUrl || "/dashboard";
    } catch (error: unknown) {
      console.error(error);
      throw error;
    }
  }

  async register(
    data: RegisterOptions,
  ): Promise<{ success: boolean; redirectUrl?: string }> {
    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      return { success: true, redirectUrl: data.returnUrl || "/dashboard" };
    } catch (error: unknown) {
      console.error(error);
      throw error;
    }
  }
}
