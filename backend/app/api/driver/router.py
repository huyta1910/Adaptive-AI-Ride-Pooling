from fastapi import APIRouter

from app.api.driver.dashboard import router as dashboard_router

driver_router = APIRouter()
driver_router.include_router(dashboard_router)
