import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";

export default async function Profile() {
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
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-600 px-6 py-8">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="ml-6">
                  <h1 className="text-2xl font-bold text-white">
                    {profile?.name}
                  </h1>
                  <p className="text-indigo-200">@{profile?.username}</p>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="px-6 py-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Profile Information
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Username
                  </label>
                  <div className="bg-gray-50 px-3 py-2 rounded-md border">
                    <span className="text-gray-900">@{profile?.username}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Full Name
                  </label>
                  <div className="bg-gray-50 px-3 py-2 rounded-md border">
                    <span className="text-gray-900">{profile?.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Email Address
                  </label>
                  <div className="bg-gray-50 px-3 py-2 rounded-md border">
                    <span className="text-gray-900">{profile?.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Member Since
                  </label>
                  <div className="bg-gray-50 px-3 py-2 rounded-md border">
                    <span className="text-gray-900">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString()
                        : "Recently"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href="/"
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors text-center"
                >
                  Back to Home
                </a>
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
