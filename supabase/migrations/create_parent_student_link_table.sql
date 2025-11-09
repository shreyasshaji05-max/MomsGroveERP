/*
      # Create parent_student_link table

      1. New Tables
        - `parent_student_link`
          - `id` (uuid, primary key)
          - `parent_id` (uuid, foreign key to `users.id`, not null)
          - `student_id` (uuid, foreign key to `students.id`, not null)
          - `created_at` (timestamp with timezone, default now())
      2. Security
        - Enable RLS on `parent_student_link` table
        - Add policy for authenticated users to read their own links
    */

    CREATE TABLE IF NOT EXISTS parent_student_link (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      UNIQUE (parent_id, student_id)
    );

    ALTER TABLE parent_student_link ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Parents can read their own student links"
      ON parent_student_link
      FOR SELECT
      TO authenticated
      USING (auth.uid() = parent_id);