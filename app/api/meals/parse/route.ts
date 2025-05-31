import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sanitizeInput } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rateLimit";

// Initialize OpenAI client with error handling for missing API key
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn("OpenAI client initialization failed:", error);
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimitResult = rateLimit(ip, { windowMs: 60000, maxRequests: 30 }); // 30 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { description } = body;

    if (!description?.trim()) {
      return NextResponse.json(
        { success: false, error: "Meal description is required" },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedDescription = sanitizeInput(description);

    // Check if OpenAI is available
    if (!openai) {
      return NextResponse.json(
        { success: false, error: "OpenAI service is not available" },
        { status: 503 }
      );
    }

    // Use OpenAI to parse the meal description into individual food items
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a nutrition assistant that parses meal descriptions into individual food items. 
          Parse the following meal description and return a JSON array of food items with their quantities and units.
          Each item should have: name (string), quantity (number), unit (string, optional).
          Be precise with quantities and use standard units (pieces, cups, grams, etc.).
          Example output: [{"name": "boiled eggs", "quantity": 2, "unit": "pieces"}, {"name": "toast", "quantity": 1, "unit": "slice"}]`,
        },
        {
          role: "user",
          content: sanitizedDescription,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return NextResponse.json(
        { success: false, error: "Failed to parse meal description" },
        { status: 500 }
      );
    }

    try {
      const parsedItems = JSON.parse(aiResponse);

      // Validate the parsed items
      if (!Array.isArray(parsedItems)) {
        throw new Error("Invalid response format");
      }

      const validatedItems = parsedItems.map(
        (item: { name?: string; quantity?: number; unit?: string }) => ({
          name: sanitizeInput(item.name || ""),
          quantity: parseFloat(String(item.quantity)) || 1,
          unit: item.unit ? sanitizeInput(item.unit) : undefined,
        })
      );

      return NextResponse.json({
        success: true,
        parsed_items: validatedItems,
      });
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return NextResponse.json(
        { success: false, error: "Failed to parse meal items" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in parse-meal API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
