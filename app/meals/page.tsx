"use client";

import { useState, useEffect, useCallback } from "react";
import ConversationalMealLogger from "@/app/components/ConversationalMealLogger";
import DailySummary from "@/app/components/DailySummary";
import SmartSuggestions from "@/app/components/SmartSuggestions";
import type { DailySummary as DailySummaryType } from "@/types/meals";

export default function MealTrackingPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dailySummary, setDailySummary] = useState<DailySummaryType | null>(
    null
  );
  const [userProfile, setUserProfile] = useState<{
    dietary_preference?: string;
    allergies?: string[];
  } | null>(null);

  const handleMealLogged = () => {
    // Trigger a refresh of the daily summary
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSummaryUpdate = useCallback((summary: DailySummaryType) => {
    setDailySummary(summary);
  }, []);

  // Fetch user profile for suggestions
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setUserProfile({
            dietary_preference: data.profile?.dietary_preference,
            allergies: data.profile?.allergies || [],
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <a
              href="/"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors"
            >
              ← Back to Home
            </a>
            <a
              href="/profile"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              👤 Profile
            </a>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🍽️ Meal Tracking
              </h1>
              <p className="mt-2 text-gray-600">
                Log your meals and track your daily nutrition
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => (window.location.href = "/meals/history")}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                📊 View History
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Meal Logger */}
          <div>
            <ConversationalMealLogger onMealLogged={handleMealLogged} />
          </div>

          {/* Daily Summary */}
          <div>
            <DailySummary
              refreshTrigger={refreshTrigger}
              onSummaryUpdate={handleSummaryUpdate}
            />
          </div>

          {/* Smart Suggestions */}
          <div>
            <SmartSuggestions
              dailySummary={dailySummary}
              userProfile={userProfile}
            />
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
