/*
      # Create students table

      1. New Tables
        - `students`
          - `id` (uuid, primary key)
          - `name` (text, not null)
          - `dob` (date, nullable)
          - `parent_id` (uuid, foreign key to `profiles.id`, nullable)
          - `created_at` (timestamp with timezone, default now())
      2. Security
        - Enable RLS on `students` table
        - Policy for authenticated users to read students they are linked to (as parent)
        - Policy for teachers to read students in their classes (will be refined with `enrollments` and `classes` tables)
    */

    CREATE TABLE IF NOT EXISTS students (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      dob date,
      parent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now()
    );

    ALTER TABLE students ENABLE ROW LEVEL SECURITY;

    -- Parents can read own children's data
    CREATE POLICY "Parents can read own children"
      ON students
      FOR SELECT
      TO authenticated
      USING (auth.uid() = parent_id);

    -- Teachers can read students in their classes (this policy will be more effective once classes and enrollments are in place)
    CREATE POLICY "Teachers can read students in their classes"
      ON students
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM enrollments e
          JOIN classes c ON e.class_id = c.id
          WHERE e.student_id = students.id AND c.teacher_id = auth.uid()
        )
      );