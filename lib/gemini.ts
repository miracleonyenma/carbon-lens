import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const CARBON_GUIDELINES = `Carbon estimation guidelines:
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
- Clothing (t-shirt): ~7 kg CO₂e per item
- Clothing (jeans): ~33 kg CO₂e per item
- Electronics (smartphone): ~70 kg CO₂e
- Electronics (laptop): ~300-400 kg CO₂e
- Plastic bags: ~0.03 kg CO₂e per bag
- Paper products: ~1-3 kg CO₂e per kg
- Furniture (wooden chair): ~20-50 kg CO₂e
- Car fuel (1L gasoline): ~2.3 kg CO₂e
- Coffee (1 cup): ~0.3-0.5 kg CO₂e
- Fast food meal: ~3-5 kg CO₂e
- Restaurant meal: ~5-8 kg CO₂e

Impact levels:
- low: < 2 kg CO₂e per item
- medium: 2-5 kg CO₂e per item
- high: > 5 kg CO₂e per item`;

const RESPONSE_FORMAT = `Return a JSON object with this exact structure (no markdown, no code fences, just raw JSON):
{
  "storeName": "store/brand name if visible, otherwise null",
  "receiptDate": "YYYY-MM-DD if visible, otherwise null",
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "unit": "kg or item or liter",
      "category": "one of: meat, dairy, produce, grains, beverages, snacks, frozen, household, seafood, clothing, electronics, transport, other",
      "carbonKg": 2.5,
      "impactLevel": "low or medium or high",
      "suggestedSwap": "a lower-carbon alternative",
      "swapSavingsKg": 1.5
    }
  ],
  "insights": "A brief 2-3 sentence personalized insight about the carbon footprint and one actionable tip to reduce it."
}`;

const IMAGE_ANALYSIS_PROMPT = `You are an expert environmental analyst. Analyze this image — it could be a grocery receipt, a photo of products, a meal, clothing, electronics, or any item(s). Identify every item you can see and estimate the carbon footprint of each in kg CO₂e based on lifecycle analysis data.

${RESPONSE_FORMAT}

${CARBON_GUIDELINES}

Be conservative in estimates. If you can't identify an item clearly, make a reasonable guess based on context. Always provide a swap suggestion for medium and high impact items.`;

const TEXT_ANALYSIS_PROMPT = `You are an expert environmental analyst. Analyze this list of items and estimate the carbon footprint for each in kg CO₂e based on lifecycle analysis data. Items can be anything — food, products, clothing, electronics, activities.

${RESPONSE_FORMAT}

${CARBON_GUIDELINES}

Be conservative in estimates. Always provide a swap suggestion for medium and high impact items.`;

const LIVE_CAMERA_PROMPT = `You are an expert environmental analyst doing real-time carbon analysis. Look at this camera frame and identify ALL visible items, products, food, or objects. For each one, estimate its carbon footprint in kg CO₂e.

Be fast and concise. Focus on the most prominent items visible.

${RESPONSE_FORMAT}

${CARBON_GUIDELINES}

Be conservative. Identify what you can clearly see. Always provide swap suggestions for medium and high impact items.`;

export async function analyzeImage(base64Image: string, mimeType: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    IMAGE_ANALYSIS_PROMPT,
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

export async function analyzeText(itemsText: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    TEXT_ANALYSIS_PROMPT,
    `Here are the items:\n${itemsText}`,
  ]);

  const text = result.response.text();
  return parseGeminiResponse(text);
}

export async function analyzeCameraFrame(
  base64Image: string,
  mimeType: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    LIVE_CAMERA_PROMPT,
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
