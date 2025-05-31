-- Run this SQL in your Supabase SQL Editor to set up the database schema

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

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users FOR
SELECT USING (auth.uid () = id);

CREATE POLICY "Users can insert own profile" ON users FOR
INSERT
WITH
    CHECK (auth.uid () = id);

CREATE POLICY "Users can update own profile" ON users FOR
UPDATE USING (auth.uid () = id);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users (username);

CREATE INDEX idx_users_email ON users (email);