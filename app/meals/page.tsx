"use client";

import { useState } from "react";
import MealLogger from "@/app/components/MealLogger";
import DailySummary from "@/app/components/DailySummary";

export default function MealTrackingPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMealLogged = () => {
    // Trigger a refresh of the daily summary
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🍽️ Meal Tracking</h1>
          <p className="mt-2 text-gray-600">
            Log your meals and track your daily nutrition
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Meal Logger */}
          <div>
            <MealLogger onMealLogged={handleMealLogged} />
          </div>

          {/* Daily Summary */}
          <div>
            <DailySummary refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            How it works
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">
                  Describe Your Meal
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Use natural language to describe what you ate. Our AI will
                  parse individual food items.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">
                  Automatic Calculation
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  We automatically calculate calories and macros using the
                  Nutritionix database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
