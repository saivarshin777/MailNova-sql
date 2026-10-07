# Backend Setup

This backend stores dashboard data, users, contacts, campaigns, notifications, OTPs, and email logs in a **SQL database (SQLite)**.
It sends login OTP emails, password reset emails, and campaign emails through SMTP. It can also send SMS to contacts through an SMS provider. Campaign and SMS send results are stored in the database.

## Run it

```bash
# 1. Install backend dependencies (project root)
npm install

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Start the backend  -> http://localhost:5000
npm run backend

# 4. Start the frontend (new terminal) -> http://localhost:5173
npm run frontend
```

No database server is needed. The SQLite database file is created automatically at `backend/data/mailnova.sqlite`
(change it with `SQLITE_PATH` in `backend/.env`; `:memory:` gives a throw-away database).
Node 22.5+ uses its built-in `node:sqlite`; older Node versions (18/20) use `better-sqlite3` (installed by `npm install`).

All settings (SMTP, Razorpay, OWNER_EMAIL, ...) are in `backend/.env`, which is already included.

Reference of the `.env` keys:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
SQLITE_PATH=./data/mailnova.sqlite
JWT_SECRET=change_this_to_a_long_random_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Mail Nova <your_email@gmail.com>
TRACKING_BASE_URL=http://localhost:5000
DELIVERY_WEBHOOK_SECRET=change_this_if_you_enable_delivery_webhooks
CAMPAIGN_DEFAULT_RECIPIENTS=
USE_CAMPAIGN_DEFAULT_RECIPIENTS=false
AUTH_EMAIL_DELIVERY=false
SMS_PROVIDER=mock
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
FAST2SMS_API_KEY=
FAST2SMS_ROUTE=q
```

## How the database layer works

- `backend/db/` is a small SQL model layer (`orm.js`) that keeps the same API the code used before
  (`Model.find().sort().lean()`, `doc.save()`, `populate`, `$or/$in/$regex`, ...). Controllers, routes and services are unchanged.
- `backend/models/*.js` define each table. Tables and missing columns are created automatically on start.
- The old "one database per user" design is now a `tenant_id` column on every per-user table; the auth middleware sets the current tenant exactly as before.
- OTPs still expire after 5 minutes (expired rows are purged on every OTP query).
- Search (`?q=` / `?search=`) is a case-insensitive "contains" match (it is no longer interpreted as a regular expression).
- `npm test` runs the database-layer tests.

### Moving existing MongoDB data

Only needed if you already have data in MongoDB:

```bash
npm install mongodb --no-save
MONGO_URI="mongodb://127.0.0.1:27017/mailnova" npm run migrate:mongo
```

It keeps the original ids and timestamps, can be re-run safely, and lists any documents it could not copy.

### PostgreSQL / MySQL

Ready-made PostgreSQL and MySQL schemas are in `backend/sql/` for reference or a future move to a server database.
The running app uses SQLite; switching it to PostgreSQL/MySQL would mean adding a driver for `backend/db/driver.js` and `orm.js`.

For Gmail, `EMAIL_PASS` must be a Gmail App Password, not your normal Gmail password.
Campaign sends now require a selected contact folder or typed recipients. `CAMPAIGN_DEFAULT_RECIPIENTS` is ignored unless `USE_CAMPAIGN_DEFAULT_RECIPIENTS=true`.
Login OTP emails are skipped when `AUTH_EMAIL_DELIVERY=false`; local login responses include a `devOtp` unless `HIDE_DEV_OTP=true`.

Campaign open/click analytics are tracked through unique recipient URLs. Local `localhost` links work only for browser-side testing; Gmail's image proxy cannot fetch your local machine. Clicks also count as opened/read emails, because a click proves the message was opened. For real Gmail open-rate tracking from the open pixel, expose the backend with a tunnel or deployment, set `TRACKING_BASE_URL` to that public backend URL, restart the backend, and send a new campaign.

Uploaded template photos and logos are compressed in the browser and converted into inline email attachments while sending campaigns, so Gmail can display them.

Recipient-level details are stored in `CampaignRecipient`. Delivery/bounce webhook events can be sent to:

```text
POST /api/track/delivery
```

If `DELIVERY_WEBHOOK_SECRET` is configured, include it as the `x-mailnova-webhook-secret` header.

For SMS testing, keep `SMS_PROVIDER=mock`; messages will be printed in the backend terminal and saved in the SQL database.
For real SMS, set either:

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_sender_number
```

or:

```env
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your_fast2sms_api_key
FAST2SMS_ROUTE=q
```

Contact routes are protected with the login JWT token:

```text
GET    /api/contacts
GET    /api/contacts?search=name
POST   /api/contacts
PUT    /api/contacts/:id
DELETE /api/contacts/:id
GET    /api/contacts/stats
POST   /api/contacts/:id/sms
POST   /api/contacts/sms
```
