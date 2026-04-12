import { EventEmitter } from "events";
import type Redis from "ioredis";
import { getRedis } from "../config/redis.js";
import { logger } from "./logger.js";

export type RealtimeEvent = {
  userId: string;
  type: "chat.message" | "notification.created" | "notification.updated";
  payload: Record<string, unknown>;
};

const realtimeBus = new EventEmitter();

realtimeBus.setMaxListeners(200);

const EVENT_NAME = "user-event";
const REDIS_CHANNEL = "ahg:realtime:user-events";
const INSTANCE_ID = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`;

type RealtimeEnvelope = {
  sourceInstanceId: string;
  event: RealtimeEvent;
};

let subscriber: Redis | null = null;
let redisBridgeBootstrapped = false;

const bootstrapRedisBridge = async (): Promise<void> => {
  if (redisBridgeBootstrapped) return;

  const publisher = getRedis();
  if (!publisher) return;

  redisBridgeBootstrapped = true;

  try {
    if (publisher.status === "wait") {
      await publisher.connect();
    }

    subscriber = publisher.duplicate({
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    subscriber.on("error", (error) => {
      logger.warn("realtime.redis_subscriber_error", { message: error.message });
    });

    if (subscriber.status === "wait") {
      await subscriber.connect();
    }

    subscriber.on("message", (_channel, message) => {
      try {
        const envelope = JSON.parse(message) as RealtimeEnvelope;
        if (envelope.sourceInstanceId === INSTANCE_ID) return;
        realtimeBus.emit(EVENT_NAME, envelope.event);
      } catch (error) {
        logger.warn("realtime.redis_parse_failed", {
          message: error instanceof Error ? error.message : "unknown",
        });
      }
    });

    await subscriber.subscribe(REDIS_CHANNEL);
  } catch (error) {
    redisBridgeBootstrapped = false;
    logger.warn("realtime.redis_bridge_unavailable", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
};

const publishToRedis = async (event: RealtimeEvent): Promise<void> => {
  const publisher = getRedis();
  if (!publisher) return;

  try {
    if (publisher.status === "wait") {
      await publisher.connect();
    }

    const envelope: RealtimeEnvelope = {
      sourceInstanceId: INSTANCE_ID,
      event,
    };

    await publisher.publish(REDIS_CHANNEL, JSON.stringify(envelope));
  } catch (error) {
    logger.warn("realtime.redis_publish_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
};

export const publishUserEvent = (
  userId: string,
  type: RealtimeEvent["type"],
  payload: RealtimeEvent["payload"]
): void => {
  const event = { userId, type, payload } satisfies RealtimeEvent;
  realtimeBus.emit(EVENT_NAME, event);
  void bootstrapRedisBridge();
  void publishToRedis(event);
};

export const subscribeUserEvents = (
  userId: string,
  listener: (event: RealtimeEvent) => void
): (() => void) => {
  void bootstrapRedisBridge();

  const wrapped = (event: RealtimeEvent) => {
    if (event.userId !== userId) return;
    listener(event);
  };

  realtimeBus.on(EVENT_NAME, wrapped);
  return () => {
    realtimeBus.off(EVENT_NAME, wrapped);
  };
};
