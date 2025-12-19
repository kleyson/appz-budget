"""Income controller"""

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session

from dependencies import get_api_key, get_client_info, get_db, get_user_name
from exceptions import NotFoundError, ValidationError
from repositories import IncomeRepository, IncomeTypeRepository, MonthRepository
from schemas import IncomeCreate, IncomeResponse, IncomeUpdate
from services import IncomeService

router = APIRouter(prefix="/api/v1/incomes", tags=["incomes"])


@router.post("", response_model=IncomeResponse)
def create_income(
    income: IncomeCreate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
    user_name: str | None = Depends(get_user_name),
):
    """Create a new income"""
    income_repository = IncomeRepository(db)
    month_repository = MonthRepository(db)
    income_type_repository = IncomeTypeRepository(db)
    service = IncomeService(income_repository, month_repository, income_type_repository)
    try:
        return service.create_income(income, user_name)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.get("", response_model=list[IncomeResponse])
def get_incomes(
    period: str | None = None,
    income_type_id: int | None = None,
    month_id: int | None = None,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get all incomes, optionally filtered by period, income_type_id, or month"""
    income_repository = IncomeRepository(db)
    service = IncomeService(income_repository)
    return service.get_incomes(period=period, income_type_id=income_type_id, month_id=month_id)


@router.get("/{income_id}", response_model=IncomeResponse)
def get_income(
    income_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get a specific income by ID"""
    income_repository = IncomeRepository(db)
    service = IncomeService(income_repository)
    try:
        return service.get_income(income_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None


@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: int,
    income_update: IncomeUpdate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
    user_name: str | None = Depends(get_user_name),
):
    """Update an income"""
    income_repository = IncomeRepository(db)
    month_repository = MonthRepository(db)
    income_type_repository = IncomeTypeRepository(db)
    service = IncomeService(income_repository, month_repository, income_type_repository)
    try:
        return service.update_income(income_id, income_update, user_name)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.delete("/{income_id}")
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Delete an income"""
    income_repository = IncomeRepository(db)
    month_repository = MonthRepository(db)
    service = IncomeService(income_repository, month_repository)
    try:
        service.delete_income(income_id)
        return {"message": "Income deleted successfully"}
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None
