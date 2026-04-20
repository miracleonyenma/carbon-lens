import mongoose, { Schema, Document } from "mongoose";

export interface IVerificationToken extends Document {
  identifier: string; // The email address or phone number
  token: string; // The hashed OTP or Magic Link token
  expires: Date;
  type: "OTP" | "MAGIC_LINK";
  createdAt: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>(
  {
    identifier: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["OTP", "MAGIC_LINK"],
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to quickly find valid tokens
VerificationTokenSchema.index(
  { identifier: 1, token: 1, type: 1 },
  { unique: true },
);

export const VerificationToken =
  mongoose.models.VerificationToken ||
  mongoose.model<IVerificationToken>(
    "VerificationToken",
    VerificationTokenSchema,
  );
