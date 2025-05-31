-- Meal Tracking Schema for FitBite App
-- This file contains the database schema for meal tracking functionality

-- Create meals table to store user meal entries
CREATE TABLE IF NOT EXISTS meals (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL, -- Original user input (e.g., "2 boiled eggs and toast")
    total_calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_protein DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_carbs DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_fat DECIMAL(10, 2) NOT NULL DEFAULT 0,
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create food_items table to store individual parsed food items from a meal
CREATE TABLE IF NOT EXISTS food_items (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    meal_id UUID REFERENCES meals (id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- Parsed food item name (e.g., "boiled eggs")
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1, -- Quantity/serving size
    unit TEXT, -- Unit of measurement (e.g., "pieces", "cups", "grams")
    calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
    protein DECIMAL(10, 2) NOT NULL DEFAULT 0,
    carbs DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fat DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals (user_id);

CREATE INDEX IF NOT EXISTS idx_meals_date ON meals (meal_date);

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals (user_id, meal_date);

CREATE INDEX IF NOT EXISTS idx_food_items_meal_id ON food_items (meal_id);

-- Enable Row Level Security (RLS)
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meals table
CREATE POLICY "Users can view their own meals" ON meals FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own meals" ON meals FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own meals" ON meals FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own meals" ON meals FOR DELETE USING (auth.uid () = user_id);

-- Create RLS policies for food_items table
CREATE POLICY "Users can view food items from their own meals" ON food_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM meals
            WHERE
                meals.id = food_items.meal_id
                AND meals.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert food items to their own meals" ON food_items FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM meals
            WHERE
                meals.id = food_items.meal_id
                AND meals.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update food items from their own meals" ON food_items FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM meals
        WHERE
            meals.id = food_items.meal_id
            AND meals.user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete food items from their own meals" ON food_items FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM meals
        WHERE
            meals.id = food_items.meal_id
            AND meals.user_id = auth.uid ()
    )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();