// Meal tracking types for the FitBite app

export interface FoodItem {
  id: string;
  meal_id: string;
  name: string;
  quantity: number;
  unit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  description: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_date: string;
  created_at: string;
  updated_at: string;
  food_items?: FoodItem[];
}

export interface MealInput {
  description: string;
  meal_date?: string;
}

export interface ParsedFoodItem {
  name: string;
  quantity: number;
  unit?: string;
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailySummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  calories_remaining: number;
  daily_goal: number;
  meals: Meal[];
}

export interface MealLogResponse {
  success: boolean;
  meal?: Meal;
  error?: string;
}

export interface CalorieCalculationResponse {
  success: boolean;
  nutrition?: NutritionData;
  parsed_items?: ParsedFoodItem[];
  dietary_violation?: boolean;
  violating_foods?: string[];
  reason?: string;
  error?: string;
}

export interface DailySummaryResponse {
  success: boolean;
  summary?: DailySummary;
  error?: string;
}

// Smart Suggestions types
export interface MealSuggestion {
  id: string;
  title: string;
  description: string;
  estimated_calories: number;
  estimated_protein: number;
  estimated_carbs: number;
  estimated_fat: number;
  ingredients: string[];
  dietary_compliance: boolean;
  allergy_safe: boolean;
}

export interface SuggestionRequest {
  calories_remaining: number;
  current_macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  daily_goal: number;
  dietary_preference?: string;
  allergies?: string[];
}

export interface SuggestionsResponse {
  success: boolean;
  suggestions?: MealSuggestion[];
  error?: string;
}
