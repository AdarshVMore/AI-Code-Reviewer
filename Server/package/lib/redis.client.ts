import { createClient, RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://redis:6379";

let redisClient : RedisClientType | null = null

export async function getRedisConnection():Promise<RedisClientType> {
    if(!redisClient){
        redisClient = createClient({ url: REDIS_URL }) as RedisClientType

        redisClient.on("error", (err:Error)=>{
            console.error("Redis Error:", err);
        })

        await redisClient.connect()
        console.log("redis client connected successfully")
    }

    return redisClient
}

// Workers that call brPop need their own dedicated connection —
// brPop blocks the TCP socket, so sharing one connection across
// multiple workers means only the first brPop ever executes.
export async function createWorkerRedisClient():Promise<RedisClientType> {
    const client = createClient({ url: REDIS_URL }) as RedisClientType
    client.on("error", (err: Error) => {
        console.error("Redis worker client error:", err);
    })
    await client.connect()
    return client
}