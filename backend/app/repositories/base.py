from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy.orm import Session

from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], session: Session) -> None:
        self.model = model
        self.session = session

    def get(self, entity_id: UUID) -> ModelType | None:
        return self.session.get(self.model, entity_id)
