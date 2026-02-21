# Authentication Update

Supabase authentication has been removed from this project.

The app now uses:
- Spring Boot auth endpoints
- JWT bearer tokens
- Brevo SMTP email verification

## What to configure instead

Set these backend environment variables:
- `SMTP_HOST=smtp-relay.brevo.com`
- `SMTP_PORT=587`
- `SMTP_USERNAME=...`
- `SMTP_PASSWORD=...`
- `SMTP_FROM=...`
- `APP_BASE_URL=...`

And the standard backend variables:
- `MONGODB_URI`
- `MONGODB_DATABASE`
- `GOOGLE_API_KEY`
- `JWT_SECRET`
