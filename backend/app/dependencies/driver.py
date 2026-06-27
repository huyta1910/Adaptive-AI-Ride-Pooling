from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseSession
from app.repositories.driver.driver_repository import DriverRepository
from app.repositories.driver.trip_repository import DriverTripRepository
from app.services.driver.driver_service import DriverService


def get_driver_repository(session: DatabaseSession) -> DriverRepository:
    return DriverRepository(session)


def get_driver_trip_repository(session: DatabaseSession) -> DriverTripRepository:
    return DriverTripRepository(session)


def get_driver_service(
    driver_repository: Annotated[DriverRepository, Depends(get_driver_repository)],
    trip_repository: Annotated[DriverTripRepository, Depends(get_driver_trip_repository)],
) -> DriverService:
    return DriverService(driver_repository, trip_repository)


DriverServiceDep = Annotated[DriverService, Depends(get_driver_service)]
