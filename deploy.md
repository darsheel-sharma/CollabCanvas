# CollabCanvas Free Deployment Guide (Complete)

To deploy your full-stack application completely for free, you'll need to piece together a few free-tier services, as your application requires a frontend, a Node.js backend with WebSockets, a PostgreSQL database, and a Redis instance.

## 1. Database & Infrastructure Setup
Before deploying your code, set up these three free infrastructure services and keep their connection URLs handy:

*   **PostgreSQL Database (via Neon.tech or Supabase)**:
    *   Create a free account on [Neon](https://neon.tech/) or [Supabase](https://supabase.com/).
    *   Create a new project/database.
    *   Copy the `DATABASE_URL` connection string.
*   **Redis (via Upstash)**:
    *   Create a free account on [Upstash](https://upstash.com/).
    *   Create a new Redis database.
    *   Copy the `REDIS_URL` connection string.
*   **WebRTC TURN Server (via Metered.ca)**:
    *   *Optional but highly recommended for video calls.*
    *   Sign up for [Metered Video's free tier](https://www.metered.ca/turn-server) (50GB free per month).
    *   Grab your TURN credentials for the frontend.

## 2. Deploy the Backend (Render)
[Render](https://render.com/) offers a free tier for web services that perfectly supports Node.js and WebSockets (it will spin down after 15 minutes of inactivity, so the first request might take a few seconds to wake up).

1. Go to Render and create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   *   **Name**: `collabcanvas-server`
   *   **Root Directory**: `server`
   *   **Environment**: Node
   *   **Build Command**: `npm install && npx prisma generate` *(to ensure the database client is built)*
   *   **Start Command**: `npm run start`
   *   **Instance Type**: Free
4. Add your **Environment Variables**:
   *   `DATABASE_URL`: The PostgreSQL URL from Neon/Supabase.
   *   `REDIS_URL`: The Redis URL from Upstash.
   *   `CLIENT_ORIGIN`: We will update this later once the frontend is deployed.
5. Deploy and copy the Render backend URL.

## 3. Deploy the Frontend (Vercel)
[Vercel](https://vercel.com/) is an excellent free platform to host Vite/React applications.

1. Go to Vercel and create a new **Project**.
2. Import your GitHub repository.
3. Configure the settings:
   *   **Root Directory**: `client`
   *   **Framework Preset**: Vite
4. Add your **Environment Variables**:
   *   `VITE_WS_URL`: Set this to your Render backend URL (but replace `https://` with `wss://`).
   *   Add your TURN server credentials if you got them from Metered.
5. Deploy the application.

## 4. Final Polish
Once Vercel gives you your live frontend URL (e.g., `https://collabcanvas-xyz.vercel.app`), go back to your backend settings on Render and update the `CLIENT_ORIGIN` environment variable with your Vercel URL to ensure CORS allows the frontend to connect to the backend securely.

That's it! Your entire real-time collaboration app will be live on the internet, completely for free.
