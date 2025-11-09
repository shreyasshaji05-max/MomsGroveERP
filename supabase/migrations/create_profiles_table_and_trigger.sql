/*
      # Create profiles table and handle_new_user trigger

      1. New Tables
        - `profiles`
          - `id` (uuid, primary key, foreign key to `auth.users.id`)
          - `full_name` (text)
          - `role` (text, default 'parent')
          - `created_at` (timestamp with timezone, default now())
      2. Security
        - Enable RLS on `profiles` table
        - Add policy for authenticated users to read their own profile
        - Add policy for authenticated users to update their own profile
      3. Triggers
        - `handle_new_user`: Automatically creates a profile entry in `public.profiles` when a new user signs up in `auth.users`, using `raw_user_meta_data` for `full_name` and `role`.
    */

    -- Create the profiles table
    CREATE TABLE IF NOT EXISTS profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name text,
      role text DEFAULT 'parent' NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- Policy for users to read their own profile
    CREATE POLICY "Users can read own profile"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);

    -- Policy for users to update their own profile (e.g., full_name)
    CREATE POLICY "Users can update own profile"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);

    -- Create a function to handle new user sign-ups
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (id, full_name, role)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create the trigger to call the function on new user inserts
    CREATE OR REPLACE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();