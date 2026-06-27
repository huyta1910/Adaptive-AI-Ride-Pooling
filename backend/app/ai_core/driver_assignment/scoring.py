from dataclasses import dataclass

from app.ai_core.driver_assignment.schemas import (
    DriverAssignmentConfig,
    DriverSnapshotInput,
    PoolGroupInput,
    PricingContextInput,
)


@dataclass(frozen=True)
class NormalizedAssignmentCosts:
    eta_cost: float
    distance_cost: float
    risk_cost: float
    capacity_cost: float
    acceptance_cost: float
    rain_mode_cost: float
    earning_cost: float


@dataclass(frozen=True)
class AssignmentScore:
    assignment_cost: float
    assignment_score: float
    components: NormalizedAssignmentCosts


def clip(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return min(max(value, minimum), maximum)


def normalize_smaller_is_better(value: float, threshold: float) -> float:
    if threshold <= 0:
        return 1.0
    return clip(value / threshold)


def normalize_larger_is_better_cost(value: float | None, default_cost: float = 0.5) -> float:
    if value is None:
        return default_cost
    return 1.0 - clip(value)


def expected_driver_earning_vnd(
    driver: DriverSnapshotInput,
    pricing_context: PricingContextInput,
) -> int | None:
    if driver.expected_driver_earning_vnd is not None:
        return driver.expected_driver_earning_vnd
    return pricing_context.driver_pool_bonus_vnd


def compute_assignment_score(
    *,
    driver: DriverSnapshotInput,
    pool_group: PoolGroupInput,
    eta_to_pickup_min: float,
    distance_to_pickup_km: float,
    route_to_pickup_risk_score: float | None,
    pricing_context: PricingContextInput,
    config: DriverAssignmentConfig,
) -> AssignmentScore:
    max_pickup_distance_km = driver.max_pickup_distance_km or config.default_max_pickup_distance_km
    risk_score = route_to_pickup_risk_score if route_to_pickup_risk_score is not None else 0.0
    extra_capacity = driver.capacity - pool_group.total_seat_count
    earning_vnd = expected_driver_earning_vnd(driver, pricing_context)

    if earning_vnd is not None and driver.expected_driver_earning_vnd is not None:
        earning_score = clip(earning_vnd / config.target_driver_earning_vnd)
        earning_cost = 1.0 - earning_score
    elif earning_vnd is not None:
        earning_score = clip(earning_vnd / config.target_pool_bonus_vnd)
        earning_cost = 1.0 - earning_score
    else:
        earning_cost = 0.5

    components = NormalizedAssignmentCosts(
        eta_cost=normalize_smaller_is_better(eta_to_pickup_min, config.max_driver_pickup_eta_min),
        distance_cost=normalize_smaller_is_better(distance_to_pickup_km, max_pickup_distance_km),
        risk_cost=clip(risk_score),
        capacity_cost=normalize_smaller_is_better(
            float(extra_capacity),
            float(config.max_extra_capacity),
        ),
        acceptance_cost=normalize_larger_is_better_cost(driver.historical_acceptance_rate),
        rain_mode_cost=normalize_larger_is_better_cost(driver.rain_mode_acceptance_score),
        earning_cost=earning_cost,
    )

    assignment_cost = (
        config.weight_driver_pickup_eta * components.eta_cost
        + config.weight_distance * components.distance_cost
        + config.weight_flood_risk * components.risk_cost
        + config.weight_capacity * components.capacity_cost
        + config.weight_acceptance * components.acceptance_cost
        + config.weight_rain_mode * components.rain_mode_cost
        + config.weight_earning * components.earning_cost
    )
    assignment_cost = clip(assignment_cost)
    return AssignmentScore(
        assignment_cost=assignment_cost,
        assignment_score=clip(1.0 - assignment_cost),
        components=components,
    )
