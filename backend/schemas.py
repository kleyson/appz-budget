"""Pydantic schemas for request/response validation"""
from pydantic import BaseModel
from typing import Optional


class ExpenseBase(BaseModel):
    expense_name: str
    period: str
    category: str
    budget: float = 0.0
    cost: float = 0.0
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    expense_name: Optional[str] = None
    period: Optional[str] = None
    category: Optional[str] = None
    budget: Optional[float] = None
    cost: Optional[float] = None
    notes: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: int

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    name: str


class CategorySummary(BaseModel):
    category: str
    budget: float
    total: float
    over_budget: bool


class PeriodResponse(BaseModel):
    name: str


class CategoryCreate(BaseModel):
    name: str


class CategoryUpdate(BaseModel):
    name: str


class CategoryFullResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class PeriodCreate(BaseModel):
    name: str


class PeriodUpdate(BaseModel):
    name: str


class PeriodFullResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
