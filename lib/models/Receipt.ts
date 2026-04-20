import mongoose, { Schema, Document } from "mongoose";

export interface IReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  carbonKg: number;
  impactLevel: "low" | "medium" | "high";
  suggestedSwap?: string;
  swapSavingsKg?: number;
}

export interface IReceipt extends Document {
  userId: mongoose.Types.ObjectId;
  storeName?: string;
  receiptDate?: Date;
  items: IReceiptItem[];
  totalCarbonKg: number;
  totalItems: number;
  insights?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptItemSchema = new Schema<IReceiptItem>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: "item" },
    category: { type: String, required: true },
    carbonKg: { type: Number, required: true },
    impactLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    suggestedSwap: { type: String },
    swapSavingsKg: { type: Number },
  },
  { _id: false }
);

const ReceiptSchema = new Schema<IReceipt>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    storeName: { type: String },
    receiptDate: { type: Date },
    items: { type: [ReceiptItemSchema], required: true },
    totalCarbonKg: { type: Number, required: true },
    totalItems: { type: Number, required: true },
    insights: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Receipt ||
  mongoose.model<IReceipt>("Receipt", ReceiptSchema);
