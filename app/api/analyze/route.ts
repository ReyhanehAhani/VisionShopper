import { NextRequest } from "next/server"
import { google } from "@ai-sdk/google"
import { streamText } from "ai"

export const runtime = "edge"
export const maxDuration = 30

const SYSTEM_PROMPT = `You are a concise shopping assistant. The user is in a rush.

Your task:
1. Identify the products in the image.
2. Compare them briefly based on taste, texture, and value.
3. Avoid marketing jargon. Be direct.
4. Limit the total response to under 150 words.
5. If the image is blurry or contains no products, ask the user to try again politely.

CRITICAL FORMATTING RULES:
- Do NOT use asterisks (**), bolding, or Markdown formatting.
- Do NOT use emojis.
- Use CAPITALIZATION for section headers (e.g., THE VERDICT instead of The Verdict).
- Output clean, plain text only.

Format your response as follows:
PRODUCTS: [List product names]

THE VERDICT: [One sentence recommendation]

COMPARISON:
For each product, provide:
- Flavor Profile: [Brief description]
- Key Pro: [One benefit]
- Key Con: [One drawback]

QUICK SUMMARY: [1-2 sentences describing the vibe]`

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
                  text: "Analyze the products in this image and provide a concise comparison.",
                },
                {
                  type: "image",
                  image: dataUrl,
                },
              ],
            },
          ],
          maxTokens: 500,
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
