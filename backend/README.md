# Form Weaver Backend (Spring Boot)

## Requirements
- Java 17+
- Maven 3.9+
- MySQL 8+

## Setup
1. Create a database named `form_weaver`.
2. Update credentials in `backend/src/main/resources/application.yml` if needed.
3. Set your Gemini API key:
```bash
export GOOGLE_API_KEY="your_key_here"
```
4. (Optional) Set JWT secret and demo user credentials:
```bash
export JWT_SECRET="replace-with-a-long-secret"
export DEMO_USER_EMAIL="demo@formweaver.local"
export DEMO_USER_PASSWORD="demo1234"
```

## Run
```bash
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`.

## Frontend Dev Proxy
Vite is configured to proxy `/api` to `http://localhost:8080`.

## Auth
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Current user: `GET /api/auth/user` (Authorization: Bearer <token>)
