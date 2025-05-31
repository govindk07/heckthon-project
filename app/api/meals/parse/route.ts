import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sanitizeInput } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rateLimit";
import { createClient } from "@/utils/supabase/server";

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

    // Get authenticated user and their profile
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user profile for dietary restrictions
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("dietary_preference, allergies")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
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

    // Prepare dietary restrictions for AI validation
    let dietaryInstructions = "";
    if (profile?.dietary_preference) {
      if (profile.dietary_preference === "vegetarian") {
        dietaryInstructions += "The user is VEGETARIAN - they cannot eat meat, fish, or poultry. ";
      } else if (profile.dietary_preference === "vegan") {
        dietaryInstructions += "The user is VEGAN - they cannot eat any animal products including meat, fish, poultry, dairy, eggs, honey, or any animal-derived ingredients. ";
      }
    }

    if (profile?.allergies && profile.allergies.length > 0) {
      dietaryInstructions += `The user is allergic to: ${profile.allergies.join(", ")}. `;
    }

    if (dietaryInstructions) {
      dietaryInstructions += "If the meal description contains any foods that violate these restrictions, return an error with 'dietary_violation': true and explain what foods are not allowed.";
    }

    // Use OpenAI to parse the meal description into individual food items
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a nutrition assistant that parses meal descriptions into individual food items and validates dietary restrictions. 
          
          ${dietaryInstructions}
          
          If there are NO dietary violations, parse the meal description and return a JSON object with:
          {
            "success": true,
            "parsed_items": [{"name": "food name", "quantity": number, "unit": "unit"}]
          }
          
          If there ARE dietary violations, return:
          {
            "success": false,
            "dietary_violation": true,
            "violating_foods": ["list of problematic foods"],
            "reason": "explanation of why these foods are not allowed"
          }
          
          Each parsed item should have: name (string), quantity (number), unit (string, optional).
          Be precise with quantities and use standard units (pieces, cups, grams, etc.).`,
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
      const result = JSON.parse(aiResponse);

      // Check if there's a dietary violation
      if (result.dietary_violation) {
        return NextResponse.json({
          success: false,
          dietary_violation: true,
          violating_foods: result.violating_foods || [],
          reason: result.reason || "This meal contains foods that don't match your dietary preferences or allergies.",
        });
      }

      // Validate the parsed items
      if (!result.success || !Array.isArray(result.parsed_items)) {
        throw new Error("Invalid response format");
      }

      const validatedItems = result.parsed_items.map(
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
