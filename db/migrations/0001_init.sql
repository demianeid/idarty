-- Idarty / إدارتي — Phase 1 foundation schema.
-- Applied by scripts/migrate.ts using DATABASE_URL_UNPOOLED inside a single transaction.
-- Conventions:
--   * Every tenant-owned table has tenant_id and UNIQUE (tenant_id, id) so children can use
--     composite foreign keys (tenant_id, x_id) that make cross-tenant references impossible.
--   * Soft delete via deleted_at on business entities; audit trail in audit_logs.
--   * Better Auth tables keep Better Auth's camelCase column names.

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE app_locale AS ENUM ('ar', 'en');
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'archived');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'manager', 'staff', 'receptionist');
CREATE TYPE member_status AS ENUM ('active', 'invited', 'suspended');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE booking_source AS ENUM ('online', 'dashboard');
CREATE TYPE date_override_kind AS ENUM ('closed', 'custom_hours');
CREATE TYPE notification_type AS ENUM (
  'booking_confirmation', 'booking_reminder', 'booking_cancelled', 'booking_rescheduled'
);
CREATE TYPE notification_channel AS ENUM ('email');
CREATE TYPE notification_status AS ENUM ('pending', 'processing', 'sent', 'failed', 'skipped');
CREATE TYPE cron_run_status AS ENUM ('running', 'succeeded', 'failed');

-- ---------------------------------------------------------------------------
-- Shared trigger: updated_at
-- ---------------------------------------------------------------------------
CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- ---------------------------------------------------------------------------
-- Better Auth core tables
-- ---------------------------------------------------------------------------
CREATE TABLE "user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "preferredLocale" text NOT NULL DEFAULT 'ar' CHECK ("preferredLocale" IN ('ar', 'en')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE session (
  id text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE INDEX session_user_id_idx ON session ("userId");

CREATE TABLE account (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX account_user_id_idx ON account ("userId");

CREATE TABLE verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);
CREATE INDEX verification_identifier_idx ON verification (identifier);

-- Better Auth database-backed rate limiter storage.
CREATE TABLE "rateLimit" (
  id text PRIMARY KEY,
  key text NOT NULL UNIQUE,
  count integer NOT NULL,
  "lastRequest" bigint NOT NULL
);

-- ---------------------------------------------------------------------------
-- Tenants & membership
-- ---------------------------------------------------------------------------
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  status tenant_status NOT NULL DEFAULT 'active',
  business_type text NOT NULL DEFAULT 'salon',
  default_locale app_locale NOT NULL DEFAULT 'ar',
  supported_locales app_locale[] NOT NULL DEFAULT '{ar,en}',
  timezone text NOT NULL DEFAULT 'Africa/Cairo',
  currency char(3) NOT NULL DEFAULT 'EGP',
  phone_e164 text,
  email text,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  CONSTRAINT tenants_default_locale_supported CHECK (default_locale = ANY (supported_locales)),
  CONSTRAINT tenants_phone_e164 CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9][0-9]{6,14}$')
);
-- Slugs are never reused, even after soft delete, so old links cannot hijack a new tenant.
CREATE UNIQUE INDEX tenants_slug_key ON tenants (slug);
CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE tenant_translations (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  locale app_locale NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  address text,
  PRIMARY KEY (tenant_id, locale)
);

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role member_role NOT NULL,
  status member_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX memberships_user_id_idx ON memberships (user_id);
CREATE TRIGGER memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Catalog: services & staff
-- ---------------------------------------------------------------------------
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  duration_min integer NOT NULL CHECK (duration_min BETWEEN 5 AND 720),
  buffer_before_min integer NOT NULL DEFAULT 0 CHECK (buffer_before_min BETWEEN 0 AND 240),
  buffer_after_min integer NOT NULL DEFAULT 0 CHECK (buffer_after_min BETWEEN 0 AND 240),
  price_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (price_amount >= 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, id)
);
CREATE INDEX services_tenant_idx ON services (tenant_id) WHERE deleted_at IS NULL;
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE service_translations (
  tenant_id uuid NOT NULL,
  service_id uuid NOT NULL,
  locale app_locale NOT NULL,
  name text NOT NULL,
  description text,
  PRIMARY KEY (service_id, locale),
  FOREIGN KEY (tenant_id, service_id) REFERENCES services (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  membership_id uuid,
  email text,
  phone_e164 text CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  color text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, membership_id) REFERENCES memberships (tenant_id, id)
    ON DELETE SET NULL (membership_id)
);
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE staff_translations (
  tenant_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  locale app_locale NOT NULL,
  name text NOT NULL,
  title text,
  bio text,
  PRIMARY KEY (staff_id, locale),
  FOREIGN KEY (tenant_id, staff_id) REFERENCES staff (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE staff_services (
  tenant_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  service_id uuid NOT NULL,
  PRIMARY KEY (staff_id, service_id),
  FOREIGN KEY (tenant_id, staff_id) REFERENCES staff (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, service_id) REFERENCES services (tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX staff_services_service_idx ON staff_services (tenant_id, service_id);

-- ---------------------------------------------------------------------------
-- Availability: split working hours + date overrides (holidays, Ramadan)
-- staff_id NULL = business-wide hours; non-null = staff-specific hours.
-- Multiple rows per weekday express split shifts (e.g. 10:00-14:00 + 17:00-23:00).
-- ---------------------------------------------------------------------------
CREATE TABLE working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id uuid,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0 = Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  CHECK (start_time < end_time),
  FOREIGN KEY (tenant_id, staff_id) REFERENCES staff (tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX working_hours_lookup_idx ON working_hours (tenant_id, staff_id, weekday);

CREATE TABLE date_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id uuid,
  start_date date NOT NULL,
  end_date date NOT NULL,
  kind date_override_kind NOT NULL,
  start_time time,
  end_time time,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK (
    (kind = 'closed' AND start_time IS NULL AND end_time IS NULL)
    OR (kind = 'custom_hours' AND start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  ),
  FOREIGN KEY (tenant_id, staff_id) REFERENCES staff (tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX date_overrides_lookup_idx ON date_overrides (tenant_id, start_date, end_date);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  name_normalized text NOT NULL,
  phone_e164 text NOT NULL CHECK (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  email text,
  preferred_locale app_locale,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, id)
);
CREATE UNIQUE INDEX customers_tenant_phone_key ON customers (tenant_id, phone_e164)
  WHERE deleted_at IS NULL;
CREATE INDEX customers_name_trgm_idx ON customers USING gin (name_normalized gin_trgm_ops);
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Bookings (multi-service via booking_items)
-- ---------------------------------------------------------------------------
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  status booking_status NOT NULL DEFAULT 'confirmed',
  source booking_source NOT NULL,
  locale app_locale NOT NULL,
  idempotency_key text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  customer_note text,
  internal_note text,
  created_by_user_id text REFERENCES "user"(id) ON DELETE SET NULL,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (ends_at > starts_at),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, idempotency_key),
  FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id)
);
CREATE INDEX bookings_tenant_starts_idx ON bookings (tenant_id, starts_at) WHERE deleted_at IS NULL;
CREATE INDEX bookings_customer_idx ON bookings (tenant_id, customer_id);
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  booking_id uuid NOT NULL,
  service_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  -- Blocked range = appointment + service buffers; this is what must not overlap.
  block_starts_at timestamptz NOT NULL,
  block_ends_at timestamptz NOT NULL,
  -- Mirrors bookings.status (kept in sync by trigger) so the exclusion constraint can filter on it.
  status booking_status NOT NULL,
  price_amount numeric(12, 2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  CHECK (ends_at > starts_at),
  CHECK (block_starts_at <= starts_at AND block_ends_at >= ends_at),
  FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, service_id) REFERENCES services (tenant_id, id),
  FOREIGN KEY (tenant_id, staff_id) REFERENCES staff (tenant_id, id),
  -- The core double-booking guarantee: one staff member cannot hold two active
  -- overlapping blocks within the same tenant. '[)' lets back-to-back slots touch.
  CONSTRAINT booking_items_no_overlap EXCLUDE USING gist (
    tenant_id WITH =,
    staff_id WITH =,
    tstzrange(block_starts_at, block_ends_at, '[)') WITH &&
  ) WHERE (status IN ('pending', 'confirmed'))
);
CREATE INDEX booking_items_booking_idx ON booking_items (tenant_id, booking_id);

CREATE FUNCTION booking_items_inherit_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  SELECT b.status INTO NEW.status FROM bookings b
   WHERE b.id = NEW.booking_id AND b.tenant_id = NEW.tenant_id;
  RETURN NEW;
END $$;
CREATE TRIGGER booking_items_status_on_insert BEFORE INSERT ON booking_items
  FOR EACH ROW EXECUTE FUNCTION booking_items_inherit_status();

CREATE FUNCTION bookings_propagate_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE booking_items SET status = NEW.status
     WHERE booking_id = NEW.id AND tenant_id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_status_propagate AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION bookings_propagate_status();

-- ---------------------------------------------------------------------------
-- Public content: FAQ + per-page SEO (translated)
-- ---------------------------------------------------------------------------
CREATE TABLE faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, id)
);

CREATE TABLE faq_translations (
  tenant_id uuid NOT NULL,
  faq_id uuid NOT NULL,
  locale app_locale NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  PRIMARY KEY (faq_id, locale),
  FOREIGN KEY (tenant_id, faq_id) REFERENCES faqs (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE page_seo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_key text NOT NULL,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, page_key)
);

CREATE TABLE page_seo_translations (
  tenant_id uuid NOT NULL,
  page_seo_id uuid NOT NULL,
  locale app_locale NOT NULL,
  title text NOT NULL,
  description text,
  PRIMARY KEY (page_seo_id, locale),
  FOREIGN KEY (tenant_id, page_seo_id) REFERENCES page_seo (tenant_id, id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Notifications
-- tenant_id NULL on a template = platform default used when the tenant has no override.
-- ---------------------------------------------------------------------------
CREATE TABLE notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'email',
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE NULLS NOT DISTINCT (tenant_id, type, channel)
);

CREATE TABLE notification_template_translations (
  template_id uuid NOT NULL REFERENCES notification_templates(id) ON DELETE CASCADE,
  locale app_locale NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  PRIMARY KEY (template_id, locale)
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id uuid,
  type notification_type NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'email',
  locale app_locale NOT NULL,
  recipient text NOT NULL,
  -- Unique per tenant; encodes the rule + booking + start time, so the same reminder can
  -- never be queued twice, while a rescheduled booking produces a fresh key.
  dedupe_key text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status notification_status NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  locked_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, dedupe_key),
  FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings (tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX notifications_due_idx ON notifications (status, scheduled_at);
CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Cron heartbeat: lets us detect a reminder job that silently stopped running.
CREATE TABLE cron_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job text NOT NULL,
  status cron_run_status NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text
);
CREATE INDEX cron_runs_job_started_idx ON cron_runs (job, started_at DESC);

-- ---------------------------------------------------------------------------
-- Audit, rate limiting, dev mail outbox
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  actor_user_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_tenant_created_idx ON audit_logs (tenant_id, created_at DESC);

-- Fixed-window limiter for app endpoints (booking, onboarding). Auth endpoints use "rateLimit".
CREATE TABLE rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  window_started_at timestamptz NOT NULL
);

-- Development only: emails are written here instead of being sent when no provider is configured.
CREATE TABLE dev_email_outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  to_address text NOT NULL,
  subject text NOT NULL,
  locale app_locale NOT NULL,
  html text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
