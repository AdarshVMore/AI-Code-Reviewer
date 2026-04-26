import { createClient, RedisClientType } from "redis";

let redisClient : RedisClientType | null = null

export async function getRedisConnection():Promise<RedisClientType> {
    if(!redisClient){
        redisClient = createClient({
            url:"redis://redis:6379"
        })

        redisClient.on("error", (err:Error)=>{
            console.error("Redis Error:", err);
        })

        await redisClient.connect()

        console.log("redis client connected sucessexfully")
    }

    return redisClient
}