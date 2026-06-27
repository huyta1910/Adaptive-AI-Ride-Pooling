import json

import pytest

from app.ai_core.driver_assignment.constants import (
    ASSIGNMENT_STATUS_CANDIDATE_FOUND,
    ASSIGNMENT_STATUS_NO_DRIVER,
    REASON_NO_FEASIBLE_DRIVER,
)
from app.ai_core.driver_assignment.schemas import (
    DriverAssignmentConfig,
    DriverAssignmentRequest,
    DriverSnapshotInput,
    OptimizedRouteInput,
    PickupCandidateInput,
    PoolGroupInput,
    PricingContextInput,
    RoutingMatrixEntryInput,
)
from app.ai_core.driver_assignment.scoring import compute_assignment_score
from app.ai_core.driver_assignment.service import assign_drivers


def test_raw_values_are_normalized_before_weighted_cost() -> None:
    score = compute_assignment_score(
        driver=_driver(
            historical_acceptance_rate=0.9,
            rain_mode_acceptance_score=0.8,
            max_pickup_distance_km=4.0,
        ),
        pool_group=_pool_group(total_seat_count=4),
        eta_to_pickup_min=10.0,
        distance_to_pickup_km=2.0,
        route_to_pickup_risk_score=0.2,
        pricing_context=PricingContextInput(driver_pool_bonus_vnd=15_000),
        config=DriverAssignmentConfig(max_driver_pickup_eta_min=20.0),
    )

    assert score.components.eta_cost == 0.5
    assert score.components.distance_cost == 0.5
    assert score.components.risk_cost == 0.2
    assert score.components.acceptance_cost == pytest.approx(0.1)
    assert score.components.rain_mode_cost == pytest.approx(0.2)
    assert score.assignment_cost == pytest.approx(0.31)
    assert score.assignment_score == pytest.approx(0.69)


def test_best_feasible_driver_is_selected_for_route() -> None:
    response = assign_drivers(
        _request(
            drivers_snapshot=[
                _driver(driver_id="D_SLOW", historical_acceptance_rate=0.6),
                _driver(driver_id="D_FAST", historical_acceptance_rate=0.9),
            ],
            routing_matrix=[
                _matrix(driver_id="D_SLOW", eta_min=10.0, distance_km=3.0, route_risk_score=0.3),
                _matrix(driver_id="D_FAST", eta_min=4.0, distance_km=1.0, route_risk_score=0.1),
            ],
        ),
    )

    assignment = response.driver_assignments[0]

    assert assignment.assignment_status == ASSIGNMENT_STATUS_CANDIDATE_FOUND
    assert assignment.driver_id == "D_FAST"
    assert assignment.assignment_score > 0


def test_driver_cannot_be_assigned_to_more_than_one_route() -> None:
    response = assign_drivers(
        _request(
            optimized_routes=[
                _route(optimized_route_id="OR001", pool_group_id="G001", pickup_point_id="PP001"),
                _route(optimized_route_id="OR002", pool_group_id="G002", pickup_point_id="PP002"),
            ],
            pool_groups=[
                _pool_group(pool_group_id="G001"),
                _pool_group(pool_group_id="G002"),
            ],
            pickup_candidates=[
                _pickup(pickup_point_id="PP001"),
                _pickup(pickup_point_id="PP002"),
            ],
            drivers_snapshot=[
                _driver(driver_id="D001"),
                _driver(driver_id="D002", historical_acceptance_rate=0.55),
            ],
            routing_matrix=[
                _matrix(driver_id="D001", pickup_point_id="PP001", eta_min=3.0),
                _matrix(driver_id="D001", pickup_point_id="PP002", eta_min=4.0),
                _matrix(driver_id="D002", pickup_point_id="PP001", eta_min=8.0),
                _matrix(driver_id="D002", pickup_point_id="PP002", eta_min=9.0),
            ],
        ),
    )

    assigned_driver_ids = [
        assignment.driver_id
        for assignment in response.driver_assignments
        if assignment.assignment_status == ASSIGNMENT_STATUS_CANDIDATE_FOUND
    ]

    assert len(assigned_driver_ids) == 2
    assert len(set(assigned_driver_ids)) == 2


def test_hard_filter_rejections_return_no_driver() -> None:
    cases = [
        (_driver(available=False), _matrix()),
        (_driver(driver_status="on_trip"), _matrix()),
        (_driver(accepts_pool=False), _matrix()),
        (_driver(capacity=1), _matrix()),
        (_driver(), _matrix(eta_min=30.0)),
        (_driver(), _matrix(route_risk_score=0.9)),
    ]

    for driver, routing_entry in cases:
        response = assign_drivers(
            _request(
                drivers_snapshot=[driver],
                routing_matrix=[routing_entry],
            ),
        )

        assignment = response.driver_assignments[0]

        assert assignment.assignment_status == ASSIGNMENT_STATUS_NO_DRIVER
        assert assignment.reason_codes == [REASON_NO_FEASIBLE_DRIVER]
        assert response.ranked_driver_candidates == []


def test_candidate_ordering_is_deterministic() -> None:
    response = assign_drivers(
        _request(
            drivers_snapshot=[
                _driver(driver_id="D002"),
                _driver(driver_id="D001"),
            ],
            routing_matrix=[
                _matrix(driver_id="D002"),
                _matrix(driver_id="D001"),
            ],
        ),
    )

    assert [candidate.driver_id for candidate in response.ranked_driver_candidates] == [
        "D001",
        "D002",
    ]
    assert response.driver_assignments[0].driver_id == "D001"


def test_output_is_json_serializable() -> None:
    response = assign_drivers(_request())

    dumped = response.model_dump(mode="json")

    assert json.loads(response.model_dump_json()) == dumped


def _request(
    *,
    optimized_routes: list[OptimizedRouteInput] | None = None,
    pool_groups: list[PoolGroupInput] | None = None,
    drivers_snapshot: list[DriverSnapshotInput] | None = None,
    pickup_candidates: list[PickupCandidateInput] | None = None,
    routing_matrix: list[RoutingMatrixEntryInput] | None = None,
) -> DriverAssignmentRequest:
    return DriverAssignmentRequest(
        optimized_routes=optimized_routes or [_route()],
        pool_groups=pool_groups or [_pool_group()],
        drivers_snapshot=drivers_snapshot or [_driver()],
        pickup_candidates=pickup_candidates or [_pickup()],
        routing_matrix=routing_matrix or [_matrix()],
        pricing_context=PricingContextInput(driver_pool_bonus_vnd=15_000),
        algorithm_config=DriverAssignmentConfig(
            max_driver_pickup_eta_min=15.0,
            max_allowed_flood_risk=0.65,
        ),
    )


def _route(
    *,
    optimized_route_id: str = "OR001",
    pool_group_id: str = "G001",
    pickup_point_id: str = "PP001",
) -> OptimizedRouteInput:
    return OptimizedRouteInput(
        optimized_route_id=optimized_route_id,
        pool_group_id=pool_group_id,
        pickup_point_id=pickup_point_id,
        total_eta_min=42.0,
        route_risk_score=0.2,
        route_efficiency_score=0.8,
        status="optimized",
    )


def _pool_group(
    *,
    pool_group_id: str = "G001",
    total_seat_count: int = 2,
) -> PoolGroupInput:
    return PoolGroupInput(
        pool_group_id=pool_group_id,
        num_passengers=total_seat_count,
        total_seat_count=total_seat_count,
    )


def _driver(
    *,
    driver_id: str = "D001",
    available: bool = True,
    driver_status: str = "idle",
    accepts_pool: bool = True,
    capacity: int = 4,
    historical_acceptance_rate: float | None = 0.9,
    rain_mode_acceptance_score: float | None = 0.8,
    max_pickup_distance_km: float | None = 5.0,
) -> DriverSnapshotInput:
    return DriverSnapshotInput(
        driver_id=driver_id,
        lat=10.78,
        lng=106.70,
        available=available,
        vehicle_type="car",
        capacity=capacity,
        driver_status=driver_status,
        accepts_pool=accepts_pool,
        max_pickup_distance_km=max_pickup_distance_km,
        historical_acceptance_rate=historical_acceptance_rate,
        rain_mode_acceptance_score=rain_mode_acceptance_score,
    )


def _pickup(*, pickup_point_id: str = "PP001") -> PickupCandidateInput:
    return PickupCandidateInput(
        pickup_point_id=pickup_point_id,
        lat=10.777,
        lng=106.701,
        flood_risk_score=0.1,
        traffic_risk_score=0.2,
    )


def _matrix(
    *,
    driver_id: str = "D001",
    pickup_point_id: str = "PP001",
    eta_min: float = 5.0,
    distance_km: float = 1.2,
    route_risk_score: float = 0.1,
) -> RoutingMatrixEntryInput:
    return RoutingMatrixEntryInput(
        from_entity_type="driver",
        from_entity_id=driver_id,
        to_entity_type="pickup_point",
        to_entity_id=pickup_point_id,
        distance_km=distance_km,
        eta_min=eta_min,
        route_risk_score=route_risk_score,
    )
