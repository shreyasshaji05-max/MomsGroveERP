/*
      # Create attendance table

      1. New Tables
        - `attendance`
          - `id` (uuid, primary key)
          - `student_id` (uuid, foreign key to `students.id`, not null)
          - `class_id` (uuid, foreign key to `classes.id`, nullable)
          - `date` (date, not null)
          - `status` (text, enum: 'present', 'absent', 'late', not null)
          - `recorded_by` (uuid, foreign key to `profiles.id`, nullable)
          - `recorded_at` (timestamp with timezone, default now())
      2. Security
        - Enable RLS on `attendance` table
        - Policy for teachers to manage attendance for students in their classes
        - Policy for parents to read their child's attendance
    */

    -- Create ENUM type for attendance status if it doesn't exist
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS attendance (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
      class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
      date date NOT NULL,
      status attendance_status NOT NULL,
      recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
      recorded_at timestamptz DEFAULT now(),
      UNIQUE (student_id, date, class_id) -- Ensure only one attendance record per student per class per day
    );

    ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

    -- Teachers can manage attendance for students in their classes
    CREATE POLICY "Teachers can manage attendance for their classes"
      ON attendance
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM classes
          WHERE id = attendance.class_id AND teacher_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM classes
          WHERE id = attendance.class_id AND teacher_id = auth.uid()
        )
      );

    -- Parents can read their own child's attendance
    CREATE POLICY "Parents can read own child's attendance"
      ON attendance
      FOR SELECT
      TO authenticated
      USING (attendance.student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

    -- Admins can manage all attendance records
    CREATE POLICY "Admins can manage all attendance"
      ON attendance
      FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));