import os
from dataclasses import dataclass
import redis.asyncio as redis
from supabase import create_client, Client

@dataclass
class AppCtx:
    supabase: Client
    redis: redis.Redis

def get_ctx() -> AppCtx:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    redis_url = os.getenv("REDIS_URL")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
    if not redis_url:
        raise ValueError("REDIS_URL must be set in environment variables")

    supa: Client = create_client(supabase_url, supabase_key)
    r: redis.Redis = redis.from_url(redis_url, decode_responses=True)
    return AppCtx(supabase=supa, redis=r) 