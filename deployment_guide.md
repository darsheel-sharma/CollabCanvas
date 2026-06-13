# CollabCanvas Free Deployment Guide

This guide provides a comprehensive deployment plan to host your application on cloud services for free. We will use Render for hosting the server/client and Upstash for a free Redis database.

## Architecture
- **Frontend**: Hosted on Render (Static Site) or Vercel for free.
- **Backend (Node.js/Express)**: Hosted on Render (Web Service) free tier.
- **Redis Database**: Hosted on Upstash (Free tier).

## Step 1: Push your Code to GitHub
Ensure all your current code is committed and pushed to a GitHub repository. Both Vercel and Render will pull directly from your GitHub repo.

## Step 2: Set up Free Redis on Upstash
1. Go to [Upstash](https://upstash.com/) and create a free account.
2. Create a new Redis database.
3. Copy the **Redis URL** (e.g., `rediss://default:password@endpoint:port`).
4. Keep this URL handy for your backend configuration.

## Step 3: Deploy Frontend (Vercel or Render)
### Option A: Vercel (Recommended for React/Vite)
1. Go to [Vercel](https://vercel.com/) and log in with GitHub.
2. Click **Add New** -> **Project** and import your CollabCanvas repo.
3. In the Framework Preset, select **Vite**.
4. Set the Root Directory to `client` (if Vercel doesn't detect it automatically).
5. Add any necessary Environment Variables (e.g., `VITE_SERVER_URL` pointing to your future backend URL).
6. Click **Deploy**.

## Step 4: Deploy Backend (Render)
1. Go to [Render](https://render.com/) and log in with GitHub.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Fill in the following details:
   - **Name**: collabcanvas-server
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free
5. **Environment Variables**:
   Add the following variables under "Advanced":
   - `PORT`: `4000` (Render will map this automatically)
   - `REDIS_URL`: Paste the Upstash Redis URL from Step 2.
   - `CLIENT_URL`: The URL of your deployed frontend (e.g., `https://collabcanvas.vercel.app`)
6. Click **Create Web Service**.

## Alternative: Full Docker Deployment (AWS EC2 / DigitalOcean)
If you have access to a Free Tier VPS (like an AWS EC2 t2.micro or an Oracle Cloud Free instance), you can deploy using the included `docker-compose.yml`.

1. SSH into your instance.
2. Clone your repository.
3. Install Docker and Docker Compose.
4. Run the following command in the root of the repository:
   ```bash
   docker-compose up --build -d
   ```
   *(Note: This starts the client, server, and Redis container locally on that machine in the background).*

## Using Free TURN/STUN Servers for WebRTC
To ensure voice chats work across strict NATs for free, the app is already configured (or should be configured) to use public STUN servers (e.g., Google's `stun:stun.l.google.com:19302`). For free TURN, you can utilize Metered.ca's free tier, which provides 50GB/month of TURN usage for free.

1. Sign up at [Metered Video](https://www.metered.ca/turn-server).
2. Get your TURN credentials.
3. Add them to your environment variables on Vercel/Render.
