# AgriLink Backend

This folder contains a Node.js backend scaffold for AgriLink. The backend is designed to connect to Supabase using a server-side service role key.

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase values:
   ```bash
   cp .env.example .env
   ```
3. Run the backend:
   ```bash
   npm start
   ```

## API Endpoints

- `GET /health` - health check
- `GET /api/profiles/:id` - fetch a profile by user ID
- `GET /api/farmers/:id` - fetch a farmer record by ID
- `GET /api/buyers/:id` - fetch a buyer record by ID
- `GET /api/admin/farmers` - list all farmers
- `POST /api/admin/farmers/:id/verify` - update farmer verification status
