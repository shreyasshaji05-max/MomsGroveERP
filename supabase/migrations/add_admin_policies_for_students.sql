/*
  # Add admin policies for students table

  This migration adds Row Level Security policies to allow admins
  to read, insert, update, and delete all students.
*/

-- Admins can read all students
CREATE POLICY "Admins can read all students"
  ON students
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can insert students
CREATE POLICY "Admins can insert students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update students
CREATE POLICY "Admins can update students"
  ON students
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete students
CREATE POLICY "Admins can delete students"
  ON students
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

