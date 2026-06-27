from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DriverTripRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    booking_id: UUID
    driver_id: UUID | None
    status: str
    total_fare: Decimal | None
    completed_at: datetime | None
    created_at: datetime
