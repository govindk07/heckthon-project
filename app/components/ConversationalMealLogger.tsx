"use client";

import { useState } from "react";
import type { MealLogResponse, ParsedFoodItem } from "@/types/meals";

interface MealLoggerProps {
  onMealLogged: () => void;
}

interface ParsedItem {
  name: string;
  quantity: number;
  unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

type ConversationStep =
  | "meal_type"
  | "description"
  | "clarification"
  | "confirmation"
  | "complete";

interface ConversationState {
  step: ConversationStep;
  mealType: string;
  description: string;
  clarificationQuestions: string[];
  clarificationAnswers: Record<string, string>;
  parsedItems: ParsedItem[];
  totalCalories: number;
}

export default function ConversationalMealLogger({
  onMealLogged,
}: MealLoggerProps) {
  const [state, setState] = useState<ConversationState>({
    step: "meal_type",
    mealType: "",
    description: "",
    clarificationQuestions: [],
    clarificationAnswers: {},
    parsedItems: [],
    totalCalories: 0,
  });

  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

  const handleMealTypeSelect = (mealType: string) => {
    setState((prev) => ({
      ...prev,
      mealType,
      step: "description",
    }));
    setCurrentInput("");
  };

  const handleDescriptionSubmit = async () => {
    if (!currentInput.trim()) {
      setError("Please describe what you ate");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check if we need clarification
      const clarificationResponse = await fetch("/api/meals/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: state.mealType,
          description: currentInput.trim(),
        }),
      });

      const clarificationData = await clarificationResponse.json();

      // Check for dietary violations first
      if (clarificationData.dietary_violation) {
        const violatingFoods = clarificationData.violating_foods || [];
        const reason = clarificationData.reason || "This meal doesn't match your dietary preferences.";
        
        let errorMessage = `❌ Dietary Restriction Violation:\n\n${reason}`;
        if (violatingFoods.length > 0) {
          errorMessage += `\n\nProblematic foods: ${violatingFoods.join(", ")}`;
        }
        errorMessage += "\n\nPlease try describing a different meal that matches your dietary preferences.";
        
        setError(errorMessage);
        setIsLoading(false);
        setCurrentInput("");
        return;
      }

      if (clarificationData.success && clarificationData.needs_clarification) {
        setState((prev) => ({
          ...prev,
          description: currentInput.trim(),
          step: "clarification",
          clarificationQuestions: clarificationData.questions || [],
        }));
      } else {
        // Proceed directly to parsing
        setState((prev) => ({
          ...prev,
          description: currentInput.trim(),
        }));
        await parseAndConfirm(currentInput.trim(), {});
      }
    } catch {
      setError("Failed to process description. Please try again.");
    } finally {
      setIsLoading(false);
      setCurrentInput("");
    }
  };

  const handleClarificationSubmit = async () => {
    if (!currentInput.trim()) {
      setError("Please provide an answer");
      return;
    }

    const currentQuestion =
      state.clarificationQuestions[
        Object.keys(state.clarificationAnswers).length
      ];
    const newAnswers = {
      ...state.clarificationAnswers,
      [currentQuestion]: currentInput.trim(),
    };

    if (Object.keys(newAnswers).length >= state.clarificationQuestions.length) {
      // All questions answered, proceed to parsing
      setIsLoading(true);
      await parseAndConfirm(state.description, newAnswers);
    } else {
      // More questions to answer
      setState((prev) => ({
        ...prev,
        clarificationAnswers: newAnswers,
      }));
    }

    setCurrentInput("");
  };

  const parseAndConfirm = async (
    description: string,
    clarifications: Record<string, string>
  ) => {
    try {
      // Combine description with clarifications
      const fullDescription =
        description + " " + Object.values(clarifications).join(" ");

      // Parse the meal
      const parseResponse = await fetch("/api/meals/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: fullDescription }),
      });

      const parseData = await parseResponse.json();

      // Check for dietary violations in parsing
      if (parseData.dietary_violation) {
        const violatingFoods = parseData.violating_foods || [];
        const reason = parseData.reason || "This meal doesn't match your dietary preferences.";
        
        let errorMessage = `❌ Dietary Restriction Violation:\n\n${reason}`;
        if (violatingFoods.length > 0) {
          errorMessage += `\n\nProblematic foods: ${violatingFoods.join(", ")}`;
        }
        errorMessage += "\n\nPlease try describing a different meal that matches your dietary preferences.";
        
        setError(errorMessage);
        setState((prev) => ({ ...prev, step: "description" }));
        return;
      }

      if (parseData.success) {
        // Get nutrition info
        const nutritionResponse = await fetch("/api/meals/nutrition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ food_items: parseData.parsed_items }),
        });

        const nutritionData = await nutritionResponse.json();

        if (nutritionData.success) {
          // Combine parsed items with nutrition data
          const enrichedItems: ParsedItem[] = parseData.parsed_items.map(
            (item: ParsedFoodItem, index: number) => ({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              calories: nutritionData.item_nutrition[index]?.calories || 0,
              protein: nutritionData.item_nutrition[index]?.protein || 0,
              carbs: nutritionData.item_nutrition[index]?.carbs || 0,
              fat: nutritionData.item_nutrition[index]?.fat || 0,
            })
          );

          setState((prev) => ({
            ...prev,
            description: fullDescription,
            step: "confirmation",
            parsedItems: enrichedItems,
            totalCalories: nutritionData.nutrition?.calories || 0,
          }));
        } else {
          throw new Error("Failed to get nutrition data");
        }
      } else {
        throw new Error("Failed to parse meal");
      }
    } catch {
      setError("Failed to analyze meal. Please try again.");
      setState((prev) => ({ ...prev, step: "description" }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndLog = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: state.description,
          meal_type: state.mealType,
          items: state.parsedItems,
          total_calories: state.totalCalories,
        }),
      });

      const data: MealLogResponse = await response.json();

      if (data.success) {
        setState((prev) => ({ ...prev, step: "complete" }));
        setTimeout(() => {
          onMealLogged();
          resetConversation();
        }, 3000);
      } else {
        setError(data.error || "Failed to log meal");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setState({
      step: "meal_type",
      mealType: "",
      description: "",
      clarificationQuestions: [],
      clarificationAnswers: {},
      parsedItems: [],
      totalCalories: 0,
    });
    setCurrentInput("");
    setError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (state.step === "description") {
        handleDescriptionSubmit();
      } else if (state.step === "clarification") {
        handleClarificationSubmit();
      }
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case "meal_type":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-2xl">🍽️</span>
              <h3 className="text-lg font-medium text-gray-800 mt-2">
                First, what meal are you logging?
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {mealTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleMealTypeSelect(type)}
                  className="p-3 text-center border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        );

      case "description":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-2xl">📝</span>
              <h3 className="text-lg font-medium text-gray-800 mt-2">
                Great! Please describe everything you ate in your{" "}
                {state.mealType.toLowerCase()}.
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                You can type it naturally, like &quot;2 boiled eggs and 2 fried
                chicken wings&quot;
              </p>
            </div>
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., grilled sandwich with cheese and mayo, or 1 cup of rice with dal"
              className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isLoading}
            />
            <button
              onClick={handleDescriptionSubmit}
              disabled={isLoading || !currentInput.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Analyzing..." : "Continue"}
            </button>
          </div>
        );

      case "clarification":
        const currentQuestionIndex = Object.keys(
          state.clarificationAnswers
        ).length;
        const currentQuestion =
          state.clarificationQuestions[currentQuestionIndex];

        return (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-2xl">🔍</span>
              <h3 className="text-lg font-medium text-gray-800 mt-2">
                Just to confirm a few things for better accuracy:
              </h3>
            </div>

            {/* Show previous answers */}
            {Object.entries(state.clarificationAnswers).map(
              ([question, answer], index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">{question}</p>
                  <p className="text-sm font-medium text-gray-800">
                    ✓ {answer}
                  </p>
                </div>
              )
            )}

            {/* Current question */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {currentQuestion}
              </p>
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Your answer..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleClarificationSubmit}
                disabled={isLoading || !currentInput.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {currentQuestionIndex >= state.clarificationQuestions.length - 1
                  ? isLoading
                    ? "Processing..."
                    : "Analyze Meal"
                  : "Next Question"}
              </button>
            </div>
          </div>
        );

      case "confirmation":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-2xl">✅</span>
              <h3 className="text-lg font-medium text-gray-800 mt-2">
                Here&apos;s a summary of your {state.mealType}:
              </h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {state.parsedItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">
                    {item.quantity} {item.unit} {item.name}
                  </span>
                  <span className="text-sm font-medium">
                    {item.calories} kcal
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between items-center font-semibold">
                <span>Total:</span>
                <span>{state.totalCalories} kcal</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() =>
                  setState((prev) => ({ ...prev, step: "description" }))
                }
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Edit Description
              </button>
              <button
                onClick={handleConfirmAndLog}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Logging..." : "Log Meal"}
              </button>
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="text-center space-y-4">
            <span className="text-4xl">🎉</span>
            <h3 className="text-lg font-medium text-green-600">
              Meal logged successfully!
            </h3>
            <p className="text-sm text-gray-600">
              Your {state.mealType.toLowerCase()} has been added to your daily
              tracking.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          AI-Guided Meal Logging
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {["meal_type", "description", "clarification", "confirmation"].map(
            (step, index) => {
              const stepIndex = [
                "meal_type",
                "description",
                "clarification",
                "confirmation",
              ].indexOf(state.step);
              const currentIndex = [
                "meal_type",
                "description",
                "clarification",
                "confirmation",
              ].indexOf(step);
              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentIndex <= stepIndex
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-8 h-0.5 ${
                        currentIndex < stepIndex ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded-md">
          <div className="whitespace-pre-line">{error}</div>
        </div>
      )}

      {renderStep()}

      {state.step !== "meal_type" && state.step !== "complete" && (
        <button
          onClick={resetConversation}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Start over
        </button>
      )}
    </div>
  );
}
