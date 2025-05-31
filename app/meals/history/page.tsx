"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface MealHistoryData {
  success: boolean;
  statistics?: {
    period: string;
    total_days: number;
    total_calories: number;
    avg_calories_per_day: number;
    daily_goal: number;
    goal_met_days: number;
    goal_met_percentage: number;
    total_meals: number;
  };
  daily_summaries?: Array<{
    date: string;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    daily_goal: number;
    calories_remaining: number;
    calorie_percentage: number;
    goal_met: boolean;
    meal_count: number;
    meals: Array<{
      id: string;
      description: string;
      total_calories: number;
      total_protein: number;
      total_carbs: number;
      total_fat: number;
      created_at: string;
    }>;
  }>;
  error?: string;
}

export default function MealHistoryPage() {
  const [historyData, setHistoryData] = useState<MealHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();

  const fetchHistory = async (period: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/meals/history?period=${period}`);
      const data: MealHistoryData = await response.json();

      if (data.success) {
        setHistoryData(data);
        setError("");
      } else {
        setError(data.error || "Failed to load history");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(selectedPeriod);
  }, [selectedPeriod]);

  const toggleDayExpansion = (date: string) => {
    setExpandedDays((prev) =>
      prev.includes(date)
        ? prev.filter((d) => d !== date)
        : [...prev, date]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleExport = async (format: "json" | "csv") => {
    try {
      setIsExporting(true);
      const baseUrl = `/api/meals/export?format=${format}`;
      
      // Add date range based on selected period
      const today = new Date();
      let startDate = "";
      
      switch (selectedPeriod) {
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          startDate = weekAgo.toISOString().split("T")[0];
          break;
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          startDate = monthAgo.toISOString().split("T")[0];
          break;
        case "year":
          const yearAgo = new Date(today);
          yearAgo.setFullYear(today.getFullYear() - 1);
          startDate = yearAgo.toISOString().split("T")[0];
          break;
      }
      
      const url = startDate ? `${baseUrl}&start_date=${startDate}` : baseUrl;
      
      // Create a temporary link to download the file
      const link = document.createElement("a");
      link.href = url;
      link.download = `fitbite_${format}_export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meal history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ {error}</div>
          <button
            onClick={() => fetchHistory(selectedPeriod)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!historyData || !historyData.statistics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p>No meal history found.</p>
          <button
            onClick={() => router.push("/meals")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Start Logging Meals
          </button>
        </div>
      </div>
    );
  }

  const { statistics, daily_summaries } = historyData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📊 Meal History & Analytics
              </h1>
              <p className="text-gray-600">
                Track your nutrition progress over time
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push("/meals")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Back to Tracking
              </button>
              <button
                onClick={() => handleExport("json")}
                disabled={isExporting}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? "Exporting..." : "📥 JSON"}
              </button>
              <button
                onClick={() => handleExport("csv")}
                disabled={isExporting}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? "Exporting..." : "📊 CSV"}
              </button>
            </div>
          </div>
        </div>

        {/* Period Selection */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {["week", "month", "year"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedPeriod === period
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Past {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-blue-600">
              {statistics.total_days}
            </div>
            <div className="text-sm text-gray-600">Days Tracked</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-green-600">
              {statistics.avg_calories_per_day}
            </div>
            <div className="text-sm text-gray-600">Avg Calories/Day</div>
            <div className="text-xs text-gray-500 mt-1">
              Goal: {statistics.daily_goal} cal
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-purple-600">
              {statistics.goal_met_percentage}%
            </div>
            <div className="text-sm text-gray-600">Goal Achievement</div>
            <div className="text-xs text-gray-500 mt-1">
              {statistics.goal_met_days}/{statistics.total_days} days
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-orange-600">
              {statistics.total_meals}
            </div>
            <div className="text-sm text-gray-600">Total Meals</div>
            <div className="text-xs text-gray-500 mt-1">
              {(statistics.total_meals / statistics.total_days).toFixed(1)} meals/day
            </div>
          </div>
        </div>

        {/* Daily Summaries */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Daily Breakdown
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {daily_summaries?.map((day) => (
              <div key={day.date} className="p-6">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleDayExpansion(day.date)}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-800">
                        {formatDate(day.date)}
                      </h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          {Math.round(day.total_calories)} / {day.daily_goal} cal
                        </span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          day.goal_met ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {day.goal_met ? "Goal Met" : "Under Goal"}
                        </span>
                        <span className="text-gray-400">
                          {expandedDays.includes(day.date) ? "▼" : "▶"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(day.calorie_percentage)}`}
                        style={{ width: `${Math.min(day.calorie_percentage, 100)}%` }}
                      ></div>
                    </div>
                    
                    {/* Macro Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-blue-700">
                          {Math.round(day.total_protein)}g
                        </div>
                        <div className="text-xs text-gray-600">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-orange-700">
                          {Math.round(day.total_carbs)}g
                        </div>
                        <div className="text-xs text-gray-600">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-purple-700">
                          {Math.round(day.total_fat)}g
                        </div>
                        <div className="text-xs text-gray-600">Fat</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Meal Details */}
                {expandedDays.includes(day.date) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Meals ({day.meal_count})
                    </h4>
                    <div className="space-y-3">
                      {day.meals.map((meal) => (
                        <div key={meal.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">
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
              </div>
            ))}
          </div>
        </div>

        {daily_summaries?.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500">
              <p className="text-lg mb-2">No meals found for this period</p>
              <p className="text-sm">Start logging meals to see your history here</p>
              <button
                onClick={() => router.push("/meals")}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Log Your First Meal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
