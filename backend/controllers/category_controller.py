"""Category controller"""

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session

from dependencies import get_api_key, get_client_info, get_db
from exceptions import ConflictError, DependencyError, NotFoundError
from repositories import CategoryRepository, ExpenseRepository
from schemas import CategoryCreate, CategoryFullResponse, CategorySummary, CategoryUpdate
from services import CategoryService

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.get("", response_model=list[CategoryFullResponse])
def get_categories(
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get all managed categories"""
    category_repository = CategoryRepository(db)
    expense_repository = ExpenseRepository(db)
    service = CategoryService(category_repository, expense_repository)
    return service.get_categories()


@router.post("", response_model=CategoryFullResponse)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Create a new category"""
    category_repository = CategoryRepository(db)
    expense_repository = ExpenseRepository(db)
    service = CategoryService(category_repository, expense_repository)
    try:
        return service.create_category(category)
    except ConflictError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.put("/{category_id}", response_model=CategoryFullResponse)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Update a category"""
    category_repository = CategoryRepository(db)
    expense_repository = ExpenseRepository(db)
    service = CategoryService(category_repository, expense_repository)
    try:
        return service.update_category(category_id, category_update)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ConflictError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Delete a category"""
    category_repository = CategoryRepository(db)
    expense_repository = ExpenseRepository(db)
    service = CategoryService(category_repository, expense_repository)
    try:
        return service.delete_category(category_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except DependencyError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.get("/summary", response_model=list[CategorySummary])
def get_category_summary(
    month_id: int | None = None,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get category summary with budget totals and actual costs"""
    category_repository = CategoryRepository(db)
    expense_repository = ExpenseRepository(db)
    service = CategoryService(category_repository, expense_repository)
    return service.get_category_summary(month_id=month_id)
