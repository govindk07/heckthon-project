import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  generateRandomUsername,
  validateEmail,
  validatePassword,
} from "@/lib/utils";
import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { sanitizeEmail, sanitizeName } from "@/lib/sanitize";
import { createSecureResponse } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 signup attempts per 15 minutes per IP
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(clientIP, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
    });

    if (!rateLimitResult.success) {
      return createSecureResponse(
        {
          error: "Too many signup attempts. Please try again later.",
          resetTime: rateLimitResult.resetTime,
        },
        429
      );
    }

    const { name, email, password } = await request.json();

    // Sanitize inputs
    const sanitizedName = sanitizeName(name);
    const sanitizedEmail = sanitizeEmail(email);

    // Validate input
    if (!sanitizedName || !sanitizedEmail || !password) {
      return createSecureResponse({ error: "All fields are required" }, 400);
    }

    if (!validateEmail(sanitizedEmail)) {
      return createSecureResponse({ error: "Invalid email format" }, 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return createSecureResponse({ error: passwordValidation.message }, 400);
    }

    const supabase = createClient();

    // Create admin client for database operations (bypasses RLS)
    const supabaseAdmin = createAdminClient();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
    });

    if (authError) {
      console.error("Auth signup error:", authError);
      return createSecureResponse({ error: authError.message }, 400);
    }

    if (!authData.user) {
      console.error("No user data returned from auth signup");
      return createSecureResponse({ error: "Failed to create user" }, 400);
    }

    console.log("User created in auth:", authData.user.id);

    // Generate unique username
    let username = generateRandomUsername();
    let usernameExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure username is unique
    while (usernameExists && attempts < maxAttempts) {
      const { data: existingUser, error: usernameCheckError } =
        await supabaseAdmin
          .from("users")
          .select("username")
          .eq("username", username)
          .single();

      if (usernameCheckError && usernameCheckError.code === "PGRST116") {
        // No rows found - username is unique
        usernameExists = false;
      } else if (!existingUser) {
        usernameExists = false;
      } else {
        username = generateRandomUsername();
        attempts++;
      }
    }

    if (attempts >= maxAttempts) {
      console.error(
        "Failed to generate unique username after",
        maxAttempts,
        "attempts"
      );
      return createSecureResponse(
        { error: "Failed to generate unique username" },
        500
      );
    }

    console.log("Generated username:", username);

    // Insert user profile into our users table using admin client
    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      email: sanitizedEmail,
      name: sanitizedName,
      username,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // If profile creation fails, we should clean up the auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError);
      }
      return createSecureResponse(
        { error: `Failed to create user profile: ${profileError.message}` },
        500
      );
    }

    console.log("User profile created successfully");

    return createSecureResponse(
      {
        message: "User created successfully",
        user: {
          id: authData.user.id,
          email: sanitizedEmail,
          name: sanitizedName,
          username,
        },
      },
      201
    );
  } catch (error) {
    console.error("Signup error:", error);
    return createSecureResponse({ error: "Internal server error" }, 500);
  }
}
