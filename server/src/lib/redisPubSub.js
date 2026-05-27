import crypto from "node:crypto";
import { createClient } from "redis";

const REDIS_CHANNEL = "live-collab:rooms";

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

  await publisher.connect();
  await subscriber.connect();

  return {
    enabled: true,
    instanceId,
    async publish(event) {
      await publisher.publish(
        REDIS_CHANNEL,
        JSON.stringify({ ...event, sourceInstanceId: instanceId }),
      );
    },
    async subscribe(handler) {
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
    },
    async disconnect() {
      await Promise.allSettled([publisher.quit(), subscriber.quit()]);
    },
  };
}
