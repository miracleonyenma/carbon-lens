import mongoose, { Schema, Document } from "mongoose";

export interface IOAuthSession extends Document {
  state: string;
  codeVerifier: string;
  userId?: string | null;
  referralId?: string | null;
  returnUrl?: string | null;
  csrf: string;
  expiresAt: Date;
  createdAt: Date;
}

const OAuthSessionSchema = new Schema<IOAuthSession>(
  {
    state: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    codeVerifier: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: false,
    },
    referralId: {
      type: String,
      required: false,
    },
    returnUrl: {
      type: String,
      required: false,
    },
    csrf: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Auto-delete expired sessions
OAuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OAuthSession =
  mongoose.models.OAuthSession ||
  mongoose.model<IOAuthSession>("OAuthSession", OAuthSessionSchema);
