# �� FitBite – Test Cases

---

## �� Epic: User Profile & Personalization

### ✅ US-01: Set Dietary Preferences

| Test Case ID | Description | Steps | Expected Result |
|--------------|-------------|-------|------------------|
| TC-US01-01 | Select dietary preference | 1. Navigate to profile settings<br>2. Choose from Vegetarian, Vegan, or Non-Vegetarian<br>3. Save preference | Selected option is saved and confirmed by toast/notification |
| TC-US01-02 | Verify preference persistence | 1. Log out and log back in<br>2. Navigate to profile settings | Previously selected preference is still selected |
| TC-US01-03 | Validate database storage | 1. Set dietary preference<br>2. Check user data in Supabase | Selected value is stored under correct Supabase profile field |

### ✅ US-02: Add Food Allergies

| Test Case ID | Description | Steps | Expected Result |
|--------------|-------------|-------|------------------|
| TC-US02-01 | Input allergies as tags | 1. Navigate to profile<br>2. Add allergies like "nuts", "dairy", etc.<br>3. Save | Tags are displayed and saved |
| TC-US02-02 | Verify allergy persistence | 1. Add allergy tags<br>2. Log out and in<br>3. View profile | Previously added tags persist |
| TC-US02-03 | Validate filtering in suggestions | 1. Add "nuts" as an allergy<br>2. Go to meal suggestions | No meals containing nuts are suggested |

### ✅ US-03: Set/View Calorie Goal

| Test Case ID | Description | Steps | Expected Result |
|--------------|-------------|-------|------------------|
| TC-US03-01 | Auto-calculate goal | 1. Input age, weight, height, activity level<br>2. Tap “Auto-calculate” | Calorie goal is shown |
| TC-US03-02 | Manual entry | 1. Choose manual input<br>2. Enter value like 2000 kcal<br>3. Save | Value is saved and used |
| TC-US03-03 | View saved goal | 1. Navigate to profile<br>2. Check calorie goal | Value (manual or auto) is displayed correctly |

---

## ��️ Epic: Meal Tracking

### ✅ US-04: Log Meals via Natural Text

| Test Case ID | Description | Steps | Expected Result |
|--------------|-------------|-------|------------------|
| TC-US04-01 | Input natural language meal | 1. Navigate to log meal<br>2. Enter "2 boiled eggs and toast"<br>3. Submit | Items parsed into eggs and toast |
| TC-US04-02 | Parse validation | 1. Enter complex meal (e.g., "chicken curry with rice and salad") | Parsed items match meal components accurately |

### ✅ US-05: Calculate Calories

| Test Case ID | Description | Steps | Expected Result |
|--------------|-------------|-------|------------------|
| TC-US05-01 | Log meal and calculate calories | 1. Input meal<br>2. View parsed items<br>3. View calories | Estimated calories are displayed |
| TC-US05-02 | View total daily calories | 1. Log multiple meals throughout day<br>2. Check dashboard | Total calories consumed is updated in real time |
| TC-US05-03 | Validate Nutritionix integration | 1. Log a standard meal<br>2. Compare estimated values | Values align with Nutritionix data |

---

## �� Epic: Smart Suggestions

### ✅ US-06: Suggestions Based on Remaining Calories

| Test Case ID | Description | Steps | Expected Result |
|--------------|-------------|-------|------------------|
| TC-US06-01 | Get meal suggestions | 1. Log partial meals<br>2. Navigate to suggestions | Meals suggested under remaining calorie limit |
| TC-US06-02 | Respect restrictions | 1. Set preference (vegan), allergy (gluten)<br>2. Get suggestions | No gluten or non-vegan meals shown |

### ✅ US-07: Suggest Balanced Diet

| Test Case ID | Description | Steps | Expected Result |
|--------------|-------------|-------|------------------|
| TC-US07-01 | Check macro diversity | 1. Get a suggestion<br>2. View macro breakdown | Suggestions include protein, carb, and fat variety |
| TC-US07-02 | GPT description format | 1. Trigger suggestions<br>2. Review output | Meal title + short description shown for each |

---

## �� Epic: Calorie Summary

### ✅ US-08: Daily Calorie Summary

| Test Case ID | Description | Steps | Expected Result |
|--------------|-------------|-------|------------------|
| TC-US08-01 | View summary after meals | 1. Log meals<br>2. Go to summary page | Consumed and remaining calories are displayed |
| TC-US08-02 | Real-time update | 1. Log a new meal<br>2. Observe summary | Data updates immediately |

### ✅ US-09: Macro Breakdown

| Test Case ID | Description | Steps | Expected Result |
|--------------|-------------|-------|------------------|
| TC-US09-01 | View macros | 1. Go to calorie summary page | Chart showing carbs, protein, fat is visible |
| TC-US09-02 | Accuracy check | 1. Log known meal (e.g., chicken and rice)<br>2. Compare expected macros | Display matches reasonable macro estimates |

---

## �� Epic: Data Persistence

### ✅ US-10: Persist Meals and Preferences

| Test Case ID | Description | Steps | Expected Result |
|--------------|-------------|-------|------------------|
| TC-US10-01 | Check meal persistence | 1. Log a meal<br>2. Log out and back in | Meal still exists |
| TC-US10-02 | Verify user link | 1. Check Supabase DB<br>2. Match meal data with user ID | Data is linked to correct authenticated user |
| TC-US10-03 | Preferences persistence | 1. Set preferences<br>2. Log out/in<br>3. View profile | All preferences still applied |
