from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.driver import Driver
from app.models.notification import Notification
from app.models.passenger import Passenger
from app.models.ride_pool_group import RidePoolGroup
from app.models.ride_pool_member import RidePoolMember
from app.models.trip_history import TripHistory


class PoolRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_pending(self) -> list[RidePoolGroup]:
        stmt = (
            select(RidePoolGroup)
            .where(RidePoolGroup.status == "pending")
            .order_by(RidePoolGroup.created_at.desc())
        )
        return list(self.session.scalars(stmt).all())

    def get(self, group_id: UUID) -> RidePoolGroup | None:
        return self.session.get(RidePoolGroup, group_id)

    def get_members_with_bookings(
        self, group_id: UUID
    ) -> list[tuple[RidePoolMember, Booking | None]]:
        stmt = (
            select(RidePoolMember, Booking)
            .join(Booking, Booking.id == RidePoolMember.booking_id, isouter=True)
            .where(RidePoolMember.ride_pool_group_id == group_id)
            .order_by(RidePoolMember.created_at)
        )
        rows = self.session.execute(stmt).all()
        return [(row[0], row[1]) for row in rows]

    def get_driver(self, driver_id: UUID) -> Driver | None:
        return self.session.get(Driver, driver_id)

    def save(self, group: RidePoolGroup) -> RidePoolGroup:
        self.session.add(group)
        self.session.commit()
        self.session.refresh(group)
        return group

    def confirm_assignment(
        self,
        group: RidePoolGroup,
        driver: Driver,
        members_with_bookings: list[tuple[RidePoolMember, Booking | None]],
    ) -> RidePoolGroup:
        """Atomically attach a driver to a pool and propagate the acceptance.

        Marks the group active, confirms each member, moves the underlying
        bookings to ``assigned``, opens a ``trip_history`` row per booking so the
        ride surfaces on the driver's trips/dashboard, and notifies both sides.
        """
        group.status = "active"
        group.driver_id = driver.id
        self.session.add(group)

        for member, booking in members_with_bookings:
            member.status = "confirmed"
            self.session.add(member)
            if booking is None:
                continue
            booking.status = "assigned"
            self.session.add(booking)
            self.session.add(
                TripHistory(
                    booking_id=booking.id,
                    driver_id=driver.id,
                    status="assigned",
                )
            )
            passenger = self.session.get(Passenger, booking.passenger_id)
            if passenger is not None:
                self.session.add(
                    Notification(
                        user_id=passenger.user_id,
                        title="Driver assigned",
                        body=(
                            "A driver has accepted your pool and is heading to "
                            f"{booking.pickup_label}."
                        ),
                        status="unread",
                    )
                )

        self.session.add(
            Notification(
                user_id=driver.user_id,
                title="Pool confirmed",
                body=f"You accepted a pool with {len(members_with_bookings)} rider(s).",
                status="unread",
            )
        )

        self.session.commit()
        self.session.refresh(group)
        return group

    def complete_pool(self, group: RidePoolGroup, driver_id: UUID) -> RidePoolGroup:
        completed_at = datetime.now(UTC)
        group.status = "completed"
        self.session.add(group)

        members_with_bookings = self.get_members_with_bookings(group.id)
        for member, booking in members_with_bookings:
            member.status = "completed"
            self.session.add(member)
            if booking is None:
                continue

            booking.status = "completed"
            self.session.add(booking)

            trip_statement = select(TripHistory).where(
                TripHistory.booking_id == booking.id,
                (TripHistory.driver_id == driver_id) | (TripHistory.driver_id.is_(None)),
            )
            for trip in self.session.scalars(trip_statement).all():
                trip.status = "completed"
                trip.completed_at = trip.completed_at or completed_at
                if trip.total_fare is None:
                    trip.total_fare = booking.estimated_fare
                self.session.add(trip)

            passenger = self.session.get(Passenger, booking.passenger_id)
            if passenger is not None:
                self.session.add(
                    Notification(
                        user_id=passenger.user_id,
                        title="Ride completed",
                        body="Your pooled ride has been completed. You can book a new ride now.",
                        status="unread",
                    )
                )

        self.session.commit()
        self.session.refresh(group)
        return group
