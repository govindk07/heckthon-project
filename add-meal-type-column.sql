-- Add meal_type column to meals table
-- This migration adds support for meal types (Breakfast, Lunch, Dinner, Snack) in the conversational meal logger

ALTER TABLE meals
ADD COLUMN IF NOT EXISTS meal_type TEXT DEFAULT 'meal';

-- Create index for meal type filtering
CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON meals (meal_type);

-- Update the description with the new column
COMMENT ON COLUMN meals.meal_type IS 'Type of meal: Breakfast, Lunch, Dinner, Snack, or custom';