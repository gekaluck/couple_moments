# Couple Moments

A private couples app for planning dates, tracking ideas, and building shared memories.

## Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL (local or remote)

### Install and Run

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and optional keys (see below)

# Run database migrations
npx prisma migrate dev

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name for photo uploads |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | No | Cloudinary unsigned upload preset |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Google Maps API key for place search |

### Useful Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npx prisma studio        # Database browser
npx prisma migrate dev   # Run migrations (dev)
npx prisma generate      # Regenerate Prisma client
```

## Deployment

See `docs/00_current/DEPLOYMENT.md` for platform options (Railway, Vercel, Fly.io) and step-by-step instructions.

<!-- TODO: Add production URL and deployment status badge once deployed -->

## Documentation

Project documentation lives in `docs/00_current/`. Start with [READ_THIS_FIRST.md](docs/00_current/READ_THIS_FIRST.md).
