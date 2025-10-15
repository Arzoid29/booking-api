Overview

Booking API with:

Google Sign-In (Google ID Token → API-issued JWT)

Bookings CRUD (create, list mine, delete)

Overlap checks: DB + Google Calendar (readonly)

SQLite + Prisma

Requirements

Node 18+

PNPM (or npm)

Google Cloud project with OAuth 2.0 (Web)

Quick start
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
cp .env.example .env   # fill in credentials
pnpm start:dev         # http://localhost:4000

.env example
DATABASE_URL="file:./dev.db"

JWT_SECRET="put_a_long_random_secret_here"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:4000/calendar/callback"

Google Cloud setup (required)

OAuth consent screen → External (Testing); add your login email to Test users.

Enable: Google Calendar API.

Credentials → OAuth client (Web)

Authorized redirect URIs: http://localhost:4000/calendar/callback

(Optional) JS origins: http://localhost:3000, http://localhost:4000

Put Client ID/Secret into .env.

Data model (Prisma)
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  googleSub    String?   @unique
  gcalAccess   String?
  gcalRefresh  String?
  gcalExpiry   DateTime?
  bookings     Booking[]
  createdAt    DateTime  @default(now())
}

model Booking {
  id        String   @id @default(cuid())
  userId    String
  title     String
  startAt   DateTime
  endAt     DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])

  @@index([userId, startAt, endAt])
}

Authentication flow

Frontend obtains a Google ID Token (Google widget).

Frontend POST /auth/google with { idToken }.

API verifies with Google, upserts user, returns JWT.

Frontend sends Authorization: Bearer <JWT> to protected endpoints.

API Endpoints
Auth
POST /auth/google

Exchange a Google ID Token for the API JWT.

Auth: Public

Body

{ "idToken": "GOOGLE_ID_TOKEN" }


200 OK

{
  "token": "API_JWT",
  "user": { "id": "…", "email": "user@gmail.com", "name": "User" }
}


401 Unauthorized – invalid Google token

cURL

curl -X POST http://localhost:4000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<GOOGLE_ID_TOKEN>"}'

Google Calendar
GET /calendar/status

Returns whether the current user has Google Calendar connected.

Auth: Bearer JWT

200 OK

{ "connected": true }


cURL

curl http://localhost:4000/calendar/status \
  -H "Authorization: Bearer <JWT>"

GET /calendar/connect

Returns the Google OAuth consent URL.

Auth: Bearer JWT

200 OK

{ "url": "https://accounts.google.com/o/oauth2/v2/auth?..." }


cURL

curl http://localhost:4000/calendar/connect \
  -H "Authorization: Bearer <JWT>"

GET /calendar/callback?code=...&state=...

Google redirects here after consent; API exchanges the code for tokens and stores them.

Auth: Public (called by Google)

200 OK: Plain text Calendar connected. You can close this tab.

400/401: invalid code/state

POST /calendar/disconnect (optional)

Clears stored Google tokens (disconnect).

Auth: Bearer JWT

200 OK

{ "ok": true }


cURL

curl -X POST http://localhost:4000/calendar/disconnect \
  -H "Authorization: Bearer <JWT>"

Bookings

Notes:

Server stores and expects UTC ISO strings.

Overlap rules:

Rejects if an existing booking overlaps (startAt < end && endAt > start) for the same user.

Also checks Google Calendar events in [startAt, endAt] if connected.

GET /bookings/me

List all bookings for the current user.

Auth: Bearer JWT

200 OK

[
  {
    "id": "…",
    "title": "Demo",
    "startAt": "2025-10-20T10:00:00.000Z",
    "endAt":   "2025-10-20T11:00:00.000Z",
    "createdAt": "2025-10-01T12:00:00.000Z"
  }
]


cURL

curl http://localhost:4000/bookings/me \
  -H "Authorization: Bearer <JWT>"

POST /bookings

Create a booking.

Auth: Bearer JWT

Body

{
  "title": "Meeting",
  "startAt": "2025-10-20T10:00:00.000Z",
  "endAt":   "2025-10-20T11:00:00.000Z"
}


201 Created: returns created booking (JSON)

409 Conflict: overlaps DB booking or Google Calendar event

400 Bad Request: invalid range (e.g., endAt <= startAt)

cURL

curl -X POST http://localhost:4000/bookings \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"title":"Demo","startAt":"2025-10-20T10:00:00.000Z","endAt":"2025-10-20T11:00:00.000Z"}'

DELETE /bookings/:id

Hard delete a booking (permanently removes it).

Auth: Bearer JWT

200 OK

{ "ok": true }


404 Not Found: booking does not exist

403 Forbidden: booking belongs to another user