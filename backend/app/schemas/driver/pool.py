from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class PoolPassenger(BaseModel):
    pickup_label: str
    dropoff_label: str
    estimated_fare: Decimal | None
    stop_order: int


class PoolSuggestion(BaseModel):
    id: UUID
    status: str
    origin_area: str | None
    destination_area: str | None
    passengers: list[PoolPassenger]
    total_estimated_fare: Decimal
    created_at: datetime


class PoolRespondPayload(BaseModel):
    action: Literal["accept", "decline"]
