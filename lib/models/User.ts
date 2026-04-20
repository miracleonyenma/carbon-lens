import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  picture?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  payTag?: string;
  referredBy?: mongoose.Types.ObjectId | string;
  kycData?: {
    payidKyc?: {
      accessToken?: string;
      refreshToken?: string;
      idToken?: string;
      payidSub?: string;
      payTag?: string;
      kycVerified?: boolean;
      verificationLevel?: string;
      sessionId?: string;
      provider?: string;
      updatedAt?: Date;
    };
  };
  role?: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    picture: {
      type: String,
    },
    payTag: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    kycData: {
      payidKyc: {
        accessToken: String,
        refreshToken: String,
        idToken: String,
        payidSub: String,
        payTag: String,
        kycVerified: {
          type: Boolean,
          default: false,
        },
        verificationLevel: String,
        sessionId: String,
        provider: String,
        updatedAt: Date,
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
