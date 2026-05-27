import http from "node:http";
import express from "express";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerRoomRoutes } from "./routes/rooms.js";
import { registerSfuRoutes } from "./routes/sfu.js";
import { attachAuthUser, requireAuth } from "./lib/authMiddleware.js";
import { createRedisPubSub } from "./lib/redisPubSub.js";
import { createRoomHub } from "./websockets/roomHub.js";
import { createWebSocketServer } from "./websockets/socketServer.js";

const port = Number(process.env.PORT ?? 4000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const app = express();

app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", clientOrigin);
  response.header("Access-Control-Allow-Credentials", "true");
  response.header("Access-Control-Allow-Headers", "Content-Type");
  response.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  next();
});

app.use(express.json());
app.use(attachAuthUser);

registerAuthRoutes(app);
registerHealthRoutes(app);
app.use("/api/rooms", requireAuth);
app.use("/api/sfu", requireAuth);
registerRoomRoutes(app);
registerSfuRoutes(app);

const httpServer = http.createServer(app);
const redisPubSub = await createRedisPubSub();
const roomHub = createRoomHub({ redisPubSub });
createWebSocketServer({ httpServer, roomHub, redisPubSub });

httpServer.listen(port, () => {
  console.log(`Live collab server listening on http://localhost:${port}`);
});
