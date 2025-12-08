"""Pydantic schemas for request/response validation"""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, model_validator


class Purchase(BaseModel):
    name: str
    amount: float
    date: str | None = None  # ISO date string when purchase was made


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
    expense_date: str | None = None  # ISO date string when expense was added


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
    expense_date: str | None = None


class ExpenseResponse(ExpenseBase):
    id: int
    expense_date: str | date | None = None  # Override to accept both date and string
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None
    updated_by: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def convert_expense_date(self):
        """Convert expense_date from date to string if needed"""
        if self.expense_date is not None and isinstance(self.expense_date, date):
            self.expense_date = self.expense_date.isoformat()
        return self


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


class PeriodSummary(BaseModel):
    period: str
    color: str
    total_income: float
    total_expenses: float
    difference: float


class PeriodSummaryResponse(BaseModel):
    periods: list[PeriodSummary]
    grand_total_income: float
    grand_total_expenses: float
    grand_total_difference: float


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
    is_closed: bool = False
    closed_at: datetime | None = None
    closed_by: str | None = None


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
    is_closed: bool = False
    closed_at: datetime | None = None
    closed_by: str | None = None
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
    email_sent: bool  # Whether email was sent successfully
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


class PasswordResetItemResponse(BaseModel):
    """Response for a single password reset request in admin list"""

    user_email: str
    short_code: str | None
    created_at: str  # ISO datetime string
    expires_at: str  # ISO datetime string
    minutes_remaining: int


class GenerateResetLinkRequest(BaseModel):
    """Request to generate a reset link for a user (admin only)"""

    user_id: int


class GenerateResetLinkResponse(BaseModel):
    """Response when admin generates a reset link"""

    user_email: str
    reset_url: str
    short_code: str
    expires_in_minutes: int


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


class PayExpenseRequest(BaseModel):
    """Request to pay an expense - creates a payment entry"""

    amount: float | None = None  # If not provided, uses budget amount


class MonthCloseResponse(BaseModel):
    """Response when closing/opening a month"""

    id: int
    name: str
    is_closed: bool
    closed_at: datetime | None = None
    closed_by: str | None = None
    message: str


# Report schemas
class CategoryTrendItem(BaseModel):
    """Category spending for a single month"""

    category: str
    amount: float
    color: str


class MonthlyTrendData(BaseModel):
    """Data for a single month in the trends report"""

    month_id: int
    month_name: str
    year: int
    month: int
    total_income: float
    total_expenses: float
    net_savings: float
    savings_rate: float  # Percentage (0-100)
    categories: list[CategoryTrendItem]


class MonthlyTrendsResponse(BaseModel):
    """Response for monthly trends report"""

    months: list[MonthlyTrendData]
    average_income: float
    average_expenses: float
    average_savings_rate: float
