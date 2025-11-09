/*
      # Update handle_new_user trigger for admin signup

      1. Triggers
        - `handle_new_user`: Modified to always set the `role` to 'admin' for new users signing up, as the signup process is now exclusively for administrators.
    */

    -- Update the function to handle new user sign-ups
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (id, full_name, role)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        'admin' -- Explicitly set role to 'admin' for all new signups
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;