 FitBite Application – Test Automation Documentation

**Tool Used:** Ghost Inspector (Chrome Extension)  
**Purpose:** Automated UI testing for the FitBite web application

---

## �� Overview

Ghost Inspector automates and validates key user workflows within the FitBite app. Tests are recorded via browser interaction, enabling fast and low-code automation. This ensures the app's features like meal logging, calorie tracking, and personalized suggestions are always functioning correctly.

---

## ��️ Tool Setup

### 1. Installation
- Install the **Ghost Inspector Chrome Extension** from the [Chrome Web Store](https://chrome.google.com/webstore/detail/ghost-inspector/).
- Sign up or log in to your Ghost Inspector account.

### 2. Test Recorder
- Use the extension to record browser actions.
- Actions like clicks, text input, and navigation are automatically saved as test steps.

---

## �� Test Cases Automated

| Test Case Name | Description | Key Steps |
|----------------|-------------|-----------|
| `Login Test` | Validate user login with valid credentials | Open login page → Enter email/password → Click Login → Verify home page |
| `Set Preferences` | Set dietary type and food allergies | Navigate to Profile → Choose type → Add allergies → Save |
| `Set Calorie Goal` | Auto-calculate or enter manually | Profile → Select method → Enter data → Save |
| `Log Meal` | Log a meal using natural text | Log Meal → Type meal (e.g., "2 eggs") → Submit → Confirm parsed food |
| `Check Calorie Summary` | View calories consumed/remaining | Log meal → Go to summary page → Verify data |
| `View Macro Breakdown` | Visualize macro chart | Open summary → Check for carbs/protein/fat chart |
| `Get Meal Suggestions` | Suggestions match dietary rules | Navigate to Suggestions → Validate meals follow calorie and allergy rules |
| `Logout Test` | Test session logout | Click logout → Verify redirect to login |

---

## �� Test Execution

- **Manual Run:** Via Ghost Inspector browser extension.
- **Scheduled Run:** Set up automatic daily/weekly execution.
- **Integration:** Triggered in CI/CD pipeline (GitHub Actions/Vercel) using Ghost Inspector API.

---

## ✅ Validation & Assertions

- Checks for correct page navigation, input values, and UI changes
- Verifies visibility of key elements (charts, buttons, messages)
- Screenshots captured at each step for audit and debugging
- Email/Slack alerts for test failures (if configured)

---

## �� Reporting

- Test dashboards available in Ghost Inspector web interface
- Pass/Fail results shown with timestamps
- Visual diffs and screenshots available for failed runs

---

## �� Authentication Handling

- Login steps recorded manually in Ghost Inspector
- Test credentials stored in environment settings securely

---

## �� Maintenance Recommendations

- Re-record tests after major UI changes
- Organize tests by feature in suites
- Use conditions to handle slight variations in UI
- Periodically review and update assertions and selectors

---

## �� Resources

- FitBite App URL: `[your-app-url-here]`
- Ghost Inspector Dashboard: `[your-dashboard-link-here]`
- Test Credentials: Stored in environment settings of Ghost Inspector

---

*This document helps QA teams, stakeholders, and developers understand the scope and implementation of test automation in FitBite using Ghost Inspector.*