# Prisma Database Setup

This document outlines the Prisma ORM setup for QuickPick.

## What Was Set Up

✅ **Prisma Packages**: Installed `prisma` and `@prisma/client`  
✅ **Schema**: Created `prisma/schema.prisma` with two models:
  - `Scan` - Stores user scan history
  - `UserProfile` - Stores user preferences
✅ **Prisma Client**: Created singleton client at `lib/prisma.ts`  
✅ **Configuration**: Prisma config at `prisma.config.ts`

## Database Schema

### Scan Model
Stores user scan history and analysis results:
- `id` (UUID) - Primary key
- `userId` (String) - Clerk user ID
- `imageUrl` (String) - Base64 or URL to stored image
- `productName` (String, optional) - Product name if identified
- `analysisResult` (Text) - Full AI analysis output
- `createdAt` (DateTime) - Auto-generated timestamp
- `updatedAt` (DateTime) - Auto-updated timestamp

**Indexes**: `userId`, `createdAt` for fast queries

### UserProfile Model
Stores user preferences:
- `id` (UUID) - Primary key
- `userId` (String, unique) - Clerk user ID (one profile per user)
- `dietaryRestrictions` (String, optional) - JSON string or comma-separated values
- `createdAt` (DateTime) - Auto-generated timestamp
- `updatedAt` (DateTime) - Auto-updated timestamp

**Indexes**: `userId` for fast lookups

## Next Steps

### 1. Set Up Database Connection

Choose one of these options:

#### Option A: Vercel Postgres
1. Go to your Vercel project dashboard
2. Navigate to "Storage" → "Create Database" → "Postgres"
3. Copy the connection string
4. Add to `.env.local`:
   ```env
   DATABASE_URL="postgresql://..."
   ```

#### Option B: Neon (Recommended for Development)
1. Sign up at [neon.tech](https://neon.tech) (free tier)
2. Create a new project
3. Copy the connection string
4. Add to `.env.local`:
   ```env
   DATABASE_URL="postgresql://..."
   ```

### 2. Generate Prisma Client

After setting up your database URL, generate the Prisma client:

```bash
npx prisma generate
```

### 3. Run Migrations

Create and apply the database schema:

```bash
npx prisma migrate dev --name init
```

This will:
- Create migration files in `prisma/migrations/`
- Apply the schema to your database
- Generate the Prisma client

### 4. (Optional) Open Prisma Studio

View and manage your database data visually:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555`

## Using Prisma Client

Import the singleton client in your API routes or server components:

```typescript
import { prisma } from '@/lib/prisma'

// Example: Create a scan
const scan = await prisma.scan.create({
  data: {
    userId: 'user_xxx',
    imageUrl: 'https://...',
    analysisResult: 'AI analysis text...',
  },
})

// Example: Get user scans
const scans = await prisma.scan.findMany({
  where: { userId: 'user_xxx' },
  orderBy: { createdAt: 'desc' },
})
```

## Environment Variables

Make sure your `.env.local` includes:

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
GOOGLE_GENERATIVE_AI_API_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

## Notes

- The Prisma client uses a singleton pattern to prevent multiple connections in Next.js hot-reloading
- All models are indexed for optimal query performance
- The `userId` field links to Clerk user IDs (strings)
- `analysisResult` uses `@db.Text` for long text content

