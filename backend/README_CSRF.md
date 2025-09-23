CSRF and Session Environment Variables

This project uses a double-submit cookie CSRF protection scheme paired with HttpOnly session cookies.

Important environment variables

- SESSION_COOKIE_NAME (default: `ssb_token`)
  - The name of the HttpOnly cookie that holds the signed app JWT. Set this if you want a different cookie name.

- JWT_SECRET
  - Secret for signing JWTs. REQUIRED in production.

- CSRF_COOKIE_NAME (default: `ssb_csrf`)
  - The name of the non-HttpOnly cookie that stores the CSRF token. The client reads this cookie and sets a header with the same value on unsafe requests.

- CSRF_HEADER_NAME (default: `x-csrf-token`)
  - The header name the client must include for unsafe requests (POST/PUT/DELETE/PATCH). Must match the server's CORS allowedHeaders.

- CORS_ORIGIN
  - Configure allowed frontend origin(s). The server uses a whitelist defined in `server.ts`. Ensure your frontend origin(s) (e.g. `http://localhost:9000`) are allowed.

Behavior

- On successful authentication (OAuth callback, login, register), the server will:
  1. Set an HttpOnly session cookie named by `SESSION_COOKIE_NAME`.
  2. Generate a random CSRF token and set it in a non-HttpOnly cookie named by `CSRF_COOKIE_NAME`.

- The frontend must:
  - Send requests with credentials (cookies). The provided `ApiClient` sets `credentials: 'include'` by default.
  - For unsafe requests, read the CSRF token cookie and set the header named by `CSRF_HEADER_NAME` (the frontend `ApiClient` already does this).

Notes

- In production set cookies with `secure=true` and choose appropriate `sameSite` and `domain` settings for your deployment.
- For better key management of refresh tokens, integrate a KMS or secret manager and avoid storing encryption keys in plain env variables long-term.

Running tests

- Backend: this repo uses Jest for backend tests. From the `backend` folder run:

  npm install
  npm test

  (Ensure `@types/jest` and `ts-jest` are installed; existing devDependencies include them.)

- Frontend: a minimal Vitest test is included. From the `frontend` folder run:

  npm install
  npm run test

  Note: Vitest is not yet included in devDependencies. Install it with `npm i -D vitest` before running tests.
