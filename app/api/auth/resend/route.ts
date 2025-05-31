import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { sanitizeEmail } from "@/lib/sanitize";
import { createSecureResponse } from "@/lib/security";
import { validateEmail } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 resend attempts per 5 minutes per IP
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(clientIP, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 3,
    });

    if (!rateLimitResult.success) {
      return createSecureResponse(
        {
          error: "Too many resend attempts. Please try again later.",
          resetTime: rateLimitResult.resetTime,
        },
        429
      );
    }

    const { email } = await request.json();

    // Sanitize and validate email
    const sanitizedEmail = sanitizeEmail(email);

    if (!sanitizedEmail || !validateEmail(sanitizedEmail)) {
      return createSecureResponse({ error: "Valid email is required" }, 400);
    }

    const supabase = createClient();

    // Resend confirmation email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: sanitizedEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000'}/auth/callback`,
      }
    });

    if (error) {
      console.error("Resend confirmation error:", error);
      return createSecureResponse(
        { 
          error: error.message === 'Email rate limit exceeded' 
            ? "Email already sent recently. Please wait a few minutes before requesting another one."
            : "Failed to resend confirmation email. Please try again."
        }, 
        400
      );
    }

    return createSecureResponse(
      {
        message: "Confirmation email sent successfully. Please check your inbox.",
      },
      200
    );

  } catch (error) {
    console.error("Resend confirmation error:", error);
    return createSecureResponse(
      { error: "An unexpected error occurred" },
      500
    );
  }
}
