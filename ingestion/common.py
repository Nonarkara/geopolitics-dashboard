import os
import sys
from pathlib import Path
from typing import Callable, Optional, TypeVar

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")
load_dotenv(_ROOT / ".env.local", override=True)

T = TypeVar("T")

DEFAULT_PLACEHOLDERS = {
    "",
    "your_firms_key_here",
    "your_mapbox_token_here",
    "your_mapbox_access_token_here",
    "your_openai_api_key_here",
    "replace_with_a_long_random_token",
}

REQUEST_TIMEOUT_SECONDS = float(
    os.getenv("INGEST_REQUEST_TIMEOUT_SECONDS", "30").strip() or "30"
)


def allow_mock_ingestion() -> bool:
    return os.getenv("ALLOW_MOCK_INGESTION", "false").strip().lower() == "true"


def fallback_or_raise(reason: str, factory: Callable[[], T]) -> T:
    if allow_mock_ingestion():
        print(f"{reason} ALLOW_MOCK_INGESTION=true, using mock data instead.")
        return factory()

    raise RuntimeError(
        f"{reason} Refusing to ingest mock data into a real pipeline."
    )


def exit_with_error(prefix: str, error: Exception) -> int:
    print(f"{prefix}: {error}", file=sys.stderr)
    return 1


def is_value_configured(value: Optional[str], *extra_placeholders: str) -> bool:
    normalized = (value or "").strip()
    return bool(normalized) and normalized not in (
        DEFAULT_PLACEHOLDERS | set(extra_placeholders)
    )


def skip_job(message: str) -> int:
    print(message)
    return 0
