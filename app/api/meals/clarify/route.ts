import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sanitizeInput } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rateLimit";

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

    // Use OpenAI to determine if clarification is needed
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a nutrition assistant helping users log meals accurately. 
          Analyze the meal description and determine if clarification questions are needed for better calorie tracking.
          
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
          
          Example output for vague input:
          {"needs_clarification": true, "questions": ["Was the chicken fried, grilled, or boiled?", "What type of bread did you have?", "Did you use any oil or butter for cooking?"]}
          
          Example output for clear input:
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

      // Validate the response
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
