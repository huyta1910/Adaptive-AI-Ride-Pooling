from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseSession
from app.repositories.passenger import PassengerRepository
from app.services.passenger import PassengerService


def get_passenger_repository(session: DatabaseSession) -> PassengerRepository:
    return PassengerRepository(session)


PassengerRepositoryDependency = Annotated[
    PassengerRepository,
    Depends(get_passenger_repository),
]


def get_passenger_service(repository: PassengerRepositoryDependency) -> PassengerService:
    return PassengerService(repository)


PassengerServiceDependency = Annotated[
    PassengerService,
    Depends(get_passenger_service),
]
