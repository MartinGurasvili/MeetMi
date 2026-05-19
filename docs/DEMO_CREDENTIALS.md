# Demo Credentials

These accounts are created by `python -m app.seed` locally and by the deploy workflow after ECS rolls out.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@meetmi.example.com` | `AdminPass123` |
| Admin | `ops@meetmi.example.com` | `OpsPass123` |
| User | `user@meetmi.example.com` | `UserPass123` |
| User | `alex@meetmi.example.com` | `UserPass123` |
| User | `sam@meetmi.example.com` | `UserPass123` |

The seed also creates Manchester and London floor spaces aligned with the imported floor layout JSON, plus 220 confirmed bookings spread across the next 60 days.

Running the seed again refreshes demo spaces and bookings. User accounts are upserted so the documented passwords continue to work.
