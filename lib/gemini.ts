import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const RECEIPT_ANALYSIS_PROMPT = `You are an expert environmental analyst. Analyze this grocery/shopping receipt image and extract each purchased item. For each item, estimate its carbon footprint in kg CO₂e based on lifecycle analysis data.

Return a JSON object with this exact structure (no markdown, no code fences, just raw JSON):
{
  "storeName": "store name if visible, otherwise null",
  "receiptDate": "YYYY-MM-DD if visible, otherwise null",
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "unit": "kg or item or liter",
      "category": "one of: meat, dairy, produce, grains, beverages, snacks, frozen, household, seafood, other",
      "carbonKg": 2.5,
      "impactLevel": "low or medium or high",
      "suggestedSwap": "a lower-carbon alternative",
      "swapSavingsKg": 1.5
    }
  ],
  "insights": "A brief 2-3 sentence personalized insight about this receipt's carbon footprint and one actionable tip to reduce it."
}

Carbon estimation guidelines:
- Beef: ~27 kg CO₂e per kg
- Lamb: ~39 kg CO₂e per kg  
- Cheese: ~13.5 kg CO₂e per kg
- Pork: ~12 kg CO₂e per kg
- Chicken/Poultry: ~6.9 kg CO₂e per kg
- Fish/Seafood: ~6-12 kg CO₂e per kg
- Eggs (dozen): ~4.8 kg CO₂e
- Milk (1L): ~3.2 kg CO₂e
- Rice: ~4 kg CO₂e per kg
- Tofu: ~2 kg CO₂e per kg
- Vegetables: ~0.5-2 kg CO₂e per kg
- Fruits: ~0.5-1.5 kg CO₂e per kg
- Bread: ~0.8 kg CO₂e per kg
- Pasta: ~1.5 kg CO₂e per kg
- Oat milk (1L): ~0.9 kg CO₂e
- Nuts: ~0.3-2.5 kg CO₂e per kg
- Snacks/processed: ~2-5 kg CO₂e per kg
- Beverages (soft drinks): ~0.5-1 kg CO₂e per liter
- Household items: ~0.5-2 kg CO₂e per item

Impact levels:
- low: < 2 kg CO₂e per item
- medium: 2-5 kg CO₂e per item  
- high: > 5 kg CO₂e per item

Be conservative in estimates. If you can't identify an item clearly, make a reasonable guess based on context. Always provide a swap suggestion for medium and high impact items.`;

const TEXT_ANALYSIS_PROMPT = `You are an expert environmental analyst. Analyze this list of grocery/shopping items and estimate the carbon footprint for each item in kg CO₂e based on lifecycle analysis data.

The user will provide a text list of items they purchased. Parse each item and estimate its carbon footprint.

Return a JSON object with this exact structure (no markdown, no code fences, just raw JSON):
{
  "storeName": null,
  "receiptDate": null,
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "unit": "kg or item or liter",
      "category": "one of: meat, dairy, produce, grains, beverages, snacks, frozen, household, seafood, other",
      "carbonKg": 2.5,
      "impactLevel": "low or medium or high",
      "suggestedSwap": "a lower-carbon alternative",
      "swapSavingsKg": 1.5
    }
  ],
  "insights": "A brief 2-3 sentence personalized insight about this shopping list's carbon footprint and one actionable tip to reduce it."
}

Use the same carbon estimation guidelines as for receipt images. Impact levels: low (<2 kg), medium (2-5 kg), high (>5 kg).`;

export async function analyzeReceiptImage(
  base64Image: string,
  mimeType: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    RECEIPT_ANALYSIS_PROMPT,
    {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    },
  ]);

  const text = result.response.text();
  return parseGeminiResponse(text);
}

export async function analyzeReceiptText(itemsText: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    TEXT_ANALYSIS_PROMPT,
    `Here are the items I purchased:\n${itemsText}`,
  ]);

  const text = result.response.text();
  return parseGeminiResponse(text);
}

function parseGeminiResponse(text: string) {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const data = JSON.parse(cleaned);

  // Calculate totals
  const totalCarbonKg = data.items.reduce(
    (sum: number, item: { carbonKg: number }) => sum + item.carbonKg,
    0
  );

  return {
    storeName: data.storeName || undefined,
    receiptDate: data.receiptDate ? new Date(data.receiptDate) : undefined,
    items: data.items,
    totalCarbonKg: Math.round(totalCarbonKg * 100) / 100,
    totalItems: data.items.length,
    insights: data.insights,
  };
}
