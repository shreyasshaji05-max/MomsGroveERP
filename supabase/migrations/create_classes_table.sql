/*
      # Create classes table

      1. New Tables
        - `classes`
          - `id` (uuid, primary key)
          - `name` (text, not null)
          - `teacher_id` (uuid, foreign key to `profiles.id`, not null)
          - `created_at` (timestamp with timezone, default now())
      2. Security
        - Enable RLS on `classes` table
        - Policy for teachers to manage their own classes
        - Policy for admins to manage all classes
    */

    CREATE TABLE IF NOT EXISTS classes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

    -- Teachers can manage their own classes
    CREATE POLICY "Teachers can manage own classes"
      ON classes
      FOR ALL
      TO authenticated
      USING (auth.uid() = teacher_id)
      WITH CHECK (auth.uid() = teacher_id);

    -- Admins can manage all classes
    CREATE POLICY "Admins can manage all classes"
      ON classes
      FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));