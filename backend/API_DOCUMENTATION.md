# MailNova Pro API

Base URL: `http://localhost:5000/api`

## Authentication

- `POST /auth/register` creates a user. New registrations default to the `User` role unless the email already exists as a `Lead` contact, in which case the account becomes `Lead`.
- `POST /auth/login` verifies email/password and sends an OTP.
- `POST /auth/verify-otp` returns a JWT token.

JWT payload includes `id`, `email`, `name`, and `role`. Suspended users are blocked during login and by protected API middleware.

Roles:

- `Admin`: full access.
- `Manager`: campaign, contacts, templates, analytics, and automation access.
- `User`: normal workspace access for own campaigns, contacts, templates, automations, analytics, notifications, and settings.
- `Lead`: assigned-lead workspace with follow-ups and read-only campaign insight signals.
- `Viewer`: read-only lead/reporting access.

Seed owner account:

- `Varshini P` is the protected owner admin.
- Owner email comes from `OWNER_EMAIL` or `EMAIL_USER`; local password comes from `SEED_ADMIN_PASSWORD`.
- Contacts saved with status `Lead` are synced to Lead dashboard access. If a Lead account must be auto-created for local testing, its temporary password defaults to `Lead@12345` unless `LEAD_DEFAULT_PASSWORD` is set.

For demo/local use, login and resend-OTP responses include `devOtp` unless `HIDE_DEV_OTP=true`.

## Campaigns

- `GET /campaigns` lists campaigns.
- `GET /campaigns/:campaignId/recipients` lists recipient-level delivery, read/open, and click state for a campaign.
- `POST /campaigns` creates a draft or sends a campaign.

`POST /campaigns` requires JWT, `Admin`, `Manager`, or `User`, validation, campaign rate limiting, and plan send-limit enforcement for non-admin users.

## Contacts

- `GET /contacts` lists contacts.
- `POST /contacts` creates a contact.
- `GET /contacts/lists` lists contact folders.
- `POST /contacts/lists` creates a contact folder.
- `POST /contacts/lists/:listId/contacts` adds contacts to a folder.
- `DELETE /contacts/lists/:listId/contacts` removes contacts from a folder.

Contact writes require JWT and enforce plan contact limits for non-admin users.

## SMS

- `POST /contacts/:id/sms` sends SMS to one contact.
- `POST /contacts/sms` sends SMS to filtered contacts.

SMS sends are role-gated and rate-limited.

## Templates

- `GET /templates` lists templates.
- `POST /templates` creates templates.
- `PUT /templates/:id` updates templates.
- `DELETE /templates/:id` deletes templates.

## Analytics And Dashboard

- `GET /dashboard` returns executive dashboard data.
- `GET /dashboard/analytics?range=Last%207%20Days` returns date-filtered analytics data.
- `GET /notifications` returns notifications.
- `PATCH /notifications/:id/read` marks one notification read.
- `PATCH /notifications/read-all` marks all notifications read.

## Lead Dashboard

- `GET /lead` returns assigned leads, follow-ups, campaign engagement signals, lead notifications, and lead summary metrics.

## Email Tracking

- `GET /track/open/:campaignId/:token.gif` records a recipient-level email open and returns a transparent tracking pixel.
- `GET /track/click/:campaignId/:token?url=https%3A%2F%2Fexample.com` records a recipient-level click and redirects to the original URL.
- `POST /track/delivery` records delivery webhooks such as `delivered` and `bounced`. If `DELIVERY_WEBHOOK_SECRET` is set, send it in `x-mailnova-webhook-secret`.

Tracking routes are intentionally public because mailbox clients must load them without a JWT. Click tracking also counts as an open/read because a click proves the recipient opened the email. For Gmail or any external mailbox to update open-rate analytics from the tracking pixel alone, `TRACKING_BASE_URL` must point to a public backend URL, not `localhost`.

## Activity Logs

- `GET /activity` returns the latest 100 activity logs.

Requires JWT and `Admin`.

## Admin Control APIs

All admin endpoints require JWT and the `Admin` role.

- `GET /admin/overview` returns user counts, role/status breakdowns, plan summaries, and monitoring metrics.
- `GET /admin/users` lists users without password/reset-token fields.
- `PATCH /admin/users/:id/role` changes a user role. Only the protected owner admin can grant or retrieve `Admin` rights.
- `PATCH /admin/users/:id/status` activates or suspends a user. The protected owner admin cannot be suspended, and only the owner can suspend or reactivate admins.
- `PATCH /admin/users/:id/plan` changes a user plan and applies backend send/contact limits.
- `GET /admin/logs` returns the latest audit/system log events.

## Production Notes

- Set a long random `JWT_SECRET`.
- Set `TRACKING_BASE_URL` to the public backend URL before sending real campaigns, for example `https://api.your-domain.com`.
- Set `DELIVERY_WEBHOOK_SECRET` before connecting a real delivery/bounce webhook provider.
- Use SendGrid, Mailgun, Amazon SES, or another transactional provider instead of Gmail for bulk production sending.
- `EMAIL_QUEUE_PROVIDER=inline` works locally. Replace the inline adapter in `services/emailQueueService.js` with BullMQ/Redis for large-volume production sending.
