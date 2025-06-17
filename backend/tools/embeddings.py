from agents import function_tool
from openai import AsyncOpenAI


@function_tool
async def get_embeddings(texts: list[str]) -> list[list[float]]:
    """vectorise node texts with openai embeddings"""
    client = AsyncOpenAI() # Assumes OPENAI_API_KEY is set in environment
    resp = await client.embeddings.create(model="text-embedding-3-small", input=texts)
    return [d.embedding for d in resp.data]
