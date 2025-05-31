import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { generateRandomUsername } from '@/lib/utils'
import { sanitizeEmail, sanitizeName } from '@/lib/sanitize'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Create profile for email-confirmed user
        const supabaseAdmin = createAdminClient()
        
        // Generate unique username
        let username = generateRandomUsername()
        let usernameExists = true
        let attempts = 0
        const maxAttempts = 10

        while (usernameExists && attempts < maxAttempts) {
          const { data: existingUser, error: usernameCheckError } =
            await supabaseAdmin
              .from("users")
              .select("username")
              .eq("username", username)
              .single()

          if (usernameCheckError && usernameCheckError.code === "PGRST116") {
            usernameExists = false
          } else if (!existingUser) {
            usernameExists = false
          } else {
            username = generateRandomUsername()
            attempts++
          }
        }

        if (attempts < maxAttempts) {
          // Create user profile
          await supabaseAdmin.from('users').insert({
            id: user.id,
            email: sanitizeEmail(user.email || ''),
            name: sanitizeName(user.user_metadata?.name || user.email?.split('@')[0] || 'User'),
            username,
          })
        }
      }
      
      // Redirect to the specified next URL or home
      return Response.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return Response.redirect(`${origin}/auth/auth-code-error`)
}
