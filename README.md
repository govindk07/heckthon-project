# Simple Web Application

A minimal web application built with Next.js, Supabase, and Tailwind CSS that demonstrates user authentication and profile management.

## Features

- ✅ User signup with automatic unique username generation
- ✅ Login with email or username
- ✅ Protected routes (Home and Profile pages)
- ✅ User profile display
- ✅ Secure logout functionality
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript support
- ✅ GitHub Actions CI/CD pipeline
- ✅ Vercel deployment ready
- 🔒 **Security Hardened**: Rate limiting, input sanitization, security headers
- 🛡️ **Security Score**: 8.5/10 (See `SECURITY_AUDIT.md` for details)

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **TypeScript**: Full type safety
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd simple-web-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard, go to SQL Editor and run this query to create the users table:

```sql
-- Create users table
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

3. Get your Supabase URL and anon key from Settings > API

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── login/
│   │   │   └── route.ts          # Login API endpoint
│   │   └── signup/
│   │       └── route.ts          # Signup API endpoint
│   ├── components/
│   │   └── LogoutButton.tsx      # Logout component
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── profile/
│   │   └── page.tsx              # Profile page
│   ├── signup/
│   │   └── page.tsx              # Signup page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── lib/
│   └── utils.ts                  # Utility functions
├── utils/
│   └── supabase/
│       ├── client.ts             # Supabase client (browser)
│       └── server.ts             # Supabase client (server)
├── middleware.ts                 # Route protection middleware
└── package.json
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### GitHub Actions Setup

The project includes a CI/CD pipeline that:
- Runs type checking and linting on every push/PR
- Builds the application
- Deploys to Vercel on main branch pushes

To set up GitHub Actions:

1. Add these secrets to your GitHub repository:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `VERCEL_TOKEN` (from Vercel account settings)
   - `ORG_ID` (from Vercel project settings)
   - `PROJECT_ID` (from Vercel project settings)

## Pages

### Public Pages
- `/login` - User login form
- `/signup` - User registration form

### Protected Pages
- `/` - Home page with welcome message
- `/profile` - User profile with logout option

## API Routes

- `POST /api/signup` - User registration
- `POST /api/login` - User authentication

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## License

MIT License
