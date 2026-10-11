-- Website Builder Foundation: draft/publish configuration
-- One row per tenant. Draft is mutable; published is an immutable snapshot.

CREATE TABLE website_config (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  published jsonb,
  published_at timestamptz,
  published_by text REFERENCES "user"(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER website_config_updated_at BEFORE UPDATE ON website_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
