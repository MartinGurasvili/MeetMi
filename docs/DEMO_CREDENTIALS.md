# Demo Credentials

These accounts are created by `python -m app.seed` locally and by the deploy workflow after ECS rolls out.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@meetmi.example.com` | `AdminPass123` |
| Admin | `ops@meetmi.example.com` | `OpsPass123` |
| User | `user@meetmi.example.com` | `UserPass123` |
| User | `alex@meetmi.example.com` | `UserPass123` |
| User | `sam@meetmi.example.com` | `UserPass123` |
| User (dense demo data) | `demo@meetmi.example.com` | `UserPass123` |

The seed creates Manchester and London floor spaces aligned with the imported floor layout JSON, plus confirmed bookings across the next 60 weekdays. Hot desks are booked for the full working day (9:00–17:00); meeting rooms use shorter slots. Regular users get at most one desk per day. The `demo@meetmi.example.com` account includes extra overflow bookings for a busier map preview.

Running the seed again refreshes demo spaces and bookings. User accounts are upserted so the documented passwords continue to work.
