# Volunteer Shift App for Theatre

This is a simple full-stack application built with **Deno** and **TypeScript**. It allows theatre staff to manage shows, volunteers and shifts, and lets volunteers sign up for shifts via a shareable link.

## Features
- Admin login via token authentication
- Manage shows, shifts and volunteers
- Volunteer signup page (mobile friendly)
- Basic analytics to list unfilled shifts

## Requirements
- Deno v2.3+
- PostgreSQL database

## Setup
1. Copy `.env.example` to `.env` and fill in the values.
2. Create the database and run the SQL in `db/schema.sql`.
3. Start the server:
   ```bash
   deno run -A src/main.ts
   ```

## Docker
A basic Dockerfile is provided. Build and run with:
```bash
docker build -t theatre-app .
docker run -p 8000:8000 --env-file .env theatre-app
```
