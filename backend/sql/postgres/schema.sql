-- MailNova: PostgreSQL schema (converted from MongoDB / Mongoose models)
--
-- Multi-tenancy: the Mongo app used one database per user (mailnova_user_<id>).
-- In SQL every tenant-owned table gets a tenant_id -> users(id) column instead.
-- Global (non-tenant) collections: users, otps, payments, activity_logs.
-- Tenant collections: contacts, contact_lists, templates, campaigns,
--   campaign_recipients, email_logs, sms_logs, notifications, automations,
--   automation_tasks.
--
-- Mongo arrays / embedded docs were normalised:
--   ContactList.contacts[]       -> contact_list_members
--   Automation.firedForContacts[] -> automation_fired_contacts
--   Campaign.recipients[]         -> campaign_recipient_emails
--   EmailLog.recipients[]         -> email_log_recipients
--   Payment.webhookEventIds[]     -> payment_webhook_events
--   Template.blocks[]             -> template_blocks
--   User.plan{} / Automation.lastTriggeredContact{} -> flattened columns
--   Mixed fields (metadata, workDoneAtLogin)        -> JSONB

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- Auto-maintain updated_at (Mongoose "timestamps: true")
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------- ENUMs
CREATE TYPE user_role            AS ENUM ('Admin','Manager','User','Lead','Viewer');
CREATE TYPE user_status          AS ENUM ('Active','Suspended');
CREATE TYPE plan_name            AS ENUM ('Free','Pro','Enterprise');
CREATE TYPE billing_status       AS ENUM ('Trial','Active','Contract','Past Due');
CREATE TYPE contact_status       AS ENUM ('Lead','Prospect','Customer','Inactive');
CREATE TYPE campaign_status      AS ENUM ('Active','Completed','Running','Draft','Scheduled','Failed');
CREATE TYPE campaign_send_status AS ENUM ('draft','pending','sending','sent','failed');
CREATE TYPE recipient_status     AS ENUM ('pending','sent','failed','bounced','unsubscribed');
CREATE TYPE email_log_status     AS ENUM ('sent','failed');
CREATE TYPE sms_status           AS ENUM ('sent','failed','mock');
CREATE TYPE payment_status       AS ENUM ('created','paid','failed','refunded');
CREATE TYPE notification_type    AS ENUM ('campaign','system','warning','growth',
  'New Contact Message','Support Message','Lead Generated','System Alert');
CREATE TYPE automation_trigger   AS ENUM ('New contact added','Campaign not opened',
  'Clicked link','Contact becomes inactive');
CREATE TYPE automation_action    AS ENUM ('Send welcome email','Send follow-up campaign',
  'Move to interested folder','Notify manager');
CREATE TYPE task_status          AS ENUM ('pending','completed','failed');
CREATE TYPE block_type           AS ENUM ('heading','text','button','image','divider',
  'header','paragraph','list','image_placeholder','spacer','quote');
CREATE TYPE block_align          AS ENUM ('left','center','right');

-- ================================================================ GLOBAL
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id              CHAR(24) UNIQUE,                 -- original ObjectId (migration traceability)
  name                  TEXT        NOT NULL,
  email                 TEXT        NOT NULL,
  password              TEXT        NOT NULL,            -- bcrypt hash
  phone                 TEXT        NOT NULL DEFAULT '',
  sender_name           TEXT        NOT NULL DEFAULT 'MailNova Workspace',
  reply_to              TEXT        NOT NULL DEFAULT '',
  role                  user_role   NOT NULL DEFAULT 'User',
  is_owner              BOOLEAN     NOT NULL DEFAULT FALSE,
  status                user_status NOT NULL DEFAULT 'Active',
  -- plan (embedded doc)
  plan_name             plan_name      NOT NULL DEFAULT 'Free',
  plan_send_limit       INTEGER        NOT NULL DEFAULT 5000,
  plan_contact_limit    INTEGER        NOT NULL DEFAULT 1000,
  plan_billing_status   billing_status NOT NULL DEFAULT 'Trial',
  last_login            TIMESTAMPTZ,
  login_count           INTEGER     NOT NULL DEFAULT 0,
  work_done_at_login    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  reset_password_token  TEXT,
  reset_password_expire TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Mongoose lowercases emails, so enforce case-insensitive uniqueness.
CREATE UNIQUE INDEX users_email_key ON users (lower(email));

-- OTP: Mongo used a TTL index (expires: 300s). Postgres has no TTL, so we store
-- expires_at and the app (or a cron: DELETE FROM otps WHERE expires_at < now())
-- must purge expired rows. Always check expires_at > now() when verifying.
CREATE TABLE otps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  otp        TEXT        NOT NULL,
  attempts   INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '300 seconds'
);
CREATE INDEX otps_email_idx   ON otps (lower(email));
CREATE INDEX otps_expires_idx ON otps (expires_at);

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id            CHAR(24) UNIQUE,
  user_id             UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_name           plan_name      NOT NULL,
  amount              BIGINT         NOT NULL,           -- in paise
  currency            TEXT           NOT NULL DEFAULT 'INR',
  razorpay_order_id   TEXT           NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature  TEXT,
  status              payment_status NOT NULL DEFAULT 'created',
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX payments_user_idx ON payments (user_id);

-- Razorpay webhook idempotency (Payment.webhookEventIds[])
CREATE TABLE payment_webhook_events (
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  event_id   TEXT NOT NULL,
  PRIMARY KEY (payment_id, event_id)
);

-- ActivityLog is NOT tenant-proxied in the Mongo app, so it is global.
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id    CHAR(24) UNIQUE,
  action      TEXT        NOT NULL,
  entity_type TEXT        NOT NULL,
  entity_id   TEXT,                                     -- polymorphic ref, so no FK
  message     TEXT        NOT NULL DEFAULT '',
  actor_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activity_logs_created_idx ON activity_logs (created_at DESC);
CREATE INDEX activity_logs_entity_idx  ON activity_logs (entity_type, entity_id);
CREATE INDEX activity_logs_actor_idx   ON activity_logs (actor_id, created_at DESC);

-- ================================================================ TENANT
-- tenant_id = the user whose private Mongo database (mailnova_user_<id>) the
-- row came from. ALWAYS filter on tenant_id in app queries (or use RLS below).

CREATE TABLE contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id   CHAR(24),
  tenant_id  UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT           NOT NULL,
  email      TEXT           NOT NULL,
  phone      TEXT           NOT NULL DEFAULT '',
  city       TEXT           NOT NULL DEFAULT '',
  status     contact_status NOT NULL DEFAULT 'Lead',
  added_by   UUID           REFERENCES users(id) ON DELETE SET NULL,
  is_seed_data BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mongo_id)
);
CREATE INDEX contacts_tenant_email_idx  ON contacts (tenant_id, lower(email));
CREATE INDEX contacts_status_created_idx ON contacts (tenant_id, status, created_at DESC);
CREATE INDEX contacts_city_status_idx    ON contacts (tenant_id, city, status);

CREATE TABLE contact_lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id     CHAR(24),
  tenant_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  color        TEXT        NOT NULL DEFAULT '#2563eb',
  created_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  is_seed_data BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mongo_id)
);
CREATE INDEX contact_lists_search_idx ON contact_lists
  USING gin (to_tsvector('simple', name || ' ' || description));

-- ContactList.contacts[]
CREATE TABLE contact_list_members (
  contact_list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts(id)      ON DELETE CASCADE,
  position        INTEGER NOT NULL DEFAULT 0,          -- preserves array order
  PRIMARY KEY (contact_list_id, contact_id)
);
CREATE INDEX contact_list_members_contact_idx ON contact_list_members (contact_id);

CREATE TABLE templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id      CHAR(24),
  tenant_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  subject       TEXT        NOT NULL DEFAULT '',
  template_type TEXT        NOT NULL DEFAULT 'newsletter',
  background    TEXT        NOT NULL DEFAULT '#f8fafc',
  accent_color  TEXT        NOT NULL DEFAULT '#2563eb',
  custom_logo   TEXT        NOT NULL DEFAULT '',        -- may hold a base64 data URI
  html_content  TEXT        NOT NULL DEFAULT '',
  text_content  TEXT        NOT NULL DEFAULT '',
  created_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mongo_id)
);
CREATE INDEX templates_creator_idx ON templates (created_by, updated_at DESC);
CREATE INDEX templates_search_idx  ON templates
  USING gin (to_tsvector('simple', name || ' ' || subject || ' ' || template_type));

-- Template.blocks[] (embedded subdocuments, no _id)
CREATE TABLE template_blocks (
  template_id UUID        NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  position    INTEGER     NOT NULL,
  type        block_type  NOT NULL DEFAULT 'text',
  content     TEXT        NOT NULL DEFAULT '',
  url         TEXT        NOT NULL DEFAULT '',
  image_data  TEXT        NOT NULL DEFAULT '',          -- base64 image, can be large
  height      TEXT        NOT NULL DEFAULT '',
  align       block_align NOT NULL DEFAULT 'left',
  PRIMARY KEY (template_id, position)
);

CREATE TABLE campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id          CHAR(24),
  tenant_id         UUID                 NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT                 NOT NULL,
  subject           TEXT                 NOT NULL,
  content           TEXT                 NOT NULL DEFAULT '',
  html_content      TEXT                 NOT NULL DEFAULT '',
  text_content      TEXT                 NOT NULL DEFAULT '',
  template_id       UUID                 REFERENCES templates(id)     ON DELETE SET NULL,
  template_name     TEXT                 NOT NULL DEFAULT '',
  contact_list_id   UUID                 REFERENCES contact_lists(id) ON DELETE SET NULL,
  contact_list_name TEXT                 NOT NULL DEFAULT '',
  send_status       campaign_send_status NOT NULL DEFAULT 'pending',
  send_error        TEXT                 NOT NULL DEFAULT '',
  status            campaign_status      NOT NULL DEFAULT 'Running',
  emails_sent       INTEGER              NOT NULL DEFAULT 0 CHECK (emails_sent >= 0),
  delivered         INTEGER              NOT NULL DEFAULT 0 CHECK (delivered  >= 0),
  opened            INTEGER              NOT NULL DEFAULT 0 CHECK (opened     >= 0),
  clicked           INTEGER              NOT NULL DEFAULT 0 CHECK (clicked    >= 0),
  created_by        UUID                 REFERENCES users(id) ON DELETE SET NULL,
  scheduled_for     TIMESTAMPTZ,
  tracking_base_url TEXT                 NOT NULL DEFAULT '',
  is_seed_data      BOOLEAN              NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ          NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ          NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mongo_id)
);
CREATE INDEX campaigns_created_status_idx ON campaigns (tenant_id, created_at DESC, status);
CREATE INDEX campaigns_send_status_idx    ON campaigns (tenant_id, send_status, created_at DESC);
CREATE INDEX campaigns_creator_idx        ON campaigns (created_by, created_at DESC);
CREATE INDEX campaigns_search_idx         ON campaigns
  USING gin (to_tsvector('simple', name || ' ' || subject));

-- Campaign.recipients[] (plain list of email strings)
CREATE TABLE campaign_recipient_emails (
  campaign_id UUID    NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  email       TEXT    NOT NULL,
  PRIMARY KEY (campaign_id, position)
);

CREATE TABLE campaign_recipients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id            CHAR(24),
  tenant_id           UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id         UUID             NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email               TEXT             NOT NULL,
  token               TEXT             NOT NULL UNIQUE,   -- tracking token (global lookup)
  status              recipient_status NOT NULL DEFAULT 'pending',
  provider_message_id TEXT             NOT NULL DEFAULT '',
  error               TEXT             NOT NULL DEFAULT '',
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  opened_at           TIMESTAMPTZ,
  clicked_at          TIMESTAMPTZ,
  bounced_at          TIMESTAMPTZ,
  opens               INTEGER          NOT NULL DEFAULT 0 CHECK (opens  >= 0),
  clicks              INTEGER          NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  last_event_at       TIMESTAMPTZ,
  last_user_agent     TEXT             NOT NULL DEFAULT '',
  last_ip             TEXT             NOT NULL DEFAULT '',
  last_clicked_url    TEXT             NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ      NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mongo_id)
);
CREATE UNIQUE INDEX campaign_recipients_campaign_email_key
  ON campaign_recipients (campaign_id, lower(email));
CREATE INDEX campaign_recipients_status_idx  ON campaign_recipients (campaign_id, status);
CREATE INDEX campaign_recipients_opened_idx  ON campaign_recipients (campaign_id, opened_at);
CREATE INDEX campaign_recipients_clicked_idx ON campaign_recipients (campaign_id, clicked_at);

CREATE TABLE email_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id            CHAR(24),
  tenant_id           UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id         UUID             NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  subject             TEXT             NOT NULL,
  html_content        TEXT             NOT NULL,
  text_content        TEXT             NOT NULL,
  status              email_log_status NOT NULL,
  provider_message_id TEXT             NOT NULL DEFAULT '',
  error               TEXT             NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ      NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mongo_id)
);
CREATE INDEX email_logs_campaign_idx ON email_logs (campaign_id, created_at DESC);

-- EmailLog.recipients[]
CREATE TABLE email_log_recipients (
  email_log_id UUID    NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,
  email        TEXT    NOT NULL,
  PRIMARY KEY (email_log_id, position)
);

CREATE TABLE sms_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id            CHAR(24),
  tenant_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id          UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  phone               TEXT        NOT NULL,
  message             TEXT        NOT NULL,
  status              sms_status  NOT NULL DEFAULT 'sent',
  provider            TEXT        NOT NULL DEFAULT 'mock',
  provider_message_id TEXT        NOT NULL DEFAULT '',
  error               TEXT        NOT NULL DEFAULT '',
  sent_by             UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mongo_id)
);
CREATE INDEX sms_logs_tenant_created_idx ON sms_logs (tenant_id, created_at DESC);

CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id     CHAR(24),
  tenant_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         notification_type NOT NULL DEFAULT 'system',
  title        TEXT              NOT NULL,
  "desc"       TEXT              NOT NULL,
  time         TEXT              NOT NULL DEFAULT 'Just now',
  read         BOOLEAN           NOT NULL DEFAULT FALSE,
  is_read      BOOLEAN           NOT NULL DEFAULT FALSE,
  recipient_id UUID              REFERENCES users(id) ON DELETE SET NULL,
  is_seed_data BOOLEAN           NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mongo_id)
);
CREATE INDEX notifications_recipient_idx ON notifications (tenant_id, recipient_id, created_at DESC);
CREATE INDEX notifications_search_idx    ON notifications
  USING gin (to_tsvector('simple', title || ' ' || "desc"));

CREATE TABLE automations (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id                      CHAR(24),
  tenant_id                     UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                          TEXT               NOT NULL,
  trigger                       automation_trigger NOT NULL,
  condition                     TEXT               NOT NULL DEFAULT 'Immediately',
  action                        automation_action  NOT NULL,
  folder                        TEXT               NOT NULL DEFAULT 'All Contacts',
  active                        BOOLEAN            NOT NULL DEFAULT TRUE,
  runs                          INTEGER            NOT NULL DEFAULT 0,
  last_triggered_at             TIMESTAMPTZ,
  last_triggered_contact_name   TEXT               NOT NULL DEFAULT '',
  last_triggered_contact_email  TEXT               NOT NULL DEFAULT '',
  last_result                   TEXT               NOT NULL DEFAULT '',
  created_by                    UUID               REFERENCES users(id) ON DELETE SET NULL,
  is_seed_data                  BOOLEAN            NOT NULL DEFAULT FALSE,
  created_at                    TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ        NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mongo_id)
);
CREATE INDEX automations_tenant_active_idx ON automations (tenant_id, active);

-- Automation.firedForContacts[] : "don't fire twice for the same contact"
CREATE TABLE automation_fired_contacts (
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  contact_id    UUID NOT NULL REFERENCES contacts(id)    ON DELETE CASCADE,
  PRIMARY KEY (automation_id, contact_id)
);

CREATE TABLE automation_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id      CHAR(24),
  tenant_id     UUID        NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  automation_id UUID        NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  contact_id    UUID        NOT NULL REFERENCES contacts(id)    ON DELETE CASCADE,
  due_at        TIMESTAMPTZ NOT NULL,
  status        task_status NOT NULL DEFAULT 'pending',
  result        TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mongo_id),
  UNIQUE (automation_id, contact_id)
);
CREATE INDEX automation_tasks_due_idx    ON automation_tasks (due_at);
CREATE INDEX automation_tasks_status_idx ON automation_tasks (status);

-- ============================================================ TRIGGERS
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','payments','activity_logs','contacts','contact_lists','templates',
    'campaigns','campaign_recipients','email_logs','sms_logs','notifications',
    'automations','automation_tasks'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t || '_set_updated_at', t);
  END LOOP;
END $$;

-- ===================================================== ROW LEVEL SECURITY
-- Optional but recommended: replaces the "one database per user" isolation.
-- Usage per request/transaction:  SET LOCAL app.tenant_id = '<user uuid>';
-- Enable by running db/postgres/enable_rls.sql after migrating data
-- (kept out of this file so the migration can run as a privileged role).

COMMIT;
