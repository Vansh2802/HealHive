from __future__ import annotations

from functools import lru_cache

from motor.motor_asyncio import AsyncIOMotorClient

from healhive_backend import settings


@lru_cache(maxsize=1)
def get_mongo_client() -> AsyncIOMotorClient:
    return AsyncIOMotorClient(
        settings.MONGODB_URI,
        maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
        minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
        serverSelectionTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
        retryWrites=True,
        appname='healhive-channels',
    )


def get_mongo_database():
    return get_mongo_client()[settings.MONGODB_DATABASE]


def get_messages_collection():
    return get_mongo_database()[settings.MONGODB_MESSAGES_COLLECTION]


async def close_mongo_client():
    client = get_mongo_client()
    client.close()