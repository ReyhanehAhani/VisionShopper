import { NextRequest } from "next/server"
import { google } from "@ai-sdk/google"
import { streamText } from "ai"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'
// Allow up to 60s for AI analysis (Pro plan) or max Hobby limits
export const maxDuration = 60
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Helper function to extract product name from HEADLINE
function extractProductName(analysisResult: string): string | null {
  try {
    const headlineMatch = analysisResult.match(/HEADLINE:\s*(.+?)(?:\n|$)/i)
    if (headlineMatch && headlineMatch[1]) {
      // Clean up the headline - remove extra spaces and trim
      let headline = headlineMatch[1].trim()
      // Remove emojis and special characters for a cleaner product name
      headline = headline.replace(/[^\w\s\-&]/g, '').trim()
      // Limit length
      return headline.substring(0, 200) || null
    }
  } catch (error) {
    console.error("❌ [ANALYZE API] Error extracting product name:", error)
  }
  return null
}

// Helper function to save scan to database (async, doesn't block)
async function saveScanToDatabase(
  userId: string,
  analysisResult: string,
  imageUrl: string
) {
  try {
    const productName = extractProductName(analysisResult)
    
    await prisma.scan.create({
      data: {
        userId,
        imageUrl,
        productName: productName || "Unknown Product",
        analysisResult,
      },
    })
    
    console.log(`💾 [ANALYZE API] Scan saved to database for user ${userId}`)
  } catch (error: any) {
    // Don't fail the request if database save fails
    console.error("❌ [ANALYZE API] Failed to save scan to database:", error?.message || error)
  }
}

const SYSTEM_PROMPT_SINGLE = `You are an expert shopping assistant and food critic. Provide scannable, concise product analysis using bullet points and emojis.

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
- If nutritional info is visible, mention it briefly in pros/cons (e.g., ✅ High protein or ❌ High sugar).
- If image is blurry or no products visible, politely ask user to try again.
- Keep total response concise but informative. Use short sentences throughout.
- Make it scannable - users should be able to quickly find key information.`

const SYSTEM_PROMPT_COMPARE = `You are an expert shopping assistant and food critic conducting a product comparison battle. Compare two products side-by-side and declare a winner. Provide scannable, concise analysis using bullet points and emojis.

CRITICAL FORMATTING RULES:
- Do NOT use markdown asterisks (**), bolding, or hashtags.
- Use emojis for bullet points: ✅ for pros, ❌ for cons, 🔹 for flavor/texture points.
- Use CAPITALIZATION for section headers.
- Write short, punchy sentences. Avoid long paragraphs.
- Keep each bullet point to 1-2 lines maximum.
- Be specific and informative but concise.

REQUIRED STRUCTURE (follow exactly):

HEADLINE:
[One catchy comparison title that captures both products. Example: "Chocolate Chip Cookie Battle: Classic vs Premium"]

WINNER:
[Clearly state which product wins and why in one sentence. Format: "WINNER: [Product Name] - [Brief reason]"]

HEALTH COMPARISON:
Rate both products' healthiness from A to E. Format:
- Product A: [Grade] - [Brief reason]
- Product B: [Grade] - [Brief reason]
[Include a comparison sentence explaining which is healthier and why.]

FLAVOR FACE-OFF:
Compare the taste and texture of both products using bullet points:
🔹 Product A: [Flavor/texture notes]
🔹 Product B: [Flavor/texture notes]
🔹 Key Difference: [Main distinction]

PROS & CONS COMPARISON:
Compare strengths and weaknesses:
✅ Product A Pros: [Main strengths]
❌ Product A Cons: [Main weaknesses]
✅ Product B Pros: [Main strengths]
❌ Product B Cons: [Main weaknesses]

VERDICT:
[Final recommendation: Which product should users buy? When would each product be better? Keep it to 2-3 sentences maximum.]

ADDITIONAL GUIDELINES:
- Be fair and honest in your comparison.
- If nutritional info is visible, use it in the health comparison.
- If images are blurry or products not visible, politely ask user to try again.
- Keep total response concise but informative. Use short sentences throughout.
- Make it scannable - users should be able to quickly find the winner and key differences.`

export async function POST(request: NextRequest) {
  console.log("Step 1: Request received")
  console.log("🚀 [ANALYZE API] Route hit - Starting image analysis request")

  try {
    // Step 2: Get user ID from Clerk (optional - scan will work without auth)
    let userId: string | null = null
    try {
      console.log("Step 2: Connecting to Clerk...")
      const { userId: authUserId } = await auth()
      userId = authUserId
      if (userId) {
        console.log(`Step 2: Connected to Clerk, UserId: ${userId}`)
        console.log(`👤 [ANALYZE API] Authenticated user: ${userId}`)
      } else {
        console.log("Step 2: Connected to Clerk, UserId: null (no authenticated user)")
        console.log("👤 [ANALYZE API] No authenticated user - scan will not be saved")
      }
    } catch (authError: any) {
      console.warn("Step 2: Clerk connection failed (continuing without auth):", authError?.message || "Unknown error")
      console.warn("⚠️ [ANALYZE API] Could not get user ID from Clerk:", authError?.message || "Unknown error")
      // Continue without auth - scan will work but won't be saved
    }

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

    // Get JSON body (for compare mode) or FormData (for single mode)
    const contentType = request.headers.get("content-type") || ""
    let image1: string
    let image2: string | null = null
    let isCompareMode = false

    if (contentType.includes("application/json")) {
      // JSON body (compare mode)
      const body = await request.json()
      image1 = body.image
      image2 = body.image2 || null
      isCompareMode = !!image2

      if (!image1) {
        console.log("❌ [ANALYZE API] No image provided in JSON body")
        return new Response(
          JSON.stringify({ error: "No image provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }

      console.log(`📁 [ANALYZE API] JSON body received - Image1: ${image1.substring(0, 50)}..., Image2: ${image2 ? image2.substring(0, 50) + '...' : 'null'}`)
      console.log(`📊 [ANALYZE API] Mode: ${isCompareMode ? 'COMPARE' : 'SINGLE'}`)
    } else {
      // FormData (backward compatibility for single mode)
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

      // Convert file to base64
      console.log("🔄 [ANALYZE API] Converting image to base64...")
      const bytes = await file.arrayBuffer()
      const uint8Array = new Uint8Array(bytes)
      let binaryString = ""
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
      }
      const base64 = btoa(binaryString)
      const mimeType = file.type || "image/jpeg"
      image1 = `data:${mimeType};base64,${base64}`
      console.log(`✅ [ANALYZE API] Image converted - MIME type: ${mimeType}, Base64 length: ${base64.length}`)
    }

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
        // Select system prompt based on mode
        const systemPrompt = isCompareMode ? SYSTEM_PROMPT_COMPARE : SYSTEM_PROMPT_SINGLE
        
        // Build content array with images
        const content: any[] = [
          {
            type: "text",
            text: isCompareMode 
              ? "Compare these two products side-by-side and provide a detailed comparison following the required structure. Identify which product is shown in each image."
              : "Analyze the products in this image and provide a comprehensive, detailed shopping assistant analysis following the required structure.",
          },
          {
            type: "image",
            image: image1,
          },
        ]

        // Add second image if in compare mode
        if (isCompareMode && image2) {
          content.push({
            type: "image",
            image: image2,
          })
        }

        console.log("Step 3: Starting Google AI stream...")
        const result = await streamText({
          model: google(modelName),
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: content,
            },
          ],
          temperature: 0.7,
          // Token limit is controlled by system prompt instructions
        })

        console.log(`Step 3: AI Stream finished, preparing response...`)
        console.log(`✅ [ANALYZE API] Gemini API call successful with model: ${modelName} - Streaming response`)

        // Step 4: If user is authenticated, save scan to database (async, doesn't block streaming)
        if (userId) {
          console.log("Step 4: AI Stream finished, saving to DB...")
          // Wrap DB save in its own try/catch to prevent crashes
          try {
            // Get the full text from the stream result and save to database
            result.text.then((fullText) => {
              // Use placeholder for imageUrl (base64 images are too large for database storage)
              const imageUrl = "uploaded_image"
              
              // Wrap saveScanToDatabase in try/catch
              saveScanToDatabase(userId!, fullText, imageUrl).then(() => {
                console.log("Step 5: DB Save successful")
              }).catch((dbError: any) => {
                console.error("DB Save Failed:", dbError)
                console.error("❌ [ANALYZE API] Error in async database save:", dbError?.message || dbError)
                // Don't crash - user will still see the analysis
              })
            }).catch((textError: any) => {
              console.error("DB Save Failed: Could not get full text from stream:", textError)
              console.error("❌ [ANALYZE API] Error getting full text for database save:", textError?.message || textError)
              // Don't crash - user will still see the analysis
            })
          } catch (dbInitError: any) {
            console.error("DB Save Failed: Error initializing DB save:", dbInitError)
            console.error("❌ [ANALYZE API] Error setting up database save:", dbInitError?.message || dbInitError)
            // Don't crash - continue with streaming response
          }
        } else {
          console.log("Step 4: Skipping DB save (no authenticated user)")
        }

        // Use toTextStreamResponse() for streaming text response
        // This returns plain text that can be parsed with buffering
        return result.toTextStreamResponse()
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
    // Global error handler - return specific error messages
    const errorType = error?.constructor?.name || "Unknown"
    const errorMessage = error?.message || "An unexpected error occurred"
    const errorStack = error?.stack || "No stack trace available"
    const errorDetails = error?.cause?.message || error?.statusText || "No additional details"

    console.error("❌ [ANALYZE API] Global Error Handler - Unexpected Error:")
    console.error("   Error type:", errorType)
    console.error("   Error message:", errorMessage)
    console.error("   Error details:", errorDetails)
    console.error("   Error stack:", errorStack)
    
    // Log full error object in development
    if (process.env.NODE_ENV === "development") {
      console.error("   Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    }

    // Return detailed error response with specific error message
    return new Response(
      JSON.stringify({ 
        error: "Failed to analyze image",
        message: errorMessage,
        type: errorType,
        details: errorDetails,
        // Only include stack in development
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
