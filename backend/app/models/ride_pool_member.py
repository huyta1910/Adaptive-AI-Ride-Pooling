from uuid import UUID

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class RidePoolMember(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "ride_pool_members"

    ride_pool_group_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("ride_pool_groups.id"),
        nullable=False,
    )
    booking_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
