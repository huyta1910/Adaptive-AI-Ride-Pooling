from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DriverTripStatus(str, Enum):
    assigned = "assigned"
    en_route = "en_route"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class DriverTripRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    booking_id: UUID
    driver_id: UUID | None
    status: str
    total_fare: Decimal | None
    completed_at: datetime | None
    created_at: datetime


class DriverTripDetail(DriverTripRead):
    pickup_label: str | None = None
    dropoff_label: str | None = None
    requested_at: datetime | None = None
    estimated_fare: Decimal | None = None


class TripStatusUpdate(BaseModel):
    status: DriverTripStatus
