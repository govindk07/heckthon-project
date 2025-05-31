import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateEmail } from "@/lib/utils";
import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { sanitizeInput } from "@/lib/sanitize";
import { createSecureResponse } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 login attempts per 15 minutes per IP
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(clientIP, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10,
    });

    if (!rateLimitResult.success) {
      return createSecureResponse(
        {
          error: "Too many login attempts. Please try again later.",
          resetTime: rateLimitResult.resetTime,
        },
        429
      );
    }

    const { identifier, password } = await request.json();

    // Sanitize inputs
    const sanitizedIdentifier = sanitizeInput(identifier);

    // Validate input
    if (!sanitizedIdentifier || !password) {
      return createSecureResponse(
        { error: "Email/username and password are required" },
        400
      );
    }

    const supabase = createClient();

    // Check if identifier is an email or username
    const isEmail = validateEmail(sanitizedIdentifier);
    let email = sanitizedIdentifier;

    if (!isEmail) {
      // If it's not an email, look up the email by username
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("username", sanitizedIdentifier)
        .single();

      if (userError || !userData) {
        return createSecureResponse(
          { error: "Invalid username or password" },
          401
        );
      }

      email = userData.email;
    }

    // Attempt to sign in with email and password
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return createSecureResponse(
        { error: "Invalid email/username or password" },
        401
      );
    }

    if (!authData.user) {
      return createSecureResponse({ error: "Login failed" }, 401);
    }

    // Get user profile data
    const { data: profile } = await supabase
      .from("users")
      .select("name, username")
      .eq("id", authData.user.id)
      .single();

    return createSecureResponse(
      {
        message: "Login successful",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: profile?.name,
          username: profile?.username,
        },
      },
      200
    );
  } catch (error) {
    console.error("Login error:", error);
    return createSecureResponse({ error: "Internal server error" }, 500);
  }
}
