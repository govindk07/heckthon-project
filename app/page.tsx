import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile data
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🧑‍🍳 Welcome to FitBite
            </h1>
            <p className="text-lg text-gray-600">
              Hello, {profile?.name || "there"}! Track your nutrition and get
              personalized meal suggestions 👋
            </p>
          </header>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🥗</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Ready to start your nutrition journey?
              </h2>
              <p className="text-gray-600 mb-6">
                Set up your dietary preferences and start tracking your meals
                for personalized suggestions.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/meals"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  🍽️ Track Meals
                </a>
                <a
                  href="/meals/history"
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  📊 View History
                </a>
                <a
                  href="/profile/setup"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  🌱 Set Up Profile
                </a>
                <a
                  href="/profile"
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  👤 View Profile
                </a>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                🎯 Your Goals
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Calories:</span>
                  <span className="font-medium">
                    {profile?.daily_calorie_goal
                      ? `${profile.daily_calorie_goal} calories`
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dietary Preference:</span>
                  <span className="font-medium">
                    {profile?.dietary_preference
                      ? profile.dietary_preference.charAt(0).toUpperCase() +
                        profile.dietary_preference.slice(1).replace("_", " ")
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Allergies Tracked:</span>
                  <span className="font-medium">
                    {profile?.allergies && profile.allergies.length > 0
                      ? profile.allergies.length + " allergen(s)"
                      : "None set"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                🚀 Quick Actions
              </h3>
              <div className="space-y-3">
                <a
                  href="/meals"
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Log a meal</span>
                </a>
                <a
                  href="/profile/setup"
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Set dietary preferences</span>
                </a>
                <a
                  href="/profile/setup"
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-600">Configure calorie goals</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
