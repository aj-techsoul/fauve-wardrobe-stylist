# Haute Wardrobe & AI Stylist

A premium, mobile-first full-stack Next.js application that provides a Virtual Try-On Studio and Gemini-powered AI Stylist. 

## Features
- **Virtual Try-On & Live AR Mirror**: Seamlessly overlay clothes onto a live camera feed or a biometric profile photo.
- **AI Background Removal**: Uses `@imgly/background-removal` to perform private, client-side, on-device AI background removal for clothing uploads.
- **Gemini AI Stylist**: Crafts the perfect trending Top + Bottom + Shoes combinations based on your wardrobe.
- **Secure Wardrobe Sharing**: Grant and revoke access to your wardrobe securely with cross-account access controls.
- **Biometric Security**: Face photos (`.np` files) are locked and restricted strictly to the authenticated user.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide Icons.
- **Backend**: Next.js API Routes.
- **Database**: PostgreSQL (Neon/Railway) with `pg` library.
- **AI/ML**: Google Gemini API, `@imgly/background-removal` (WASM).
- **Deployment**: Railway.app

---

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Local or Hosted like Neon/Railway)

### 2. Environment Variables
Create a `.env` file in the root of the project and add the following keys:

```env
# Your PostgreSQL Database URL
DATABASE_URL="postgresql://user:password@host:port/database"

# Your Google Gemini AI API Key
GEMINI_API_KEY="your_google_gemini_api_key"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Initialization
The application uses an automatic table initialization script. The first time you interact with the database (e.g., creating a user), it will automatically execute the schema in `src/lib/db.ts` to create the `users`, `clothes`, `wardrobe_shares`, and `outfit_logs` tables.

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Note: Features requiring the camera (Live AR) require HTTPS. To test camera features on mobile locally, you will need an HTTPS tunnel (like `ngrok`) or proper local certificates.

---

## Deployment (Railway)

1. Connect your GitHub repository to Railway.
2. Add a **PostgreSQL** service to your Railway project.
3. Deploy the Next.js app.
4. Go to the Next.js service **Variables** tab on Railway.
5. Add `GEMINI_API_KEY`.
6. Add `DATABASE_URL` by referencing the Railway Postgres service.
7. Generate a public domain in the Railway Settings tab.
