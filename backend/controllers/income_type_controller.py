"""Income type controller"""

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session

from dependencies import get_api_key, get_client_info, get_db
from exceptions import ConflictError, DependencyError, NotFoundError
from repositories import IncomeRepository, IncomeTypeRepository
from schemas import IncomeTypeCreate, IncomeTypeFullResponse, IncomeTypeSummary, IncomeTypeUpdate
from services import IncomeTypeService

router = APIRouter(prefix="/api/v1/income-types", tags=["income-types"])


@router.get("", response_model=list[IncomeTypeFullResponse])
def get_income_types(
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get all income types"""
    income_type_repository = IncomeTypeRepository(db)
    income_repository = IncomeRepository(db)
    service = IncomeTypeService(income_type_repository, income_repository)
    return service.get_income_types()


@router.post("", response_model=IncomeTypeFullResponse)
def create_income_type(
    income_type: IncomeTypeCreate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Create a new income type"""
    income_type_repository = IncomeTypeRepository(db)
    income_repository = IncomeRepository(db)
    service = IncomeTypeService(income_type_repository, income_repository)
    try:
        return service.create_income_type(income_type)
    except ConflictError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.put("/{income_type_id}", response_model=IncomeTypeFullResponse)
def update_income_type(
    income_type_id: int,
    income_type_update: IncomeTypeUpdate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Update an income type"""
    income_type_repository = IncomeTypeRepository(db)
    income_repository = IncomeRepository(db)
    service = IncomeTypeService(income_type_repository, income_repository)
    try:
        return service.update_income_type(income_type_id, income_type_update)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ConflictError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.delete("/{income_type_id}")
def delete_income_type(
    income_type_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Delete an income type"""
    income_type_repository = IncomeTypeRepository(db)
    income_repository = IncomeRepository(db)
    service = IncomeTypeService(income_type_repository, income_repository)
    try:
        return service.delete_income_type(income_type_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except DependencyError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.get("/summary", response_model=list[IncomeTypeSummary])
def get_income_type_summary(
    period: str | None = None,
    month_id: int | None = None,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get income type summary with budget totals and actual amounts"""
    income_type_repository = IncomeTypeRepository(db)
    income_repository = IncomeRepository(db)
    service = IncomeTypeService(income_type_repository, income_repository)
    return service.get_income_type_summary(period=period, month_id=month_id)
