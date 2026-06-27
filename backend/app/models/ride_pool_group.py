from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class RidePoolGroup(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "ride_pool_groups"

    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    origin_area: Mapped[str | None] = mapped_column(String(255), nullable=True)
    destination_area: Mapped[str | None] = mapped_column(String(255), nullable=True)
