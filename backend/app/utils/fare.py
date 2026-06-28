from decimal import Decimal
from math import asin, cos, radians, sin, sqrt


def estimate_fare(
    pickup_latitude: Decimal | None,
    pickup_longitude: Decimal | None,
    dropoff_latitude: Decimal | None,
    dropoff_longitude: Decimal | None,
    passenger_count: int = 1,
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
    return fare_from_distance_km(distance_km, passenger_count=passenger_count)


def fare_from_distance_m(distance_m: float | Decimal | None, passenger_count: int = 1) -> Decimal | None:
    if distance_m is None:
        return None

    distance_km = Decimal(str(distance_m)) / Decimal("1000")
    return fare_from_distance_km(distance_km, passenger_count=passenger_count)


def fare_from_distance_km(
    distance_km: float | Decimal,
    passenger_count: int = 1,
) -> Decimal:
    rider_count = max(1, passenger_count)
    fare = (Decimal(str(distance_km)) * Decimal("3000")) / Decimal(rider_count)
    return fare.quantize(Decimal("0.01"))


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
