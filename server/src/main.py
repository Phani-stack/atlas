"""Atlas API server entry point."""

import uvicorn

__all__ = ["main"]


def main() -> None:
    uvicorn.run("src.api.main:app", host="127.0.0.1", port=8000, reload=True)
