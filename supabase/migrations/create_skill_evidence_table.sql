/*
      # Create skill_evidence table

      1. New Tables
        - `skill_evidence`
          - `id` (uuid, primary key)
          - `student_id` (uuid, foreign key to `students.id`, not null)
          - `skill_name` (text, not null)
          - `description` (text, nullable)
          - `date_recorded` (date, not null, default now())
          - `recorded_by` (uuid, foreign key to `profiles.id`, nullable)
          - `created_at` (timestamp with timezone, default now())
      2. Security
        - Enable RLS on `skill_evidence` table
        - Policy for teachers to manage skill evidence for students in their classes
        - Policy for parents to read skill evidence for their own child
    */

    CREATE TABLE IF NOT EXISTS skill_evidence (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
      skill_name text NOT NULL DEFAULT '',
      description text DEFAULT '',
      date_recorded date NOT NULL DEFAULT now(),
      recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now()
    );

    ALTER TABLE skill_evidence ENABLE ROW LEVEL SECURITY;

    -- Teachers can manage skill evidence for students in their classes
    CREATE POLICY "Teachers can manage skill evidence for their students"
      ON skill_evidence
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM enrollments e
          JOIN classes c ON e.class_id = c.id
          WHERE e.student_id = skill_evidence.student_id AND c.teacher_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM enrollments e
          JOIN classes c ON e.class_id = c.id
          WHERE e.student_id = skill_evidence.student_id AND c.teacher_id = auth.uid()
        )
      );

    -- Parents can read skill evidence for their own child
    CREATE POLICY "Parents can read own child's skill evidence"
      ON skill_evidence
      FOR SELECT
      TO authenticated
      USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

    -- Admins can manage all skill evidence records
    CREATE POLICY "Admins can manage all skill evidence"
      ON skill_evidence
      FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));