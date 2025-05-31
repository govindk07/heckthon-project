export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  // Profile & Personalization fields
  dietary_preference?: "vegetarian" | "vegan" | "non-vegetarian";
  allergies?: string[];
  daily_calorie_goal?: number;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  activity_level?:
    | "sedentary"
    | "lightly_active"
    | "moderately_active"
    | "very_active"
    | "extremely_active";
  gender?: "male" | "female";
  created_at?: string;
}

export interface AuthResponse {
  user: User | null;
  error?: string;
}

export interface ProfileData {
  dietary_preference?: "vegetarian" | "vegan" | "non-vegetarian";
  allergies?: string[];
  daily_calorie_goal?: number;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  activity_level?:
    | "sedentary"
    | "lightly_active"
    | "moderately_active"
    | "very_active"
    | "extremely_active";
  gender?: "male" | "female";
}
