from fastapi import APIRouter

from app.api.driver import driver_router
from app.api.v1.system import router as system_router

api_router = APIRouter()
api_router.include_router(system_router, tags=["system"])
api_router.include_router(driver_router, prefix="/drivers", tags=["driver"])
