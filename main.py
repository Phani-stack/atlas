import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))

import uvicorn
from atlas.api.main import app

__all__ = ["app", "main"]


def main():
    uvicorn.run("atlas.api.main:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    main()
