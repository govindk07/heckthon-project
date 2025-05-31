"use client";

import { useState } from "react";
import type { MealLogResponse } from "@/types/meals";

interface MealLoggerProps {
  onMealLogged: () => void;
}

export default function MealLogger({ onMealLogged }: MealLoggerProps) {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError("Please enter a meal description");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description.trim(),
        }),
      });

      const data: MealLogResponse = await response.json();

      if (data.success) {
        setDescription("");
        onMealLogged();
      } else {
        setError(data.error || "Failed to log meal");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Log Your Meal
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="meal-description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            What did you eat?
          </label>
          <textarea
            id="meal-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., 2 boiled eggs, 1 slice of toast with butter, 1 cup of coffee"
            className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !description.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            "Log Meal"
          )}
        </button>
      </form>

      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          💡 Tips for better tracking:
        </h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>
            • Be specific with quantities (e.g., &quot;2 cups rice&quot; not
            just &quot;rice&quot;)
          </li>
          <li>
            • Include cooking methods (e.g., &quot;grilled chicken&quot; vs
            &quot;fried chicken&quot;)
          </li>
          <li>• Mention brands when relevant for packaged foods</li>
        </ul>
      </div>
    </div>
  );
}
