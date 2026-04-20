"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter, useSearchParams } from "next/navigation";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  MinimalMultiStep,
  MinimalStepProps,
} from "@/components/ui/aevr/multistep";
import { AuthService, AuthConfig } from "../../utils/auth";
import { RegisterOptions } from "../../utils/auth/types";
import { PayIDService } from "@/utils/payid";
import { useStatus } from "@/hooks/aevr/use-status";
import { Calligraph } from "calligraph";
import Loader from "@/components/ui/aevr/loader";
import { InfoBox } from "@/components/ui/aevr/info-box";
import Link from "next/link";
import { PhoneInput } from "@/components/ui/aevr/phone-input";
import type { E164Number } from "libphonenumber-js/core";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
  TagIcon,
} from "lucide-react";

// Configuration for AuthService
const authConfig: AuthConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:6960",
  clientId:
    process.env.NEXT_PUBLIC_CLIENT_ID ||
    "client_6134855fcb477b2ecf4bc7dac65cfec2",
  redirectUri:
    process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/callback",
};

const authService = new AuthService(authConfig);

const AuthForm: React.FC<{
  mode: "login" | "register" | "magic-link" | "otp" | "forgot-password";
  options?: {
    showHeader?: false;
  };
  initialReferralCode?: string;
}> = ({ mode, options, initialReferralCode }) => {
  const { setStatus, aggregatedStatus } = useStatus({
    defaultStatuses: {
      payidLoading: {
        key: "payidLoading",
        message: "Connect with PayID",
        status: "idle",
        name: "PayID Login",
      },
    },
    aggregation: {
      enabled: true,
    },
  });

  const handlePayIDLogin = async () => {
    try {
      setStatus("payidLoading", {
        status: "loading",
        message: "Connecting to PayID...",
      });

      // Create PayID service (no auth token needed for OAuth initiation)
      const payidService = new PayIDService();
      const currentRef = urlRef || initialReferralCode;

      console.log("PAYID INIT REF PAYLOAD ->", currentRef);

      // Initiate OAuth flow
      const { authorizationUrl } = await payidService.initiateOAuth({
        ...(currentRef ? { ref: currentRef } : {}),
        returnUrl: finalReturnUrl || undefined,
      });

      // Redirect to PayID authorization
      window.location.href = authorizationUrl;
    } catch (error) {
      let msg = "Failed to connect PayID. Please try again.";
      if (error instanceof Error) {
        msg = error.message;
      }
      setStatus("payidLoading", {
        status: "error",
        message: msg,
      });
      sileo.error({
        title: "PayID Connection Failed",
        description: msg,
      });
    }
  };

  const { showHeader } = options || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<
    "password" | "otp" | "magic-link"
  >("password");
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  // Get return_url from query parameters (for OAuth flow)
  const oauthReturnUrl = searchParams.get("return_url");
  // Get returnUrl from query parameters (for auth guard redirects)
  const authReturnUrl = searchParams.get("returnUrl");
  // Decode the returnUrl if it exists (it comes URL-encoded from the auth guard)
  const decodedAuthReturnUrl = authReturnUrl
    ? decodeURIComponent(authReturnUrl)
    : null;
  // Use auth guard returnUrl first, then OAuth return_url, then default to dashboard
  const finalReturnUrl = decodedAuthReturnUrl || oauthReturnUrl;

  // Check if we're coming from an OTP email link
  const urlEmail = searchParams.get("email");
  const urlOtp = searchParams.get("otp");
  const urlSent = searchParams.get("sent");
  const urlRef = searchParams.get("ref");

  const [isVerifyingFromUrl, setIsVerifyingFromUrl] = useState(false);

  // Auto-fill OTP if coming from email link
  useEffect(() => {
    // Handling login auto-fill
    if (urlEmail && urlOtp && urlSent === "true" && mode === "login") {
      setLoginMethod("otp");
      setOtpSent(true);
      setOtpEmail(urlEmail);
      // Set initial values instead of using setFieldValue
      loginFormik.values.email = urlEmail;
      loginFormik.values.otp = urlOtp;
    }

    // Handling register/verify auto-verification
    if (urlEmail && urlOtp && (mode === "register" || mode === "otp")) {
      const verifyFromUrl = async () => {
        setIsVerifyingFromUrl(true);
        setLoading(true);
        try {
          const redirectUrl = await authService.verifyOtp(
            urlEmail,
            urlOtp,
            finalReturnUrl || undefined,
          );
          if (redirectUrl) {
            sileo.success({
              title: "Account verified!",
              description: "Welcome to PayID. Redirecting...",
            });
            window.location.href = redirectUrl;
          } else {
            sileo.success({
              title: "Account verified!",
              description: "Welcome to PayID.",
            });
            router.push(finalReturnUrl || "/dashboard");
          }
        } catch (err) {
          console.error("URL Verification error:", err);
          setError("The verification link has expired or is invalid.");
          sileo.error({
            title: "Verification failed",
            description: "Please log in and try requesting a new code.",
          });
          setIsVerifyingFromUrl(false);
          setLoading(false);
          // If we fail verification, switch to login tab or prompt for login
          if (mode === "register") {
            router.push("/login?email=" + encodeURIComponent(urlEmail));
          }
        }
      };

      verifyFromUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlEmail, urlOtp, urlSent, mode]);

  // --- LOGIN FORM LOGIC ---
  const loginFormik = useFormik({
    initialValues: {
      email: "",
      password: "",
      otp: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .trim()
        .lowercase()
        .email("Please enter a valid email address")
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "Email must have a valid domain (e.g., example.com)",
        )
        .required("Email is required"),
      password:
        loginMethod === "password"
          ? Yup.string()
              .min(6, "Password must be at least 6 characters")
              .required("Password is required")
          : Yup.string(),
      otp:
        loginMethod === "otp" && otpSent
          ? Yup.string()
              .length(6, "OTP must be 6 digits")
              .matches(/^\d+$/, "OTP must contain only numbers")
              .required("OTP is required")
          : Yup.string(),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);
      try {
        if (loginMethod === "password") {
          const response = await authService.loginWithPassword({
            email: values.email,
            password: values.password,
            returnUrl: finalReturnUrl || undefined,
          });

          if (response.success) {
            sileo.success({
              title: "Login successful",
              description: "Redirecting to your dashboard...",
            });
            if (response.redirectUrl) {
              window.location.href = response.redirectUrl;
            } else {
              // Use finalReturnUrl if available, otherwise default to dashboard
              const destination = finalReturnUrl || "/dashboard";
              router.push(destination);
            }
          } else {
            setError("Login failed. Please check your credentials.");
            sileo.error({
              title: "Login failed",
              description: "Please check your credentials and try again.",
            });
          }
        } else if (loginMethod === "magic-link") {
          const response = await authService.requestMagicLink(
            values.email,
            finalReturnUrl || undefined,
            true, // shouldCreate (login and registration act as an upsert via magic link so send true to allow account creation if missing)
          );
          if (response.success) {
            setError(null);
            sileo.success({
              title: "Magic link sent!",
              description: "Check your email to complete login.",
              duration: 8000,
            });
          } else {
            setError("Failed to send magic link.");
            sileo.error({
              title: "Failed to send magic link",
              description: "Please try again or use a different login method.",
            });
          }
        } else if (loginMethod === "otp") {
          if (!otpSent) {
            // Request OTP
            const response = await authService.requestOtp(
              values.email,
              true, // shouldCreate (login and registration act as an upsert via OTP so send true to allow account creation if missing)
              finalReturnUrl || undefined,
            );
            if (response.success) {
              setOtpSent(true);
              setOtpEmail(values.email);
              sileo.success({
                title: "OTP sent",
                description: "Check your email for the verification code.",
                duration: 6000,
              });
            } else {
              setError("Failed to send OTP.");
              sileo.error({
                title: "Failed to send OTP",
                description:
                  "Please try again or use a different login method.",
              });
            }
          } else {
            // Verify OTP
            const redirectUrl = await authService.verifyOtp(
              otpEmail || values.email || "",
              values.otp || "",
              finalReturnUrl || undefined,
            );
            if (redirectUrl) {
              sileo.success({
                title: "OTP verified",
                description: "Redirecting...",
              });
              window.location.href = redirectUrl;
            } else {
              sileo.success({
                title: "OTP verified",
                description: "Login successful!",
              });
              // Use finalReturnUrl if available, otherwise default to dashboard
              const destination = finalReturnUrl || "/dashboard";
              router.push(destination);
            }
          }
        }
      } catch (err) {
        console.error("Login error:", err);
        const errorMessage =
          (err as Error).message || "An unexpected error occurred.";
        setError(errorMessage);
        sileo.error({
          title: "Login error",
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    },
  });

  // --- REGISTER FORM STEPS ---
  const ProfileStep = ({
    values,
    setValues,
    next,
    stepInfo,
  }: MinimalStepProps<RegisterOptions>) => {
    const stepFormik = useFormik({
      initialValues: {
        firstName: values.firstName || "",
        lastName: values.lastName || "",
        phone: values.phone || "",
      },
      validationSchema: Yup.object({
        firstName: Yup.string()
          .trim()
          .min(2, "First name must be at least 2 characters")
          .max(50, "First name must be less than 50 characters")
          .matches(
            /^[a-zA-Z\s'-]+$/,
            "First name can only contain letters, spaces, hyphens, and apostrophes",
          )
          .required("First name is required"),
        lastName: Yup.string()
          .trim()
          .min(2, "Last name must be at least 2 characters")
          .max(50, "Last name must be less than 50 characters")
          .matches(
            /^[a-zA-Z\s'-]+$/,
            "Last name can only contain letters, spaces, hyphens, and apostrophes",
          )
          .required("Last name is required"),
        phone: Yup.string()
          .optional()
          .test(
            "is-valid-phone",
            "Please enter a valid phone number",
            (value) => {
              if (!value) return true; // Optional field
              // Basic E.164 format validation (+ followed by 7-15 digits)
              return /^\+[1-9]\d{6,14}$/.test(value);
            },
          ),
      }),
      onSubmit: (stepValues) => {
        const newValues = {
          ...values,
          firstName: stepValues.firstName,
          lastName: stepValues.lastName,
          phone: stepValues.phone,
        };
        setValues((prev: Partial<RegisterOptions>) => ({
          ...prev,
          ...newValues,
        }));
        next(newValues);
      },
    });

    return (
      <form onSubmit={stepFormik.handleSubmit}>
        {stepInfo && (
          <div className="text-muted-foreground mb-4 text-xs font-medium tracking-wider uppercase">
            Step {stepInfo.currentStep + 1} of {stepInfo.totalSteps}
          </div>
        )}
        <FieldGroup>
          <Field>
            <FieldLabel>First Name</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <UserIcon size={20} className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                name="firstName"
                placeholder="John"
                value={stepFormik.values.firstName}
                onChange={stepFormik.handleChange}
                onBlur={stepFormik.handleBlur}
              />
            </InputGroup>
            <FieldError>
              {stepFormik.touched.firstName && stepFormik.errors.firstName}
            </FieldError>
          </Field>
          <Field>
            <FieldLabel>Last Name</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <UserIcon size={20} className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                name="lastName"
                placeholder="Doe"
                value={stepFormik.values.lastName}
                onChange={stepFormik.handleChange}
                onBlur={stepFormik.handleBlur}
              />
            </InputGroup>
            <FieldError>
              {stepFormik.touched.lastName && stepFormik.errors.lastName}
            </FieldError>
          </Field>
          <Field>
            <FieldLabel>Phone Number (Optional)</FieldLabel>
            <PhoneInput
              name="phone"
              placeholder="Enter phone number"
              value={stepFormik.values.phone as E164Number}
              onChange={(value) =>
                stepFormik.setFieldValue("phone", value || "")
              }
              onBlur={stepFormik.handleBlur}
              defaultCountry="US"
            />
            <FieldError>
              {stepFormik.touched.phone && stepFormik.errors.phone}
            </FieldError>
          </Field>
          <Button type="submit" className="w-full">
            Next
          </Button>
        </FieldGroup>
      </form>
    );
  };

  const CredentialsStep = ({
    values,
    setValues,
    next,
    prev,
    stepInfo,
  }: MinimalStepProps<RegisterOptions>) => {
    const [showStepPassword, setShowStepPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const stepFormik = useFormik({
      initialValues: {
        email: values.email || "",
        password: values.password || "",
        confirmPassword: "",
        referralCode: urlRef || initialReferralCode || "",
      },
      validationSchema: Yup.object({
        email: Yup.string()
          .trim()
          .lowercase()
          .email("Please enter a valid email address")
          .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "Email must have a valid domain (e.g., example.com)",
          )
          .required("Email is required"),
        password: Yup.string()
          .min(8, "Password must be at least 8 characters")
          .max(128, "Password must be less than 128 characters")
          .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
          )
          .required("Password is required"),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref("password")], "Passwords must match")
          .required("Please confirm your password"),
        referralCode: Yup.string().optional(),
      }),
      onSubmit: async (stepValues) => {
        setLoading(true);
        setError(null);
        try {
          const newValues = {
            ...values,
            email: stepValues.email,
            password: stepValues.password,
          };

          // 1. Hit the register endpoint
          const registerResponse = await authService.register({
            ...newValues,
            returnUrl: finalReturnUrl || undefined,
            referralCode: stepValues.referralCode || undefined,
          });

          if (!registerResponse.success) {
            throw new Error("Registration failed.");
          }

          // 2. Request OTP
          const otpResponse = await authService.requestOtp(
            stepValues.email,
            false, // Should not create since we just registered them
            finalReturnUrl || undefined,
          );

          if (!otpResponse.success) {
            throw new Error("Failed to send verification email.");
          }

          sileo.success({
            title: "Verification Email Sent",
            description: "Please check your inbox for the OTP.",
            duration: 5000,
          });

          setValues((prev: Partial<RegisterOptions>) => ({
            ...prev,
            ...newValues,
          }));
          next(newValues);
        } catch (err) {
          console.error("CredentialsStep error:", err);
          const errorMessage = (err as Error).message || "An error occurred";
          setError(errorMessage);
          sileo.error({
            title: "Error",
            description: errorMessage,
          });
        } finally {
          setLoading(false);
        }
      },
    });

    return (
      <form onSubmit={stepFormik.handleSubmit}>
        {stepInfo && (
          <div className="text-muted-foreground mb-4 text-xs font-medium tracking-wider uppercase">
            Step {stepInfo.currentStep + 1} of {stepInfo.totalSteps}
          </div>
        )}
        <FieldGroup>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <MailIcon size={20} className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                name="email"
                type="email"
                placeholder="name@example.com"
                value={stepFormik.values.email}
                onChange={stepFormik.handleChange}
                onBlur={stepFormik.handleBlur}
              />
            </InputGroup>
            <FieldError>
              {stepFormik.touched.email && stepFormik.errors.email}
            </FieldError>
          </Field>
          <Field>
            <FieldLabel>Password</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <LockIcon size={20} className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                name="password"
                type={showStepPassword ? "text" : "password"}
                placeholder="••••••••"
                value={stepFormik.values.password}
                onChange={stepFormik.handleChange}
                onBlur={stepFormik.handleBlur}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  onClick={() => setShowStepPassword(!showStepPassword)}
                >
                  {showStepPassword ? (
                    <EyeOffIcon size={20} />
                  ) : (
                    <EyeIcon size={20} />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FieldError>
              {stepFormik.touched.password && stepFormik.errors.password}
            </FieldError>
          </Field>
          <Field>
            <FieldLabel>Confirm Password</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <LockIcon size={20} className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={stepFormik.values.confirmPassword}
                onChange={stepFormik.handleChange}
                onBlur={stepFormik.handleBlur}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon size={20} />
                  ) : (
                    <EyeIcon size={20} />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FieldError>
              {stepFormik.touched.confirmPassword &&
                stepFormik.errors.confirmPassword}
            </FieldError>
          </Field>
          <Field>
            <FieldLabel>Referral Code (Optional)</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <TagIcon size={20} className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                name="referralCode"
                type="text"
                placeholder="Friend's PayTag"
                value={stepFormik.values.referralCode}
                onChange={stepFormik.handleChange}
                onBlur={stepFormik.handleBlur}
              />
            </InputGroup>
            <FieldError>
              {stepFormik.touched.referralCode &&
                (stepFormik.errors.referralCode as string)}
            </FieldError>
          </Field>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={prev}>
              Back
            </Button>
            <Button type="submit" className="grow" disabled={loading}>
              <Calligraph>
                {loading ? "Creating Account..." : "Create Account"}
              </Calligraph>
            </Button>
          </div>
        </FieldGroup>
      </form>
    );
  };

  const VerificationStep = ({
    values,
    setValues,
    next,
  }: MinimalStepProps<RegisterOptions & { otp?: string }>) => {
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
      let timer: ReturnType<typeof setInterval>;
      if (timeLeft > 0) {
        timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      }
      return () => clearInterval(timer);
    }, [timeLeft]);

    const stepFormik = useFormik({
      initialValues: {
        otp: values.otp || "",
      },
      validationSchema: Yup.object({
        otp: Yup.string()
          .length(6, "OTP must be 6 digits")
          .matches(/^\d+$/, "OTP must contain only numbers")
          .required("OTP is required"),
      }),
      onSubmit: (stepValues) => {
        const newValues = {
          ...values,
          otp: stepValues.otp,
        };
        setValues((prev: Partial<RegisterOptions & { otp?: string }>) => ({
          ...prev,
          ...newValues,
        }));
        next(newValues);
      },
    });

    const triggerResent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.requestOtp(
          values.email || "",
          false,
          finalReturnUrl || undefined,
        );
        if (response.success) {
          sileo.success({
            title: "OTP sent",
            description: "Check your email for a new verification code.",
            duration: 6000,
          });
          setTimeLeft(60);
          stepFormik.setFieldValue("otp", "");
        } else {
          throw new Error("Failed to send OTP.");
        }
      } catch (err) {
        setError((err as Error).message || "Failed to resend OTP.");
        sileo.error({
          title: "Failed to resend OTP",
          description: "Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={stepFormik.handleSubmit}>
        <div className="mb-6 text-center">
          <h3 className="text-lg font-semibold tracking-tight">
            Verify your email
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            We sent a secure code to <strong>{values.email}</strong>
          </p>
        </div>
        <FieldGroup>
          <Field>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={stepFormik.values.otp}
                onChange={(value) => stepFormik.setFieldValue("otp", value)}
                onBlur={stepFormik.handleBlur}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <FieldError className="text-center">
              {stepFormik.touched.otp && stepFormik.errors.otp}
            </FieldError>
            <div className="text-muted-foreground mt-4 text-center text-sm">
              Didn&apos;t receive the code?{" "}
              {timeLeft > 0 ? (
                <span>Resend in {timeLeft}s</span>
              ) : (
                <button
                  type="button"
                  onClick={triggerResent}
                  className="text-primary hover:underline font-medium"
                  disabled={loading}
                >
                  Resend Code
                </button>
              )}
            </div>
          </Field>
          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            <Calligraph>
              {loading ? "Verifying..." : "Verify & Continue"}
            </Calligraph>
          </Button>
        </FieldGroup>
      </form>
    );
  };

  // --- RENDER ---

  if (isVerifyingFromUrl) {
    return (
      <Card className="w-full max-w-full shadow-none lg:border-0 lg:ring-0 lg:bg-background">
        <CardContent className="py-12 flex flex-col items-center justify-center space-y-4">
          <Loader loading={true} className="h-8 w-8 text-primary" />
          <h3 className="text-xl font-medium tracking-tight">
            Verifying your email...
          </h3>
        </CardContent>
      </Card>
    );
  }

  if (mode === "register") {
    return (
      <Card className="w-full max-w-full shadow-none lg:border-0 lg:ring-0 lg:bg-background">
        {showHeader && (
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Enter your details to get started</CardDescription>
          </CardHeader>
        )}
        <CardContent className="lg:px-0">
          {error && (
            <InfoBox
              type="error"
              colorScheme={"full"}
              title="Oops.."
              description={error}
              className="mb-4"
              size="sm"
            />
          )}

          <div className="mb-6 grid grid-cols-1 gap-4">
            <Button
              variant="outline"
              className="w-full gap-2 text-primary"
              onClick={handlePayIDLogin}
              type="button"
            >
              <Loader loading={!!aggregatedStatus?.loading} />
              <Calligraph>{aggregatedStatus?.description}</Calligraph>
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                Or continue with
              </span>
            </div>
          </div>
          <Tabs
            defaultValue="password"
            value={loginMethod}
            onValueChange={(value) => {
              setLoginMethod(value as "password" | "otp" | "magic-link");
              if (value === "otp") {
                setOtpSent(false);
              }
            }}
            className="mb-6 w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
            </TabsList>
          </Tabs>

          {loginMethod === "password" ? (
            <MinimalMultiStep<RegisterOptions & { otp?: string }>
              steps={[ProfileStep, CredentialsStep, VerificationStep]}
              initialValues={{
                firstName: "",
                lastName: "",
                phone: "",
                email: "",
                password: "",
                otp: "",
              }}
              persist={false}
              onComplete={async (values) => {
                setLoading(true);
                try {
                  const redirectUrl = await authService.verifyOtp(
                    values.email || "",
                    values.otp || "",
                    finalReturnUrl || undefined,
                  );

                  if (redirectUrl) {
                    sileo.success({
                      title: "Account verified!",
                      description: "Welcome to PayID. Redirecting...",
                    });
                    window.location.href = redirectUrl;
                  } else {
                    sileo.success({
                      title: "Account verified!",
                      description: "Welcome to PayID.",
                    });
                    const destination = finalReturnUrl || "/dashboard";
                    router.push(destination);
                  }
                } catch (err) {
                  console.error("Verification error:", err);
                  const errorMessage =
                    (err as Error).message || "Verification failed";
                  setError(errorMessage);
                  sileo.error({
                    title: "Verification error",
                    description: errorMessage,
                  });
                } finally {
                  setLoading(false);
                }
              }}
              options={{ showBackBtn: false }}
            />
          ) : (
            <form onSubmit={loginFormik.handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <MailIcon size={20} className="text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      value={loginFormik.values.email}
                      onChange={loginFormik.handleChange}
                      onBlur={loginFormik.handleBlur}
                    />
                  </InputGroup>
                  <FieldError>
                    {loginFormik.touched.email && loginFormik.errors.email}
                  </FieldError>
                </Field>

                {loginMethod === "otp" && otpSent && (
                  <Field>
                    <FieldLabel>Enter OTP</FieldLabel>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={loginFormik.values.otp}
                        onChange={(value) =>
                          loginFormik.setFieldValue("otp", value)
                        }
                        onBlur={loginFormik.handleBlur}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <FieldError>
                      {loginFormik.touched.otp && loginFormik.errors.otp}
                    </FieldError>
                    <div className="text-muted-foreground mt-2 text-center text-sm">
                      Didn&apos;t receive the code?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          loginFormik.setFieldValue("otp", "");
                        }}
                        className="text-primary hover:underline"
                      >
                        Resend
                      </button>
                    </div>
                  </Field>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  <Calligraph>
                    {loading
                      ? "Processing..."
                      : loginMethod === "magic-link"
                        ? "Send Magic Link"
                        : otpSent
                          ? "Verify OTP"
                          : "Send OTP"}
                  </Calligraph>
                </Button>
              </FieldGroup>
            </form>
          )}
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link
              href={`/login${finalReturnUrl ? `?returnUrl=${encodeURIComponent(finalReturnUrl)}` : ""}`}
              className="text-primary hover:underline"
            >
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: Login
  return (
    <Card className="w-full max-w-full shadow-none lg:border-0 lg:ring-0 lg:bg-background">
      {showHeader && (
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className="lg:px-0">
        {error && (
          <InfoBox
            type="error"
            title="Oops.."
            description={error}
            className="mb-4"
            size="sm"
          />
        )}

        <div className="mb-6 grid grid-cols-1 gap-4">
          <Button
            variant="outline"
            className="w-full gap-2 text-primary"
            onClick={handlePayIDLogin}
            type="button"
          >
            <Loader loading={!!aggregatedStatus?.loading} />
            <Calligraph>{aggregatedStatus?.description}</Calligraph>
          </Button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background text-muted-foreground px-2">
              Or continue with
            </span>
          </div>
        </div>
        <Tabs
          defaultValue="password"
          value={loginMethod}
          onValueChange={(value) => {
            setLoginMethod(value as "password" | "otp" | "magic-link");
            if (value === "otp") {
              setOtpSent(false);
            }
          }}
          className="mb-6 w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="otp">OTP</TabsTrigger>
            <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={loginFormik.handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <MailIcon size={20} className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={loginFormik.values.email}
                  onChange={loginFormik.handleChange}
                  onBlur={loginFormik.handleBlur}
                />
              </InputGroup>
              <FieldError>
                {loginFormik.touched.email && loginFormik.errors.email}
              </FieldError>
            </Field>

            {loginMethod === "password" && (
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Password</FieldLabel>
                  {/* <a href="/forgot-password" class="text-xs text-muted-foreground hover:text-primary">Forgot?</a> */}
                </div>
                <InputGroup>
                  <InputGroupAddon>
                    <LockIcon size={20} className="text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginFormik.values.password}
                    onChange={loginFormik.handleChange}
                    onBlur={loginFormik.handleBlur}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon size={20} />
                      ) : (
                        <EyeIcon size={20} />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError>
                  {loginFormik.touched.password && loginFormik.errors.password}
                </FieldError>
              </Field>
            )}

            {loginMethod === "otp" && otpSent && (
              <Field>
                <FieldLabel>Enter OTP</FieldLabel>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={loginFormik.values.otp}
                    onChange={(value) =>
                      loginFormik.setFieldValue("otp", value)
                    }
                    onBlur={loginFormik.handleBlur}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <FieldError>
                  {loginFormik.touched.otp && loginFormik.errors.otp}
                </FieldError>
                <div className="text-muted-foreground mt-2 text-center text-sm">
                  Didn&apos;t receive the code?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      loginFormik.setFieldValue("otp", "");
                    }}
                    className="text-primary hover:underline"
                  >
                    Resend
                  </button>
                </div>
              </Field>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              <Calligraph>
                {loading
                  ? "Processing..."
                  : loginMethod === "password"
                    ? "Log in"
                    : loginMethod === "magic-link"
                      ? "Send Magic Link"
                      : otpSent
                        ? "Verify OTP"
                        : "Send OTP"}
              </Calligraph>
            </Button>
          </FieldGroup>
        </form>

        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href={`/register${finalReturnUrl ? `?returnUrl=${encodeURIComponent(finalReturnUrl)}` : ""}`}
            className="text-primary hover:underline"
          >
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthForm;
