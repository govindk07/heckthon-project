## 🧑‍🍳 FitBite – User Stories

### 🧾 Epic: User Profile & Personalization

#### 🟢 US-01: As a user, I want to set up my dietary preferences
- So that the app can suggest meals that match my lifestyle
- ✅ Acceptance:
  - I can select if I’m vegetarian, vegan, or non-vegetarian
  - My choice is saved to my Supabase profile

#### 🟢 US-02: As a user, I want to list my food allergies
- So that I can avoid allergic ingredients in suggestions
- ✅ Acceptance:
  - I can input allergies as tags (e.g., nuts, dairy, gluten)
  - Stored in Supabase and considered in meal suggestions

#### 🟢 US-03: As a user, I want to set or view my daily calorie goal
- So that I know how much I should eat each day
- ✅ Acceptance:
  - App can auto-calculate based on age, weight, height, activity
  - Or I can enter it manually

---

### 🍽️ Epic: Meal Tracking

#### 🟢 US-04: As a user, I want to log what I’ve eaten today using natural text
- So that I can track my calorie intake easily
- ✅ Acceptance:
  - I can type or paste a meal description (e.g., "2 boiled eggs and toast")
  - AI parses it and extracts individual food items

#### 🟢 US-05: As a user, I want the app to calculate calories from my meal input
- So that I know how much I’ve consumed
- ✅ Acceptance:
  - AI + Nutritionix API gives estimated calorie count
  - I can see total calories consumed so far today

---

### 🍱 Epic: Smart Suggestions

#### 🟢 US-06: As a user, I want the app to suggest what I can eat next
- So that I can stay within my daily calorie goal
- ✅ Acceptance:
  - Suggestions are based on remaining calories
  - Suggestions respect dietary restrictions and allergies

#### 🟢 US-07: As a user, I want the suggestions to include a balanced diet
- So that I’m not just hitting calories, but also macros
- ✅ Acceptance:
  - Suggestions include macro diversity (protein, carbs, fat)
  - GPT generates suggestions with meal titles + small description

---

### 📊 Epic: Calorie Summary

#### 🟢 US-08: As a user, I want to see a daily summary of my intake
- So that I can track my progress throughout the day
- ✅ Acceptance:
  - I can see calories consumed, calories left
  - Display is clear and updated as I log meals

#### 🟢 US-09: As a user, I want to see the macro breakdown of my meals
- So that I can track carbs, protein, and fat
- ✅ Acceptance:
  - Macro chart or breakdown is shown alongside calorie summary

---

### 💾 Epic: Data Persistence

#### 🟢 US-10: As a user, I want my logged meals and preferences saved
- So that I don’t lose my data when I log out
- ✅ Acceptance:
  - Data is stored in Supabase (PostgreSQL)
  - Linked to my Supabase Auth user ID

---

### 🔐 Epic: Authentication (Already Implemented)

#### ✅ US-00: As a user, I can sign up and log in with Supabase Auth
- So that I can access my own personalized data

---

## 🔧 Notes
- All frontend components use **Next.js (App Router)** + **Tailwind CSS**
- Backend API logic via **Next.js API Routes**
- **AI Integration:** OpenAI GPT-4 for NLP and meal suggestions
- **Calorie/Macro Data:** Nutritionix API
- **Deployment:** Vercel with GitHub Actions CI/CD
