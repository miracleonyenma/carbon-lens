// ./src/utils/emails/index.ts

import dotenv from "dotenv";
import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
import { SendMailClient } from "zeptomail";
import { Resend } from "resend";

dotenv.config();

// Environment variables
const APP_NAME = process.env.APP_NAME || "Application";
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;
const MAIL_LOGO = process.env.MAIL_LOGO || "https://via.placeholder.com/48";
const APP_SUPPORT_MAIL = process.env.APP_SUPPORT_MAIL || MAIL_USER;
const ZOHO_KEY = process.env.ZOHO_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_MAIL_PROVIDER = process.env.DEFAULT_MAIL_PROVIDER || "nodemailer"; // 'nodemailer', 'zeptomail', or 'resend'

// Email Provider Interface
interface EmailProviderInterface {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  sendTemplateEmail(
    options: TemplateOptions,
    emailOptions: EmailOptions,
  ): Promise<EmailResult>;
}

// Recipient type
interface Recipient {
  email: string;
  name?: string;
}

// Attachment type
interface Attachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  path?: string;
  cid?: string;
}

// Email sending options
interface EmailOptions {
  subject: string;
  htmlBody: string;
  textBody?: string;
  to: Recipient | Recipient[];
  from?: Recipient;
  cc?: Recipient[];
  bcc?: Recipient[];
  attachments?: Attachment[];
  replyTo?: string;
}

// Template options
interface TemplateOptions {
  templateId?: string;
  templateContent?: string;
  templateData?: Record<string, string | unknown>;
}

// Result of email sending
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: unknown;
}

// Social media link type
interface SocialLink {
  name: string;
  url: string;
}

/**
 * Configuration options for the modern minimal email template.
 */
interface StandardTemplateOptions {
  /** The main heading of the email (rendered in bold, large font) */
  title: string;
  /** The HTML content body of the email */
  content: string;
  /** Text for the primary Call-To-Action button */
  buttonText?: string;
  /** Destination URL for the primary Call-To-Action button */
  buttonUrl?: string;
  /** URL for the company logo (defaults to MAIL_LOGO) */
  logoUrl?: string;
  /** Optional image URL for a hero/banner image below the header */
  bannerUrl?: string;
  /** Hex code for the CTA button (e.g., '#00D18B' or '#000000') */
  brandColor?: string;
  /** Array of social media objects { name: string, url: string } */
  socialLinks?: Array<{ name: string; url: string }>;
  /** Custom footer copyright or legal text */
  footerText?: string;
  /** Contact email address for the help section */
  supportEmail?: string;
}

/**
 * Nodemailer Provider Implementation
 */
class NodemailerProvider implements EmailProviderInterface {
  private transporter: Transporter | null = null;
  private defaultFromEmail: string;
  private defaultFromName: string;
  private testAccountConfig: boolean = false;

  constructor(config: {
    user?: string;
    pass?: string;
    service?: string;
    host?: string;
    port?: number;
    secure?: boolean;
    defaultFromEmail?: string;
    defaultFromName?: string;
  }) {
    this.defaultFromEmail =
      config.defaultFromEmail || MAIL_USER || "noreply@example.com";
    this.defaultFromName =
      config.defaultFromName || APP_NAME || "Notification Service";

    // Create transporter based on config
    if (config.user && config.pass) {
      if (config.service) {
        this.transporter = nodemailer.createTransport({
          service: config.service,
          auth: {
            user: config.user,
            pass: config.pass,
          },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: config.host || "smtp.gmail.com",
          port: config.port || 587,
          secure: config.secure || false,
          auth: {
            user: config.user,
            pass: config.pass,
          },
        });
      }
    } else {
      // Flag for testing environments to lazily generate nodemailer ethereal testing account on first send
      this.testAccountConfig = true;
      console.warn(
        "Using Ethereal test account flag for email. Real emails will not be delivered unless explicitly configured.",
      );
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      if (this.testAccountConfig && !this.transporter) {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.warn(
          "Using freshly generated Ethereal test account for mock email delivery.",
        );
      }

      if (!this.transporter) {
        throw new Error("Email transporter not initialized properly");
      }
      const fromEmail = options.from?.email || this.defaultFromEmail;
      const fromName = options.from?.name || this.defaultFromName;

      const mailOptions: SendMailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: Array.isArray(options.to)
          ? options.to.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email))
          : options.to.name
            ? `${options.to.name} <${options.to.email}>`
            : options.to.email,
        subject: options.subject,
        html: options.htmlBody,
        text: options.textBody,
        replyTo: options.replyTo || fromEmail,
      };

      // Add CC if provided
      if (options.cc && options.cc.length > 0) {
        mailOptions.cc = options.cc.map((recipient) =>
          recipient.name
            ? `${recipient.name} <${recipient.email}>`
            : recipient.email,
        );
      }

      // Add BCC if provided
      if (options.bcc && options.bcc.length > 0) {
        mailOptions.bcc = options.bcc.map((recipient) =>
          recipient.name
            ? `${recipient.name} <${recipient.email}>`
            : recipient.email,
        );
      }

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments;
      }

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        details: info,
      };
    } catch (error) {
      console.error("Failed to send email via Nodemailer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      };
    }
  }

  async sendTemplateEmail(
    options: TemplateOptions,
    emailOptions: EmailOptions,
  ): Promise<EmailResult> {
    try {
      if (options.templateContent) {
        return this.sendEmail({
          ...emailOptions,
          htmlBody: options.templateContent,
        });
      } else {
        throw new Error("Template content must be provided for Nodemailer");
      }
    } catch (error) {
      console.error("Failed to send template email via Nodemailer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      };
    }
  }
}

/**
 * ZeptoMail Provider Implementation
 */
class ZeptoMailProvider implements EmailProviderInterface {
  private client: SendMailClient;
  private apiKey: string;
  private apiUrl: string;
  private defaultFromEmail: string;
  private defaultFromName: string;

  constructor(config: {
    apiKey?: string;
    apiUrl?: string;
    defaultFromEmail?: string;
    defaultFromName?: string;
  }) {
    this.apiKey = config.apiKey || ZOHO_KEY || "";
    this.apiUrl = config.apiUrl || "https://api.zeptomail.com/";
    this.defaultFromEmail = config.defaultFromEmail || "noreply@example.com";
    this.defaultFromName =
      config.defaultFromName || APP_NAME || "Notification Service";

    if (!this.apiKey) {
      console.warn("ZeptoMail API key not provided. Email sending will fail.");
    }

    // Initialize the ZeptoMail client
    this.client = new SendMailClient({
      url: this.apiUrl,
      token: this.apiKey,
    });
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Define the email payload with TypeScript interface
      interface ZeptoMailPayload {
        from: {
          address: string;
          name: string;
        };
        to: Array<{
          email_address: {
            address: string;
            name: string;
          };
        }>;
        subject: string;
        htmlbody: string;
        textbody?: string;
        cc?: Array<{
          email_address: {
            address: string;
            name: string;
          };
        }>;
        bcc?: Array<{
          email_address: {
            address: string;
            name: string;
          };
        }>;
        reply_to?: Array<{
          address: string;
          name: string;
        }>;
        attachments?: Array<{
          name: string;
          content: string;
          mime_type: string;
        }>;
      }

      // Prepare email payload
      const emailPayload: ZeptoMailPayload = {
        from: {
          address: options.from?.email || this.defaultFromEmail,
          name: options.from?.name || this.defaultFromName,
        },
        to: (Array.isArray(options.to) ? options.to : [options.to]).map(
          (recipient) => ({
            email_address: {
              address: recipient.email,
              name: recipient.name || recipient.email.split("@")[0],
            },
          }),
        ),
        subject: options.subject,
        htmlbody: options.htmlBody,
      };

      // Add text body if provided
      if (options.textBody) {
        emailPayload.textbody = options.textBody;
      }

      // Add CC recipients if provided
      if (options.cc && Array.isArray(options.cc) && options.cc.length > 0) {
        emailPayload.cc = options.cc.map((recipient) => ({
          email_address: {
            address: recipient.email,
            name: recipient.name || recipient.email.split("@")[0],
          },
        }));
      }

      // Add BCC recipients if provided
      if (options.bcc && Array.isArray(options.bcc) && options.bcc.length > 0) {
        emailPayload.bcc = options.bcc.map((recipient) => ({
          email_address: {
            address: recipient.email,
            name: recipient.name || recipient.email.split("@")[0],
          },
        }));
      }

      // Add reply-to if provided
      if (options.replyTo) {
        emailPayload.reply_to = [
          {
            address: options.replyTo,
            name: "",
          },
        ];
      }

      // Add attachments if provided
      if (
        options.attachments &&
        Array.isArray(options.attachments) &&
        options.attachments.length > 0
      ) {
        emailPayload.attachments = options.attachments.map((attachment) => ({
          name: attachment.filename,
          content:
            typeof attachment.content === "string"
              ? attachment.content
              : attachment.content.toString("base64"),
          mime_type: attachment.contentType || "application/octet-stream",
        }));
      }

      // Send the email
      const response = await this.client.sendMail(emailPayload);

      return {
        success: true,
        messageId:
          (response as { messageId?: string; data?: { request_id?: string } })
            ?.messageId ||
          (response as { messageId?: string; data?: { request_id?: string } })
            ?.data?.request_id ||
          undefined,
        details: response,
      };
    } catch (error) {
      console.error("Failed to send email via ZeptoMail:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      };
    }
  }

  async sendTemplateEmail(
    options: TemplateOptions,
    emailOptions: EmailOptions,
  ): Promise<EmailResult> {
    try {
      // Define ZeptoMail template payload interface
      interface ZeptoMailTemplatePayload {
        from: {
          address: string;
          name: string;
        };
        to: Array<{
          email_address: {
            address: string;
            name: string;
          };
        }>;
        subject: string;
        template_key: string;
        merge_info?: Record<string, string>;
      }

      // If using a template ID
      if (options.templateId) {
        const templatePayload: ZeptoMailTemplatePayload = {
          from: {
            address: emailOptions.from?.email || this.defaultFromEmail,
            name: emailOptions.from?.name || this.defaultFromName,
          },
          to: (Array.isArray(emailOptions.to)
            ? emailOptions.to
            : [emailOptions.to]
          ).map((recipient) => ({
            email_address: {
              address: recipient.email,
              name: recipient.name || recipient.email.split("@")[0],
            },
          })),
          subject: emailOptions.subject,
          template_key: options.templateId,
        };

        if (options.templateData) {
          templatePayload.merge_info = options.templateData as Record<
            string,
            string
          >;
        }

        const response =
          await this.client.sendMailWithTemplate(templatePayload);

        return {
          success: true,
          messageId:
            (response as { data?: { request_id?: string } })?.data
              ?.request_id || undefined,
          details: response,
        };
      }
      // If using custom template content
      else if (options.templateContent) {
        return await this.sendEmail({
          ...emailOptions,
          htmlBody: options.templateContent,
        });
      } else {
        throw new Error(
          "Either templateId or templateContent must be provided",
        );
      }
    } catch (error) {
      console.error("Failed to send template email via ZeptoMail:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      };
    }
  }
}

/**
 * Resend Provider Implementation
 */
class ResendProvider implements EmailProviderInterface {
  private client: Resend;
  private defaultFromEmail: string;
  private defaultFromName: string;

  constructor(config: {
    apiKey?: string;
    defaultFromEmail?: string;
    defaultFromName?: string;
  }) {
    const apiKey = config.apiKey || RESEND_API_KEY || "";
    this.defaultFromEmail = config.defaultFromEmail || "noreply@example.com";
    this.defaultFromName =
      config.defaultFromName || APP_NAME || "Notification Service";

    if (!apiKey) {
      console.warn("Resend API key not provided. Email sending will fail.");
    }

    this.client = new Resend(apiKey);
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const fromEmail = options.from?.email || this.defaultFromEmail;
      const fromName = options.from?.name || this.defaultFromName;
      const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

      // Define Resend email payload interface
      interface ResendEmailPayload {
        from: string;
        to: string[];
        subject: string;
        html: string;
        text?: string;
        reply_to?: string;
        cc?: string[];
        bcc?: string[];
        attachments?: Array<{
          filename: string;
          content: string | Buffer;
          path?: string;
        }>;
      }

      const payload: ResendEmailPayload = {
        from,
        to: (Array.isArray(options.to) ? options.to : [options.to]).map((r) =>
          r.name ? `${r.name} <${r.email}>` : r.email,
        ),
        subject: options.subject,
        html: options.htmlBody,
      };

      // Add text body if provided
      if (options.textBody) {
        payload.text = options.textBody;
      }

      // Add reply-to if provided
      if (options.replyTo) {
        payload.reply_to = options.replyTo;
      }

      // Add CC if provided
      if (options.cc && options.cc.length > 0) {
        payload.cc = options.cc.map((recipient) =>
          recipient.name
            ? `${recipient.name} <${recipient.email}>`
            : recipient.email,
        );
      }

      // Add BCC if provided
      if (options.bcc && options.bcc.length > 0) {
        payload.bcc = options.bcc.map((recipient) =>
          recipient.name
            ? `${recipient.name} <${recipient.email}>`
            : recipient.email,
        );
      }

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        payload.attachments = options.attachments.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          path: attachment.path,
        }));
      }

      const response = await this.client.emails.send(payload);

      // Handle Resend v3 response format: { data, error }
      const resendResponse = response as Record<string, unknown>;
      const errorObj = resendResponse?.error as
        | { message?: string }
        | undefined;
      const dataObj = resendResponse?.data as { id?: string } | undefined;

      const success = !errorObj && !!(dataObj?.id || resendResponse?.id);
      const messageId =
        (dataObj?.id as string) || (resendResponse?.id as string) || "";

      return {
        success,
        messageId,
        error: errorObj ? errorObj.message : undefined,
        details: response,
      };
    } catch (error) {
      console.error("Failed to send email via Resend:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      };
    }
  }

  async sendTemplateEmail(
    options: TemplateOptions,
    emailOptions: EmailOptions,
  ): Promise<EmailResult> {
    try {
      if (options.templateContent) {
        // Use the content directly if provided
        return await this.sendEmail({
          ...emailOptions,
          htmlBody: options.templateContent,
        });
      } else if (options.templateId) {
        // For Resend, we need to check their API documentation
        // Currently, instead of using template_id directly, we'll use React templates
        // which appears to be the main approach for Resend

        // Define a proper interface for the React template payload
        interface ResendReactTemplatePayload {
          from: string;
          to: string[];
          subject: string;
          react: {
            template_id: string;
            props: Record<string, string | unknown>;
          };
        }

        const fromEmail = emailOptions.from?.email || this.defaultFromEmail;
        const fromName = emailOptions.from?.name || this.defaultFromName;
        const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

        // Create a payload that conforms to Resend's expected format for React templates
        const payload: ResendReactTemplatePayload = {
          from,
          to: (Array.isArray(emailOptions.to)
            ? emailOptions.to
            : [emailOptions.to]
          ).map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
          subject: emailOptions.subject,
          react: {
            template_id: options.templateId,
            props: options.templateData || {},
          },
        };

        // Send the email with React template
        const response = await this.client.emails.send(payload as never);

        // Safely access response properties
        const success = Boolean(response && (response as { id?: string }).id);
        const messageId = (response as { id?: string })?.id || "";

        return {
          success,
          messageId,
          details: response,
        };
      } else {
        throw new Error(
          "Either templateId or templateContent must be provided",
        );
      }
    } catch (error) {
      console.error("Failed to send template email via Resend:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      };
    }
  }
}

/**
 * Main Email Service class that provides a unified interface
 * for all email providers
 */
class EmailService {
  private provider: EmailProviderInterface;
  private defaultFromEmail: string;
  private defaultFromName: string;

  /**
   * Create a new email service instance
   * @param providerType The email provider to use ('nodemailer', 'zeptomail', or 'resend')
   * @param config Configuration options for the provider
   */
  constructor(
    providerType:
      | "nodemailer"
      | "zeptomail"
      | "resend" = DEFAULT_MAIL_PROVIDER as
      | "nodemailer"
      | "zeptomail"
      | "resend",
    config: Record<string, unknown> = {},
  ) {
    this.defaultFromEmail =
      (config.defaultFromEmail as string) ||
      APP_SUPPORT_MAIL ||
      MAIL_USER ||
      "noreply@example.com";
    this.defaultFromName =
      (config.defaultFromName as string) || APP_NAME || "Notification Service";

    // Initialize the selected provider
    switch (providerType) {
      case "nodemailer":
        this.provider = new NodemailerProvider({
          user: MAIL_PASS ? MAIL_USER : undefined,
          pass: MAIL_PASS || undefined,
          service: MAIL_PASS ? "gmail" : undefined,
          defaultFromEmail: this.defaultFromEmail,
          defaultFromName: this.defaultFromName,
          ...config,
        });
        break;
      case "zeptomail":
        this.provider = new ZeptoMailProvider({
          apiKey: ZOHO_KEY,
          defaultFromEmail: this.defaultFromEmail,
          defaultFromName: this.defaultFromName,
          ...config,
        });
        break;
      case "resend":
        this.provider = new ResendProvider({
          apiKey: RESEND_API_KEY,
          defaultFromEmail: this.defaultFromEmail,
          defaultFromName: this.defaultFromName,
          ...config,
        });
        break;
      default:
        console.warn(
          `Invalid provider type: ${providerType}. Falling back to nodemailer.`,
        );
        this.provider = new NodemailerProvider({
          user: MAIL_PASS ? MAIL_USER : undefined,
          pass: MAIL_PASS || undefined,
          service: MAIL_PASS ? "gmail" : undefined,
          defaultFromEmail: this.defaultFromEmail,
          defaultFromName: this.defaultFromName,
          ...config,
        });
    }
  }

  /**
   * Send an email
   * @param options Email options
   * @returns Promise with the result of the email sending operation
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    return this.provider.sendEmail(options);
  }

  /**
   * Send an email using a template
   * @param options Template options
   * @param emailOptions Email options
   * @returns Promise with the result of the email sending operation
   */
  async sendTemplateEmail(
    options: TemplateOptions,
    emailOptions: EmailOptions,
  ): Promise<EmailResult> {
    return this.provider.sendTemplateEmail(options, emailOptions);
  }

  /**
   * Generate a standard responsive email template
   * @param options Template options
   * @returns HTML email template as a string
   */
  generateStandardTemplate(options: StandardTemplateOptions): string {
    const {
      title,
      content,
      buttonText,
      buttonUrl,
      logoUrl = MAIL_LOGO || "https://via.placeholder.com/48",
      bannerUrl = null,
      socialLinks = [],
      footerText = `© ${new Date().getFullYear()} ${APP_NAME || "All rights reserved."}`,
      supportEmail = APP_SUPPORT_MAIL || "",
      brandColor = "#00D18B", // Added for brand customizability (Mint Green default)
    } = options;

    // Generate social links HTML if provided (Styled for dark footer)
    const socialLinksHtml =
      socialLinks.length > 0
        ? `
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #333333; text-align: left;">
          ${socialLinks
            .map(
              (link) =>
                `<a href="${link.url}" target="_blank" style="display: inline-block; margin-right: 16px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500;">${link.name}</a>`,
            )
            .join("")}
        </div>
      `
        : "";

    // Generate banner HTML if provided
    const bannerHtml = bannerUrl
      ? `<div style="margin-bottom: 30px;"><img src="${bannerUrl}" alt="Banner" style="width: 100%; max-width: 600px; height: auto; display: block;"></div>`
      : "";

    // Generate button HTML if provided (Pill-shaped, vibrant color)
    const buttonHtml =
      buttonText && buttonUrl
        ? `<div style="margin: 40px 0 10px 0;">
            <a href="${buttonUrl}" style="display: inline-block; padding: 16px 32px; background-color: ${brandColor}; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase;">${buttonText}</a>
          </div>`
        : "";

    // Generate support email section if provided (Styled for dark footer)
    const supportEmailHtml = supportEmail
      ? `<p style="margin: 0 0 10px 0; color: #999999;">
          If you have any questions or concerns, we're here to help. Contact us via our 
          <a href="mailto:${supportEmail}" style="color: #ffffff; text-decoration: underline;">Help Center</a>.
        </p>`
      : "";

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${title || "Notification"}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f4; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
          <td align="center">
            <div style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; text-align: left;">
              
              <div style="padding: 40px 40px 30px 40px;">
                <img src="${logoUrl}" alt="Logo" style="max-width: 120px; max-height: 48px; width: auto; height: auto; display: block;">
              </div>
              
              ${bannerHtml}
              
              <div style="padding: 0 40px 50px 40px;">
                <h1 style="color: #000000; font-size: 36px; font-weight: 800; line-height: 1.1; margin: 0 0 24px 0; letter-spacing: -1px;">
                  ${title || "Notification"}
                </h1>
                
                <div style="color: #555555; font-size: 16px; line-height: 1.6;">
                  ${content}
                </div>
                
                ${buttonHtml}
              </div>
              
              <div style="background-color: #000000; padding: 50px 40px; color: #ffffff;">
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 40px; letter-spacing: -0.5px;">
                  ${APP_NAME || "Company"}
                </div>
                
                <div style="border-top: 1px solid #222222; padding-top: 30px; font-size: 14px; line-height: 1.5; color: #999999;">
                  ${supportEmailHtml}
                  <p style="margin: 0;">${footerText}</p>
                </div>
                
                ${socialLinksHtml}
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }

  /**
   * Generate a simple email template without header/footer styling
   * @param title The email title
   * @param content The email content (HTML)
   * @returns HTML email template as a string
   */
  generateSimpleTemplate(title: string, content: string): string {
    return `
      <div style="max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased;">
        
        <div style="margin-bottom: 40px;">
          <img src="${MAIL_LOGO || "https://via.placeholder.com/48"}" alt="${APP_NAME || "Logo"}" style="max-height: 32px; width: auto; display: block;" />
        </div>
        
        <div style="padding-bottom: 40px; border-bottom: 1px solid #eeeeee;">
          <h1 style="font-size: 28px; font-weight: 800; color: #000000; margin: 0 0 20px 0; letter-spacing: -0.5px; line-height: 1.2;">
            ${title}
          </h1>
          <div style="color: #555555;">
            ${content}
          </div>
        </div>

        <div style="padding-top: 24px; color: #999999; font-size: 13px; line-height: 1.5;">
          <p style="margin: 0 0 8px 0;">
            Questions? Contact us at 
            <a href="mailto:${APP_SUPPORT_MAIL || ""}" style="color: #000000; font-weight: 500; text-decoration: none;">${APP_SUPPORT_MAIL || "support@example.com"}</a>
          </p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${APP_NAME || "Application"}. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate a refined minimalist responsive email template with improved buttons and colors
   * @param options Template options
   * @returns HTML email template as a string
   */
  generateMinimalistTemplate(options: StandardTemplateOptions): string {
    const {
      title,
      content,
      buttonText,
      buttonUrl,
      logoUrl = MAIL_LOGO || "https://via.placeholder.com/48",
      bannerUrl = null,
      socialLinks = [],
      footerText = `© ${new Date().getFullYear()} ${APP_NAME || "All rights reserved."}`,
      supportEmail = APP_SUPPORT_MAIL || "",
    } = options;

    // Generate social links HTML if provided
    const socialLinksHtml =
      socialLinks.length > 0
        ? `
      <div class="social-links" style="margin-top: 20px; text-align: left;">
        ${socialLinks
          .map(
            (link) =>
              `<a href="${link.url}" target="_blank" style="display: inline-block; margin-right: 12px; color: #94a3b8; text-decoration: none; font-size: 14px;">${link.name}</a>`,
          )
          .join("")}
      </div>
    `
        : "";

    // Generate banner HTML if provided
    const bannerHtml = bannerUrl
      ? `<img src="${bannerUrl}" alt="Email Banner" style="width: 100%; max-width: 600px; height: auto; border-radius: 16px; margin-bottom: 24px;">`
      : "";

    // Generate button HTML if provided - NOW USING THE HELPER FUNCTION
    const buttonHtml =
      buttonText && buttonUrl ? createEmailButton(buttonText, buttonUrl) : "";

    // Generate support email section if provided
    const supportEmailHtml = supportEmail
      ? `<p style="margin-bottom: 8px; font-size: 14px;">
        If you have any questions, please contact us at
        <a href="mailto:${supportEmail}" style="color: #38bdf8; text-decoration: underline;">${supportEmail}</a>.
      </p>`
      : "";

    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title || "Notification"}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.5; background-color: #f0f9ff;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <!-- Header -->
      <div style="text-align: left; margin-bottom: 32px;">
        <img src="${logoUrl}" alt="Logo" style="height: 40px; width: auto; border-radius: 8px;">
      </div>
      
      ${bannerHtml}
      
      <!-- Main Content -->
      <div style="background-color: #ffffff; border-radius: 24px; padding: 40px; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);">
        <h2 style="color: #0c4a6e; font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 20px;">${title || "Notification"}</h2>
        
        ${content}
        
        ${buttonHtml}
      </div>
      
      <!-- Footer -->
      <div style="text-align: left; padding-top: 12px; font-size: 14px; color: #94a3b8;">
        ${supportEmailHtml}
        <p style="margin-bottom: 8px;">${footerText}</p>
        
        ${socialLinksHtml}
        
        <p style="margin-top: 16px;">
          <a href="#" style="color: #38bdf8; text-decoration: underline; font-size: 14px;">Unsubscribe</a> • 
          <a href="#" style="color: #38bdf8; text-decoration: underline; font-size: 14px;">Privacy Policy</a>
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
  }

  /**
   * Generate a simple minimalist email template with improved styling
   * @param title The email title
   * @param content The email content (HTML)
   * @returns HTML email template as a string
   */
  generateSimpleMinimalistTemplate(title: string, content: string): string {
    return `
    <div style="text-align: left; padding: 40px; background-color: #ffffff; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; border-radius: 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);">
      <!-- Header -->
      <div style="width: 100%; margin-bottom: 24px;">
        <div style="width: 48px; height: 48px; display: inline-block; vertical-align: middle; border-radius: 12px; overflow: hidden;">
          <img src="${MAIL_LOGO || "https://via.placeholder.com/48"}" alt="${APP_NAME || "Logo"}" width="48" height="48" />
        </div>
        <span style="margin-left: 8px; font-size: 1.25rem; font-weight: 600; color: #0c4a6e; vertical-align: middle;">
          ${APP_NAME || "Application"}
        </span>
      </div>
      
      <!-- Main Content -->
      <div style="text-align: left; padding-bottom: 24px;">
        <h1 style="font-size: 22px; color: #0c4a6e; font-weight: 600; margin-top: 0; margin-bottom: 16px;">${title}</h1>
        ${content}
      </div>

      <!-- Footer -->
      <div style="text-align: left; padding-top: 24px; border-top: 1px solid #e0f2fe; color: #94a3b8; font-size: 14px;">
        <p style="margin-bottom: 8px;">
          If you have any questions, please contact us at
          <a href="mailto:${APP_SUPPORT_MAIL || ""}" style="color: #38bdf8; text-decoration: underline;">${APP_SUPPORT_MAIL || "support@example.com"}</a>.
        </p>
        <p style="margin-bottom: 0;">&copy; ${new Date().getFullYear()} ${APP_NAME || "Application"}. All rights reserved.</p>
      </div>
    </div>
  `;
  }

  /**
   * Validate email format using regex
   * @param email The email to validate
   * @returns Whether the email format is valid
   */
  validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate a welcome email template
   * @param options Options for the welcome email
   * @returns HTML email template as a string
   */
  generateWelcomeEmail(options: {
    userName: string;
    verificationUrl?: string;
    loginUrl?: string;
    additionalContent?: string;
  }): string {
    const { userName, verificationUrl, loginUrl, additionalContent } = options;

    let actionButton = "";
    if (verificationUrl) {
      actionButton = `<a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1a74e4; color: white; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 20px 0;">Verify Your Email</a>`;
    } else if (loginUrl) {
      actionButton = `<a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1a74e4; color: white; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 20px 0;">Log In</a>`;
    }

    const content = `
      <p>Hello ${userName},</p>
      <p>Thank you for signing up! We're excited to have you as part of our community.</p>
      ${verificationUrl ? "<p>Please verify your email address to activate your account:</p>" : ""}
      ${actionButton ? `<div style="text-align: center;">${actionButton}</div>` : ""}
      ${additionalContent ? additionalContent : ""}
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>The ${APP_NAME || "Application"} Team</p>
    `;

    return this.generateMinimalistTemplate({
      title: `Welcome to ${APP_NAME || "Our Platform"}!`,
      content,
      socialLinks: [
        { name: "Website", url: "https://example.com" },
        { name: "Twitter", url: "https://twitter.com/example" },
        { name: "Instagram", url: "https://instagram.com/example" },
      ],
    });
  }

  /**
   * Generate a password reset email template
   * @param options Options for the password reset email
   * @returns HTML email template as a string
   */
  generatePasswordResetEmail(options: {
    userName: string;
    resetUrl: string;
    expiryTime?: string;
  }): string {
    const { userName, resetUrl, expiryTime } = options;

    const expiryMessage = expiryTime
      ? `<p>This link will expire in ${expiryTime}.</p>`
      : "<p>This link will expire in 1 hour.</p>";

    const content = `
      <p>Hello ${userName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      ${createEmailButton("Reset Password", resetUrl)}
      ${expiryMessage}
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
      <p>Best regards,<br>The ${APP_NAME || "Application"} Team</p>
    `;

    return this.generateMinimalistTemplate({
      title: "Reset Your Password",
      content,
    });
  }
}

/**
 * Creates a styled button for use in email content
 * @param text Button text
 * @param url Button URL
 * @returns HTML button as a string
 */
function createEmailButton(text: string, url: string): string {
  return `
    <div style="text-align: left; margin: 28px 0;">
      <a href="${url}" style="display: inline-block; padding: 14px 32px; background-color: #0091cf; color: #c1e8ff; text-decoration: none; border-radius: 100px; font-weight: 500; font-size: 15px; box-shadow: 0 2px 4px rgba(56, 189, 248, 0.2); transition: all 0.2s ease-in-out;">${text}</a>
    </div>
  `;
}

// Legacy compatibility functions
const mailSender = async (
  email: string,
  subject: string,
  body: string,
): Promise<EmailResult> => {
  const emailService = new EmailService("nodemailer");
  return emailService.sendEmail({
    subject,
    htmlBody: body,
    to: { email },
  });
};

const generateEmailTemplate = (title: string, content: string): string => {
  const emailService = new EmailService();
  return emailService.generateSimpleMinimalistTemplate(title, content);
};

export {
  EmailService,
  mailSender,
  generateEmailTemplate,
  createEmailButton,
  type EmailOptions,
  type TemplateOptions,
  type EmailResult,
  type StandardTemplateOptions,
};
