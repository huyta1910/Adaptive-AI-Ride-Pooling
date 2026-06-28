from datetime import UTC, datetime
from decimal import Decimal
from math import asin, cos, radians, sin, sqrt
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.notification import Notification
from app.models.passenger import Passenger
from app.models.ride_pool_group import RidePoolGroup
from app.models.ride_pool_member import RidePoolMember
from app.models.trip_history import TripHistory
from app.repositories.base import BaseRepository


class PassengerRepository(BaseRepository[Passenger]):
    def __init__(self, session: Session) -> None:
        super().__init__(Passenger, session)

    def get_by_id(self, passenger_id: UUID) -> Passenger | None:
        return self.get(passenger_id)

    def update_profile(self, passenger: Passenger, display_name: str) -> Passenger:
        passenger.display_name = display_name
        self.session.add(passenger)
        self.session.commit()
        self.session.refresh(passenger)
        return passenger

    def create_ride_request(
        self,
        passenger_id: UUID,
        user_id: UUID,
        pickup_label: str,
        dropoff_label: str,
        pickup_latitude: Decimal | None,
        pickup_longitude: Decimal | None,
        dropoff_latitude: Decimal | None,
        dropoff_longitude: Decimal | None,
    ) -> Booking:
        booking = Booking(
            passenger_id=passenger_id,
            pickup_label=pickup_label,
            dropoff_label=dropoff_label,
            pickup_latitude=pickup_latitude,
            pickup_longitude=pickup_longitude,
            dropoff_latitude=dropoff_latitude,
            dropoff_longitude=dropoff_longitude,
            status="matching",
            requested_at=datetime.now(UTC),
            estimated_fare=_estimate_fare(
                pickup_latitude,
                pickup_longitude,
                dropoff_latitude,
                dropoff_longitude,
            ),
        )
        self.session.add(booking)

        # The booking enters the matching queue (status "matching"). The AI
        # matcher (app.services.matching) groups compatible requests into shared
        # pools afterward — it is triggered from the passenger service.
        self.session.add(
            Notification(
                user_id=user_id,
                title="Looking for a pool",
                body=(
                    f"We are matching your ride from {pickup_label} to "
                    f"{dropoff_label} with nearby drivers."
                ),
                status="unread",
            )
        )

        self.session.commit()
        self.session.refresh(booking)
        return booking

    def get_latest_ride(self, passenger_id: UUID) -> Booking | None:
        statement = (
            select(Booking)
            .where(Booking.passenger_id == passenger_id)
            .order_by(Booking.requested_at.desc())
            .limit(1)
        )
        return self.session.scalars(statement).first()

    def get_current_ride(self, passenger_id: UUID) -> Booking | None:
        active_statuses = ("requested", "matching", "matched", "assigned", "in_progress")
        statement = (
            select(Booking)
            .where(Booking.passenger_id == passenger_id, Booking.status.in_(active_statuses))
            .order_by(Booking.requested_at.desc())
            .limit(1)
        )
        return self.session.scalars(statement).first()

    def cancel_ride_request(self, booking: Booking) -> Booking:
        booking.status = "cancelled"
        if booking.estimated_fare is None:
            booking.estimated_fare = _estimate_fare(
                booking.pickup_latitude,
                booking.pickup_longitude,
                booking.dropoff_latitude,
                booking.dropoff_longitude,
            )
        self.session.add(booking)

        trip_statement = select(TripHistory).where(TripHistory.booking_id == booking.id)
        trips = list(self.session.scalars(trip_statement).all())
        for trip in trips:
            trip.status = "cancelled"
            if trip.total_fare is None:
                trip.total_fare = booking.estimated_fare
            if trip.completed_at is None:
                trip.completed_at = datetime.now(UTC)
            self.session.add(trip)

        member_statement = select(RidePoolMember).where(RidePoolMember.booking_id == booking.id)
        members = list(self.session.scalars(member_statement).all())
        for member in members:
            member.status = "cancelled"
            self.session.add(member)

        group_ids = {member.ride_pool_group_id for member in members}
        for group_id in group_ids:
            remaining_statement = (
                select(func.count())
                .select_from(RidePoolMember)
                .join(Booking, Booking.id == RidePoolMember.booking_id)
                .where(
                    RidePoolMember.ride_pool_group_id == group_id,
                    Booking.status.in_(("requested", "matching", "assigned", "in_progress")),
                )
            )
            remaining_active_members = int(self.session.scalar(remaining_statement) or 0)
            if remaining_active_members == 0:
                group = self.session.get(RidePoolGroup, group_id)
                if group is not None and group.status in {"pending", "active"}:
                    group.status = "cancelled"
                    self.session.add(group)

        self.session.commit()
        self.session.refresh(booking)
        return booking

    def list_ride_history(self, passenger_id: UUID, limit: int = 10) -> list[tuple[TripHistory, Booking]]:
        statement: Select[tuple[TripHistory, Booking]] = (
            select(TripHistory, Booking)
            .join(Booking, TripHistory.booking_id == Booking.id)
            .where(Booking.passenger_id == passenger_id)
            .order_by(TripHistory.completed_at.desc().nullslast(), Booking.requested_at.desc())
            .limit(limit)
        )
        return list(self.session.execute(statement).tuples().all())

    def list_notifications(self, user_id: UUID, limit: int = 10) -> list[Notification]:
        statement = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return list(self.session.scalars(statement).all())

    def mark_notification_read(self, notification_id: UUID, user_id: UUID) -> Notification | None:
        statement = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        notification = self.session.scalars(statement).first()
        if notification is None:
            return None

        notification.status = "read"
        self.session.add(notification)
        self.session.commit()
        self.session.refresh(notification)
        return notification

    def count_completed_rides(self, passenger_id: UUID) -> int:
        statement = (
            select(func.count())
            .select_from(TripHistory)
            .join(Booking, TripHistory.booking_id == Booking.id)
            .where(Booking.passenger_id == passenger_id, TripHistory.status == "completed")
        )
        return int(self.session.scalar(statement) or 0)


def _estimate_fare(
    pickup_latitude: Decimal | None,
    pickup_longitude: Decimal | None,
    dropoff_latitude: Decimal | None,
    dropoff_longitude: Decimal | None,
) -> Decimal | None:
    if (
        pickup_latitude is None
        or pickup_longitude is None
        or dropoff_latitude is None
        or dropoff_longitude is None
    ):
        return None

    distance_km = _haversine_km(
        float(pickup_latitude),
        float(pickup_longitude),
        float(dropoff_latitude),
        float(dropoff_longitude),
    )
    fare = max(18_000, 12_000 + (distance_km * 7_000))
    return Decimal(str(round(fare, -3))).quantize(Decimal("0.01"))


def _haversine_km(
    pickup_latitude: float,
    pickup_longitude: float,
    dropoff_latitude: float,
    dropoff_longitude: float,
) -> float:
    earth_radius_km = 6371.0
    lat_delta = radians(dropoff_latitude - pickup_latitude)
    lon_delta = radians(dropoff_longitude - pickup_longitude)
    pickup_lat_rad = radians(pickup_latitude)
    dropoff_lat_rad = radians(dropoff_latitude)

    a = (
        sin(lat_delta / 2) ** 2
        + cos(pickup_lat_rad) * cos(dropoff_lat_rad) * sin(lon_delta / 2) ** 2
    )
    return earth_radius_km * 2 * asin(sqrt(a))
