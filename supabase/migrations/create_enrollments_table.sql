/*
      # Create enrollments table

      1. New Tables
        - `enrollments`
          - `id` (uuid, primary key)
          - `student_id` (uuid, foreign key to `students.id`, not null)
          - `class_id` (uuid, foreign key to `classes.id`, not null)
          - `created_at` (timestamp with timezone, default now())
          - Unique constraint on `student_id`, `class_id`
      2. Security
        - Enable RLS on `enrollments` table
        - Policy for teachers to manage enrollments for their classes
        - Policy for parents to read enrollments for their children
        - Policy for admins to manage all enrollments
    */

    CREATE TABLE IF NOT EXISTS enrollments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
      class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
      created_at timestamptz DEFAULT now(),
      UNIQUE (student_id, class_id)
    );

    ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

    -- Teachers can manage enrollments for their classes
    CREATE POLICY "Teachers can manage enrollments for their classes"
      ON enrollments
      FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM classes WHERE id = enrollments.class_id AND teacher_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM classes WHERE id = enrollments.class_id AND teacher_id = auth.uid()));

    -- Parents can read enrollments for their children
    CREATE POLICY "Parents can read own children's enrollments"
      ON enrollments
      FOR SELECT
      TO authenticated
      USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

    -- Admins can manage all enrollments
    CREATE POLICY "Admins can manage all enrollments"
      ON enrollments
      FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));