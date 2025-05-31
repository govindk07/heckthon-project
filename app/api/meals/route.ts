import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sanitizeInput } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rateLimit";
import type { MealInput, ParsedFoodItem, NutritionData } from "@/types/meals";

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

    const body = await request.json();
    const { description, meal_date }: MealInput = body;

    if (!description?.trim()) {
      return NextResponse.json(
        { success: false, error: "Meal description is required" },
        { status: 400 }
      );
    }

    const sanitizedDescription = sanitizeInput(description);
    const mealDate = meal_date || new Date().toISOString().split("T")[0];

    // Step 1: Parse meal description using AI
    const parseResponse = await fetch(
      `${request.nextUrl.origin}/api/meals/parse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: sanitizedDescription }),
      }
    );

    if (!parseResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to parse meal description" },
        { status: 500 }
      );
    }

    const parseData = await parseResponse.json();
    if (!parseData.success) {
      return NextResponse.json(
        { success: false, error: parseData.error },
        { status: 500 }
      );
    }

    const parsedItems: ParsedFoodItem[] = parseData.parsed_items;

    // Step 2: Get nutrition data for parsed items
    const nutritionResponse = await fetch(
      `${request.nextUrl.origin}/api/meals/nutrition`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ food_items: parsedItems }),
      }
    );

    if (!nutritionResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to calculate nutrition" },
        { status: 500 }
      );
    }

    const nutritionData = await nutritionResponse.json();
    if (!nutritionData.success) {
      return NextResponse.json(
        { success: false, error: nutritionData.error },
        { status: 500 }
      );
    }

    const totalNutrition: NutritionData = nutritionData.nutrition;
    const itemNutrition: NutritionData[] = nutritionData.item_nutrition;

    // Step 3: Save meal to database
    const { data: mealData, error: mealError } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        description: sanitizedDescription,
        total_calories: totalNutrition.calories,
        total_protein: totalNutrition.protein,
        total_carbs: totalNutrition.carbs,
        total_fat: totalNutrition.fat,
        meal_date: mealDate,
      })
      .select()
      .single();

    if (mealError) {
      console.error("Error inserting meal:", mealError);
      return NextResponse.json(
        { success: false, error: "Failed to save meal" },
        { status: 500 }
      );
    }

    // Step 4: Save individual food items
    const foodItemsToInsert = parsedItems.map((item, index) => ({
      meal_id: mealData.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      calories: itemNutrition[index]?.calories || 0,
      protein: itemNutrition[index]?.protein || 0,
      carbs: itemNutrition[index]?.carbs || 0,
      fat: itemNutrition[index]?.fat || 0,
    }));

    const { data: foodItemsData, error: foodItemsError } = await supabase
      .from("food_items")
      .insert(foodItemsToInsert)
      .select();

    if (foodItemsError) {
      console.error("Error inserting food items:", foodItemsError);
      // Continue even if food items fail - we have the meal logged
    }

    // Return the complete meal with food items
    const completeMeal = {
      ...mealData,
      food_items: foodItemsData || [],
    };

    return NextResponse.json({
      success: true,
      meal: completeMeal,
    });
  } catch (error) {
    console.error("Error in meals API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Get meals for the specified date
    const { data: meals, error: mealsError } = await supabase
      .from("meals")
      .select(
        `
        *,
        food_items (*)
      `
      )
      .eq("user_id", user.id)
      .eq("meal_date", date)
      .order("created_at", { ascending: true });

    if (mealsError) {
      console.error("Error fetching meals:", mealsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch meals" },
        { status: 500 }
      );
    }

    // Get user's daily calorie goal
    const { data: profile } = await supabase
      .from("profiles")
      .select("daily_calorie_goal")
      .eq("id", user.id)
      .single();

    const dailyGoal = profile?.daily_calorie_goal || 2000;

    // Calculate daily summary
    const totalCalories = meals.reduce(
      (sum, meal) => sum + (meal.total_calories || 0),
      0
    );
    const totalProtein = meals.reduce(
      (sum, meal) => sum + (meal.total_protein || 0),
      0
    );
    const totalCarbs = meals.reduce(
      (sum, meal) => sum + (meal.total_carbs || 0),
      0
    );
    const totalFat = meals.reduce(
      (sum, meal) => sum + (meal.total_fat || 0),
      0
    );

    const summary = {
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
      calories_remaining: Math.max(0, dailyGoal - totalCalories),
      daily_goal: dailyGoal,
      meals: meals,
    };

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error in GET meals API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
