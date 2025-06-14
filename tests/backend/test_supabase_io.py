import sys
from pathlib import Path
import asyncio
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(ROOT))

from dataclasses import dataclass
import types


@dataclass
class AppCtx:
    supabase: object
    redis: object | None = None

fake_deps = types.ModuleType("backend.deps")
fake_deps.AppCtx = AppCtx
sys.modules["backend.deps"] = fake_deps

from backend.tools import supabase_io
from backend.tools.supabase_io import SupabasePermissionError, APIError

class DummyClient:
    """Simple object to attach mocked methods to."""
    pass


@pytest.fixture
def ctx(mocker):
    client = DummyClient()
    return AppCtx(supabase=client, redis=None)


def _mock_chain(mocker, result):
    execute = mocker.AsyncMock(return_value=result)
    single = mocker.Mock(return_value=mocker.Mock(execute=execute))
    insert = mocker.Mock(return_value=mocker.Mock(single=single))
    select = mocker.Mock(return_value=mocker.Mock(eq=mocker.Mock(return_value=mocker.Mock(maybe_single=mocker.Mock(return_value=mocker.Mock(execute=execute))))) )
    table_obj = mocker.Mock(insert=insert, select=select)
    return table_obj, execute


def test_get_session_data(ctx, mocker):
    table_obj, _ = _mock_chain(mocker, mocker.Mock(data={"id": "123"}))
    ctx.supabase.table = mocker.Mock(return_value=table_obj)

    data = asyncio.run(supabase_io._get_session_data(ctx, "123"))
    assert data == {"id": "123"}
    ctx.supabase.table.assert_called_with("sessions")


def test_save_session(ctx, mocker):
    table_obj, _ = _mock_chain(mocker, mocker.Mock(data={"id": "55"}))
    ctx.supabase.table = mocker.Mock(return_value=table_obj)

    sid = asyncio.run(supabase_io._save_session(ctx, {"foo": 1}))
    assert sid == "55"
    ctx.supabase.table.assert_called_with("sessions")


def test_save_concept_permission_error(ctx, mocker):
    api_err = supabase_io.APIError({"message": "no", "code": "401"})
    execute = mocker.AsyncMock(side_effect=api_err)
    single = mocker.Mock(return_value=mocker.Mock(execute=execute))
    table_obj = mocker.Mock(insert=mocker.Mock(return_value=mocker.Mock(single=single)))
    ctx.supabase.table = mocker.Mock(return_value=table_obj)

    with pytest.raises(SupabasePermissionError):
        asyncio.run(supabase_io._save_concept(ctx, {"a": 1}))

