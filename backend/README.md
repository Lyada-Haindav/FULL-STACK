# Form Weaver Backend (Spring Boot)

## Requirements
- Java 17+
- Maven 3.9+
- MongoDB Atlas (or local MongoDB)

## Required environment variables
```bash
export MONGODB_URI="mongodb+srv://..."
export MONGODB_DATABASE="form_weaver"
export GOOGLE_API_KEY="your_key_here"
export JWT_SECRET="replace-with-a-long-secret"
```

## Auth email (Brevo SMTP)
```bash
export SMTP_HOST="smtp-relay.brevo.com"
export SMTP_PORT="587"
export SMTP_USERNAME="your-brevo-login"
export SMTP_PASSWORD="your-brevo-api-key"
export SMTP_FROM="no-reply@yourdomain.com"
export BREVO_API_KEY="xkeysib-..."
export APP_BASE_URL="http://localhost:8080"
export APP_FRONTEND_URL="http://localhost:5173"
```

Notes:
- `APP_BASE_URL` must be the backend public URL so email verification links work.
- `APP_FRONTEND_URL` is optional but recommended. If set, verification links open a frontend `/verify-email` page.
- `BREVO_API_KEY` is recommended on Render. It sends mail via Brevo HTTPS API (port 443), which is more reliable than SMTP on restricted networks.
- If `BREVO_API_KEY` is not set, SMTP is used. If SMTP password is copied as `api-key=...`, it is normalized automatically.

## Optional demo user
```bash
export DEMO_USER_EMAIL="demo@formweaver.local"
export DEMO_USER_PASSWORD="demo1234"
```

## Run
```bash
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`.

## Auth endpoints
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Verify email (from inbox link): `GET /api/auth/verify-email?token=...`
- Resend verification: `POST /api/auth/resend-verification`
- Current user: `GET /api/auth/user` (Authorization: Bearer `<token>`)
