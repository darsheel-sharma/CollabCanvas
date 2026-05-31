import { prisma } from "../lib/prisma.js";

function createSlug() {
  return `ws-${Math.random().toString(36).slice(2, 8)}`;
}

export function registerWorkspaceRoutes(app) {
  // Get all active workspaces for the current user
  app.get("/api/workspaces", async (request, response) => {
    try {
      const userId = request.authUser.id;
      const workspaces = await prisma.workspace.findMany({
        where: {
          ownerId: userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
      response.json({ workspaces });
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  });

  // Create a new workspace
  app.post("/api/workspaces", async (request, response) => {
    try {
      const { name, hasTimeLimit, durationMinutes } = request.body ?? {};
      const userId = request.authUser.id;

      if (!name?.trim()) {
        return response.status(400).json({ error: "Workspace name is required." });
      }

      let expiresAt = null;
      if (hasTimeLimit) {
        const mins = parseInt(durationMinutes, 10);
        if (isNaN(mins) || mins <= 0) {
          return response.status(400).json({ error: "Invalid duration provided." });
        }
        expiresAt = new Date(Date.now() + mins * 60 * 1000);
      }

      const slug = createSlug();
      const workspace = await prisma.workspace.create({
        data: {
          slug,
          name: name.trim(),
          ownerId: userId,
          expiresAt,
          documentState: {
            create: {},
          },
        },
      });

      response.status(201).json({ workspace });
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  });

  // Get a single workspace by slug
  app.get("/api/workspaces/:slug", async (request, response) => {
    try {
      const { slug } = request.params;
      const workspace = await prisma.workspace.findUnique({
        where: { slug },
      });

      if (!workspace) {
        return response.status(404).json({ error: "Workspace not found." });
      }

      if (workspace.expiresAt && new Date(workspace.expiresAt) < new Date()) {
        return response.status(410).json({ error: "This workspace has expired.", expired: true });
      }

      response.json({ workspace });
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  });

  // Delete a workspace
  app.delete("/api/workspaces/:id", async (request, response) => {
    try {
      const { id } = request.params;
      const userId = request.authUser.id;

      // Find first to verify ownership
      const workspace = await prisma.workspace.findFirst({
        where: { id, ownerId: userId },
      });

      if (!workspace) {
        return response.status(404).json({ error: "Workspace not found or not owned by you." });
      }

      // Delete related DocumentState first since Prisma handles cascading or manual deletes
      await prisma.documentState.deleteMany({
        where: { workspaceId: id },
      });

      await prisma.workspace.delete({
        where: { id },
      });

      response.status(204).end();
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  });
}
