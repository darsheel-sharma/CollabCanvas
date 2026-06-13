import crypto from "node:crypto";
import { createClient } from "redis";

const REDIS_CHANNEL = "live-collab:rooms";

/**
 * Initializes a Redis Pub/Sub adapter to allow horizontal scaling of WebSocket servers.
 * If Redis is unavailable or fails to connect, it gracefully returns a "dummy" adapter,
 * falling back to single-instance memory orchestration.
 */
export async function createRedisPubSub() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return {
      enabled: false,
      instanceId: crypto.randomUUID(),
      publish: async () => {},
      subscribe: async () => {},
      disconnect: async () => {},
    };
  }
  const publisher = createClient({ url: redisUrl });
  const subscriber = publisher.duplicate();
  const instanceId = crypto.randomUUID();

  try {
    publisher.on("error", (err) => {
      console.warn("Redis Publisher Connection Error:", err.message);
    });
    subscriber.on("error", (err) => {
      console.warn("Redis Subscriber Connection Error:", err.message);
    });

    await publisher.connect();
    await subscriber.connect();

    return {
      enabled: true,
      instanceId,
      async publish(event) {
        try {
          await publisher.publish(
            REDIS_CHANNEL,
            JSON.stringify({ ...event, sourceInstanceId: instanceId }),
          );
        } catch (error) {
          console.error("Failed to publish to Redis:", error.message);
        }
      },
      async subscribe(handler) {
        try {
          await subscriber.subscribe(REDIS_CHANNEL, async (message) => {
            try {
              const event = JSON.parse(message);
              if (event.sourceInstanceId === instanceId) {
                return;
              }

              await handler(event);
            } catch (error) {
              console.error("Redis event parse failed", error);
            }
          });
        } catch (error) {
          console.error("Failed to subscribe to Redis channel:", error.message);
        }
      },
      async disconnect() {
        await Promise.allSettled([publisher.quit(), subscriber.quit()]);
      },
    };
  } catch (error) {
    console.warn(
      `⚠️ Redis Pub/Sub connection failed (URL: ${redisUrl}). Gracefully falling back to in-memory orchestration. Error: ${error.message}`
    );
    return {
      enabled: false,
      instanceId,
      publish: async () => {},
      subscribe: async () => {},
      disconnect: async () => {},
    };
  }
}
