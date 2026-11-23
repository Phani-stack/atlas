from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from ..config import PROJECT_ROOT
from .auth_routes import router as auth_router
from .routes import router
from .spaces import router as spaces_router
from .space_tutor import router as space_tutor_router
from .tutor import router as tutor_router

app = FastAPI(title="Resource Atlas API", version="1.0.0")
app.include_router(router)
app.include_router(auth_router)
app.include_router(spaces_router)
app.include_router(space_tutor_router)
app.include_router(tutor_router)

ui_dist = PROJECT_ROOT / "ui" / "dist"
if ui_dist.is_dir():
    app.mount("/", StaticFiles(directory=ui_dist, html=True), name="ui")


def main() -> None:
    import uvicorn

    uvicorn.run("src.api.main:app", host="127.0.0.1", port=8000, reload=True)
