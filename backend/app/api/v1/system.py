from fastapi import APIRouter

from app.config.settings import settings
from app.schemas.common import ApiResponse
from app.schemas.system import HealthStatus, ServiceStatus

router = APIRouter()


@router.get("/health", response_model=ApiResponse[HealthStatus])
async def health_check() -> ApiResponse[HealthStatus]:
    return ApiResponse(
        data=HealthStatus(status="ok"),
        message="Service is healthy",
    )


@router.get("/status", response_model=ApiResponse[ServiceStatus])
async def status_check() -> ApiResponse[ServiceStatus]:
    return ApiResponse(
        data=ServiceStatus(
            name=settings.project_name,
            environment=settings.environment,
            version=settings.api_version,
        ),
        message="Service status",
    )
