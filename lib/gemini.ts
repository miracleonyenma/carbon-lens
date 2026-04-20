import { GoogleGenerativeAI } from "@google/generative-ai";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const DEFAULT_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";

function getGroqProvider() {
  if (!GROQ_API_KEY) return null;
  return createGroq({ apiKey: GROQ_API_KEY });
}

function isServiceBusy(error: unknown): boolean {
  if (error instanceof GeminiError && error.code === "SERVICE_BUSY")
    return true;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("Service Unavailable") ||
    msg.includes("overloaded")
  );
}

function getModel(apiKey?: string) {
  const key = apiKey || DEFAULT_KEY;
  if (!key) {
    throw new GeminiError(
      "No API key configured. Please add your Gemini API key in Settings.",
      "NO_API_KEY"
    );
  }
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

export class GeminiError extends Error {
  code: string;
  retryAfter?: number;

  constructor(message: string, code: string, retryAfter?: number) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

function handleGeminiError(error: unknown): never {
  if (error instanceof GeminiError) throw error;

  const msg = error instanceof Error ? error.message : String(error);
  console.error("[Gemini] Unhandled error:", msg);

  // Rate limit / quota exceeded
  if (msg.includes("429") || msg.includes("quota")) {
    // Check for zero-quota (key has no free tier access for this model)
    if (msg.includes("limit: 0")) {
      throw new GeminiError(
        "This API key has no quota for the requested model. Please use a different API key.",
        "NO_QUOTA"
      );
    }
    const retryMatch = msg.match(/retry in ([\d.]+)s/i);
    const retryAfter = retryMatch
      ? Math.ceil(parseFloat(retryMatch[1]))
      : undefined;
    throw new GeminiError(
      "Gemini API rate limit reached. Please wait a moment and try again, or add your own API key in Settings.",
      "RATE_LIMIT",
      retryAfter
    );
  }

  // Service overloaded (503)
  if (
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("Service Unavailable") ||
    msg.includes("overloaded")
  ) {
    throw new GeminiError(
      "The AI model is experiencing high demand. Please try again in a moment.",
      "SERVICE_BUSY",
      10
    );
  }

  // Invalid API key
  if (
    msg.includes("401") ||
    msg.includes("API_KEY_INVALID") ||
    msg.includes("403")
  ) {
    throw new GeminiError(
      "Invalid Gemini API key. Please check your key in Settings.",
      "INVALID_KEY"
    );
  }

  // JSON parse / response format issues from parseGeminiResponse
  if (msg.includes("invalid JSON") || msg.includes("missing items array")) {
    throw new GeminiError(
      "AI returned an unexpected response. Please try again.",
      "PARSE_ERROR"
    );
  }

  throw new GeminiError(
    `Failed to analyze — please try again. (${msg})`,
    "UNKNOWN"
  );
}

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

function withClimateContext(prompt: string, climateContext?: string) {
  if (!climateContext) return prompt;

  return `${prompt}

Global climate context for user-facing insights:
${climateContext}

Use the climate context only to make the insight more grounded and timely. Do not override the item-level carbon guidelines above unless the user input itself clearly demands it.`;
}

function extractText(
  result: {
    response: {
      text: () => string;
      promptFeedback?: { blockReason?: string };
      candidates?: { finishReason?: string }[];
    };
  },
  context: string
): string {
  const response = result.response;

  // Check prompt-level blocking
  if (response.promptFeedback?.blockReason) {
    throw new GeminiError(
      `Content was blocked (${response.promptFeedback.blockReason}). Please try different ${context}.`,
      "SAFETY_BLOCKED"
    );
  }

  // Check candidate-level safety
  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason === "SAFETY" || finishReason === "BLOCKED") {
    throw new GeminiError(
      `Content was blocked by safety filters. Please try different ${context}.`,
      "SAFETY_BLOCKED"
    );
  }

  return response.text();
}

// ── Groq fallback helpers ──────────────────────────────────────────────

async function tryGroqImageAnalysis(
  base64Image: string,
  mimeType: string,
  climateContext?: string
) {
  const groq = getGroqProvider();
  if (!groq) return null;

  try {
    console.log("[Groq Fallback] Attempting image analysis...");
    const prompt = withClimateContext(IMAGE_ANALYSIS_PROMPT, climateContext);

    const result = await generateText({
      model: groq(GROQ_VISION_MODEL),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image",
              image: `data:${mimeType};base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    console.log("[Groq Fallback] Image analysis succeeded");
    return parseGeminiResponse(result.text);
  } catch (err) {
    console.error(
      "[Groq Fallback] Image analysis failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

async function tryGroqTextAnalysis(itemsText: string, climateContext?: string) {
  const groq = getGroqProvider();
  if (!groq) return null;

  try {
    console.log("[Groq Fallback] Attempting text analysis...");
    const prompt = withClimateContext(TEXT_ANALYSIS_PROMPT, climateContext);

    const result = await generateText({
      model: groq(GROQ_TEXT_MODEL),
      prompt: `${prompt}\n\nHere are the items:\n${itemsText}`,
    });

    console.log("[Groq Fallback] Text analysis succeeded");
    return parseGeminiResponse(result.text);
  } catch (err) {
    console.error(
      "[Groq Fallback] Text analysis failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

async function tryGroqCameraAnalysis(
  base64Image: string,
  mimeType: string,
  climateContext?: string
) {
  const groq = getGroqProvider();
  if (!groq) return null;

  try {
    console.log("[Groq Fallback] Attempting camera analysis...");
    const prompt = withClimateContext(LIVE_CAMERA_PROMPT, climateContext);

    const result = await generateText({
      model: groq(GROQ_VISION_MODEL),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image",
              image: `data:${mimeType};base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    console.log("[Groq Fallback] Camera analysis succeeded");
    return parseGeminiResponse(result.text);
  } catch (err) {
    console.error(
      "[Groq Fallback] Camera analysis failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

// ── Exported analysis functions ────────────────────────────────────────

export async function analyzeImage(
  base64Image: string,
  mimeType: string,
  apiKey?: string,
  climateContext?: string
) {
  try {
    const model = getModel(apiKey);

    const result = await model.generateContent([
      withClimateContext(IMAGE_ANALYSIS_PROMPT, climateContext),
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const text = extractText(result, "image");
    return parseGeminiResponse(text);
  } catch (error) {
    if (isServiceBusy(error)) {
      const fallback = await tryGroqImageAnalysis(
        base64Image,
        mimeType,
        climateContext
      );
      if (fallback) return fallback;
    }
    handleGeminiError(error);
  }
}

export async function analyzeText(
  itemsText: string,
  apiKey?: string,
  climateContext?: string
) {
  try {
    const model = getModel(apiKey);

    const result = await model.generateContent([
      withClimateContext(TEXT_ANALYSIS_PROMPT, climateContext),
      `Here are the items:\n${itemsText}`,
    ]);

    const text = extractText(result, "items");
    return parseGeminiResponse(text);
  } catch (error) {
    if (isServiceBusy(error)) {
      const fallback = await tryGroqTextAnalysis(itemsText, climateContext);
      if (fallback) return fallback;
    }
    handleGeminiError(error);
  }
}

export async function analyzeCameraFrame(
  base64Image: string,
  mimeType: string,
  apiKey?: string,
  climateContext?: string
) {
  try {
    const model = getModel(apiKey);

    const result = await model.generateContent([
      withClimateContext(LIVE_CAMERA_PROMPT, climateContext),
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const text = extractText(result, "image");
    return parseGeminiResponse(text);
  } catch (error) {
    if (isServiceBusy(error)) {
      const fallback = await tryGroqCameraAnalysis(
        base64Image,
        mimeType,
        climateContext
      );
      if (fallback) return fallback;
    }
    handleGeminiError(error);
  }
}

function parseGeminiResponse(text: string) {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Gemini returned invalid JSON. Raw response: ${cleaned.slice(0, 200)}`
    );
  }

  if (!data.items || !Array.isArray(data.items)) {
    throw new Error("Gemini response missing items array");
  }

  // Calculate totals
  const totalCarbonKg = data.items.reduce(
    (sum: number, item: { carbonKg: number }) => sum + (item.carbonKg || 0),
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
