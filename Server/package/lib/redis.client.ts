import { createClient, RedisClientType } from "redis";

const QUEUE_REDIS_URL = process.env.REDIS_QUEUE_URL ?? process.env.REDIS_URL ?? "redis://redis:6379";
const CACHE_REDIS_URL = process.env.REDIS_CACHE_URL ?? process.env.REDIS_URL ?? "redis://redis:6379";

let queueClient: RedisClientType | null = null;
let cacheClient: RedisClientType | null = null;

export async function getQueueRedisConnection(): Promise<RedisClientType> {
    if (!queueClient) {
        queueClient = createClient({ url: QUEUE_REDIS_URL }) as RedisClientType;

        queueClient.on("error", (err: Error) => {
            console.error("Redis queue cluster error:", err);
        });

        await queueClient.connect();
        console.log("redis queue cluster connected successfully");
    }

    return queueClient;
}

export async function getCacheRedisConnection(): Promise<RedisClientType> {
    if (!cacheClient) {
        cacheClient = createClient({ url: CACHE_REDIS_URL }) as RedisClientType;

        cacheClient.on("error", (err: Error) => {
            console.error("Redis cache cluster error:", err);
        });

        await cacheClient.connect();
        console.log("redis cache cluster connected successfully");
    }

    return cacheClient;
}

export async function createQueueWorkerClient(): Promise<RedisClientType> {
    const client = createClient({ url: QUEUE_REDIS_URL }) as RedisClientType;
    client.on("error", (err: Error) => {
        console.error("Redis queue worker client error:", err);
    });
    await client.connect();
    return client;
}
