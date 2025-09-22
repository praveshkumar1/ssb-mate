# SSB Connect Backend API

This document summarizes the backend REST API for SSB Connect (version as of workspace).
Base URL: /api

Authentication: JWT (Bearer token). Obtain token from POST /api/auth/login. Include header:
Authorization: Bearer <token>

Common response envelope:
- success: boolean
- message: string (optional)
- data: object | array (when success)
- error: string (when failure)
- timestamp: ISO string (sometimes present)

---

## 1. Auth

### POST /api/auth/register
- Auth: none
- Body (application/json):
  {
    "email": "user@example.com",
    "password": "secret123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "mentor" // or "mentee"
  }
- Success (201):
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": { "_id": "...", "email": "user@example.com", "firstName": "John", "role": "mentor" },
      "token": "<jwt>",
      "tokenType": "Bearer"
    }
  }
- Errors: 400 validation / email exists, 500 server error

### POST /api/auth/login
- Auth: none
- Body:
  { "email": "user@example.com", "password": "secret123" }
- Success (200):
  {
    "success": true,
    "message": "Login successful",
    "data": { "user": { "_id": "...", "email": "user@example.com" }, "token": "<jwt>", "tokenType": "Bearer" }
  }
- Errors: 400 validation, 401 invalid credentials

### POST /api/auth/forgot-password
- Body: { "email": "user@example.com" }
- Response: generic success message (never reveals existence)

---

## 2. Coaches

### GET /api/coaches/verified
- Auth: none
- Returns verified mentors (password excluded)
- Success:
  { "success": true, "data": [ {"_id":"...","firstName":"A"}], "count": 1 }

### GET /api/coaches/search/:term
- Auth: none
- Params: term (path), optional query: limit (default 10)
- Example: GET /api/coaches/search/john?limit=5
- Success:
  { "success": true, "data": [ {"_id":"...","firstName":"John"} ], "count": 1, "searchTerm":"john" }

### GET /api/coaches
- Auth: none
- Query params: page, limit, verified ("true"), specialization, minRating
- Success (paginated):
  {
    "success": true,
    "data": [ {"_id":"...","firstName":"X"} ],
    "pagination": { "page":1, "limit":10, "total":100, "totalPages":10 }
  }

### GET /api/coaches/:id
- Auth: none
- Path param: id (MongoId)
- Success: { success:true, data: { /* coach */ } }
- 404 if not found

---

## 3. Sessions

### GET /api/sessions
- Auth: none
- Returns list of sessions (mentor/mentee populated)

### GET /api/sessions/:id
- Auth: none
- Path param: id
- Success: { success:true, data: { /* session */ } }

### POST /api/sessions
- Auth: Required (Bearer token)
- Body (required):
  {
    "title": "Mock Interview",
    "description": "Practice session",
    "mentorId": "<mentorId>",
    "sessionType": "personal_interview",
    "duration": 60,
    "scheduledAt": "2025-10-01T10:00:00.000Z"
  }
- Success (201): created session object (populated)
- Errors: 400 validation, 401 if not authenticated

### PUT /api/sessions/:id
- Auth: Required
- Body: fields to update (server validates/updates)
- Success: updated session

### DELETE /api/sessions/:id
- Auth: Required
- Success: { success:true, message: 'Session deleted successfully' }

---

## 4. Users

### GET /api/users/profile
- Auth: Required
- Returns: authenticated user's profile (password excluded)
- Success:
  { "success": true, "data": { "_id":"...","email":"...","firstName":"..." }, "timestamp":"..." }
- 401 if token missing or invalid, 404 if user not found

### PUT /api/users/profile
- Auth: Required
- Allowed fields (safe subset):
  firstName, lastName, phoneNumber, bio, experience, specializations,
  rank, unit, achievements, hourlyRate, availability, location,
  profileImageUrl, certifications, sportsPlayed
- Notes: If certain fields (specializations, achievements, availability, certifications, sportsPlayed) are passed as comma-separated strings they will be normalized to arrays.
- Example body:
  {
    "firstName": "Jane",
    "specializations": "communication,leadership",
    "hourlyRate": 30
  }
- Success (200): returns updated user object (password excluded)
- Errors: 400 if no valid fields, 401 if not authenticated

### GET /api/users/mentors
- Auth: none
- Returns list of mentors sorted by verification and rating

### GET /api/users
- Auth: none
- Query: page, limit
- Success (paginated): similar pagination envelope as coaches

---

## 5. Resources

### GET /api/resources
- Auth: none
- Query params: type, category, difficulty, tags (CSV or array)
- Success: { success:true, data: [ resources ] }

### GET /api/resources/:id
- Auth: none
- Path: id
- Success: resource object

### POST /api/resources
- Auth: Required
- Body required:
  title (min 3), content (min 10), category (one of allowed list)
- Optional: description, fileUrl, thumbnailUrl, difficulty, tags (CSV or array)
- Success (201): created resource (populated with author details)
- Errors: 400 validation, 401 auth required

### PUT /api/resources/:id
- Auth: Required (only creator or admin)
- Body: fields to update
- Responses: 200 updated, 403 permission denied, 404 not found

### DELETE /api/resources/:id
- Auth: Required (creator or admin)
- Success: { success:true, message: 'Resource deleted successfully' }

---

## Error patterns & HTTP codes
- 200 OK – request successful
- 201 Created – resource created
- 400 Bad Request – validation errors; response contains `errors` array from express-validator
- 401 Unauthorized – missing/invalid token
- 403 Forbidden – insufficient permissions
- 404 Not Found – entity not found
- 500 Internal Server Error – unexpected server error

---

## Next steps (recommended)
- Add explicit example curl commands and code snippets for each endpoint (I can add these under `# Add examples & auth notes`).
- Produce an OpenAPI (Swagger) spec (optional but helps frontend tooling).


*File created automatically by the assistant.*

---

## Examples & Auth notes

Authentication header
```
Authorization: Bearer <JWT_TOKEN>
```

Below are concrete examples using curl and TypeScript (fetch) for common workflows.

### Example: Register (curl)
```
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "email":"alice@example.com", "password":"secret123", "firstName":"Alice", "lastName":"Smith", "role":"mentee" }'
```

### Example: Login (curl) -> obtain JWT
```
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email":"alice@example.com", "password":"secret123" }'
```

Sample successful login response (JSON):
```
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "_id": "64...", "email": "alice@example.com", "firstName": "Alice" },
    "token": "eyJhbGciOi...",
    "tokenType": "Bearer"
  }
}
```

### Example: Get authenticated profile (curl)
```
curl -X GET http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Example: Update profile (curl)
```
curl -X PUT http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "firstName":"Alice", "specializations":"communication,leadership", "hourlyRate":40 }'
```

### Example: Search coaches (curl)
```
curl -X GET "http://localhost:8080/api/coaches/search/john?limit=5"
```

### Example: Create session (curl) (authenticated)
```
curl -X POST http://localhost:8080/api/sessions \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "title":"Mock Interview", "description":"Practice", "mentorId":"64...", "sessionType":"personal_interview", "duration":60, "scheduledAt":"2025-10-01T10:00:00.000Z" }'
```

### Example: Create resource (curl) (authenticated)
```
curl -X POST http://localhost:8080/api/resources \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "title":"Interview Tips", "content":"Prepare well...", "category":"preparation_guide", "tags":"ssb,interview" }'
```

### TypeScript (fetch) examples
Add these to your frontend code to interact with the API.

1) Login and store token
```ts
async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json();
  if (json.success && json.data?.token) {
    const token = json.data.token;
    localStorage.setItem('token', token);
    return json.data.user;
  }
  throw new Error(json.message || 'Login failed');
}
```

2) Fetch authenticated profile
```ts
async function getProfile() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/users/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}
```

3) Update profile
```ts
async function updateProfile(updates: Record<string, any>) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return res.json();
}
```

### Error handling notes
- Validation errors return 400 with an `errors` array (from express-validator).
- Auth failures return 401. Ensure token is attached as `Authorization: Bearer <token>`.
- Permission failures return 403.

---

If you want, I can: add examples for every endpoint in the file, or convert this full doc into an OpenAPI spec so the frontend team can import it in tools like Postman/Swagger UI.
If you want, I can: add examples for every endpoint in the file, or convert this full doc into an OpenAPI spec so the frontend team can import it in tools like Postman/Swagger UI.

---

## Full endpoint examples (curl + sample responses)

All examples assume server runs at http://localhost:8080. Replace host/port with your deployed URL.

### Auth

#### POST /api/auth/register (curl)
```
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "email":"bob@example.com", "password":"secret123", "firstName":"Bob", "lastName":"Lee", "role":"mentor" }'
```
Sample success response (201):
```
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "_id": "64abc...", "email":"bob@example.com", "firstName":"Bob", "role":"mentor" },
    "token": "<jwt>",
    "tokenType": "Bearer"
  }
}
```

#### POST /api/auth/login (curl)
```
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email":"bob@example.com", "password":"secret123" }'
```
Sample success response (200):
```
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "_id": "64abc...", "email": "bob@example.com" },
    "token": "eyJhbGci...",
    "tokenType": "Bearer"
  }
}
```

#### POST /api/auth/forgot-password (curl)
```
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{ "email":"maybe@exists.com" }'
```
Sample response (200):
```
{ "success": true, "message": "If an account with that email exists, a password reset link will be sent." }
```

---

### Coaches

#### GET /api/coaches/verified (curl)
```
curl http://localhost:8080/api/coaches/verified
```
Sample response (200):
```
{
  "success": true,
  "data": [ { "_id":"64c0...", "firstName":"Ravi", "lastName":"K", "rating":4.8 } ],
  "count": 1,
  "timestamp": "2025-09-20T..."
}
```

#### GET /api/coaches/search/:term (curl)
```
curl "http://localhost:8080/api/coaches/search/army?limit=5"
```
Sample response (200):
```
{ "success": true, "data": [ { "_id":"64c1...","firstName":"Aman","bio":"Army Officer..." } ], "count":1, "searchTerm":"army" }
```

#### GET /api/coaches (with filters)
```
curl "http://localhost:8080/api/coaches?page=1&limit=10&verified=true&specialization=leadership&minRating=4"
```
Sample response (200): pagination envelope
```
{
  "success": true,
  "data": [ /* array of coach objects */ ],
  "pagination": { "page":1, "limit":10, "total":25, "totalPages":3 }
}
```

#### GET /api/coaches/:id
```
curl http://localhost:8080/api/coaches/64c0abcdef1234567890abcd
```
200 (coach) or 404 if not found:
```
{ "success": false, "error": "Coach not found" }
```

---

### Sessions

#### GET /api/sessions
```
curl http://localhost:8080/api/sessions
```
Response (200):
```
{ "success": true, "message":"Sessions retrieved successfully", "data": [ /* sessions populated with mentor/mentee */ ] }
```

#### GET /api/sessions/:id
```
curl http://localhost:8080/api/sessions/650000abcde1234567890
```
Response (200) or 404

#### POST /api/sessions (create) — authenticated
```
curl -X POST http://localhost:8080/api/sessions \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "title":"Mock Interview","description":"Mock","mentorId":"64c0...","sessionType":"personal_interview","duration":60,"scheduledAt":"2025-10-01T10:00:00.000Z" }'
```
Sample response (201):
```
{ "success": true, "message":"Session created successfully", "data": { /* populated session */ } }
```

#### PUT /api/sessions/:id (authenticated)
```
curl -X PUT http://localhost:8080/api/sessions/650000abcde1234567890 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "status":"cancelled" }'
```
Response: updated session object or 404

#### DELETE /api/sessions/:id (authenticated)
```
curl -X DELETE http://localhost:8080/api/sessions/650000abcde1234567890 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```
Response (200): { "success": true, "message": "Session deleted successfully" }

---

### Users

#### GET /api/users/profile (authenticated)
```
curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:8080/api/users/profile
```
Sample success (200):
```
{ "success": true, "data": { "_id":"64u...","email":"bob@example.com","firstName":"Bob" }, "timestamp":"..." }
```

#### PUT /api/users/profile (authenticated)
```
curl -X PUT http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "bio":"Ex-army officer","specializations":"leadership,planning","availability":"weekends" }'
```
Sample success (200): updated user object returned.

#### GET /api/users/mentors
```
curl http://localhost:8080/api/users/mentors
```
Sample response (200):
```
{ "success": true, "data": [ /* mentors */ ], "count": 5 }
```

#### GET /api/users (paginated)
```
curl "http://localhost:8080/api/users?page=1&limit=20"
```
Sample response: pagination envelope similar to coaches.

---

### Resources

#### GET /api/resources (with tags filter)
```
curl "http://localhost:8080/api/resources?tags=ssb,interview&category=preparation_guide"
```
Sample response (200):
```
{ "success": true, "message":"Resources retrieved successfully", "data": [ /* resources */ ] }
```

#### GET /api/resources/:id
```
curl http://localhost:8080/api/resources/64r000abcde123456789
```

#### POST /api/resources (authenticated)
```
curl -X POST http://localhost:8080/api/resources \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "title":"SSB Guide","content":"Detailed guide...","category":"preparation_guide","tags":"ssb,guide" }'
```
Sample response (201): created resource (populated with author details).

#### PUT /api/resources/:id (authenticated; creator or admin)
```
curl -X PUT http://localhost:8080/api/resources/64r000abcde123456789 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "title":"Updated title" }'
```

#### DELETE /api/resources/:id (authenticated; creator or admin)
```
curl -X DELETE http://localhost:8080/api/resources/64r000abcde123456789 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## TypeScript (fetch) helper snippets

These are small helpers the frontend can reuse.

```ts
// Generic fetch helper with JSON and auth
async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(opts.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers });
  return res.json();
}

// Usage examples
// Get coaches
const coaches = await apiFetch('/api/coaches');
// Create session
const createSession = await apiFetch('/api/sessions', { method: 'POST', body: JSON.stringify({ /* ... */ }) });
// Create resource
const createResource = await apiFetch('/api/resources', { method: 'POST', body: JSON.stringify({ /* ... */ }) });
```

## Error handling summary
- Validation errors: 400 with `errors` array
- Auth failures: 401
- Permission failures: 403
- Not found: 404

---

If you'd like, I will now mark this todo as completed and can also produce an OpenAPI JSON/YAML file next.
