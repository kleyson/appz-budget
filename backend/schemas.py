"""Pydantic schemas for request/response validation"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class Purchase(BaseModel):
    name: str
    amount: float


class ExpenseBase(BaseModel):
    expense_name: str
    period: str
    category: str
    budget: float = 0.0
    cost: float = 0.0
    notes: str | None = None
    month_id: int
    purchases: list[Purchase] | None = None
    order: int = 0


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    expense_name: str | None = None
    period: str | None = None
    category: str | None = None
    budget: float | None = None
    cost: float | None = None
    notes: str | None = None
    month_id: int | None = None
    purchases: list[Purchase] | None = None
    order: int | None = None


class ExpenseResponse(ExpenseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None
    updated_by: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ExpenseReorderRequest(BaseModel):
    expense_ids: list[int]  # List of expense IDs in the desired order


class CategoryResponse(BaseModel):
    name: str


class CategorySummary(BaseModel):
    category: str
    budget: float
    total: float
    over_budget: bool


class IncomeTypeSummary(BaseModel):
    income_type: str
    budget: float
    total: float


class SummaryTotals(BaseModel):
    total_budgeted_expenses: float
    total_current_expenses: float
    total_budgeted_income: float
    total_current_income: float
    total_budgeted: float
    total_current: float


class PeriodResponse(BaseModel):
    name: str


class CategoryCreate(BaseModel):
    name: str
    color: str | None = None


class CategoryUpdate(BaseModel):
    name: str
    color: str | None = None


class CategoryFullResponse(BaseModel):
    id: int
    name: str
    color: str
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None
    updated_by: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PeriodCreate(BaseModel):
    name: str
    color: str | None = None


class PeriodUpdate(BaseModel):
    name: str
    color: str | None = None


class PeriodFullResponse(BaseModel):
    id: int
    name: str
    color: str
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None
    updated_by: str | None = None

    model_config = ConfigDict(from_attributes=True)


class MonthBase(BaseModel):
    year: int
    month: int  # 1-12
    name: str
    start_date: str  # ISO date string
    end_date: str  # ISO date string


class MonthCreate(BaseModel):
    year: int
    month: int  # 1-12


class MonthUpdate(BaseModel):
    year: int | None = None
    month: int | None = None
    name: str | None = None
    start_date: str | None = None
    end_date: str | None = None


class MonthResponse(BaseModel):
    id: int
    year: int
    month: int
    name: str
    start_date: str
    end_date: str
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None
    updated_by: str | None = None

    model_config = ConfigDict(from_attributes=True)


# Authentication schemas
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ForgotPasswordResponse(BaseModel):
    message: str
    token: str | None = None  # Only for development, remove in production


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ResetPasswordResponse(BaseModel):
    message: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ChangePasswordResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None
    updated_by: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    email: str | None = None
    full_name: str | None = None
    is_active: bool | None = None
    is_admin: bool | None = None


class UserCreateAdmin(BaseModel):
    email: str
    password: str
    full_name: str | None = None
    is_active: bool = True
    is_admin: bool = False


class CloneExpensesResponse(BaseModel):
    message: str
    cloned_count: int
    cloned_income_count: int = 0
    next_month_id: int
    next_month_name: str


class IncomeTypeCreate(BaseModel):
    name: str
    color: str | None = None


class IncomeTypeUpdate(BaseModel):
    name: str
    color: str | None = None


class IncomeTypeFullResponse(BaseModel):
    id: int
    name: str
    color: str
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None
    updated_by: str | None = None

    model_config = ConfigDict(from_attributes=True)


class IncomeBase(BaseModel):
    income_type_id: int
    period: str
    budget: float = 0.0
    amount: float = 0.0
    month_id: int


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(BaseModel):
    income_type_id: int | None = None
    period: str | None = None
    budget: float | None = None
    amount: float | None = None
    month_id: int | None = None


class IncomeResponse(IncomeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None
    updated_by: str | None = None

    model_config = ConfigDict(from_attributes=True)
