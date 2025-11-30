"""Month controller"""

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session

from dependencies import get_api_key, get_client_info, get_db, get_user_name
from exceptions import ConflictError, NotFoundError, ValidationError
from repositories import MonthRepository
from schemas import MonthCloseResponse, MonthCreate, MonthResponse, MonthUpdate
from services import MonthService

router = APIRouter(prefix="/api/v1/months", tags=["months"])


@router.post("", response_model=MonthResponse)
def create_month(
    month: MonthCreate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
    user_name: str | None = Depends(get_user_name),
):
    """Create a new month"""
    repository = MonthRepository(db)
    service = MonthService(repository)
    try:
        return service.create(month.model_dump(), user_name)
    except ConflictError as e:
        raise HTTPException(status_code=409, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.get("", response_model=list[MonthResponse])
def get_months(
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get all months"""
    repository = MonthRepository(db)
    service = MonthService(repository)
    return service.get_all()


@router.get("/current", response_model=MonthResponse)
def get_current_month(
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get current month, or most recent month if current doesn't exist"""
    repository = MonthRepository(db)
    service = MonthService(repository)
    month = service.get_current()
    if not month:
        raise HTTPException(status_code=404, detail="No months found in database")
    return month


@router.get("/{month_id}", response_model=MonthResponse)
def get_month(
    month_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get a specific month by ID"""
    repository = MonthRepository(db)
    service = MonthService(repository)
    try:
        return service.get_by_id(month_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None


@router.get("/year/{year}/month/{month}", response_model=MonthResponse)
def get_month_by_year_month(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get month by year and month number"""
    repository = MonthRepository(db)
    service = MonthService(repository)
    month_obj = service.get_by_year_month(year, month)
    if not month_obj:
        raise HTTPException(status_code=404, detail=f"Month {year}-{month:02d} not found")
    return month_obj


@router.put("/{month_id}", response_model=MonthResponse)
def update_month(
    month_id: int,
    month_update: MonthUpdate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
    user_name: str | None = Depends(get_user_name),
):
    """Update a month"""
    repository = MonthRepository(db)
    service = MonthService(repository)
    try:
        return service.update(month_id, month_update.model_dump(exclude_unset=True), user_name)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ConflictError as e:
        raise HTTPException(status_code=409, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.delete("/{month_id}")
def delete_month(
    month_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Delete a month"""
    repository = MonthRepository(db)
    service = MonthService(repository)
    try:
        service.delete(month_id)
        return {"message": "Month deleted successfully"}
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.post("/{month_id}/close", response_model=MonthCloseResponse)
def close_month(
    month_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
    user_name: str | None = Depends(get_user_name),
):
    """Close a month, preventing new expenses/incomes from being added"""
    repository = MonthRepository(db)
    service = MonthService(repository)
    try:
        return service.close_month(month_id, user_name)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.post("/{month_id}/open", response_model=MonthCloseResponse)
def open_month(
    month_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
    user_name: str | None = Depends(get_user_name),
):
    """Reopen a closed month, allowing new expenses/incomes"""
    repository = MonthRepository(db)
    service = MonthService(repository)
    try:
        return service.open_month(month_id, user_name)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None
