import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sanitizeInput } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rateLimit";
import type { SuggestionRequest, MealSuggestion } from "@/types/meals";
import OpenAI from "openai";

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
    const rateLimitResult = rateLimit(ip, { windowMs: 60000, maxRequests: 20 }); // 20 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const supabase = createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: SuggestionRequest = await request.json();
    const {
      calories_remaining,
      current_macros,
      daily_goal,
      dietary_preference,
      allergies,
    } = body;

    // Validate input
    if (typeof calories_remaining !== "number" || calories_remaining < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid calories_remaining" },
        { status: 400 }
      );
    }

    // Check if OpenAI is available
    if (!openai) {
      return NextResponse.json(
        { success: false, error: "AI service is not available" },
        { status: 503 }
      );
    }

    // Prepare dietary restrictions text
    const dietaryRestrictions = [];
    if (dietary_preference === "vegetarian") {
      dietaryRestrictions.push("vegetarian (no meat, fish, or poultry)");
    } else if (dietary_preference === "vegan") {
      dietaryRestrictions.push(
        "vegan (no animal products including dairy, eggs, honey)"
      );
    }

    if (allergies && allergies.length > 0) {
      dietaryRestrictions.push(`allergic to: ${allergies.join(", ")}`);
    }

    const restrictionsText =
      dietaryRestrictions.length > 0
        ? `Dietary restrictions: ${dietaryRestrictions.join(". ")}.`
        : "No specific dietary restrictions.";

    // Calculate current macro percentages
    const currentCalories =
      current_macros.protein * 4 +
      current_macros.carbs * 4 +
      current_macros.fat * 9;
    const proteinRatio =
      currentCalories > 0 ? (current_macros.protein * 4) / currentCalories : 0;
    const carbsRatio =
      currentCalories > 0 ? (current_macros.carbs * 4) / currentCalories : 0;
    const fatRatio =
      currentCalories > 0 ? (current_macros.fat * 9) / currentCalories : 0;

    // Determine what macros are needed for balance
    let macroGuidance = "";
    if (proteinRatio < 0.15) {
      macroGuidance += "Focus on protein-rich foods. ";
    }
    if (carbsRatio < 0.45) {
      macroGuidance += "Include healthy carbohydrates. ";
    }
    if (fatRatio < 0.2) {
      macroGuidance += "Add healthy fats. ";
    }
    if (!macroGuidance) {
      macroGuidance = "Maintain balanced macro distribution. ";
    }

    const prompt = `You are a nutrition expert. Generate 3 meal suggestions for someone with ${calories_remaining} calories remaining in their daily budget.

Current daily intake:
- Protein: ${current_macros.protein}g
- Carbs: ${current_macros.carbs}g  
- Fat: ${current_macros.fat}g
- Daily calorie goal: ${daily_goal} calories

${restrictionsText}

Guidelines:
- ${macroGuidance}
- Each suggestion should be realistic and practical
- Target balanced nutrition within the calorie budget
- Include variety (breakfast/lunch/dinner/snack options appropriate for remaining calories)
- Ensure suggestions comply with dietary restrictions
- Avoid ingredients that the user is allergic to

Return a JSON array with exactly 3 suggestions. Each suggestion must have:
{
  "title": "Meal name (max 50 characters)",
  "description": "Brief description with cooking method (max 150 characters)", 
  "estimated_calories": number,
  "estimated_protein": number (grams),
  "estimated_carbs": number (grams),
  "estimated_fat": number (grams),
  "ingredients": ["ingredient1", "ingredient2", "ingredient3", ...] (max 8 ingredients),
  "dietary_compliance": true/false,
  "allergy_safe": true/false
}

Make sure estimated_calories for each suggestion is less than or equal to ${calories_remaining}. If calories_remaining is very low (under 100), suggest light snacks or drinks.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a professional nutritionist providing meal suggestions. Always respond with valid JSON only, no additional text.",
        },
        {
          role: "user",
          content: sanitizeInput(prompt),
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return NextResponse.json(
        { success: false, error: "Failed to generate suggestions" },
        { status: 500 }
      );
    }

    try {
      const suggestions: MealSuggestion[] = JSON.parse(aiResponse);

      // Validate the suggestions
      if (!Array.isArray(suggestions) || suggestions.length !== 3) {
        throw new Error("Invalid response format");
      }

      const validatedSuggestions = suggestions.map((suggestion, index) => ({
        id: `suggestion-${Date.now()}-${index}`,
        title: sanitizeInput(suggestion.title || "").substring(0, 50),
        description: sanitizeInput(suggestion.description || "").substring(
          0,
          150
        ),
        estimated_calories: Math.max(
          0,
          Math.min(suggestion.estimated_calories || 0, calories_remaining)
        ),
        estimated_protein: Math.max(0, suggestion.estimated_protein || 0),
        estimated_carbs: Math.max(0, suggestion.estimated_carbs || 0),
        estimated_fat: Math.max(0, suggestion.estimated_fat || 0),
        ingredients: (suggestion.ingredients || [])
          .slice(0, 8)
          .map((ing: string) => sanitizeInput(ing)),
        dietary_compliance: Boolean(suggestion.dietary_compliance),
        allergy_safe: Boolean(suggestion.allergy_safe),
      }));

      return NextResponse.json({
        success: true,
        suggestions: validatedSuggestions,
      });
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return NextResponse.json(
        { success: false, error: "Failed to parse suggestions" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in suggestions API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
