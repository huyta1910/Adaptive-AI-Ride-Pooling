from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status

from app.repositories.driver.pool_repository import PoolRepository
from app.schemas.driver.pool import PoolPassenger, PoolRespondPayload, PoolSuggestion


class PoolService:
    def __init__(self, pool_repo: PoolRepository) -> None:
        self._pools = pool_repo

    def list_suggestions(self) -> list[PoolSuggestion]:
        groups = self._pools.list_pending()
        return [self._to_suggestion(g) for g in groups]

    def respond(self, group_id: UUID, payload: PoolRespondPayload) -> PoolSuggestion:
        group = self._pools.get(group_id)
        if group is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pool suggestion not found",
            )
        if group.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot respond to pool with status '{group.status}'",
            )
        group.status = "active" if payload.action == "accept" else "declined"
        self._pools.save(group)
        return self._to_suggestion(group)

    def _to_suggestion(self, group) -> PoolSuggestion:
        members_with_bookings = self._pools.get_members_with_bookings(group.id)
        passengers: list[PoolPassenger] = []
        total_fare = Decimal(0)
        for i, (_, booking) in enumerate(members_with_bookings):
            fare = booking.estimated_fare if booking else None
            passengers.append(
                PoolPassenger(
                    pickup_label=booking.pickup_label if booking else "Unknown",
                    dropoff_label=booking.dropoff_label if booking else "Unknown",
                    estimated_fare=fare,
                    stop_order=i + 1,
                )
            )
            if fare:
                total_fare += fare
        return PoolSuggestion(
            id=group.id,
            status=group.status,
            origin_area=group.origin_area,
            destination_area=group.destination_area,
            passengers=passengers,
            total_estimated_fare=total_fare,
            created_at=group.created_at,
        )
