# MediaFlow API

A NestJS API for authentication, user management, and media metadata. Clients upload files directly to S3-compatible storage through presigned multipart URLs.

## Stack

- NestJS and TypeScript
- PostgreSQL with Drizzle ORM
- MinIO for local S3-compatible storage
- WorkOS AuthKit for authentication

## Requirements

- Node.js 22+
- Docker
- A WorkOS application with:
  - Redirect URI `http://localhost:3000/auth/callback`
  - This JWT template:
    ```json
    {
      "urn:myapp:app_user_id": "{{ user.external_id }}",
      "urn:myapp:role": "{{ user.metadata.role }}"
    }
    ```

## Configuration

Create a root `.env` file:

```dotenv
POSTGRES_DB=media_flow
POSTGRES_USER=media_flow
POSTGRES_PASSWORD=change-me
DATABASE_URL=postgresql://media_flow:change-me@localhost:5432/media_flow

MINIO_ROOT_USER=media_flow
MINIO_ROOT_PASSWORD=change-me
MINIO_API_PORT=9001
MINIO_CONSOLE_PORT=9002
MINIO_ENDPOINT=http://localhost:9001
STORAGE_ACCESS_KEY_ID=media_flow
STORAGE_SECRET_ACCESS_KEY=change-me
STORAGE_REGION=us-east-1
STORAGE_UPLOAD_BUCKET=media

WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
WORKOS_COOKIE_PASSWORD=at-least-32-characters-long-secret
APP_LOGIN_URL=http://localhost:3000/auth/login
```

## Run locally

```bash
npm install
docker compose up -d
npm run migrate:dev
npm run start:dev
```

The API listens on port `3000`. Swagger UI is available at `http://localhost:3000/api`, with the OpenAPI JSON at `http://localhost:3000/api-json`.

Create the `STORAGE_UPLOAD_BUCKET` bucket in the MinIO console at `http://localhost:9002` before uploading.

## User API

- `POST /user` registers a user with `firstName`, `lastName`, and `email`.
- `GET /user` lists users.
- `GET /user/{id}` returns a user by ID.
- `DELETE /user/{id}` deletes a user.

Registration returns `409 Conflict` for an existing email and `400 Bad Request` for invalid input. User details and the full response schemas are available in Swagger.

## End-to-end tests

The e2e suite uses a WorkOS emulator and a separate test database. Configure a root `.env.test` with the same keys as `.env`, use a database name containing `test`, and select ports that do not conflict with development (for example, Postgres `5433` and MinIO `9101`/`9102`).

```bash
npm run test:e2e
npm run docker-down:test
```
