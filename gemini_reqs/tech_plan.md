Technical Plan: "The Us Hub" MVP
1. Project Overview
A private, full-stack web application for a couple to manage shared life events.

Goal: A "Split View" dashboard for proposing date ideas (Inbox) and archiving past memories (Timeline).

Key Integration: Syncing proposed ideas to Google Calendar to avoid building a native mobile app or calendar UI.

2. Tech Stack
Backend: Python 3.11+, FastAPI.

Frontend: React (Vite), Tailwind CSS, Shadcn/UI.

Database/Auth/Storage: Supabase (PostgreSQL, Auth, S3 Buckets).

API Integrations: Google Calendar API (via Google Cloud Console).

3. Data Schema (PostgreSQL)
SQL

-- Ideas Table
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'scheduled'
  suggested_by UUID REFERENCES auth.users(id)
);

-- Interactions (Comments/Reactions)
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT,
  emoji TEXT
);

-- Memories Table
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_date DATE NOT NULL,
  title TEXT,
  journal_entry TEXT,
  photo_url TEXT,
  vibe_emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
4. System Architecture
5. Implementation Roadmap & Instructions
Phase 1: Environment Setup
Supabase: Create a project, run the SQL schema above. Enable "Storage" for a bucket named memory-photos.

Google Cloud: Create a project, enable Google Calendar API, and configure OAuth 2.0 credentials.

Local: Create /backend and /frontend directories. Use a .env file for:

SUPABASE_URL, SUPABASE_KEY

GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

Phase 2: Backend Development (FastAPI)
Instruction for AI: "Create a FastAPI app with a /dashboard endpoint that returns a combined JSON of the latest 10 ideas and latest 10 memories. Implement CRUD for ideas and memories using the supabase-py client."

Integration Logic: Create a route /calendar/sync that accepts an idea_id and a datetime, then uses the Google Calendar API to insert an event.

Phase 3: Frontend Development (React + Tailwind)
Instruction for AI: "Build a responsive 'Split View' layout. The top section is a horizontally scrollable list of Idea Cards. The bottom section is a vertical Timeline of Memories. Use Tailwind for a clean, minimalist aesthetic."

Component Specs:

IdeaCard: Displays title, link, and a 'React' button that opens a comment input.

MemoryCard: Displays a photo (from Supabase Storage), a date, and the journal text.

QuickAdd: A floating action button (FAB) to toggle between 'Add Idea' and 'Log Memory'.

Phase 4: Authentication & Deployment
Instruction for AI: "Integrate Supabase Auth UI for React. Restrict all API routes in FastAPI to authenticated users only."

Deployment: Frontend on Vercel, Backend on Railway/Render.

6. MVP Success Criteria
User can post a restaurant link to the "Inbox".

Partner can comment and react with an emoji.

User can click "Confirm Date," which pushes the event to their real Google Calendar.

After the date, user can upload one photo and a journal entry to the "Timeline".