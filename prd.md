# Product Requirements Document (PRD)

## Project Title
Simple Web Application with Authentication and User Profile

## Overview
This document outlines the product requirements for building a simple web application using the following tech stack:

### Tech Stack
- **Frontend**: Next.js(latest) with Tailwind CSS(latest)
- **Backend**: Next.js API Routes (Serverless)
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Version Control**: GitHub
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

## Goals
Create a minimal web application that allows users to:
1. Sign up and log in securely using email or username and password.
2. View a personalized Home and Profile page.
3. Ensure pages are protected and only accessible to authenticated users.

## Features

### 1. User Signup
- Form fields: Name, Email, Password
- On submission:
  - Create a user in Supabase Auth
  - Generate a unique and random username
  - Store the user details in Supabase database (name, email, username)

### 2. User Login
- Form fields: Email or Username, Password
- On successful login:
  - Redirect user to the Home page

### 3. Home Page
- Display a welcome message: "Welcome to my app"
- Only accessible to logged-in users

### 4. Profile Page
- Display user details:
  - Username
  - Name
  - Email
- Logout button to sign the user out and redirect to login page
- Only accessible to logged-in users

## Pages Structure

### Public Pages
- `/signup` – Signup form
- `/login` – Login form

### Protected Pages
- `/` – Home page (welcome message)
- `/profile` – Profile page (user info + logout)

## API Routes (Serverless)
- `POST /api/signup` – Handles user registration, random username generation, and DB entry.
- `POST /api/login` – Handles login with email/username and password (optional: fallback to Supabase auth).

## Authentication & Session Management
- Use Supabase Auth for session handling
- Use Supabase client to check user session
- Implement middleware or custom logic to restrict access to protected routes

## Database Schema (Supabase - PostgreSQL)
**Table: users**
| Field     | Type     | Description               |
|-----------|----------|---------------------------|
| id        | UUID     | Primary key, user ID      |
| email     | Text     | User's email              |
| name      | Text     | User's name               |
| username  | Text     | Unique random username    |
| created_at| Timestamp| Timestamp of registration |

## CI/CD
- Use GitHub Actions to run lint, build, and deploy checks on every push and PR
- Automatically deploy to Vercel on push to main

## Deployment
- Deploy the application to Vercel
- Environment variables (Supabase keys, etc.) will be securely configured in Vercel settings

## Access Control
- Use session hooks (e.g., Supabase’s `useSession`) or middleware to guard protected routes
- Redirect unauthorized users to the login page

## Acceptance Criteria
- ✅ Users can sign up and a unique username is generated
- ✅ Users can log in with email or username
- ✅ Home and Profile pages are only visible when logged in
- ✅ Users can log out successfully
- ✅ GitHub Actions pipeline is configured and functional
- ✅ Application is deployed and publicly accessible via Vercel

## Nice-to-Have (Future Scope)
- Avatar upload in profile
- Forgot password/reset feature
- Username customization option
- Responsive design improvements

---

**End of PRD**