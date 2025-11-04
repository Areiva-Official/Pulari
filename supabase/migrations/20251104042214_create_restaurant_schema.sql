/*
  # Restaurant Website Database Schema

  ## Overview
  This migration creates a comprehensive database schema for a restaurant website
  including user management, menu items, reservations, reviews, and events.

  ## New Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `phone` (text) - Contact phone number
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `menu_categories`
  - `id` (uuid, primary key)
  - `name` (text) - Category name (Starters, Mains, Desserts, etc.)
  - `description` (text) - Category description
  - `display_order` (integer) - Order in which to display
  - `created_at` (timestamptz)

  ### `menu_items`
  - `id` (uuid, primary key)
  - `category_id` (uuid, foreign key) - Links to menu_categories
  - `name` (text) - Dish name
  - `description` (text) - Dish description
  - `price` (numeric) - Price in euros
  - `image_url` (text) - Image URL
  - `is_vegetarian` (boolean)
  - `is_vegan` (boolean)
  - `is_gluten_free` (boolean)
  - `is_available` (boolean) - Currently available
  - `created_at` (timestamptz)

  ### `reservations`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `date` (date) - Reservation date
  - `time` (time) - Reservation time
  - `party_size` (integer) - Number of guests
  - `special_requests` (text) - Any special requests
  - `status` (text) - pending, confirmed, cancelled, completed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `reviews`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `rating` (integer) - Rating 1-5
  - `title` (text) - Review title
  - `comment` (text) - Review text
  - `is_approved` (boolean) - Admin approval status
  - `created_at` (timestamptz)

  ### `events`
  - `id` (uuid, primary key)
  - `title` (text) - Event title
  - `description` (text) - Event description
  - `event_date` (date) - Event date
  - `event_time` (time) - Event time
  - `image_url` (text) - Event image
  - `is_active` (boolean) - Whether event is active
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can read their own profiles and update them
  - Menu items and categories are publicly readable
  - Users can create and view their own reservations
  - Users can create reviews and read approved reviews
  - Events are publicly readable
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create menu_categories table
CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view menu categories"
  ON menu_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  image_url text,
  is_vegetarian boolean DEFAULT false,
  is_vegan boolean DEFAULT false,
  is_gluten_free boolean DEFAULT false,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available menu items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time NOT NULL,
  party_size integer NOT NULL,
  special_requests text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  comment text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active events"
  ON events FOR SELECT
  TO anon, authenticated
  USING (is_active = true);