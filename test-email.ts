import dotenv from "dotenv";
import { EmailService } from "./utils/email/index.js";
import path from "path";

// Load environment variables manually for explicit test override
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  console.log("Checking EmailService Integrations...");
  console.log("Provider configured:", process.env.DEFAULT_MAIL_PROVIDER);

  const emailService = new EmailService();

  const htmlBody = emailService.generateStandardTemplate({
    title: "Integration Test Successful",
    content:
      "<p>If you are reading this, the Auth integration for real Email deliveries via Resend works locally via the .env mappings.</p>",
  });

  console.log("Dispatching email...");
  const result = await emailService.sendEmail({
    to: { email: process.env.MAIL_USER || "hi@bucket.aevr.space" },
    subject: "Bucket Test Integration Email",
    htmlBody,
  });

  console.log("Result:", result);
}

run().catch(console.error);
