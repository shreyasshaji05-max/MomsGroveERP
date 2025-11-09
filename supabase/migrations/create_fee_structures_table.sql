/*
      # Create fee_structures table

      1. New Tables
        - `fee_structures`
          - `id` (uuid, primary key)
          - `name` (text, not null)
          - `description` (text, nullable)
          - `amount` (numeric, not null)
          - `billing_cycle` (enum: 'monthly', 'quarterly', 'annually', 'one-time', not null)
          - `is_active` (boolean, default true)
          - `created_at` (timestamp with timezone, default now())
      2. Security
        - Enable RLS on `fee_structures` table
        - Policy for authenticated users to read active fee structures
        - Policy for admins to manage all fee structures
    */

    -- Create ENUM type for billing_cycle if it doesn't exist
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle_enum') THEN
        CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'quarterly', 'annually', 'one-time');
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS fee_structures (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text DEFAULT '',
      amount numeric NOT NULL,
      billing_cycle billing_cycle_enum NOT NULL,
      is_active boolean DEFAULT true NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;

    -- Authenticated users can read active fee structures
    CREATE POLICY "Authenticated users can read active fee structures"
      ON fee_structures
      FOR SELECT
      TO authenticated
      USING (is_active = true);

    -- Admins can manage all fee structures
    CREATE POLICY "Admins can manage all fee structures"
      ON fee_structures
      FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));