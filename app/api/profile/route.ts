import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ProfileData } from "@/types/auth";

export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { error: `Failed to fetch profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ProfileData = await request.json();
    console.log("Received profile data:", body);

    // Validate the data
    if (
      body.dietary_preference &&
      !["vegetarian", "vegan", "non-vegetarian"].includes(
        body.dietary_preference
      )
    ) {
      return NextResponse.json(
        { error: "Invalid dietary preference" },
        { status: 400 }
      );
    }

    if (
      body.activity_level &&
      ![
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "extremely_active",
      ].includes(body.activity_level)
    ) {
      return NextResponse.json(
        { error: "Invalid activity level" },
        { status: 400 }
      );
    }

    if (body.gender && !["male", "female"].includes(body.gender)) {
      return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
    }

    // Calculate auto calorie goal if physical stats are provided and no manual goal is set
    let calorieGoal = body.daily_calorie_goal;
    if (
      !calorieGoal &&
      body.age &&
      body.weight_kg &&
      body.height_cm &&
      body.activity_level &&
      body.gender
    ) {
      calorieGoal = calculateCalorieGoal(
        body.age,
        body.weight_kg,
        body.height_cm,
        body.activity_level,
        body.gender
      );
    }

    // Prepare update data, filtering out undefined values
    const updateData: Partial<ProfileData> = {};
    if (body.dietary_preference !== undefined)
      updateData.dietary_preference = body.dietary_preference;
    if (body.allergies !== undefined) updateData.allergies = body.allergies;
    if (calorieGoal !== undefined) updateData.daily_calorie_goal = calorieGoal;
    if (body.age !== undefined) updateData.age = body.age;
    if (body.weight_kg !== undefined) updateData.weight_kg = body.weight_kg;
    if (body.height_cm !== undefined) updateData.height_cm = body.height_cm;
    if (body.activity_level !== undefined)
      updateData.activity_level = body.activity_level;
    if (body.gender !== undefined) updateData.gender = body.gender;

    console.log("Update data:", updateData);

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: `Failed to update profile: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Enhanced BMR calculation using Mifflin-St Jeor Equation with gender
function calculateCalorieGoal(
  age: number,
  weight: number,
  height: number,
  activityLevel: string,
  gender: string
): number {
  // Calculate BMR based on gender
  // Male: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
  // Female: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };

  return Math.round(
    bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers]
  );
}
