import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sanitizeInput } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rateLimit";
import { createClient } from "@/utils/supabase/server";

// Initialize OpenAI client
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
    const rateLimitResult = rateLimit(ip, { windowMs: 60000, maxRequests: 30 });
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
    const { mealType, description } = body;

    if (!description?.trim()) {
      return NextResponse.json(
        { success: false, error: "Meal description is required" },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedDescription = sanitizeInput(description);
    const sanitizedMealType = sanitizeInput(mealType || "");

    // Check if OpenAI is available
    if (!openai) {
      return NextResponse.json(
        { success: false, error: "OpenAI service is not available" },
        { status: 503 }
      );
    }

    // Prepare dietary restrictions for validation
    let dietaryValidation = "";
    if (profile?.dietary_preference) {
      if (profile.dietary_preference === "vegetarian") {
        dietaryValidation += "The user is VEGETARIAN - they cannot eat meat, fish, or poultry. ";
      } else if (profile.dietary_preference === "vegan") {
        dietaryValidation += "The user is VEGAN - they cannot eat any animal products including meat, fish, poultry, dairy, eggs, honey, or any animal-derived ingredients. ";
      }
    }

    if (profile?.allergies && profile.allergies.length > 0) {
      dietaryValidation += `The user is allergic to: ${profile.allergies.join(", ")}. `;
    }

    if (dietaryValidation) {
      dietaryValidation += "IMPORTANT: If the meal description contains any foods that violate these dietary restrictions, immediately return an error indicating dietary violation instead of asking clarification questions.";
    }

    // Use OpenAI to determine if clarification is needed or if there are dietary violations
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a nutrition assistant helping users log meals accurately while respecting their dietary restrictions.
          
          ${dietaryValidation}
          
          First, check if the meal violates any dietary restrictions. If it does, return:
          {
            "success": false,
            "dietary_violation": true,
            "violating_foods": ["list of problematic foods"],
            "reason": "explanation of why these foods are not allowed"
          }
          
          If there are NO dietary violations, analyze the meal description and determine if clarification questions are needed for better calorie tracking.
          
          Return a JSON object with:
          - "needs_clarification": boolean (true if questions are needed)
          - "questions": array of specific clarification questions (max 3 questions)
          
          Ask clarification questions only when:
          1. Cooking methods are unclear (e.g., "chicken" - fried, grilled, boiled?)
          2. Bread/grain types are vague (white, brown, multigrain?)
          3. Missing important details about preparation (oil used, dressing, sauce?)
          4. Portion sizes are very unclear
          
          DO NOT ask clarification for:
          - Already detailed descriptions
          - Common foods with standard preparations
          - When quantities are reasonably clear
          
          Example output for vague input (no dietary violations):
          {"needs_clarification": true, "questions": ["Was the chicken fried, grilled, or boiled?", "What type of bread did you have?", "Did you use any oil or butter for cooking?"]}
          
          Example output for clear input (no dietary violations):
          {"needs_clarification": false, "questions": []}`,
        },
        {
          role: "user",
          content: `Meal Type: ${sanitizedMealType}\nDescription: ${sanitizedDescription}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return NextResponse.json(
        { success: false, error: "Failed to analyze meal description" },
        { status: 500 }
      );
    }

    try {
      const clarificationData = JSON.parse(aiResponse);

      // Check if there's a dietary violation
      if (clarificationData.dietary_violation) {
        return NextResponse.json({
          success: false,
          dietary_violation: true,
          violating_foods: clarificationData.violating_foods || [],
          reason: clarificationData.reason || "This meal contains foods that don't match your dietary preferences or allergies.",
        });
      }

      // Validate the response for clarification
      if (typeof clarificationData.needs_clarification !== "boolean") {
        throw new Error("Invalid response format");
      }

      const questions = Array.isArray(clarificationData.questions)
        ? clarificationData.questions
            .slice(0, 3)
            .map((q: string) => sanitizeInput(q))
        : [];

      return NextResponse.json({
        success: true,
        needs_clarification: clarificationData.needs_clarification,
        questions,
        original_description: sanitizedDescription,
      });
    } catch (parseError) {
      console.error("Error parsing AI clarification response:", parseError);

      // Fallback: no clarification needed
      return NextResponse.json({
        success: true,
        needs_clarification: false,
        questions: [],
        original_description: sanitizedDescription,
      });
    }
  } catch (error) {
    console.error("Error in meal clarification API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
