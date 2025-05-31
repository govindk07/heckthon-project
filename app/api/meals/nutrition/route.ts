import { NextRequest, NextResponse } from "next/server";
import { sanitizeInput } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rateLimit";
import type { ParsedFoodItem, NutritionData } from "@/types/meals";

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
    const { food_items } = body;

    if (!Array.isArray(food_items) || food_items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Food items array is required" },
        { status: 400 }
      );
    }

    const nutritionixAppId = process.env.NUTRITIONIX_APP_ID;
    const nutritionixApiKey = process.env.NUTRITIONIX_API_KEY;

    if (!nutritionixAppId || !nutritionixApiKey) {
      return NextResponse.json(
        { success: false, error: "Nutritionix API credentials not configured" },
        { status: 500 }
      );
    }

    // Calculate nutrition for each food item
    const nutritionPromises = food_items.map(async (item: ParsedFoodItem) => {
      const query = `${item.quantity} ${item.unit || ""} ${item.name}`.trim();

      try {
        const response = await fetch(
          "https://trackapi.nutritionix.com/v2/natural/nutrients",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-app-id": nutritionixAppId,
              "x-app-key": nutritionixApiKey,
            },
            body: JSON.stringify({
              query: sanitizeInput(query),
            }),
          }
        );

        if (!response.ok) {
          console.error(
            `Nutritionix API error for "${query}":`,
            response.status
          );
          // Return default values if API fails
          return {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          };
        }

        const data = await response.json();
        const food = data.foods?.[0];

        if (food) {
          return {
            calories: food.nf_calories || 0,
            protein: food.nf_protein || 0,
            carbs: food.nf_total_carbohydrate || 0,
            fat: food.nf_total_fat || 0,
          };
        }

        return {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };
      } catch (error) {
        console.error(`Error fetching nutrition for "${query}":`, error);
        return {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };
      }
    });

    const nutritionResults = await Promise.all(nutritionPromises);

    // Sum up total nutrition
    const totalNutrition: NutritionData = nutritionResults.reduce(
      (total, nutrition) => ({
        calories: total.calories + nutrition.calories,
        protein: total.protein + nutrition.protein,
        carbs: total.carbs + nutrition.carbs,
        fat: total.fat + nutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return NextResponse.json({
      success: true,
      nutrition: totalNutrition,
      item_nutrition: nutritionResults,
    });
  } catch (error) {
    console.error("Error in nutrition API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
