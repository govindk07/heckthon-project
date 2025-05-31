import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimitResult = rateLimit(ip, { windowMs: 60000, maxRequests: 60 }); // 60 requests per minute
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
    const period = searchParams.get("period") || "week"; // week, month, year
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let dateFilter = "";
    const today = new Date();
    
    if (startDate && endDate) {
      // Custom date range
      dateFilter = `meal_date >= '${startDate}' AND meal_date <= '${endDate}'`;
    } else {
      // Predefined periods
      switch (period) {
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          dateFilter = `meal_date >= '${weekAgo.toISOString().split("T")[0]}'`;
          break;
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          dateFilter = `meal_date >= '${monthAgo.toISOString().split("T")[0]}'`;
          break;
        case "year":
          const yearAgo = new Date(today);
          yearAgo.setFullYear(today.getFullYear() - 1);
          dateFilter = `meal_date >= '${yearAgo.toISOString().split("T")[0]}'`;
          break;
        default:
          return NextResponse.json(
            { success: false, error: "Invalid period. Use 'week', 'month', 'year', or provide start_date and end_date" },
            { status: 400 }
          );
      }
    }

    // Get meals for the specified period
    const { data: meals, error: mealsError } = await supabase
      .from("meals")
      .select(
        `
        *,
        food_items (*)
      `
      )
      .eq("user_id", user.id)
      .gte("meal_date", dateFilter.split("'")[1]) // Extract start date from filter
      .order("meal_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (mealsError) {
      console.error("Error fetching meal history:", mealsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch meal history" },
        { status: 500 }
      );
    }

    // Get user's daily calorie goal
    const { data: profile } = await supabase
      .from("users")
      .select("daily_calorie_goal")
      .eq("id", user.id)
      .single();

    const dailyGoal = profile?.daily_calorie_goal || 2000;

    // Group meals by date and calculate daily summaries
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
      meal_date: string;
      total_calories: number;
      total_protein: number;
      total_carbs: number;
      total_fat: number;
      food_items: FoodItem[];
      created_at: string;
      description?: string;
    }

    interface DailySummary {
      date: string;
      total_calories: number;
      total_protein: number;
      total_carbs: number;
      total_fat: number;
      goal_met: boolean;
      meals_count: number;
      daily_goal: number;
      meals: Meal[];
      calorie_percentage: number;
      meal_count: number;
      calories_remaining: number;
    }

    const dailySummaries: { [key: string]: DailySummary } = {};
    
    meals.forEach((meal: Meal) => {
      const date = meal.meal_date;
      if (!dailySummaries[date]) {
        dailySummaries[date] = {
          date,
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
          daily_goal: dailyGoal,
          meals: [],
          goal_met: false,
          meals_count: 0,
          calorie_percentage: 0,
          meal_count: 0,
          calories_remaining: 0,
        };
      }
      
      dailySummaries[date].total_calories += meal.total_calories || 0;
      dailySummaries[date].total_protein += meal.total_protein || 0;
      dailySummaries[date].total_carbs += meal.total_carbs || 0;
      dailySummaries[date].total_fat += meal.total_fat || 0;
      dailySummaries[date].meals.push(meal);
    });

    // Calculate additional metrics
    Object.keys(dailySummaries).forEach((date) => {
      const summary = dailySummaries[date];
      summary.calories_remaining = Math.max(0, dailyGoal - summary.total_calories);
      summary.calorie_percentage = (summary.total_calories / dailyGoal) * 100;
      summary.goal_met = summary.total_calories >= dailyGoal * 0.9; // Within 90% of goal
      summary.meal_count = summary.meals.length;
      summary.meals_count = summary.meals.length;
    });

    // Convert to array and sort by date
    const summariesArray = Object.values(dailySummaries).sort(
      (a: DailySummary, b: DailySummary) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate overall period statistics
    const totalDays = summariesArray.length;
    const totalCalories = summariesArray.reduce((sum: number, day: DailySummary) => sum + day.total_calories, 0);
    const avgCaloriesPerDay = totalDays > 0 ? totalCalories / totalDays : 0;
    const goalMetDays = summariesArray.filter((day: DailySummary) => day.goal_met).length;
    const goalMetPercentage = totalDays > 0 ? (goalMetDays / totalDays) * 100 : 0;

    const statistics = {
      period,
      total_days: totalDays,
      total_calories: totalCalories,
      avg_calories_per_day: Math.round(avgCaloriesPerDay),
      daily_goal: dailyGoal,
      goal_met_days: goalMetDays,
      goal_met_percentage: Math.round(goalMetPercentage),
      total_meals: meals.length,
    };

    return NextResponse.json({
      success: true,
      statistics,
      daily_summaries: summariesArray,
    });
  } catch (error) {
    console.error("Error in meal history API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
