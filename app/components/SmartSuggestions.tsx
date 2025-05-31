"use client";

import { useState, useEffect } from "react";
import type { MealSuggestion, DailySummary } from "@/types/meals";

interface SmartSuggestionsProps {
  dailySummary: DailySummary | null;
  userProfile: {
    dietary_preference?: string;
    allergies?: string[];
  } | null;
}

export default function SmartSuggestions({
  dailySummary,
  userProfile,
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Manual refresh function for the button
  const refreshSuggestions = async () => {
    if (!dailySummary) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/meals/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calories_remaining: dailySummary.calories_remaining,
          current_macros: {
            protein: dailySummary.total_protein,
            carbs: dailySummary.total_carbs,
            fat: dailySummary.total_fat,
          },
          daily_goal: dailySummary.daily_goal,
          dietary_preference: userProfile?.dietary_preference,
          allergies: userProfile?.allergies || [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions || []);
      } else {
        setError(data.error || "Failed to get suggestions");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch suggestions when daily summary changes, with debouncing
  useEffect(() => {
    if (!dailySummary) {
      setSuggestions([]);
      return;
    }

    if (dailySummary.calories_remaining <= 0) {
      setSuggestions([]);
      return;
    }

    // Debounce the API call to prevent excessive requests
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/meals/suggestions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            calories_remaining: dailySummary.calories_remaining,
            current_macros: {
              protein: dailySummary.total_protein,
              carbs: dailySummary.total_carbs,
              fat: dailySummary.total_fat,
            },
            daily_goal: dailySummary.daily_goal,
            dietary_preference: userProfile?.dietary_preference,
            allergies: userProfile?.allergies || [],
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSuggestions(data.suggestions || []);
        } else {
          setError(data.error || "Failed to get suggestions");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 2000); // Wait 2 seconds before making the API call

    return () => clearTimeout(timeoutId);
  }, [dailySummary, userProfile]);

  if (!dailySummary) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🤖</span>
          </div>
          <p>Log some meals to get personalized suggestions</p>
        </div>
      </div>
    );
  }

  if (dailySummary.calories_remaining <= 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-xl">🎯</span>
          Smart Suggestions
        </h3>
        <div className="text-center text-green-600">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">✅</span>
          </div>
          <p className="font-medium">Daily calorie goal reached!</p>
          <p className="text-sm text-gray-600 mt-1">
            Great job staying within your target calories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-xl">🤖</span>
          Smart Suggestions
        </h3>
        <button
          onClick={refreshSuggestions}
          disabled={isLoading}
          className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 flex items-center gap-1"
        >
          <span className="text-xs">🔄</span>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-medium">
            {dailySummary.calories_remaining} calories remaining
          </span>{" "}
          • Based on your dietary preferences and nutrition balance
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-800">
                  {suggestion.title}
                </h4>
                <div className="flex gap-1">
                  {suggestion.dietary_compliance && (
                    <span
                      className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded"
                      title="Matches your dietary preference"
                    >
                      ✓ Diet
                    </span>
                  )}
                  {suggestion.allergy_safe && (
                    <span
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded"
                      title="Safe for your allergies"
                    >
                      ✓ Safe
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {suggestion.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {suggestion.ingredients.slice(0, 5).map((ingredient, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                  >
                    {ingredient}
                  </span>
                ))}
                {suggestion.ingredients.length > 5 && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                    +{suggestion.ingredients.length - 5} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4 text-gray-600">
                  <span>
                    🔥 {Math.round(suggestion.estimated_calories)} cal
                  </span>
                  <span>
                    💪 {Math.round(suggestion.estimated_protein)}g protein
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>{Math.round(suggestion.estimated_carbs)}g carbs</span>
                  <span>{Math.round(suggestion.estimated_fat)}g fat</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          <p>No suggestions available at the moment.</p>
          <button
            onClick={refreshSuggestions}
            className="text-blue-600 hover:text-blue-700 text-sm mt-2"
          >
            Try generating suggestions
          </button>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 These are AI-generated suggestions based on your preferences and
            remaining calories. Always verify nutritional information.
          </p>
        </div>
      )}
    </div>
  );
}
