from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime

from app.ai_core.driver_assignment.constants import (
    ASSIGNMENT_STATUS_CANDIDATE_FOUND,
    ASSIGNMENT_STATUS_NO_DRIVER,
    DEFAULT_CREATED_AT_ISO,
    DRIVER_ENTITY_TYPE,
    OPTIMIZED_ROUTE_STATUS,
    PICKUP_POINT_ENTITY_TYPE,
    REASON_DRIVER_DOES_NOT_ACCEPT_POOL,
    REASON_DRIVER_NOT_IDLE,
    REASON_DRIVER_UNAVAILABLE,
    REASON_ENOUGH_CAPACITY,
    REASON_GOOD_RAIN_MODE_SCORE,
    REASON_GREEDY_MATCH_SELECTED,
    REASON_HIGH_ACCEPTANCE_RATE,
    REASON_HIGH_EXPECTED_EARNING,
    REASON_INSUFFICIENT_CAPACITY,
    REASON_LOW_ROUTE_RISK,
    REASON_NEAR_PICKUP_POINT,
    REASON_NO_FEASIBLE_DRIVER,
    REASON_PICKUP_DISTANCE_TOO_FAR,
    REASON_PICKUP_ETA_TOO_HIGH,
    REASON_ROUTE_RISK_TOO_HIGH,
    REASON_SHORT_PICKUP_ETA,
)
from app.ai_core.driver_assignment.schemas import (
    DriverAssignmentOutput,
    DriverAssignmentRequest,
    DriverAssignmentResponse,
    DriverSnapshotInput,
    OptimizedRouteInput,
    PickupCandidateInput,
    PoolGroupInput,
    RankedDriverCandidateOutput,
    RoutingMatrixEntryInput,
)
from app.ai_core.driver_assignment.scoring import (
    AssignmentScore,
    compute_assignment_score,
    expected_driver_earning_vnd,
)


@dataclass(frozen=True)
class FeasiblePair:
    route: OptimizedRouteInput
    pool_group: PoolGroupInput
    driver: DriverSnapshotInput
    pickup_candidate: PickupCandidateInput
    routing_entry: RoutingMatrixEntryInput
    score: AssignmentScore
    expected_driver_earning_vnd: int | None
    reason_codes: list[str]


def assign_drivers(request: DriverAssignmentRequest) -> DriverAssignmentResponse:
    pool_groups_by_id = {group.pool_group_id: group for group in request.pool_groups}
    pickup_candidates_by_id = {
        pickup.pickup_point_id: pickup for pickup in request.pickup_candidates if pickup.is_active
    }
    routing_entries_by_key = {
        _routing_key(entry.from_entity_id, entry.to_entity_id): entry
        for entry in request.routing_matrix
        if entry.from_entity_type == DRIVER_ENTITY_TYPE
        and entry.to_entity_type == PICKUP_POINT_ENTITY_TYPE
    }
    routes = sorted(request.optimized_routes, key=lambda route: route.optimized_route_id)

    feasible_pairs_by_route: dict[str, list[FeasiblePair]] = {
        route.optimized_route_id: [] for route in routes
    }
    all_feasible_pairs: list[FeasiblePair] = []

    for route in routes:
        pool_group = pool_groups_by_id.get(route.pool_group_id)
        pickup_candidate = pickup_candidates_by_id.get(route.pickup_point_id)
        if pool_group is None or pickup_candidate is None or route.status != OPTIMIZED_ROUTE_STATUS:
            continue

        for driver in sorted(request.drivers_snapshot, key=lambda item: item.driver_id):
            routing_entry = routing_entries_by_key.get(
                _routing_key(driver.driver_id, route.pickup_point_id)
            )
            if routing_entry is None:
                continue

            failure_reasons = _hard_filter_failure_reasons(
                route=route,
                pool_group=pool_group,
                driver=driver,
                routing_entry=routing_entry,
                request=request,
            )
            if failure_reasons:
                continue

            score = compute_assignment_score(
                driver=driver,
                pool_group=pool_group,
                eta_to_pickup_min=routing_entry.eta_min,
                distance_to_pickup_km=routing_entry.distance_km,
                route_to_pickup_risk_score=routing_entry.route_risk_score,
                pricing_context=request.pricing_context,
                config=request.algorithm_config,
            )
            pair = FeasiblePair(
                route=route,
                pool_group=pool_group,
                driver=driver,
                pickup_candidate=pickup_candidate,
                routing_entry=routing_entry,
                score=score,
                expected_driver_earning_vnd=expected_driver_earning_vnd(
                    driver,
                    request.pricing_context,
                ),
                reason_codes=_success_reason_codes(driver, pool_group, routing_entry, request),
            )
            feasible_pairs_by_route[route.optimized_route_id].append(pair)
            all_feasible_pairs.append(pair)

    selected_pairs = _select_greedy_pairs(all_feasible_pairs)
    created_at = datetime.fromisoformat(DEFAULT_CREATED_AT_ISO)

    driver_assignments = [
        _assignment_output_for_route(
            route=route,
            selected_pair=selected_pairs.get(route.optimized_route_id),
            created_at=created_at,
        )
        for route in routes
    ]
    ranked_driver_candidates = _ranked_candidates(
        feasible_pairs_by_route=feasible_pairs_by_route,
        selected_pairs=selected_pairs,
    )

    return DriverAssignmentResponse(
        driver_assignments=driver_assignments,
        ranked_driver_candidates=ranked_driver_candidates,
    )


def _routing_key(driver_id: str, pickup_point_id: str) -> tuple[str, str]:
    return driver_id, pickup_point_id


def _assignment_id(route_id: str) -> str:
    return f"DA_{route_id}"


def _hard_filter_failure_reasons(
    *,
    route: OptimizedRouteInput,
    pool_group: PoolGroupInput,
    driver: DriverSnapshotInput,
    routing_entry: RoutingMatrixEntryInput,
    request: DriverAssignmentRequest,
) -> list[str]:
    failure_reasons: list[str] = []

    if route.status != OPTIMIZED_ROUTE_STATUS:
        failure_reasons.append(REASON_NO_FEASIBLE_DRIVER)
    if not driver.available:
        failure_reasons.append(REASON_DRIVER_UNAVAILABLE)
    if driver.driver_status != "idle":
        failure_reasons.append(REASON_DRIVER_NOT_IDLE)
    if not driver.accepts_pool:
        failure_reasons.append(REASON_DRIVER_DOES_NOT_ACCEPT_POOL)
    if driver.vehicle_type != "car":
        failure_reasons.append(REASON_NO_FEASIBLE_DRIVER)
    if driver.capacity < pool_group.total_seat_count:
        failure_reasons.append(REASON_INSUFFICIENT_CAPACITY)
    if routing_entry.eta_min > request.algorithm_config.max_driver_pickup_eta_min:
        failure_reasons.append(REASON_PICKUP_ETA_TOO_HIGH)

    max_pickup_distance_km = driver.max_pickup_distance_km
    if max_pickup_distance_km is not None and routing_entry.distance_km > max_pickup_distance_km:
        failure_reasons.append(REASON_PICKUP_DISTANCE_TOO_FAR)

    risk_score = routing_entry.route_risk_score
    if risk_score is not None and risk_score > request.algorithm_config.max_allowed_flood_risk:
        failure_reasons.append(REASON_ROUTE_RISK_TOO_HIGH)

    return failure_reasons


def _success_reason_codes(
    driver: DriverSnapshotInput,
    pool_group: PoolGroupInput,
    routing_entry: RoutingMatrixEntryInput,
    request: DriverAssignmentRequest,
) -> list[str]:
    reason_codes = [
        REASON_SHORT_PICKUP_ETA,
        REASON_NEAR_PICKUP_POINT,
        REASON_ENOUGH_CAPACITY,
    ]

    if routing_entry.route_risk_score is None or routing_entry.route_risk_score <= 0.3:
        reason_codes.append(REASON_LOW_ROUTE_RISK)
    if driver.historical_acceptance_rate is not None and driver.historical_acceptance_rate >= 0.7:
        reason_codes.append(REASON_HIGH_ACCEPTANCE_RATE)
    if driver.rain_mode_acceptance_score is not None and driver.rain_mode_acceptance_score >= 0.7:
        reason_codes.append(REASON_GOOD_RAIN_MODE_SCORE)
    if (
        expected_driver_earning_vnd(driver, request.pricing_context) or 0
    ) >= request.algorithm_config.target_pool_bonus_vnd:
        reason_codes.append(REASON_HIGH_EXPECTED_EARNING)
    if driver.capacity >= pool_group.total_seat_count:
        reason_codes.append(REASON_ENOUGH_CAPACITY)

    return _deduplicate(reason_codes)


def _select_greedy_pairs(feasible_pairs: Iterable[FeasiblePair]) -> dict[str, FeasiblePair]:
    selected_by_route: dict[str, FeasiblePair] = {}
    used_driver_ids: set[str] = set()

    sorted_pairs = sorted(
        feasible_pairs,
        key=lambda pair: (
            pair.score.assignment_cost,
            pair.routing_entry.eta_min,
            pair.routing_entry.distance_km,
            pair.route.optimized_route_id,
            pair.driver.driver_id,
        ),
    )
    for pair in sorted_pairs:
        if pair.route.optimized_route_id in selected_by_route:
            continue
        if pair.driver.driver_id in used_driver_ids:
            continue
        selected_by_route[pair.route.optimized_route_id] = pair
        used_driver_ids.add(pair.driver.driver_id)

    return selected_by_route


def _assignment_output_for_route(
    *,
    route: OptimizedRouteInput,
    selected_pair: FeasiblePair | None,
    created_at: datetime,
) -> DriverAssignmentOutput:
    if selected_pair is None:
        return DriverAssignmentOutput(
            assignment_id=_assignment_id(route.optimized_route_id),
            optimized_route_id=route.optimized_route_id,
            pool_group_id=route.pool_group_id,
            driver_id=None,
            assignment_score=0.0,
            driver_eta_to_pickup_min=None,
            driver_distance_to_pickup_km=None,
            route_to_pickup_risk_score=None,
            expected_driver_earning_vnd=None,
            assignment_status=ASSIGNMENT_STATUS_NO_DRIVER,
            created_at=created_at,
            reason_codes=[REASON_NO_FEASIBLE_DRIVER],
        )

    return DriverAssignmentOutput(
        assignment_id=_assignment_id(route.optimized_route_id),
        optimized_route_id=route.optimized_route_id,
        pool_group_id=route.pool_group_id,
        driver_id=selected_pair.driver.driver_id,
        assignment_score=selected_pair.score.assignment_score,
        driver_eta_to_pickup_min=selected_pair.routing_entry.eta_min,
        driver_distance_to_pickup_km=selected_pair.routing_entry.distance_km,
        route_to_pickup_risk_score=selected_pair.routing_entry.route_risk_score,
        expected_driver_earning_vnd=selected_pair.expected_driver_earning_vnd,
        assignment_status=ASSIGNMENT_STATUS_CANDIDATE_FOUND,
        created_at=created_at,
        reason_codes=_deduplicate(
            [*selected_pair.reason_codes, REASON_GREEDY_MATCH_SELECTED],
        ),
    )


def _ranked_candidates(
    *,
    feasible_pairs_by_route: dict[str, list[FeasiblePair]],
    selected_pairs: dict[str, FeasiblePair],
) -> list[RankedDriverCandidateOutput]:
    candidates: list[RankedDriverCandidateOutput] = []
    for route_id in sorted(feasible_pairs_by_route):
        selected_driver_id = (
            selected_pairs[route_id].driver.driver_id if route_id in selected_pairs else None
        )
        ranked_pairs = sorted(
            feasible_pairs_by_route[route_id],
            key=lambda pair: (
                -pair.score.assignment_score,
                pair.routing_entry.eta_min,
                pair.routing_entry.distance_km,
                pair.driver.driver_id,
            ),
        )
        for rank, pair in enumerate(ranked_pairs, start=1):
            is_selected = pair.driver.driver_id == selected_driver_id
            reason_codes = (
                _deduplicate([*pair.reason_codes, REASON_GREEDY_MATCH_SELECTED])
                if is_selected
                else pair.reason_codes
            )
            candidates.append(
                RankedDriverCandidateOutput(
                    assignment_id=_assignment_id(route_id),
                    rank=rank,
                    driver_id=pair.driver.driver_id,
                    assignment_score=pair.score.assignment_score,
                    eta_to_pickup_min=pair.routing_entry.eta_min,
                    distance_to_pickup_km=pair.routing_entry.distance_km,
                    route_to_pickup_risk_score=pair.routing_entry.route_risk_score,
                    is_selected=is_selected,
                    reason_codes=reason_codes,
                ),
            )
    return candidates


def _deduplicate(reason_codes: list[str]) -> list[str]:
    return list(dict.fromkeys(reason_codes))
