-- Optional: Row Level Security to replace "one Mongo database per user".
-- Run AFTER the data migration, then connect the app as a NON-superuser role
-- that does not own the tables (owners/superusers bypass RLS unless FORCEd).
--
-- In the app, at the start of every request transaction:
--   BEGIN;
--   SELECT set_config('app.tenant_id', '<user uuid>', true);   -- true = LOCAL
--   ... queries ...
--   COMMIT;
-- Background jobs (campaign worker, automation scheduler) loop over users and
-- set app.tenant_id per user, mirroring runGlobally() in config/tenantDb.js.
-- Public tracking endpoints (open pixel / click redirect) get the tenant from
-- the URL's userId, exactly like trackingController.runInTenantContext.

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'contacts','contact_lists','templates','campaigns','campaign_recipients',
    'email_logs','sms_logs','notifications','automations','automation_tasks'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING      (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)
         WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)', t);
  END LOOP;
END $$;
