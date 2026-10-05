-- Phase A follow-ups: additive, idempotent, no data loss.
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country_code char(2) NOT NULL DEFAULT 'EG';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS week_start_day text NOT NULL DEFAULT 'saturday';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS numbering_system text NOT NULL DEFAULT 'latn';
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE working_hours ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;
DO $$ BEGIN
  ALTER TABLE tenants ADD CONSTRAINT tenants_country_code_format CHECK (country_code ~ '^[A-Z]{2}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE tenants ADD CONSTRAINT tenants_week_start_day_valid CHECK (week_start_day IN ('saturday', 'sunday', 'monday'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE tenants ADD CONSTRAINT tenants_numbering_system_valid CHECK (numbering_system IN ('latn', 'arab'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
