from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.trip_history import TripHistory

_ACTIVE_TRIP_STATUSES = ("assigned", "en_route", "in_progress")
_COMPLETED_TRIP_STATUS = "completed"


class DriverTripRepository:
    """Data access for trips associated with a driver."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def list_by_driver(self, driver_id: UUID, limit: int, offset: int) -> list[TripHistory]:
        statement = (
            select(TripHistory)
            .where(TripHistory.driver_id == driver_id)
            .order_by(TripHistory.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.session.scalars(statement).all())

    def count_by_driver(self, driver_id: UUID) -> int:
        statement = (
            select(func.count())
            .select_from(TripHistory)
            .where(TripHistory.driver_id == driver_id)
        )
        return self.session.scalar(statement) or 0

    def count_completed(self, driver_id: UUID) -> int:
        statement = (
            select(func.count())
            .select_from(TripHistory)
            .where(
                TripHistory.driver_id == driver_id,
                TripHistory.status == _COMPLETED_TRIP_STATUS,
            )
        )
        return self.session.scalar(statement) or 0

    def total_earnings(
        self,
        driver_id: UUID,
        since: datetime | None = None,
    ) -> Decimal:
        statement = (
            select(func.coalesce(func.sum(TripHistory.total_fare), 0))
            .where(
                TripHistory.driver_id == driver_id,
                TripHistory.status == _COMPLETED_TRIP_STATUS,
            )
        )
        if since is not None:
            statement = statement.where(TripHistory.completed_at >= since)
        return Decimal(self.session.scalar(statement) or 0)

    def get_active_trip(self, driver_id: UUID) -> TripHistory | None:
        statement = (
            select(TripHistory)
            .where(
                TripHistory.driver_id == driver_id,
                TripHistory.status.in_(_ACTIVE_TRIP_STATUSES),
            )
            .order_by(TripHistory.created_at.desc())
        )
        return self.session.scalars(statement).first()
