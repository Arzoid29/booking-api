# Booking API with Google Calendar Integration --- [DeepWiki powered doc](https://deepwiki.com/Arzoid29/api/1-overview)

[![Language](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Framework](https://img.shields.io/badge/framework-NestJS-red.svg)](https://nestjs.com/)
[![Database](https://img.shields.io/badge/database-Prisma%20%7C%20postgress-lightgrey.svg)](https://www.prisma.io/)
[![Deployment](https://img.shields.io/badge/deployment-Docker-blue.svg)](https://www.docker.com/)

A robust API built with **NestJS** for managing user bookings, featuring secure authentication via Google and seamless integration with **Google Calendar** to prevent scheduling conflicts. It uses **Prisma** as its ORM to interact with a **postgress** database and is fully containerized for easy deployment with **Docker**.

## 📋 Table of Contents

1.  [Project Architecture](#-project-architecture)
2.  [Environment Setup](#-environment-setup)
3.  [Database Schema](#-database-schema)
4.  [Security (JWT Authentication)](#-security-jwt-authentication)
5.  [Deployment with Docker](#-deployment-with-docker)
6.  [API Endpoints](#-api-endpoints)
    * [App Module (Root)](#app-module-root)
    * [Auth Module](#auth-module)
    * [Bookings Module](#bookings-module)
    * [Calendar Module](#calendar-module)

---

## 🏛️ Project Architecture

The project follows a modular architecture, where each feature has a dedicated NestJS module with clear responsibilities:

* **`AppModule`**: The root module that imports and configures all other modules and global services.
* **`AuthModule`**: Handles user authentication. It validates a Google `idToken` to verify the user's identity and issues a **JSON Web Token (JWT)** to authorize subsequent requests.
* **`UsersModule`**: Manages business logic for users, such as creating or updating a user's profile after a successful Google sign-in (`upsertGoogleUser`).
* **`BookingsModule`**: Controls all booking-related logic (create, list, delete). It validates new bookings against existing ones in the database and against events in the user's Google Calendar to prevent conflicts.
* **`CalendarModule`**: Manages the integration with the Google Calendar API. It handles the **OAuth2** authorization flow to connect a user's Google account and access their calendar events.

---

## ⚙️ Environment Setup

To run the project locally, you need to create a `.env` file in the project's root directory. You can use the `.env.example` file as a template.

```env
# Database connection URL (for postgress in this case)
DATABASE_URL="file:./dev.db"

# A long, random, and secret string for signing JWTs
JWT_SECRET="put_a_long_random_secret_here"

# Google Cloud OAuth 2.0 application credentials
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:4000/calendar/callback"

🗃️ Database SchemaThe database schema is defined in the prisma/schema.prisma file and consists of two main models:UserRepresents a user in the system.FieldTypeDescriptionidStringUnique identifier (CUID).emailStringThe user's unique email address.nameString?The user's name (optional).googleSubString?The Google Subject ID, used for auth.gcalAccessString?Google Calendar API access token.gcalRefreshString?Google Calendar API refresh token.gcalExpiryDateTime?Expiry date for the access token.bookingsBooking[]A list of all bookings made by the user.BookingRepresents a booking created by a user.FieldTypeDescriptionidStringUnique identifier (CUID).userIdStringThe ID of the user who owns the booking.titleStringThe title or description of the booking.startAtDateTimeThe start date and time of the booking.endAtDateTimeThe end date and time of the booking.deletedAtDateTime?Timestamp for soft-deleting bookings.🔐 Security (JWT Authentication)Endpoint security is enforced using NestJS Guards and Passport's JWT strategy.JwtStrategy: This strategy validates the JWT sent in the Authorization header of incoming requests. It verifies the token's signature using the JWT_SECRET and attaches the user payload (ID and email) to the request object.JwtAuthGuard: This guard is applied to controllers or specific routes using the @UseGuards(JwtAuthGuard) decorator. It intercepts incoming requests and invokes the JwtStrategy to ensure the token is valid before granting access to the endpoint.🐳 Deployment with DockerThe repository is configured for easy containerization and deployment using Docker.Dockerfile: Defines a multi-stage build process to create a lean, optimized production image for the application. It installs dependencies, compiles the TypeScript code, and sets up the application for execution.docker-compose.yml: Orchestrates the service deployment. It builds the image from the Dockerfile and runs it as a container, handling port mapping and environment configuration.To build and run the service using Docker, execute the following command:Bashdocker-compose up --build
🌐 API EndpointsApp Module (Root)GET /A basic health check endpoint to verify that the API is running.Controller: AppControllerDescription: Returns a simple greeting.Success Response (200): Hello World!Auth ModulePOST /auth/googleAuthenticates a user with their Google idToken and returns a JWT for use in protected requests.Request Body:JSON{
  "idToken": "string"
}
idToken: The JWT provided by Google upon successful sign-in.Success Response (201):JSON{
  "token": "ey...",
  "user": {
    "id": "cl...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
Error Response (401 Unauthorized):Returned if the idToken is invalid, expired, or malformed.Bookings Module🔐 All endpoints in this module require JWT authentication. The token must be provided in the Authorization: Bearer <token> header.GET /bookings/meRetrieves a list of all bookings belonging to the authenticated user, sorted by start date.Success Response (200):JSON[
  {
    "id": "cl...",
    "userId": "cl...",
    "title": "Team Meeting",
    "startAt": "2023-10-27T10:00:00.000Z",
    "endAt": "2023-10-27T11:00:00.000Z",
    "createdAt": "...",
    "deletedAt": null
  }
]
POST /bookingsCreates a new booking after performing several validations:The end date must be after the start date.The booking must not overlap with the user's existing bookings.The booking must not conflict with any events on the user's connected Google Calendar.Request Body:JSON{
  "title": "string",
  "startAt": "ISO_Date_String",
  "endAt": "ISO_Date_String"
}
Success Response (201): Returns the newly created booking object.Error Response (409 Conflict):If the time range is invalid.If the booking overlaps with an existing one.If the booking conflicts with a Google Calendar event.DELETE /bookings/:idDeletes a specific booking by its ID.URL Parameters:id: The unique identifier of the booking to be deleted.Success Response (200):JSON{
  "ok": true
}
Calendar Module🔐 Most endpoints in this module require JWT authentication.GET /calendar/statusChecks whether the authenticated user has connected their Google Calendar account.Success Response (200):JSON{
  "connected": boolean
}
GET /calendar/connectGenerates a Google authorization URL. The frontend should redirect the user to this URL to grant the application access to their calendar.Success Response (200):JSON{
  "url": "[https://accounts.google.com/o/oauth2/v2/auth](https://accounts.google.com/o/oauth2/v2/auth)?..."
}
GET /calendar/callbackThis endpoint is part of the OAuth2 flow and is not meant to be called directly. Google redirects the user to this callback URL after they grant authorization. The server exchanges the received authorization code for access tokens and stores them.POST /calendar/disconnectDisconnects the user's Google Calendar account from the application by clearing the stored access tokens from the database.Success Response (201):JSON{
  "ok": true
}
