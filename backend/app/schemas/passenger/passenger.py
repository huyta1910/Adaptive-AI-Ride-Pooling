from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class AddressInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    house_number: str = Field(default="", alias="houseNumber", max_length=60)
    street: str = Field(default="", max_length=120)
    province: str = Field(default="", max_length=120)
    ward: str = Field(default="", max_length=120)
    full_address: str = Field(default="", alias="fullAddress", max_length=255)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    place_id: str = Field(default="", alias="placeId", max_length=120)
    type: str | None = Field(default=None)

    @field_validator("house_number", "street", "province", "ward", "full_address", "place_id")
    @classmethod
    def trim_text(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def validate_resolved_address(self) -> "AddressInput":
        has_coordinates = self.latitude is not None and self.longitude is not None
        has_selected_location = bool(self.place_id) or has_coordinates
        has_exact_address = bool(self.house_number and self.street)

        if has_selected_location or has_exact_address:
            return self

        raise ValueError("Please enter a house number or choose a specific location.")

    def format_full_address(self) -> str:
        structured_address = ", ".join(
            part.strip()
            for part in [self.house_number, self.street, self.ward, self.province]
            if part.strip()
        )
        if self.ward and self.province:
            return structured_address

        if self.house_number and self.street:
            return structured_address

        return self.full_address or structured_address


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
