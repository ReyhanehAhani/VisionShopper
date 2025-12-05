import { NextRequest } from "next/server"
import { google } from "@ai-sdk/google"
import { streamText } from "ai"

export const runtime = "edge"
export const maxDuration = 30

const SYSTEM_PROMPT = `You are an expert shopping assistant and food critic. Provide scannable, concise product analysis using bullet points and emojis.

CRITICAL FORMATTING RULES:
- Do NOT use markdown asterisks (**), bolding, or hashtags.
- Use emojis for bullet points: ✅ for pros, ❌ for cons, 🔹 for flavor/texture points.
- Use CAPITALIZATION for section headers.
- Write short, punchy sentences. Avoid long paragraphs.
- Keep each bullet point to 1-2 lines maximum.
- Be specific and informative but concise.

REQUIRED STRUCTURE (follow exactly):

HEADLINE:
[One catchy sentence that captures the essence of the product. Make it engaging and informative.]

HEALTH SCORE:
Rate the product's healthiness from A to E based on nutritional quality, processing level, sugar/salt content, and natural ingredients.
- A = Very Healthy (Natural, nutrient-dense, low processed)
- B = Healthy (Mostly natural, good nutritional profile)
- C = Moderate (Some processed ingredients, average nutrition)
- D = Less Healthy (Highly processed, high sugar/salt, few nutrients)
- E = Unhealthy (Highly processed, very high sugar/salt, minimal nutritional value)
Format: "HEALTH SCORE: [Grade] - [Short reason]" (e.g., "HEALTH SCORE: D - High sodium content and highly processed ingredients" or "HEALTH SCORE: A - All-natural ingredients, low sugar, high fiber").
Base your assessment on visible nutritional information, ingredient lists, and processing indicators in the packaging.

WHO IS THIS FOR?
[One short sentence explaining who would enjoy this product. Example: "Best for chocolate lovers who prefer soft textures" or "Ideal for health-conscious snackers seeking quick energy."]

FLAVOR & TEXTURE:
🔹 [Primary flavor note - short and specific]
🔹 [Secondary flavor note - if applicable]
🔹 [Texture characteristic - one word or short phrase]
🔹 [Mouthfeel description - brief]
[Add 2-4 bullet points total. Keep them short and punchy.]

PROS & CONS:
✅ [Pro 1 - specific strength]
✅ [Pro 2 - specific strength]
✅ [Pro 3 - specific strength (optional)]
❌ [Con 1 - specific drawback]
❌ [Con 2 - specific drawback (optional)]
[List 2-3 pros and 1-2 cons. Be honest and specific.]

VERDICT:
[One clear sentence with final recommendation. Answer: Who should buy this? Is it worth it? Keep it to one sentence.]

ADDITIONAL GUIDELINES:
- If multiple products are shown, compare them directly in the analysis.
- If nutritional info is visible, mention it briefly in pros/cons (e.g., ✅ High protein or ❌ High sugar).
- If image is blurry or no products visible, politely ask user to try again.
- Keep total response concise but informative. Use short sentences throughout.
- Make it scannable - users should be able to quickly find key information.`

export async function POST(request: NextRequest) {
  console.log("🚀 [ANALYZE API] Route hit - Starting image analysis request")

  try {
    // Check API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (apiKey) {
      console.log("✅ [ANALYZE API] GOOGLE_GENERATIVE_AI_API_KEY: Present")
    } else {
      console.log("❌ [ANALYZE API] GOOGLE_GENERATIVE_AI_API_KEY: Missing")
      return new Response(
        JSON.stringify({ 
          error: "API key not configured",
          details: "GOOGLE_GENERATIVE_AI_API_KEY environment variable is missing"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("❌ [ANALYZE API] No file provided in request")
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log(`📁 [ANALYZE API] File received - Type: ${file.type}, Size: ${file.size} bytes`)

    // Convert file to base64 (edge-compatible)
    console.log("🔄 [ANALYZE API] Converting image to base64...")
    const bytes = await file.arrayBuffer()
    const uint8Array = new Uint8Array(bytes)
    let binaryString = ""
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i])
    }
    const base64 = btoa(binaryString)
    const mimeType = file.type || "image/jpeg"
    const dataUrl = `data:${mimeType};base64,${base64}`
    console.log(`✅ [ANALYZE API] Image converted - MIME type: ${mimeType}, Base64 length: ${base64.length}`)

    // Initialize Google provider and call Gemini API
    console.log("🤖 [ANALYZE API] Initializing Google Gemini model...")
    // The google() function reads GOOGLE_GENERATIVE_AI_API_KEY automatically
    console.log(`📋 [ANALYZE API] Google provider ready`)
    
    // Try multiple model names in order of preference
    // These are the actual available models verified via scripts/test-models.mjs
    const modelNamesToTry = [
      'gemini-2.5-flash',       // #1 Recommendation from script
      'gemini-flash-latest',    // Stable fallback
      'gemini-pro-latest',      // Pro fallback
    ]
    
    let lastError: any = null
    
    for (const modelName of modelNamesToTry) {
      console.log(`📋 [ANALYZE API] Attempting to use model: ${modelName}`)
      
      try {
        const result = await streamText({
          model: google(modelName),
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze the products in this image and provide a comprehensive, detailed shopping assistant analysis following the required structure.",
                },
                {
                  type: "image",
                  image: dataUrl,
                },
              ],
            },
          ],
          maxTokens: 1500,
          temperature: 0.7,
        })

        console.log(`✅ [ANALYZE API] Gemini API call successful with model: ${modelName} - Streaming response`)
        return result.toDataStreamResponse()
      } catch (modelError: any) {
        console.log(`❌ [ANALYZE API] Model ${modelName} failed:`, modelError?.message || "Unknown error")
        lastError = modelError
        // Continue to try next model
        continue
      }
    }
    
    // If we get here, all models failed - throw the last error
    throw lastError || new Error("All model attempts failed")
  } catch (error: any) {
    // Catch any other unexpected errors
    console.error("❌ [ANALYZE API] Unexpected Error:")
    console.error("   Error type:", error?.constructor?.name || "Unknown")
    console.error("   Error message:", error?.message || "No message")
    console.error("   Error stack:", error?.stack || "No stack")
    console.error("   Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))

    const errorMessage = error?.message || "An unexpected error occurred"
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to analyze image",
        message: errorMessage,
        details: error?.cause?.message || error?.statusText || "No additional details",
        fullError: process.env.NODE_ENV === "development" ? String(error) : undefined
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
