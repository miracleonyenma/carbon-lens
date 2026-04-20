/**
 * Quick diagnostic: test the Gemini API key + model directly
 * Run: npx tsx test-gemini.ts
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("❌ GEMINI_API_KEY not set in environment");
  process.exit(1);
}

console.log(`🔑 Key: ${key.slice(0, 8)}...${key.slice(-4)}`);
console.log(`📡 Testing model: gemini-2.0-flash-lite`);
console.log(`⏰ Time: ${new Date().toISOString()}\n`);

async function testModel(modelName: string) {
  const genAI = new GoogleGenerativeAI(key!);
  const model = genAI.getGenerativeModel({ model: modelName });

  console.log(`--- Testing ${modelName} ---`);
  const start = Date.now();
  try {
    const result = await model.generateContent("Say hello in 5 words");
    const text = result.response.text();
    console.log(`✅ ${modelName}: "${text}" (${Date.now() - start}ms)`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`❌ ${modelName}: ${msg} (${Date.now() - start}ms)`);

    // Check if it's a rate limit with retry info
    const retryMatch = msg.match(/retry in ([\d.]+)s/i);
    if (retryMatch) {
      console.log(`   ⏳ Retry after: ${retryMatch[1]}s`);
    }
    if (msg.includes("429")) {
      console.log(`   💡 This is a rate limit (429) error`);
    }
    if (msg.includes("404") || msg.includes("not found")) {
      console.log(`   💡 Model not found — name may be wrong`);
    }
  }
}

async function main() {
  // Test the model we're using
  await testModel("gemini-2.0-flash-lite");

  console.log("");

  // Also test the curl model that worked
  await testModel("gemini-2.0-flash");

  console.log("\n--- Testing with raw fetch (like curl) ---");
  const start = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say hello in 3 words" }] }],
        }),
      }
    );
    const data = await res.json();
    console.log(`Status: ${res.status} (${Date.now() - start}ms)`);
    if (res.ok) {
      console.log(
        `✅ Response: ${data.candidates?.[0]?.content?.parts?.[0]?.text}`
      );
    } else {
      console.log(`❌ Error: ${JSON.stringify(data.error, null, 2)}`);
    }
  } catch (err) {
    console.log(`❌ Fetch error: ${err}`);
  }
}

main();
