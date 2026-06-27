from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

TData = TypeVar("TData")
TItem = TypeVar("TItem")


class ApiResponse(BaseModel, Generic[TData]):
    success: bool = True
    message: str
    data: TData


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    path: str
    details: dict[str, object] | None = None


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel, Generic[TItem]):
    model_config = ConfigDict(from_attributes=True)

    items: list[TItem]
    page: int
    page_size: int
    total: int
