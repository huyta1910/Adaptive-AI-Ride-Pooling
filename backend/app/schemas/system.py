from pydantic import BaseModel


class HealthStatus(BaseModel):
    status: str


class ServiceStatus(BaseModel):
    name: str
    environment: str
    version: str
