import mongoose, { Schema, Document } from "mongoose";

export type EcoTier = "seedling" | "sprout" | "grove" | "guardian";

export interface ILeaderboardEntry extends Document {
  userId?: mongoose.Types.ObjectId;
  nickname: string;
  ecoScore: number;
  totalScans: number;
  totalItems: number;
  lowImpactRatio: number;
  avgCarbonPerItem: number;
  streakWeeks: number;
  tier: EcoTier;
  isVerified: boolean;
  country?: string;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },
    nickname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 24,
    },
    ecoScore: { type: Number, required: true, default: 0, index: -1 },
    totalScans: { type: Number, required: true, default: 0 },
    totalItems: { type: Number, required: true, default: 0 },
    lowImpactRatio: { type: Number, required: true, default: 0 },
    avgCarbonPerItem: { type: Number, required: true, default: 0 },
    streakWeeks: { type: Number, required: true, default: 0 },
    tier: {
      type: String,
      enum: ["seedling", "sprout", "grove", "guardian"],
      required: true,
      default: "seedling",
    },
    isVerified: { type: Boolean, required: true, default: false },
    country: { type: String, uppercase: true, trim: true },
    lastUpdated: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.LeaderboardEntry ||
  mongoose.model<ILeaderboardEntry>("LeaderboardEntry", LeaderboardEntrySchema);
