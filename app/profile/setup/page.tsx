"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfileData } from "@/types/auth";

export default function ProfileSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<ProfileData>({});
  const [formData, setFormData] = useState<ProfileData>({
    dietary_preference: undefined,
    allergies: [],
    daily_calorie_goal: undefined,
    age: undefined,
    weight_kg: undefined,
    height_cm: undefined,
    activity_level: undefined,
    gender: undefined,
  });
  const [newAllergy, setNewAllergy] = useState("");
  const [useAutoCalorie, setUseAutoCalorie] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setCurrentProfile(data.profile);
          setFormData({
            dietary_preference: data.profile.dietary_preference,
            allergies: data.profile.allergies || [],
            daily_calorie_goal: data.profile.daily_calorie_goal,
            age: data.profile.age,
            weight_kg: data.profile.weight_kg,
            height_cm: data.profile.height_cm,
            activity_level: data.profile.activity_level,
            gender: data.profile.gender,
          });
          setUseAutoCalorie(!data.profile.daily_calorie_goal);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = { ...formData };
      if (useAutoCalorie) {
        dataToSave.daily_calorie_goal = undefined; // Let the API calculate it
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentProfile(data.profile);
        alert("Profile updated successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("An error occurred while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies?.includes(newAllergy.trim())) {
      setFormData({
        ...formData,
        allergies: [...(formData.allergies || []), newAllergy.trim()],
      });
      setNewAllergy("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setFormData({
      ...formData,
      allergies: formData.allergies?.filter((a) => a !== allergy) || [],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-green-600 px-6 py-8">
              <h1 className="text-3xl font-bold text-white">
                🧑‍🍳 FitBite Profile
              </h1>
              <p className="text-green-100 mt-2">
                Set up your dietary preferences and goals
              </p>
            </div>

            <div className="p-6 space-y-8">
              {/* US-01: Dietary Preferences */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  🌱 Dietary Preferences
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      value: "vegetarian",
                      label: "🥬 Vegetarian",
                      desc: "No meat or fish",
                    },
                    {
                      value: "vegan",
                      label: "🌿 Vegan",
                      desc: "No animal products",
                    },
                    {
                      value: "non-vegetarian",
                      label: "🍖 Non-Vegetarian",
                      desc: "All foods",
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.dietary_preference === option.value
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="dietary_preference"
                        value={option.value}
                        checked={formData.dietary_preference === option.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dietary_preference: e.target.value as
                              | "vegetarian"
                              | "vegan"
                              | "non-vegetarian",
                          })
                        }
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="font-medium text-gray-800">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {option.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* US-02: Food Allergies */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  🚫 Food Allergies
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="Enter an allergy (e.g., nuts, dairy, gluten)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      onKeyPress={(e) => e.key === "Enter" && addAllergy()}
                    />
                    <button
                      onClick={addAllergy}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.allergies?.map((allergy) => (
                      <span
                        key={allergy}
                        className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                      >
                        {allergy}
                        <button
                          onClick={() => removeAllergy(allergy)}
                          className="ml-2 hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* US-03: Physical Stats for Calorie Calculation */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  📊 Physical Information
                </h2>

                {/* Gender Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-3">
                    Gender (for accurate calorie calculation)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                    {[
                      { value: "male", label: "👨 Male", icon: "♂️" },
                      { value: "female", label: "👩 Female", icon: "♀️" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.gender === option.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={option.value}
                          checked={formData.gender === option.value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gender: e.target.value as "male" | "female",
                            })
                          }
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className="text-2xl mb-1">{option.icon}</div>
                          <div className="font-medium text-gray-800">
                            {option.label.replace(/👨|👩/, "").trim()}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Age (years)
                    </label>
                    <input
                      type="number"
                      value={formData.age || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          age: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight_kg || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weight_kg: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.height_cm || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          height_cm: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Activity Level
                    </label>
                    <select
                      value={formData.activity_level || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          activity_level:
                            (e.target.value as
                              | "sedentary"
                              | "lightly_active"
                              | "moderately_active"
                              | "very_active"
                              | "extremely_active") || undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select...</option>
                      <option value="sedentary">Sedentary</option>
                      <option value="lightly_active">Lightly Active</option>
                      <option value="moderately_active">
                        Moderately Active
                      </option>
                      <option value="very_active">Very Active</option>
                      <option value="extremely_active">Extremely Active</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* US-03: Daily Calorie Goal */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  🎯 Daily Calorie Goal
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="auto-calorie"
                      checked={useAutoCalorie}
                      onChange={(e) => setUseAutoCalorie(e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="auto-calorie"
                      className="text-sm text-gray-700"
                    >
                      Auto-calculate based on my physical information
                    </label>
                  </div>
                  {!useAutoCalorie && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Manual Calorie Goal
                      </label>
                      <input
                        type="number"
                        value={formData.daily_calorie_goal || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            daily_calorie_goal: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          })
                        }
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., 2000"
                      />
                    </div>
                  )}
                  {currentProfile.daily_calorie_goal && (
                    <div className="text-sm text-gray-600">
                      Current goal:{" "}
                      <span className="font-medium">
                        {currentProfile.daily_calorie_goal} calories/day
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Save Button */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
