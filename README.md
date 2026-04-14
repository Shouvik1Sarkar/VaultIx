# Vaultix

A secure, production-style backend service for managing user data and files with a strong focus on authentication, security, and clean architecture.

Vaultix is designed to demonstrate real-world backend engineering practices including token-based authentication, layered architecture, input validation, and scalable API design.

---

## Why Vaultix?

Most beginner projects focus only on CRUD operations. Vaultix goes further by implementing:

- Secure authentication flows (access + refresh tokens)
- Structured backend architecture
- Centralized error handling
- Middleware-driven request lifecycle
- Scalable and maintainable code organization

---

## Features

### Authentication & Security

- JWT-based authentication (access + refresh tokens)
- HTTP-only cookie storage (prevents XSS attacks)
- Password hashing using bcrypt
- Protected routes via authentication middleware
- Input validation and sanitization
- Rate limiting and request filtering

### User Management

- User registration and login
- Profile update functionality
- Secure password change

### Data / Vault Management

- Store and manage user-specific data
- Retrieve individual or all stored items
- Delete user-owned resources securely

### File Handling

- File uploads using Multer
- Cloud storage integration via Cloudinary

### System Design

- Centralized API response structure
- Global error handling middleware
- Reusable utility functions
- Clean separation of concerns

---

## Tech Stack

| Layer      | Technology                 |
| ---------- | -------------------------- |
| Runtime    | Node.js                    |
| Framework  | Express.js                 |
| Database   | MongoDB + Mongoose         |
| Auth       | JWT, bcrypt                |
| Storage    | Cloudinary, Multer         |
| Validation | express-validator          |
| Testing    | Jest, Supertest            |
| Security   | Custom middleware / Arcjet |

---

## Project Structure

```
vaultix/
├── index.js
└── src/
    ├── app.js
    ├── config/
    ├── connection/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    └── utils/
```

### Structure Overview

- **Controllers** → Handle request & response logic
- **Models** → Define database schema
- **Middleware** → Authentication, validation, error handling
- **Routes** → API endpoint definitions
- **Utils** → Reusable helper functions

---

## Architecture

Vaultix follows a layered architecture to ensure maintainability and scalability.

```
Client
  │
  ▼
Express Server
  │
  ├── Security Layer (rate limiting, validation)
  ├── Middleware (auth, error handling)
  ├── Controllers (business logic)
  │
  ▼
Database (MongoDB)
  │
  ▼
External Services (Cloudinary, Email)
```

---

## Request Flow

Example request lifecycle:

```
1. Client sends request
2. Middleware validates input
3. Authentication middleware verifies user
4. Controller executes business logic
5. Database operation performed
6. Standardized response returned
```

---

## Authentication Flow

Vaultix uses token-based authentication with rotation:

```
Login →
Access Token (short-lived)
Refresh Token (long-lived)

Access expires →
Refresh endpoint →
New access token issued
```

Security considerations:

- Tokens stored in HTTP-only cookies
- No sensitive data exposed to client-side scripts
- Passwords never stored in plain text

---

## API Design

All routes are prefixed with:

```
/api/v1
```

### Auth

| Method | Endpoint       | Description   |
| ------ | -------------- | ------------- |
| POST   | /auth/register | Register user |
| POST   | /auth/login    | Login user    |
| POST   | /auth/refresh  | Refresh token |
| POST   | /auth/logout   | Logout user   |

---

### User

| Method | Endpoint       | Description      |
| ------ | -------------- | ---------------- |
| GET    | /user/me       | Get current user |
| PATCH  | /user/update   | Update profile   |
| PATCH  | /user/password | Change password  |

---

### Vault

| Method | Endpoint   | Description       |
| ------ | ---------- | ----------------- |
| POST   | /vault     | Create item       |
| GET    | /vault     | Get all items     |
| GET    | /vault/:id | Get specific item |
| DELETE | /vault/:id | Delete item       |

---

## Environment Variables

Create a `.env` file in the root:

```
PORT=3000
MONGO_URL=your_mongodb_connection

JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

## Installation

```
git clone https://github.com/your-username/vaultix.git
cd vaultix

npm install
cp .env.example .env

npm run dev
```

Server runs at:

```
http://localhost:3000
```

---

## Testing

Vaultix includes automated tests to ensure API reliability.

### Tools

- Jest
- Supertest

### Coverage

- Authentication routes
- Protected endpoints
- Core functionality
- Error handling

### Run tests

```
npm test
```

---

## Response Format

Success:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success"
}
```

Error:

```json
{
  "statusCode": 400,
  "message": "Error message"
}
```

---

## Security

Vaultix applies layered security principles:

- Password hashing with bcrypt
- JWT authentication via HTTP-only cookies
- Input validation and sanitization
- Protected API routes
- Rate limiting and request filtering

---

## Scaling Considerations

- Database indexing for faster queries
- Stateless authentication (horizontal scaling ready)
- Separation of concerns for maintainability
- Redis caching can be integrated
- Background jobs can be added for async processing

---

## Future Improvements

- Redis caching layer
- Role-based access control (RBAC)
- File encryption before storage
- Audit logging system
- Background job queues (BullMQ)
- Swagger API documentation
- Docker containerization

---

## License

MIT
