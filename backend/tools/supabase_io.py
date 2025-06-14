"""Helpers for reading and writing data to Supabase.

Each function is exposed as an agent tool via the ``function_tool`` decorator so
that agents can persist and retrieve session and concept information.
"""

from agents import function_tool
from backend.deps import AppCtx
from postgrest.exceptions import APIError


class SupabasePermissionError(Exception):
    """Raised when Supabase rejects a request due to missing permissions."""


def _check_permission(err: Exception):
    """Raise ``SupabasePermissionError`` for 401/403 API errors."""

    if isinstance(err, APIError) and err.code in {"401", "403"}:
        raise SupabasePermissionError(err.message or "permission denied") from err

async def _get_session_data(ctx: AppCtx, session_id: str) -> dict:
    """Return a single session row by ``session_id``."""

    try:
        res = (
            await ctx.supabase.table("sessions")
            .select("*")
            .eq("id", session_id)
            .maybe_single()
            .execute()
        )
        return res.data if res and res.data else {}
    except Exception as err:  # pragma: no cover - error mapping
        _check_permission(err)
        raise


async def _save_session(ctx: AppCtx, session: dict) -> str:
    """Insert a new session and return its ``id``."""

    try:
        res = (
            await ctx.supabase.table("sessions")
            .insert(session)
            .single()
            .execute()
        )
        return res.data.get("id") if res and res.data else ""
    except Exception as err:  # pragma: no cover - error mapping
        _check_permission(err)
        raise


async def _save_concept(ctx: AppCtx, concept: dict) -> str:
    """Insert a concept and return its ``id``."""

    try:
        res = (
            await ctx.supabase.table("concepts")
            .insert(concept)
            .single()
            .execute()
        )
        return res.data.get("id") if res and res.data else ""
    except Exception as err:  # pragma: no cover - error mapping
        _check_permission(err)
        raise


# Expose wrapped functions as agent tools with public names
@function_tool(strict_mode=False)
async def get_session_data(ctx: AppCtx, session_id: str) -> dict:
    return await _get_session_data(ctx, session_id)


@function_tool(strict_mode=False)
async def save_session(ctx: AppCtx, session: dict) -> str:
    return await _save_session(ctx, session)


@function_tool(strict_mode=False)
async def save_concept(ctx: AppCtx, concept: dict) -> str:
    return await _save_concept(ctx, concept)

# keep references for testing
__all__ = [
    "get_session_data",
    "save_session",
    "save_concept",
    "SupabasePermissionError",
    "_get_session_data",
    "_save_session",
    "_save_concept",
]
