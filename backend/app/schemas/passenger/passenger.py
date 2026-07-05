from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AddressInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    house_number: str = Field(alias="houseNumber", min_length=1, max_length=60)
    street: str = Field(min_length=1, max_length=120)
    province: str = Field(min_length=1, max_length=120)
    ward: str = Field(min_length=1, max_length=120)

    @field_validator("house_number", "street", "province", "ward")
    @classmethod
    def require_non_blank(cls, value: str) -> str:
        stripped_value = value.strip()
        if not stripped_value:
            raise ValueError("Field is required.")
        return stripped_value

    def format_full_address(self) -> str:
        return ", ".join(
            part.strip()
            for part in [self.house_number, self.street, self.ward, self.province]
            if part.strip()
        )


class RideRequestCreate(BaseModel):
    pickup_address: AddressInput
    dropoff_address: AddressInput
    pickup_label: str | None = Field(default=None, min_length=3, max_length=255)
    dropoff_label: str | None = Field(default=None, min_length=3, max_length=255)
    pickup_latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    pickup_longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    dropoff_latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    dropoff_longitude: Decimal | None = Field(default=None, ge=-180, le=180)


class PassengerProfileUpdate(BaseModel):
    display_name: str = Field(min_length=2, max_length=120)


class PassengerProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    display_name: str
    updated_at: datetime


class RideRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    passenger_id: UUID
    pickup_label: str
    dropoff_label: str
    pickup_latitude: Decimal | None
    pickup_longitude: Decimal | None
    dropoff_latitude: Decimal | None
    dropoff_longitude: Decimal | None
    status: str
    requested_at: datetime
    estimated_fare: Decimal | None


class RideStatusRead(BaseModel):
    current_ride: RideRequestRead | None
    next_step: str


class RideHistoryRead(BaseModel):
    id: UUID
    booking_id: UUID
    pickup_label: str
    dropoff_label: str
    pickup_latitude: Decimal | None
    pickup_longitude: Decimal | None
    dropoff_latitude: Decimal | None
    dropoff_longitude: Decimal | None
    status: str
    requested_at: datetime
    completed_at: datetime | None
    total_fare: Decimal | None


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    body: str
    status: str
    category: str = "general"
    created_at: datetime


class PassengerDashboardRead(BaseModel):
    profile: PassengerProfileRead
    current_ride: RideRequestRead | None
    recent_rides: list[RideHistoryRead]
    notifications: list[NotificationRead]
