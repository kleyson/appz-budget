"""Summary controller"""

from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session

from dependencies import get_api_key, get_client_info, get_db
from repositories import ExpenseRepository, IncomeRepository, PeriodRepository
from schemas import PeriodSummaryResponse, SummaryTotals
from services import SummaryService

router = APIRouter(prefix="/api/v1/summary", tags=["summary"])


@router.get("/totals", response_model=SummaryTotals)
def get_summary_totals(
    period: str | None = None,
    month_id: int | None = None,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get summary totals for expenses and income"""
    expense_repository = ExpenseRepository(db)
    income_repository = IncomeRepository(db)
    service = SummaryService(expense_repository, income_repository)
    return service.get_summary_totals(period=period, month_id=month_id)


@router.get("/by-period", response_model=PeriodSummaryResponse)
def get_period_summary(
    month_id: int | None = None,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get summary totals grouped by period"""
    expense_repository = ExpenseRepository(db)
    income_repository = IncomeRepository(db)
    period_repository = PeriodRepository(db)
    service = SummaryService(expense_repository, income_repository, period_repository)
    return service.get_period_summary(month_id=month_id)
