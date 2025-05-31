"use client";

import { useState, useEffect } from "react";
import type { DailySummaryResponse, DailySummary } from "@/types/meals";

interface DailySummaryProps {
  refreshTrigger: number;
  onSummaryUpdate?: (summary: DailySummary) => void;
}

export default function DailySummary({
  refreshTrigger,
  onSummaryUpdate,
}: DailySummaryProps) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(`/api/meals?date=${today}`);
        const data: DailySummaryResponse = await response.json();

        if (data.success && data.summary) {
          setSummary(data.summary);
          setError("");
          // Call the callback to update parent component only if it's different
          if (onSummaryUpdate) {
            onSummaryUpdate(data.summary);
          }
        } else {
          setError(data.error || "Failed to load summary");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]); // onSummaryUpdate is stable (wrapped in useCallback)

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/meals?date=${today}`);
      const data: DailySummaryResponse = await response.json();

      if (data.success && data.summary) {
        setSummary(data.summary);
        setError("");
        if (onSummaryUpdate) {
          onSummaryUpdate(data.summary);
        }
      } else {
        setError(data.error || "Failed to load summary");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600 text-center">
          <p>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const caloriePercentage = (summary.total_calories / summary.daily_goal) * 100;
  const isOverGoal = summary.total_calories > summary.daily_goal;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Today&apos;s Summary
      </h2>

      {/* Calorie Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Calories</span>
          <span className="text-sm text-gray-600">
            {Math.round(summary.total_calories)} / {summary.daily_goal}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              isOverGoal ? "bg-red-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(caloriePercentage, 100)}%` }}
          ></div>
        </div>
        <div className="mt-2 text-center">
          {isOverGoal ? (
            <span className="text-red-600 text-sm font-medium">
              {Math.round(summary.total_calories - summary.daily_goal)} calories
              over goal
            </span>
          ) : (
            <span className="text-green-600 text-sm font-medium">
              {Math.round(summary.calories_remaining)} calories remaining
            </span>
          )}
        </div>
      </div>

      {/* Macro Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-semibold text-blue-700">
            {Math.round(summary.total_protein)}g
          </div>
          <div className="text-xs text-blue-600">Protein</div>
          {/* Protein percentage of total calories */}
          <div className="text-xs text-blue-500 mt-1">
            {Math.round(
              (summary.total_protein * 4) / summary.total_calories
            )}
            %
          </div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-lg font-semibold text-orange-700">
            {Math.round(summary.total_carbs)}g
          </div>
          <div className="text-xs text-orange-600">Carbs</div>
          <div className="text-xs text-orange-500 mt-1">
            {Math.round(
              (summary.total_carbs * 4) / summary.total_calories
            )}
            %
          </div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-semibold text-purple-700">
            {Math.round(summary.total_fat)}g
          </div>
          <div className="text-xs text-purple-600">Fat</div>
          <div className="text-xs text-purple-500 mt-1">
            {Math.round((summary.total_fat * 9) / summary.total_calories)}%
          </div>
        </div>
      </div>

      {/* Enhanced Progress Metrics */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-800 mb-3">
          Daily Progress
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Progress:</span>
            <span className="ml-2 font-medium text-gray-800">
              {Math.round(caloriePercentage)}% of goal
            </span>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <span
              className={`ml-2 font-medium ${
                isOverGoal
                  ? "text-red-600"
                  : caloriePercentage >= 90
                  ? "text-green-600"
                  : caloriePercentage >= 70
                  ? "text-yellow-600"
                  : "text-blue-600"
              }`}
            >
              {isOverGoal
                ? "Over Goal"
                : caloriePercentage >= 90
                ? "Goal Reached"
                : caloriePercentage >= 70
                ? "Almost There"
                : "Getting Started"}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Meals Today:</span>
            <span className="ml-2 font-medium text-gray-800">
              {summary.meals.length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Avg per Meal:</span>
            <span className="ml-2 font-medium text-gray-800">
              {summary.meals.length > 0
                ? Math.round(summary.total_calories / summary.meals.length)
                : 0}{" "}
              cal
            </span>
          </div>
        </div>
      </div>

      {/* Meals List */}
      {summary.meals.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Today&apos;s Meals
          </h3>
          <div className="space-y-2">
            {summary.meals.map((meal) => (
              <div key={meal.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium">
                      {meal.description}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(meal.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800">
                      {Math.round(meal.total_calories)} cal
                    </div>
                    <div className="text-xs text-gray-600">
                      P: {Math.round(meal.total_protein)}g • C:{" "}
                      {Math.round(meal.total_carbs)}g • F:{" "}
                      {Math.round(meal.total_fat)}g
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.meals.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No meals logged today.</p>
          <p className="text-sm">Start by logging your first meal above!</p>
        </div>
      )}
    </div>
  );
}
