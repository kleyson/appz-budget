"""Period controller"""

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session

from dependencies import get_api_key, get_client_info, get_db
from exceptions import ConflictError, DependencyError, NotFoundError
from repositories import ExpenseRepository, PeriodRepository
from schemas import PeriodCreate, PeriodFullResponse, PeriodUpdate
from services import PeriodService

router = APIRouter(prefix="/api/v1/periods", tags=["periods"])


@router.get("", response_model=list[PeriodFullResponse])
def get_periods(
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get all managed periods"""
    period_repository = PeriodRepository(db)
    expense_repository = ExpenseRepository(db)
    service = PeriodService(period_repository, expense_repository)
    return service.get_periods()


@router.post("", response_model=PeriodFullResponse)
def create_period(
    period: PeriodCreate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Create a new period"""
    period_repository = PeriodRepository(db)
    expense_repository = ExpenseRepository(db)
    service = PeriodService(period_repository, expense_repository)
    try:
        return service.create_period(period)
    except ConflictError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.put("/{period_id}", response_model=PeriodFullResponse)
def update_period(
    period_id: int,
    period_update: PeriodUpdate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Update a period"""
    period_repository = PeriodRepository(db)
    expense_repository = ExpenseRepository(db)
    service = PeriodService(period_repository, expense_repository)
    try:
        return service.update_period(period_id, period_update)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ConflictError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.delete("/{period_id}")
def delete_period(
    period_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Delete a period"""
    period_repository = PeriodRepository(db)
    expense_repository = ExpenseRepository(db)
    service = PeriodService(period_repository, expense_repository)
    try:
        return service.delete_period(period_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except DependencyError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None
