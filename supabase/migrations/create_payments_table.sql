/*
      # Create payments table

      1. New Tables
        - `payments`
          - `id` (uuid, primary key)
          - `invoice_id` (uuid, foreign key to `invoices.id`, not null)
          - `amount_paid` (numeric, not null)
          - `payment_date` (date, not null, default now())
          - `payment_method` (text, nullable)
          - `transaction_id` (text, unique, nullable)
          - `created_at` (timestamp with timezone, default now())
      2. Security
        - Enable RLS on `payments` table
        - Policy for parents to read their own child's payments
        - Policy for admins to manage all payments
    */

    CREATE TABLE IF NOT EXISTS payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
      amount_paid numeric NOT NULL,
      payment_date date NOT NULL DEFAULT now(),
      payment_method text DEFAULT '',
      transaction_id text UNIQUE,
      created_at timestamptz DEFAULT now()
    );

    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

    -- Parents can read their own child's payments
    CREATE POLICY "Parents can read own child's payments"
      ON payments
      FOR SELECT
      TO authenticated
      USING (invoice_id IN (SELECT id FROM invoices WHERE student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())));

    -- Admins can manage all payments
    CREATE POLICY "Admins can manage all payments"
      ON payments
      FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));