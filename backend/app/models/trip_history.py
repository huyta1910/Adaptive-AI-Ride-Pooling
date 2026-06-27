from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class TripHistory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trip_history"

    booking_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    driver_id: Mapped[UUID | None] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_fare: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
