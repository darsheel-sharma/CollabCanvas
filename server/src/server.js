import http from "node:http";
import express from "express";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerRoomRoutes } from "./routes/rooms.js";
import { createRoomHub } from "./websockets/roomHub.js";
import { createWebSocketServer } from "./websockets/socketServer.js";

const port = Number(process.env.PORT ?? 4000);
const app = express();

app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", process.env.CLIENT_ORIGIN ?? "http://localhost:5173");
  response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  next();
});

app.use(express.json());
registerAuthRoutes(app);
registerHealthRoutes(app);
registerRoomRoutes(app);

const httpServer = http.createServer(app);
const roomHub = createRoomHub();
createWebSocketServer({ httpServer, roomHub });

httpServer.listen(port, () => {
  console.log(`Live collab server listening on http://localhost:${port}`);
});
