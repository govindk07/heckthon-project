import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { rateLimit } from "@/lib/rateLimit";

interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  id: string;
  description: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_date: string;
  created_at: string;
  food_items?: FoodItem[];
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimitResult = rateLimit(ip, { windowMs: 60000, maxRequests: 10 }); // 10 exports per minute
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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json"; // json, csv
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Get all user data
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // Build date filter (kept for potential future use)
    // let dateFilter = {};
    // if (startDate) {
    //   dateFilter = { ...dateFilter, meal_date: { gte: startDate } };
    // }
    // if (endDate) {
    //   dateFilter = { ...dateFilter, meal_date: { lte: endDate } };
    // }

    // Get meals with food items
    let query = supabase
      .from("meals")
      .select(
        `
        *,
        food_items (*)
      `
      )
      .eq("user_id", user.id)
      .order("meal_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (startDate) {
      query = query.gte("meal_date", startDate);
    }
    if (endDate) {
      query = query.lte("meal_date", endDate);
    }

    const { data: meals, error: mealsError } = await query;

    if (mealsError) {
      console.error("Error fetching meals for export:", mealsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch meal data" },
        { status: 500 }
      );
    }

    const exportData = {
      export_info: {
        user_id: user.id,
        export_date: new Date().toISOString(),
        date_range: {
          start: startDate || "all_time",
          end: endDate || new Date().toISOString().split("T")[0],
        },
        total_meals: meals.length,
        total_food_items: meals.reduce((sum, meal) => sum + (meal.food_items?.length || 0), 0),
      },
      user_profile: {
        email: profile?.email,
        name: profile?.name,
        dietary_preference: profile?.dietary_preference,
        allergies: profile?.allergies,
        daily_calorie_goal: profile?.daily_calorie_goal,
        age: profile?.age,
        weight_kg: profile?.weight_kg,
        height_cm: profile?.height_cm,
        activity_level: profile?.activity_level,
        created_at: profile?.created_at,
      },
      meals: meals.map((meal) => ({
        id: meal.id,
        description: meal.description,
        total_calories: meal.total_calories,
        total_protein: meal.total_protein,
        total_carbs: meal.total_carbs,
        total_fat: meal.total_fat,
        meal_date: meal.meal_date,
        created_at: meal.created_at,
        food_items: meal.food_items || [],
      })),
    };

    if (format === "csv") {
      // Generate CSV format
      const csvRows = [];
      
      // Headers
      csvRows.push([
        "Date",
        "Time",
        "Meal Description",
        "Total Calories",
        "Total Protein (g)",
        "Total Carbs (g)",
        "Total Fat (g)",
        "Food Item Name",
        "Food Quantity",
        "Food Unit",
        "Food Calories",
        "Food Protein (g)",
        "Food Carbs (g)",
        "Food Fat (g)",
      ].join(","));

      // Data rows
      meals.forEach((meal: Meal) => {
        if (meal.food_items && meal.food_items.length > 0) {
          meal.food_items.forEach((item: FoodItem) => {
            csvRows.push([
              meal.meal_date,
              new Date(meal.created_at).toLocaleTimeString(),
              `"${meal.description.replace(/"/g, '""')}"`,
              meal.total_calories,
              meal.total_protein,
              meal.total_carbs,
              meal.total_fat,
              `"${item.name.replace(/"/g, '""')}"`,
              item.quantity,
              item.unit || "",
              item.calories,
              item.protein,
              item.carbs,
              item.fat,
            ].join(","));
          });
        } else {
          // Meal without food items
          csvRows.push([
            meal.meal_date,
            new Date(meal.created_at).toLocaleTimeString(),
            `"${meal.description.replace(/"/g, '""')}"`,
            meal.total_calories,
            meal.total_protein,
            meal.total_carbs,
            meal.total_fat,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ].join(","));
        }
      });

      const csvContent = csvRows.join("\n");
      const filename = `fitbite_meals_${startDate || "all"}_to_${endDate || "latest"}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Default: JSON format
    const filename = `fitbite_data_${startDate || "all"}_to_${endDate || "latest"}.json`;
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error in data export API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
