-- MailNova: MySQL 8.0+ schema (converted from MongoDB / Mongoose models)
-- Same structure as postgres/schema.sql. See that file for the design notes.
--
-- Differences from the PostgreSQL version:
--   * UUIDs are CHAR(36) (generate in the app with crypto.randomUUID()).
--   * ENUMs are inline column types.
--   * Emails use utf8mb4_0900_ai_ci (case-insensitive), so plain UNIQUE works.
--   * updated_at uses ON UPDATE CURRENT_TIMESTAMP(3) instead of a trigger.
--   * Full-text search uses FULLTEXT indexes (MATCH ... AGAINST).
--   * OTP expiry: use the scheduled event at the bottom (needs event_scheduler=ON).
--   * Row Level Security does not exist in MySQL: always filter on tenant_id.
--   * Large base64 payloads (template images/logos) need max_allowed_packet >= 64M.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================================ GLOBAL
CREATE TABLE users (
  id                    CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id              CHAR(24)     NULL UNIQUE,
  name                  VARCHAR(255) NOT NULL,
  email                 VARCHAR(255) NOT NULL,
  password              VARCHAR(255) NOT NULL,
  phone                 VARCHAR(50)  NOT NULL DEFAULT '',
  sender_name           VARCHAR(255) NOT NULL DEFAULT 'MailNova Workspace',
  reply_to              VARCHAR(255) NOT NULL DEFAULT '',
  role                  ENUM('Admin','Manager','User','Lead','Viewer') NOT NULL DEFAULT 'User',
  is_owner              TINYINT(1)   NOT NULL DEFAULT 0,
  status                ENUM('Active','Suspended') NOT NULL DEFAULT 'Active',
  plan_name             ENUM('Free','Pro','Enterprise') NOT NULL DEFAULT 'Free',
  plan_send_limit       INT          NOT NULL DEFAULT 5000,
  plan_contact_limit    INT          NOT NULL DEFAULT 1000,
  plan_billing_status   ENUM('Trial','Active','Contract','Past Due') NOT NULL DEFAULT 'Trial',
  last_login            DATETIME(3)  NULL,
  login_count           INT          NOT NULL DEFAULT 0,
  work_done_at_login    JSON         NULL,
  reset_password_token  VARCHAR(255) NULL,
  reset_password_expire DATETIME(3)  NULL,
  created_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY users_email_key (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE otps (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  otp        VARCHAR(255) NOT NULL,
  attempts   INT          NOT NULL DEFAULT 0,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3)  NOT NULL DEFAULT (CURRENT_TIMESTAMP(3) + INTERVAL 300 SECOND),
  KEY otps_email_idx (email),
  KEY otps_expires_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE payments (
  id                  CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id            CHAR(24)     NULL UNIQUE,
  user_id             CHAR(36)     NOT NULL,
  plan_name           ENUM('Free','Pro','Enterprise') NOT NULL,
  amount              BIGINT       NOT NULL COMMENT 'in paise',
  currency            VARCHAR(10)  NOT NULL DEFAULT 'INR',
  razorpay_order_id   VARCHAR(255) NOT NULL,
  razorpay_payment_id VARCHAR(255) NULL,
  razorpay_signature  VARCHAR(255) NULL,
  status              ENUM('created','paid','failed','refunded') NOT NULL DEFAULT 'created',
  failure_reason      TEXT         NULL,
  created_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY payments_order_key (razorpay_order_id),
  KEY payments_user_idx (user_id),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE payment_webhook_events (
  payment_id CHAR(36)     NOT NULL,
  event_id   VARCHAR(255) NOT NULL,
  PRIMARY KEY (payment_id, event_id),
  CONSTRAINT fk_pwe_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE activity_logs (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id    CHAR(24)     NULL UNIQUE,
  action      VARCHAR(255) NOT NULL,
  entity_type VARCHAR(255) NOT NULL,
  entity_id   VARCHAR(64)  NULL,
  message     TEXT         NOT NULL,
  actor_id    CHAR(36)     NULL,
  metadata    JSON         NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY activity_logs_created_idx (created_at),
  KEY activity_logs_entity_idx (entity_type, entity_id),
  KEY activity_logs_actor_idx (actor_id, created_at),
  CONSTRAINT fk_activity_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================ TENANT
CREATE TABLE contacts (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id     CHAR(24)     NULL,
  tenant_id    CHAR(36)     NOT NULL,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  phone        VARCHAR(50)  NOT NULL DEFAULT '',
  city         VARCHAR(255) NOT NULL DEFAULT '',
  status       ENUM('Lead','Prospect','Customer','Inactive') NOT NULL DEFAULT 'Lead',
  added_by     CHAR(36)     NULL,
  is_seed_data TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY contacts_tenant_mongo_key (tenant_id, mongo_id),
  KEY contacts_tenant_email_idx (tenant_id, email),
  KEY contacts_status_created_idx (tenant_id, status, created_at),
  KEY contacts_city_status_idx (tenant_id, city, status),
  CONSTRAINT fk_contacts_tenant FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_contacts_added_by FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE contact_lists (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id     CHAR(24)     NULL,
  tenant_id    CHAR(36)     NOT NULL,
  name         VARCHAR(255) NOT NULL,
  description  TEXT         NOT NULL,
  color        VARCHAR(20)  NOT NULL DEFAULT '#2563eb',
  created_by   CHAR(36)     NULL,
  is_seed_data TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY contact_lists_tenant_mongo_key (tenant_id, mongo_id),
  FULLTEXT KEY contact_lists_search_idx (name, description),
  CONSTRAINT fk_lists_tenant FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lists_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE contact_list_members (
  contact_list_id CHAR(36) NOT NULL,
  contact_id      CHAR(36) NOT NULL,
  position        INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (contact_list_id, contact_id),
  KEY contact_list_members_contact_idx (contact_id),
  CONSTRAINT fk_clm_list    FOREIGN KEY (contact_list_id) REFERENCES contact_lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_clm_contact FOREIGN KEY (contact_id)      REFERENCES contacts(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE templates (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id      CHAR(24)     NULL,
  tenant_id     CHAR(36)     NOT NULL,
  name          VARCHAR(255) NOT NULL,
  subject       VARCHAR(500) NOT NULL DEFAULT '',
  template_type VARCHAR(100) NOT NULL DEFAULT 'newsletter',
  background    VARCHAR(50)  NOT NULL DEFAULT '#f8fafc',
  accent_color  VARCHAR(50)  NOT NULL DEFAULT '#2563eb',
  custom_logo   LONGTEXT     NOT NULL,
  html_content  LONGTEXT     NOT NULL,
  text_content  LONGTEXT     NOT NULL,
  created_by    CHAR(36)     NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY templates_tenant_mongo_key (tenant_id, mongo_id),
  KEY templates_creator_idx (created_by, updated_at),
  FULLTEXT KEY templates_search_idx (name, subject, template_type),
  CONSTRAINT fk_templates_tenant  FOREIGN KEY (tenant_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_templates_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE template_blocks (
  template_id CHAR(36) NOT NULL,
  position    INT      NOT NULL,
  type        ENUM('heading','text','button','image','divider','header','paragraph',
                   'list','image_placeholder','spacer','quote') NOT NULL DEFAULT 'text',
  content     LONGTEXT NOT NULL,
  url         TEXT     NOT NULL,
  image_data  LONGTEXT NOT NULL,
  height      VARCHAR(50) NOT NULL DEFAULT '',
  align       ENUM('left','center','right') NOT NULL DEFAULT 'left',
  PRIMARY KEY (template_id, position),
  CONSTRAINT fk_blocks_template FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE campaigns (
  id                CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id          CHAR(24)     NULL,
  tenant_id         CHAR(36)     NOT NULL,
  name              VARCHAR(255) NOT NULL,
  subject           VARCHAR(500) NOT NULL,
  content           LONGTEXT     NOT NULL,
  html_content      LONGTEXT     NOT NULL,
  text_content      LONGTEXT     NOT NULL,
  template_id       CHAR(36)     NULL,
  template_name     VARCHAR(255) NOT NULL DEFAULT '',
  contact_list_id   CHAR(36)     NULL,
  contact_list_name VARCHAR(255) NOT NULL DEFAULT '',
  send_status       ENUM('draft','pending','sending','sent','failed') NOT NULL DEFAULT 'pending',
  send_error        TEXT         NOT NULL,
  status            ENUM('Active','Completed','Running','Draft','Scheduled','Failed') NOT NULL DEFAULT 'Running',
  emails_sent       INT UNSIGNED NOT NULL DEFAULT 0,
  delivered         INT UNSIGNED NOT NULL DEFAULT 0,
  opened            INT UNSIGNED NOT NULL DEFAULT 0,
  clicked           INT UNSIGNED NOT NULL DEFAULT 0,
  created_by        CHAR(36)     NULL,
  scheduled_for     DATETIME(3)  NULL,
  tracking_base_url VARCHAR(500) NOT NULL DEFAULT '',
  is_seed_data      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY campaigns_tenant_mongo_key (tenant_id, mongo_id),
  KEY campaigns_created_status_idx (tenant_id, created_at, status),
  KEY campaigns_send_status_idx (tenant_id, send_status, created_at),
  KEY campaigns_creator_idx (created_by, created_at),
  FULLTEXT KEY campaigns_search_idx (name, subject),
  CONSTRAINT fk_campaigns_tenant   FOREIGN KEY (tenant_id)       REFERENCES users(id)         ON DELETE CASCADE,
  CONSTRAINT fk_campaigns_template FOREIGN KEY (template_id)     REFERENCES templates(id)     ON DELETE SET NULL,
  CONSTRAINT fk_campaigns_list     FOREIGN KEY (contact_list_id) REFERENCES contact_lists(id) ON DELETE SET NULL,
  CONSTRAINT fk_campaigns_creator  FOREIGN KEY (created_by)      REFERENCES users(id)         ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE campaign_recipient_emails (
  campaign_id CHAR(36)     NOT NULL,
  position    INT          NOT NULL,
  email       VARCHAR(255) NOT NULL,
  PRIMARY KEY (campaign_id, position),
  CONSTRAINT fk_cre_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE campaign_recipients (
  id                  CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id            CHAR(24)     NULL,
  tenant_id           CHAR(36)     NOT NULL,
  campaign_id         CHAR(36)     NOT NULL,
  email               VARCHAR(255) NOT NULL,
  token               VARCHAR(255) NOT NULL,
  status              ENUM('pending','sent','failed','bounced','unsubscribed') NOT NULL DEFAULT 'pending',
  provider_message_id VARCHAR(255) NOT NULL DEFAULT '',
  error               TEXT         NOT NULL,
  sent_at             DATETIME(3)  NULL,
  delivered_at        DATETIME(3)  NULL,
  opened_at           DATETIME(3)  NULL,
  clicked_at          DATETIME(3)  NULL,
  bounced_at          DATETIME(3)  NULL,
  opens               INT UNSIGNED NOT NULL DEFAULT 0,
  clicks              INT UNSIGNED NOT NULL DEFAULT 0,
  last_event_at       DATETIME(3)  NULL,
  last_user_agent     TEXT         NOT NULL,
  last_ip             VARCHAR(100) NOT NULL DEFAULT '',
  last_clicked_url    TEXT         NOT NULL,
  created_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY campaign_recipients_token_key (token),
  UNIQUE KEY campaign_recipients_tenant_mongo_key (tenant_id, mongo_id),
  UNIQUE KEY campaign_recipients_campaign_email_key (campaign_id, email),
  KEY campaign_recipients_status_idx (campaign_id, status),
  KEY campaign_recipients_opened_idx (campaign_id, opened_at),
  KEY campaign_recipients_clicked_idx (campaign_id, clicked_at),
  CONSTRAINT fk_cr_tenant   FOREIGN KEY (tenant_id)   REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_cr_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE email_logs (
  id                  CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id            CHAR(24)     NULL,
  tenant_id           CHAR(36)     NOT NULL,
  campaign_id         CHAR(36)     NOT NULL,
  subject             VARCHAR(500) NOT NULL,
  html_content        LONGTEXT     NOT NULL,
  text_content        LONGTEXT     NOT NULL,
  status              ENUM('sent','failed') NOT NULL,
  provider_message_id VARCHAR(255) NOT NULL DEFAULT '',
  error               TEXT         NOT NULL,
  created_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY email_logs_tenant_mongo_key (tenant_id, mongo_id),
  KEY email_logs_campaign_idx (campaign_id, created_at),
  CONSTRAINT fk_el_tenant   FOREIGN KEY (tenant_id)   REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_el_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE email_log_recipients (
  email_log_id CHAR(36)     NOT NULL,
  position     INT          NOT NULL,
  email        VARCHAR(255) NOT NULL,
  PRIMARY KEY (email_log_id, position),
  CONSTRAINT fk_elr_log FOREIGN KEY (email_log_id) REFERENCES email_logs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sms_logs (
  id                  CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id            CHAR(24)     NULL,
  tenant_id           CHAR(36)     NOT NULL,
  contact_id          CHAR(36)     NULL,
  phone               VARCHAR(50)  NOT NULL,
  message             TEXT         NOT NULL,
  status              ENUM('sent','failed','mock') NOT NULL DEFAULT 'sent',
  provider            VARCHAR(100) NOT NULL DEFAULT 'mock',
  provider_message_id VARCHAR(255) NOT NULL DEFAULT '',
  error               TEXT         NOT NULL,
  sent_by             CHAR(36)     NULL,
  created_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY sms_logs_tenant_mongo_key (tenant_id, mongo_id),
  KEY sms_logs_tenant_created_idx (tenant_id, created_at),
  CONSTRAINT fk_sms_tenant  FOREIGN KEY (tenant_id)  REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_sms_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_sms_sent_by FOREIGN KEY (sent_by)    REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE notifications (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id     CHAR(24)     NULL,
  tenant_id    CHAR(36)     NOT NULL,
  type         ENUM('campaign','system','warning','growth','New Contact Message',
                    'Support Message','Lead Generated','System Alert') NOT NULL DEFAULT 'system',
  title        VARCHAR(500) NOT NULL,
  `desc`       TEXT         NOT NULL,
  time         VARCHAR(100) NOT NULL DEFAULT 'Just now',
  `read`       TINYINT(1)   NOT NULL DEFAULT 0,
  is_read      TINYINT(1)   NOT NULL DEFAULT 0,
  recipient_id CHAR(36)     NULL,
  is_seed_data TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY notifications_tenant_mongo_key (tenant_id, mongo_id),
  KEY notifications_recipient_idx (tenant_id, recipient_id, created_at),
  FULLTEXT KEY notifications_search_idx (title, `desc`),
  CONSTRAINT fk_notif_tenant    FOREIGN KEY (tenant_id)    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE automations (
  id                           CHAR(36)     NOT NULL PRIMARY KEY,
  mongo_id                     CHAR(24)     NULL,
  tenant_id                    CHAR(36)     NOT NULL,
  name                         VARCHAR(255) NOT NULL,
  `trigger`                    ENUM('New contact added','Campaign not opened','Clicked link',
                                    'Contact becomes inactive') NOT NULL,
  `condition`                  VARCHAR(255) NOT NULL DEFAULT 'Immediately',
  action                       ENUM('Send welcome email','Send follow-up campaign',
                                    'Move to interested folder','Notify manager') NOT NULL,
  folder                       VARCHAR(255) NOT NULL DEFAULT 'All Contacts',
  active                       TINYINT(1)   NOT NULL DEFAULT 1,
  runs                         INT          NOT NULL DEFAULT 0,
  last_triggered_at            DATETIME(3)  NULL,
  last_triggered_contact_name  VARCHAR(255) NOT NULL DEFAULT '',
  last_triggered_contact_email VARCHAR(255) NOT NULL DEFAULT '',
  last_result                  TEXT         NOT NULL,
  created_by                   CHAR(36)     NULL,
  is_seed_data                 TINYINT(1)   NOT NULL DEFAULT 0,
  created_at                   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at                   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY automations_tenant_mongo_key (tenant_id, mongo_id),
  KEY automations_tenant_active_idx (tenant_id, active),
  CONSTRAINT fk_auto_tenant  FOREIGN KEY (tenant_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_auto_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE automation_fired_contacts (
  automation_id CHAR(36) NOT NULL,
  contact_id    CHAR(36) NOT NULL,
  PRIMARY KEY (automation_id, contact_id),
  CONSTRAINT fk_afc_automation FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE,
  CONSTRAINT fk_afc_contact    FOREIGN KEY (contact_id)    REFERENCES contacts(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE automation_tasks (
  id            CHAR(36)    NOT NULL PRIMARY KEY,
  mongo_id      CHAR(24)    NULL,
  tenant_id     CHAR(36)    NOT NULL,
  automation_id CHAR(36)    NOT NULL,
  contact_id    CHAR(36)    NOT NULL,
  due_at        DATETIME(3) NOT NULL,
  status        ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
  result        TEXT        NOT NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY automation_tasks_tenant_mongo_key (tenant_id, mongo_id),
  UNIQUE KEY automation_tasks_pair_key (automation_id, contact_id),
  KEY automation_tasks_due_idx (due_at),
  KEY automation_tasks_status_idx (status),
  CONSTRAINT fk_at_tenant     FOREIGN KEY (tenant_id)     REFERENCES users(id)       ON DELETE CASCADE,
  CONSTRAINT fk_at_automation FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE,
  CONSTRAINT fk_at_contact    FOREIGN KEY (contact_id)    REFERENCES contacts(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Replacement for Mongo's TTL index on OTP.createdAt (needs event_scheduler=ON)
CREATE EVENT IF NOT EXISTS purge_expired_otps
  ON SCHEDULE EVERY 1 MINUTE
  DO DELETE FROM otps WHERE expires_at < CURRENT_TIMESTAMP(3);
