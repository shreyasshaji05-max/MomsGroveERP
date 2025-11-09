/*
      # Create invoices table

      1. New Tables
        - `invoices`
          - `id` (uuid, primary key)
          - `student_id` (uuid, foreign key to `students.id`, not null)
          - `fee_structure_id` (uuid, foreign key to `fee_structures.id`, nullable)
          - `amount_due` (numeric, not null)
          - `due_date` (date, not null)
          - `status` (enum: 'pending', 'paid', 'overdue', 'cancelled', not null)
          - `created_at` (timestamp with timezone, default now())
      2. Security
        - Enable RLS on `invoices` table
        - Policy for parents to read their own child's invoices
        - Policy for admins to manage all invoices
    */

    -- Create ENUM type for invoice_status if it doesn't exist
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status_enum') THEN
        CREATE TYPE invoice_status_enum AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS invoices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
      fee_structure_id uuid REFERENCES fee_structures(id) ON DELETE SET NULL,
      amount_due numeric NOT NULL,
      due_date date NOT NULL,
      status invoice_status_enum NOT NULL DEFAULT 'pending',
      created_at timestamptz DEFAULT now()
    );

    ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

    -- Parents can read their own child's invoices
    CREATE POLICY "Parents can read own child's invoices"
      ON invoices
      FOR SELECT
      TO authenticated
      USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

    -- Admins can manage all invoices
    CREATE POLICY "Admins can manage all invoices"
      ON invoices
      FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));