"""Expense controller"""

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session

from dependencies import get_api_key, get_client_info, get_db, get_user_name
from exceptions import NotFoundError, ValidationError
from repositories import ExpenseRepository, IncomeRepository, MonthRepository
from schemas import (
    CloneExpensesResponse,
    ExpenseCreate,
    ExpenseReorderRequest,
    ExpenseResponse,
    ExpenseUpdate,
    PayExpenseRequest,
)
from services import ExpenseService

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


@router.post("", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
    user_name: str | None = Depends(get_user_name),
):
    """Create a new expense"""
    expense_repository = ExpenseRepository(db)
    month_repository = MonthRepository(db)
    service = ExpenseService(expense_repository, month_repository)
    try:
        return service.create_expense(expense, user_name)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.get("", response_model=list[ExpenseResponse])
def get_expenses(
    period: str | None = None,
    category: str | None = None,
    month_id: int | None = None,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get all expenses, optionally filtered by period, category, or month"""
    expense_repository = ExpenseRepository(db)
    service = ExpenseService(expense_repository)
    return service.get_expenses(period=period, category=category, month_id=month_id)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Get a specific expense by ID"""
    repository = ExpenseRepository(db)
    service = ExpenseService(repository)
    try:
        return service.get_expense(expense_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
    user_name: str | None = Depends(get_user_name),
):
    """Update an expense"""
    expense_repository = ExpenseRepository(db)
    month_repository = MonthRepository(db)
    service = ExpenseService(expense_repository, month_repository)
    try:
        return service.update_expense(expense_id, expense_update, user_name)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Delete an expense"""
    expense_repository = ExpenseRepository(db)
    month_repository = MonthRepository(db)
    service = ExpenseService(expense_repository, month_repository)
    try:
        return service.delete_expense(expense_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.post("/reorder", response_model=list[ExpenseResponse])
def reorder_expenses(
    reorder_request: ExpenseReorderRequest,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
    user_name: str | None = Depends(get_user_name),
):
    """Reorder expenses by providing a list of expense IDs in the desired order"""
    repository = ExpenseRepository(db)
    service = ExpenseService(repository)
    try:
        return service.reorder_expenses(reorder_request.expense_ids, user_name)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.post("/clone-to-next-month/{month_id}", response_model=CloneExpensesResponse)
def clone_expenses_to_next_month(
    month_id: int,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
    user_name: str | None = Depends(get_user_name),
):
    """Clone all expenses and incomes from a month to the following month"""
    expense_repository = ExpenseRepository(db)
    income_repository = IncomeRepository(db)
    month_repository = MonthRepository(db)
    service = ExpenseService(expense_repository, month_repository, income_repository)
    try:
        return service.clone_to_next_month(month_id, user_name)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.post("/{expense_id}/pay", response_model=ExpenseResponse)
def pay_expense(
    expense_id: int,
    pay_request: PayExpenseRequest | None = None,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
    user_name: str | None = Depends(get_user_name),
):
    """Pay an expense by adding a payment entry with the budget amount"""
    expense_repository = ExpenseRepository(db)
    month_repository = MonthRepository(db)
    service = ExpenseService(expense_repository, month_repository)
    try:
        amount = pay_request.amount if pay_request else None
        return service.pay_expense(expense_id, amount, user_name)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None
