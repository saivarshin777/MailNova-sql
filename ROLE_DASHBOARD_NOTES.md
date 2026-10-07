# MailNova Role Dashboards

This build separates the dashboards by role and keeps the final MailNova navy/teal theme across all dashboards.

## Login Routing

- `Admin` logs into `/admin`.
- `User` and `Manager` log into `/dashboard`.
- `Lead` and `Viewer` log into `/lead-dashboard`.
- New registrations default to `User`, unless the email is already saved as a `Lead` contact. Lead-contact emails are routed to `/lead-dashboard`.

## Owner Account

- Protected owner admin: `Varshini P`.
- Owner login email comes from `OWNER_EMAIL` or `EMAIL_USER`; password comes from `SEED_ADMIN_PASSWORD`.
- The older seeded `MailNova User` and `MailNova Lead` accounts are no longer created on fresh databases.
- Lead contacts can be promoted into Lead dashboard users. For local testing, auto-created lead accounts use `LEAD_DEFAULT_PASSWORD` or `Lead@12345`.

For demo/local use, the OTP is shown in the login alert and filled into the OTP input automatically. In mock email mode, it is also printed in the backend terminal. Set `HIDE_DEV_OTP=true` only when you want to hide that demo OTP behavior.

The owner account is refreshed on backend startup so Varshini P stays protected as Admin.

## Dashboard Difference

- Admin dashboard is the control room: users, roles, account status, plans, global monitoring, system logs, security, platform settings, and global campaign operations.
- User dashboard is a normal workspace: live campaigns, campaign builder, contact add/import/export/delete, professional template builder with image/logo uploads, automation workflow builder, analytics graphs, notifications, profile/settings, and plan usage.
- Lead dashboard is focused on assigned leads: lead list, follow-up queue, lead analytics, campaign influence signals, notifications, and profile.

## Access Rules

- Admin-only frontend routes are guarded.
- `/api/admin/*` is backend-protected by the `Admin` role.
- Only Varshini P can grant or retrieve `Admin` rights from other accounts.
- Other admins cannot demote, suspend, or modify the protected owner account.
- Suspended accounts are blocked during login and on protected API requests.
- Campaigns, dashboard analytics, contacts, and editable templates are scoped so normal users work with their own records while Admin/Manager accounts can view global operational data.

## Live Tracking And Template Images

- New campaign emails create recipient-level tracking records. Each recipient gets a unique open pixel and tracked links, so analytics can show who read/opened and who clicked.
- Click tracking also marks that recipient as opened/read, because a click proves the recipient opened the email even if the mailbox blocks the tracking pixel.
- Gmail and other webmail clients cannot reach `localhost` from their servers. For real Gmail open-rate testing, expose the backend with a deployed URL or tunnel and set `TRACKING_BASE_URL=https://your-public-backend-url`, then restart the backend and send a new campaign.
- Already-sent campaigns do not get retroactive tracking pixels or rewritten links. Send a new campaign after this update.
- Uploaded template photos/logos are compressed in the browser, then converted from browser `data:` images into inline email attachments during send, so Gmail can display them instead of showing the placeholder area.
- Campaigns, top performers, and analytics show read/open and unread email counts, with read-vs-unread charts and recipient-level tables fed from backend campaign data.
- Lead dashboard now loads assigned leads, follow-ups, notifications, and campaign engagement signals from `/api/lead`.
- Analytics date filters call the backend with a real range parameter instead of only changing the visible label.
- Admin can assign Free, Pro, and Enterprise plans. Send/contact limits are enforced for non-admin users.
- Delivery webhook support exists at `/api/track/delivery` for bounce/delivered events. Set `DELIVERY_WEBHOOK_SECRET` before connecting a real provider.
- Dashboard notification cards show read and unread notification counts for both Admin and User workspaces.

## Automations (Admin + User dashboards) - v2, fully live

All four triggers now fire for real, backed by a real scheduler:

- **New contact added** - fires synchronously when a contact is created or
  bulk-imported (capped at the first 25 contacts per import batch).
- **Clicked link** - fires the moment a real click on a tracked campaign
  link comes in, resolved to the correct tenant via the tracking URL.
- **Campaign not opened** and **Contact becomes inactive** - checked every 5
  minutes by a background scheduler (`automationScheduler.js`) that sweeps
  every user's data in their own tenant context, the same pattern already
  used for the rate-limiter cleanup.
- **"Wait 24/48 hours" conditions are real now**, not cosmetic. A workflow
  with a wait condition creates a scheduled `AutomationTask` instead of
  firing instantly, and the same 5-minute sweep processes anything whose
  wait window has elapsed. "Immediately" and the two non-time conditions
  still fire right away.

**New workflow management:** edit an existing workflow in place (no more
delete-and-recreate), search/filter the workflow list, and each card now
shows when it last ran, for which contact, and the actual result (e.g.
"Welcome email sent to jane@x.com" or a failure reason like "SMTP not
configured") - so you can verify it's really working instead of trusting a
bare number.

**Still out of scope** (bigger, separate features if ever needed):
multi-step workflows (trigger -> multiple chained actions), and folding
automation-sent emails into the existing campaign open/click analytics as
their own tracked category.

