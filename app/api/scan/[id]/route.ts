import { auth } from "@clerk/nextjs/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: {
    id: string
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Step 1: Authentication check
    const { userId } = await auth()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "You must be logged in to delete scans" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const scanId = params.id

    if (!scanId) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Scan ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Step 2: Authorization check - verify scan belongs to current user
    const scan = await prisma.scan.findUnique({
      where: {
        id: scanId,
      },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!scan) {
      return new Response(
        JSON.stringify({ error: "Not Found", message: "Scan not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // CRITICAL: Verify scan belongs to current user
    if (scan.userId !== userId) {
      return new Response(
        JSON.stringify({ error: "Forbidden", message: "You do not have permission to delete this scan" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Step 3: Delete the scan (authorized)
    await prisma.scan.delete({
      where: {
        id: scanId,
      },
    })

    console.log(`✅ [DELETE SCAN] Scan ${scanId} deleted by user ${userId}`)

    // Step 4: Return success response
    return new Response(
      JSON.stringify({ success: true, message: "Scan deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    console.error("❌ [DELETE SCAN] Error deleting scan:", error)
    
    return new Response(
      JSON.stringify({ 
        error: "Internal Server Error", 
        message: error?.message || "Failed to delete scan" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

