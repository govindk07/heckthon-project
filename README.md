# FitBite: Your Smart Meal & Calorie Tracker

A comprehensive meal tracking and nutrition management application built with Next.js, Supabase, and AI-powered features. FitBite helps users log meals conversationally, track calories, and get personalized nutrition insights.

## ✨ Features

### 🔐 Authentication & User Management
- ✅ **Email Verification System**: Complete signup flow with email confirmation
- ✅ **User Authentication**: Secure login with email/username
- ✅ **Profile Setup**: Guided onboarding with personal details and goals
- ✅ **Automatic Username Generation**: Unique usernames created on signup
- ✅ **Password Security**: Secure password handling and validation
- ✅ **Protected Routes**: Middleware-based route protection

### 🍽️ Smart Meal Tracking
- ✅ **Conversational Meal Logging**: Natural language meal input powered by OpenAI
- ✅ **Nutrition Analysis**: Automatic calorie and nutrient calculation via Nutritionix API
- ✅ **Meal History**: Complete log of all tracked meals with timestamps
- ✅ **Daily Summaries**: Real-time calorie tracking and goal progress
- ✅ **Meal Clarification**: AI-powered clarification for ambiguous meal inputs
- ✅ **Data Export**: CSV export functionality for meal history

### 🤖 AI-Powered Features
- ✅ **Smart Meal Suggestions**: Personalized meal recommendations based on preferences
- ✅ **Natural Language Processing**: Parse complex meal descriptions
- ✅ **Nutrition Intelligence**: Automatic nutrient breakdown and analysis
- ✅ **Goal-Based Recommendations**: Suggestions aligned with user's fitness goals

### 📊 Analytics & Insights
- ✅ **Daily Calorie Tracking**: Real-time progress toward daily goals
- ✅ **Nutritional Breakdown**: Detailed macro and micronutrient analysis
- ✅ **Historical Data**: Track progress over time
- ✅ **Export Functionality**: Download data for external analysis

### 🛡️ Security & Performance
- ✅ **Rate Limiting**: API protection against abuse
- ✅ **Input Sanitization**: XSS and injection protection
- ✅ **Security Headers**: Comprehensive security configuration
- ✅ **Error Handling**: Graceful error management and user feedback
- 🛡️ **Security Score**: 8.5/10 (See `SECURITY_AUDIT.md` for details)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router, React 18
- **Styling**: Tailwind CSS with responsive design
- **Authentication**: Supabase Auth with email verification
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **AI Integration**: OpenAI GPT-4 for meal parsing and suggestions
- **Nutrition API**: Nutritionix for accurate nutritional data
- **TypeScript**: Full type safety across the application
- **Deployment**: Vercel with automatic deployments
- **CI/CD**: GitHub Actions pipeline
- **Security**: Rate limiting, input sanitization, security headers

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

### 3. Database Setup

Run the complete database setup script in your Supabase SQL Editor:

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

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  height NUMERIC(5,2),
  weight NUMERIC(5,2),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  goal TEXT CHECK (goal IN ('lose_weight', 'maintain_weight', 'gain_weight', 'build_muscle')),
  daily_calorie_goal INTEGER,
  dietary_restrictions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Create meals table
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  calories NUMERIC(7,2),
  protein NUMERIC(6,2),
  carbs NUMERIC(6,2),
  fat NUMERIC(6,2),
  fiber NUMERIC(6,2),
  sugar NUMERIC(6,2),
  sodium NUMERIC(8,2),
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile data" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile data" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile data" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for meals
CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON meals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON meals
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_logged_at ON meals(logged_at);
CREATE INDEX idx_meals_user_logged ON meals(user_id, logged_at);
```

3. **Configure Email Settings**: In Supabase dashboard:
   - Go to Authentication > Settings
   - Configure email templates and confirm email URL
   - Set site URL to your production domain

4. Get your Supabase URL and keys from Settings > API

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Production Site URL (required for email verification)
NEXT_PUBLIC_SITE_URL=https://yourapp.vercel.app

# OpenAI API (for meal parsing and suggestions)
OPENAI_API_KEY=your_openai_api_key

# Nutritionix API (for nutrition data)
NUTRITIONIX_APP_ID=your_nutritionix_app_id
NUTRITIONIX_API_KEY=your_nutritionix_api_key
```

### 5. API Keys Setup

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an account and generate an API key
3. Add credits to your account for API usage

#### Nutritionix API Keys
1. Sign up at [Nutritionix Developer Portal](https://developer.nutritionix.com)
2. Create an application to get App ID and API Key
3. Use the free tier for development (up to 200 requests/day)

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   │   └── resend/           # Email resend functionality
│   │   ├── login/                # Authentication endpoints
│   │   ├── signup/               # User registration
│   │   ├── profile/              # Profile management
│   │   └── meals/                # Meal tracking APIs
│   │       ├── clarify/          # AI meal clarification
│   │       ├── export/           # Data export
│   │       ├── history/          # Meal history
│   │       ├── nutrition/        # Nutrition analysis
│   │       ├── parse/            # AI meal parsing
│   │       └── suggestions/      # Smart recommendations
│   ├── auth/                     # Authentication pages
│   │   ├── auth-code-error/      # Email verification errors
│   │   └── callback/             # Auth callback handling
│   ├── components/               # Reusable React components
│   │   ├── ConversationalMealLogger.tsx  # AI-powered meal input
│   │   ├── DailySummary.tsx      # Calorie tracking dashboard
│   │   ├── LogoutButton.tsx      # Logout functionality
│   │   ├── MealLogger.tsx        # Traditional meal logging
│   │   └── SmartSuggestions.tsx  # AI meal suggestions
│   ├── login/                    # Login page
│   ├── meals/                    # Meal tracking pages
│   │   └── history/              # Meal history view
│   ├── profile/                  # Profile management
│   │   └── setup/                # Initial profile setup
│   ├── signup/                   # User registration
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with navigation
│   └── page.tsx                  # Dashboard/home page
├── lib/                          # Utility libraries
│   ├── rateLimit.ts              # API rate limiting
│   ├── sanitize.ts               # Input sanitization
│   ├── security.ts               # Security utilities
│   └── utils.ts                  # General utilities
├── types/                        # TypeScript type definitions
│   ├── auth.ts                   # Authentication types
│   └── meals.ts                  # Meal and nutrition types
├── utils/                        # Supabase utilities
│   └── supabase/
│       ├── admin.ts              # Admin client
│       ├── client.ts             # Browser client
│       └── server.ts             # Server client
├── middleware.ts                 # Route protection and security
└── package.json
```

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**: Ensure your code is in a GitHub repository
2. **Connect to Vercel**: Import your repository at [vercel.com](https://vercel.com)
3. **Environment Variables**: Add all required environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_SITE_URL
   OPENAI_API_KEY
   NUTRITIONIX_APP_ID
   NUTRITIONIX_API_KEY
   ```
4. **Deploy**: Vercel will automatically build and deploy your application

### Email Verification Setup
- Ensure `NEXT_PUBLIC_SITE_URL` points to your production domain
- Configure Supabase email templates with your branding
- Test the complete email verification flow after deployment

### GitHub Actions Setup

The project includes a CI/CD pipeline that:
- Runs type checking and linting on every push/PR
- Builds the application to ensure no build errors
- Automatically deploys to Vercel on main branch pushes

Required GitHub Secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VERCEL_TOKEN` (from Vercel account settings)
- `ORG_ID` (from Vercel project settings)
- `PROJECT_ID` (from Vercel project settings)

## 📱 Application Pages

### Public Pages
- **`/`** - Landing page with app introduction
- **`/login`** - User authentication with email/username
- **`/signup`** - User registration with email verification
- **`/auth/auth-code-error`** - Email verification error handling

### Protected Pages (Require Authentication)
- **`/`** - Dashboard with daily summary and meal logging
- **`/profile`** - User profile management and settings
- **`/profile/setup`** - Initial profile setup for new users
- **`/meals`** - Advanced meal logging with AI features
- **`/meals/history`** - Complete meal history with export options

### Authentication Flow
- **`/auth/callback`** - Handles email verification and OAuth callbacks

## 🔌 API Endpoints

### Authentication
- `POST /api/signup` - User registration with email verification
- `POST /api/login` - User authentication
- `POST /api/auth/resend` - Resend verification email

### Profile Management
- `GET /api/profile` - Get user profile and preferences
- `POST /api/profile` - Update user profile and goals

### Meal Tracking
- `GET /api/meals` - Get user's meals with filtering
- `POST /api/meals` - Log a new meal
- `POST /api/meals/parse` - AI-powered meal description parsing
- `POST /api/meals/clarify` - Get clarification for ambiguous meals
- `POST /api/meals/nutrition` - Get detailed nutrition information
- `GET /api/meals/history` - Get paginated meal history
- `GET /api/meals/export` - Export meal data as CSV
- `GET /api/meals/suggestions` - Get personalized meal suggestions

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Run production server locally
npm start

# Type checking
npm run type-check

# Linting and code formatting
npm run lint

# Run all checks (type-check + lint + build)
npm run validate
```

## 🧪 Testing the Application

### 1. User Registration & Email Verification
1. Navigate to `/signup`
2. Fill in the registration form
3. Check your email for verification link
4. Click the verification link to activate your account
5. Complete profile setup at `/profile/setup`

### 2. Meal Logging Flow
1. Go to the dashboard (`/`) after login
2. Use the conversational meal logger: "I had a turkey sandwich for lunch"
3. Review the AI-parsed nutrition information
4. View your daily calorie progress in the summary

### 3. Advanced Features
1. Visit `/meals` for advanced meal logging
2. Try the smart suggestions feature
3. Export your meal history from `/meals/history`
4. Update your profile and goals in `/profile`

## 🔒 Security Features

### Rate Limiting
- **Signup**: 5 attempts per 15 minutes per IP
- **Login**: 10 attempts per 15 minutes per IP
- **Meal Logging**: 30 requests per minute per user
- **AI Features**: 20 requests per hour per user

### Data Protection
- **Input Sanitization**: All user inputs sanitized against XSS
- **SQL Injection Prevention**: Parameterized queries with Supabase
- **Authentication**: JWT-based session management
- **CORS**: Configured for production domains only

### Privacy
- **Row Level Security**: Users can only access their own data
- **Data Encryption**: All data encrypted in transit and at rest
- **No Data Sharing**: Meal and health data remains private

## 📚 Documentation

### Additional Documentation Files
- **`EMAIL_VERIFICATION_DEPLOYMENT_GUIDE.md`** - Complete email verification setup
- **`SECURITY_AUDIT.md`** - Detailed security analysis and recommendations
- **`PROJECT_COMPLETE.md`** - Feature completion status and roadmap
- **`MEAL_TRACKING_COMPLETE.md`** - Meal tracking implementation details
- **`SMART_SUGGESTIONS_COMPLETE.md`** - AI suggestions system documentation

### API Documentation
Each API endpoint includes:
- Request/response schemas
- Authentication requirements
- Rate limiting information
- Error handling examples

## 🐛 Troubleshooting

### Common Issues

1. **Email Verification Not Working**
   - Check `NEXT_PUBLIC_SITE_URL` environment variable
   - Verify Supabase email settings
   - Ensure production domain matches Supabase configuration

2. **AI Features Not Responding**
   - Verify OpenAI API key and credits
   - Check rate limiting status
   - Review API usage in OpenAI dashboard

3. **Nutrition Data Missing**
   - Confirm Nutritionix API credentials
   - Check daily API usage limits
   - Verify food description format

4. **Build Failures**
   - Clear Next.js cache: `rm -rf .next`
   - Check TypeScript errors: `npm run type-check`
   - Verify all environment variables are set

### Getting Help
- Check the console for detailed error messages
- Review the security audit for common issues
- Ensure all required environment variables are configured
- Test API endpoints individually using browser dev tools

## 🚀 Future Enhancements

### Planned Features
- **Mobile App**: React Native companion app
- **Social Features**: Meal sharing and community challenges
- **Integration**: Fitness tracker and grocery delivery APIs
- **Analytics**: Advanced nutrition insights and trends
- **Gamification**: Achievement system and progress rewards

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for natural language processing capabilities
- **Nutritionix** for comprehensive nutrition database
- **Supabase** for authentication and database infrastructure
- **Vercel** for seamless deployment and hosting
- **Next.js** team for the excellent React framework
