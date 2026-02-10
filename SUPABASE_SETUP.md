# Supabase Authentication Setup Guide

## Overview
This project now uses Supabase for authentication while keeping MySQL for data storage (templates, forms, submissions).

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Choose your organization or create a new one
4. Select a region close to your users
5. Create your project

## Step 2: Get Supabase Credentials

1. In your Supabase project dashboard:
   - Go to **Settings** → **API**
   - Copy the **Project URL** and **anon public** key

2. Your credentials should look like:
   ```
   Project URL: https://your-project-ref.supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 4: Configure Supabase Auth

In your Supabase dashboard:

1. **Authentication** → **Providers**
   - Enable **Email** provider
   - Configure site URL: `http://localhost:5173` (for development)
   - Configure site URL: `https://your-domain.com` (for production)

2. **Authentication** → **URL Configuration**
   - Add your site URLs to the allowed list

3. **Authentication** → **Email Templates** (optional)
   - Customize email templates for confirmation and recovery

## Step 5: Test Authentication

1. Start your development servers:
   ```bash
   # Frontend
   npm run dev
   
   # Backend (if not already running)
   cd backend && mvn clean install && java -jar target/form-weaver-backend-0.0.1-SNAPSHOT.jar --server.port=80abase
   ```

2. Test authentication:
   - Go to http://localhost:5173/login
   - Try registering a new account
   - Test login/logout functionality

## Step 6: Production Deployment

For production:

1. Update allowed URLs in Supabase Auth settings
2. Update site URL in email templates
3. Ensure HTTPS is properly configured
4. Update environment variables with production URLs

## Features

✅ **Email Authentication** - Secure login/signup with email
✅ **Session Management** - Automatic session handling
✅ **User Metadata** - Store first name, last name
✅ **Protected Routes** - Authentication-aware routing
✅ **MySQL Integration** - Keep existing database for data
✅ **No Backend Auth Needed** - Supabase handles auth completely

## Notes

- Supabase handles all authentication, no backend auth code needed
- MySQL remains the primary database for forms, templates, and submissions
- User data (name, email) is stored in Supabase Auth
- Form data remains in MySQL as before
- No JWT tokens or auth middleware needed in Spring Boot
