from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.ai_core.driver_assignment.constants import (
    DEFAULT_MAX_ALLOWED_FLOOD_RISK,
    DEFAULT_MAX_DRIVER_PICKUP_ETA_MIN,
    DEFAULT_MAX_EXTRA_CAPACITY,
    DEFAULT_MAX_PICKUP_DISTANCE_KM,
    DEFAULT_TARGET_DRIVER_EARNING_VND,
    DEFAULT_TARGET_POOL_BONUS_VND,
    WEIGHT_ACCEPTANCE_COST,
    WEIGHT_CAPACITY_COST,
    WEIGHT_DISTANCE_COST,
    WEIGHT_EARNING_COST,
    WEIGHT_ETA_COST,
    WEIGHT_RAIN_MODE_COST,
    WEIGHT_RISK_COST,
)


class DriverAssignmentBaseModel(BaseModel):
    model_config = ConfigDict(extra="ignore")


class OptimizedRouteInput(DriverAssignmentBaseModel):
    optimized_route_id: str
    pool_group_id: str
    pickup_point_id: str
    total_eta_min: float | None = None
    route_risk_score: float | None = None
    route_efficiency_score: float | None = None
    status: str = "optimized"
    event_id: str | None = None
    total_distance_km: float | None = None


class PoolGroupInput(DriverAssignmentBaseModel):
    pool_group_id: str
    num_passengers: int
    total_seat_count: int
    event_id: str | None = None
    pickup_point_id: str | None = None
    group_compatibility_score: float | None = None
    status: str | None = None


class DriverSnapshotInput(DriverAssignmentBaseModel):
    driver_id: str
    lat: float
    lng: float
    available: bool
    vehicle_type: str
    capacity: int
    driver_status: str
    accepts_pool: bool
    event_id: str | None = None
    grid_id: str | None = None
    available_at: datetime | None = None
    max_pickup_distance_km: float | None = None
    historical_acceptance_rate: float | None = None
    rain_mode_acceptance_score: float | None = None
    avg_rating: float | None = None
    last_updated_at: datetime | None = None
    expected_driver_earning_vnd: int | None = None


class PickupCandidateInput(DriverAssignmentBaseModel):
    pickup_point_id: str
    lat: float
    lng: float
    flood_risk_score: float | None = None
    traffic_risk_score: float | None = None
    event_id: str | None = None
    name: str | None = None
    grid_id: str | None = None
    stop_feasibility_score: float | None = None
    is_active: bool = True


class RoutingMatrixEntryInput(DriverAssignmentBaseModel):
    from_entity_type: str
    from_entity_id: str
    to_entity_type: str
    to_entity_id: str
    distance_km: float
    eta_min: float
    route_risk_score: float | None = None
    matrix_id: str | None = None
    event_id: str | None = None


class PricingContextInput(DriverAssignmentBaseModel):
    driver_pool_bonus_vnd: int | None = None
    rain_surcharge_multiplier: float = 1.0
    currency: str = "VND"


class DriverAssignmentConfig(DriverAssignmentBaseModel):
    max_driver_pickup_eta_min: float = DEFAULT_MAX_DRIVER_PICKUP_ETA_MIN
    max_allowed_flood_risk: float = DEFAULT_MAX_ALLOWED_FLOOD_RISK
    weight_driver_pickup_eta: float = WEIGHT_ETA_COST
    weight_flood_risk: float = WEIGHT_RISK_COST
    weight_distance: float = WEIGHT_DISTANCE_COST
    weight_capacity: float = WEIGHT_CAPACITY_COST
    weight_acceptance: float = WEIGHT_ACCEPTANCE_COST
    weight_rain_mode: float = WEIGHT_RAIN_MODE_COST
    weight_earning: float = WEIGHT_EARNING_COST
    default_max_pickup_distance_km: float = DEFAULT_MAX_PICKUP_DISTANCE_KM
    max_extra_capacity: int = DEFAULT_MAX_EXTRA_CAPACITY
    target_driver_earning_vnd: int = DEFAULT_TARGET_DRIVER_EARNING_VND
    target_pool_bonus_vnd: int = DEFAULT_TARGET_POOL_BONUS_VND


class DriverAssignmentRequest(DriverAssignmentBaseModel):
    optimized_routes: list[OptimizedRouteInput] = Field(default_factory=list)
    pool_groups: list[PoolGroupInput] = Field(default_factory=list)
    drivers_snapshot: list[DriverSnapshotInput] = Field(default_factory=list)
    pickup_candidates: list[PickupCandidateInput] = Field(default_factory=list)
    routing_matrix: list[RoutingMatrixEntryInput] = Field(default_factory=list)
    pricing_context: PricingContextInput = Field(default_factory=PricingContextInput)
    algorithm_config: DriverAssignmentConfig = Field(default_factory=DriverAssignmentConfig)


class DriverAssignmentOutput(DriverAssignmentBaseModel):
    assignment_id: str
    optimized_route_id: str
    pool_group_id: str
    driver_id: str | None
    assignment_score: float
    driver_eta_to_pickup_min: float | None
    driver_distance_to_pickup_km: float | None
    route_to_pickup_risk_score: float | None
    expected_driver_earning_vnd: int | None
    assignment_status: str
    created_at: datetime
    reason_codes: list[str]


class RankedDriverCandidateOutput(DriverAssignmentBaseModel):
    assignment_id: str
    rank: int
    driver_id: str
    assignment_score: float
    eta_to_pickup_min: float
    distance_to_pickup_km: float
    route_to_pickup_risk_score: float | None
    is_selected: bool
    reason_codes: list[str]


class DriverAssignmentResponse(DriverAssignmentBaseModel):
    driver_assignments: list[DriverAssignmentOutput]
    ranked_driver_candidates: list[RankedDriverCandidateOutput]
