"""FastAPI backend for budget management application"""
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uvicorn
import pandas as pd
import io

from database import SessionLocal, engine, Base
from models import Expense, Category, Period
from schemas import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    CategoryResponse, CategorySummary, CategoryCreate, CategoryUpdate, CategoryFullResponse,
    PeriodResponse, PeriodCreate, PeriodUpdate, PeriodFullResponse
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Budget Management API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Budget Management API"}


# Expense endpoints
@app.post("/api/expenses", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    """Create a new expense"""
    db_expense = Expense(**expense.dict())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.get("/api/expenses", response_model=List[ExpenseResponse])
def get_expenses(
    period: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all expenses, optionally filtered by period or category"""
    query = db.query(Expense)
    if period:
        query = query.filter(Expense.period == period)
    if category:
        query = query.filter(Expense.category == category)
    return query.order_by(Expense.expense_name).all()


@app.get("/api/expenses/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    """Get a specific expense by ID"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@app.put("/api/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    db: Session = Depends(get_db)
):
    """Update an expense"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    for key, value in expense_update.dict(exclude_unset=True).items():
        setattr(expense, key, value)
    
    db.commit()
    db.refresh(expense)
    return expense


@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}


# Category endpoints
@app.get("/api/categories", response_model=List[CategoryFullResponse])
def get_categories(db: Session = Depends(get_db)):
    """Get all managed categories"""
    categories = db.query(Category).order_by(Category.name).all()
    return categories


@app.post("/api/categories", response_model=CategoryFullResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category"""
    # Check if category already exists
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    db_category = Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@app.put("/api/categories/{category_id}", response_model=CategoryFullResponse)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name already exists
    existing = db.query(Category).filter(
        Category.name == category_update.name,
        Category.id != category_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    # Update expenses that use this category
    old_name = category.name
    category.name = category_update.name
    db.query(Expense).filter(Expense.category == old_name).update(
        {Expense.category: category_update.name}
    )
    
    db.commit()
    db.refresh(category)
    return category


@app.delete("/api/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category is used in expenses
    expense_count = db.query(Expense).filter(Expense.category == category.name).count()
    if expense_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category: it is used by {expense_count} expense(s)"
        )
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}


@app.get("/api/categories/summary", response_model=List[CategorySummary])
def get_category_summary(
    period: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get category summary with budget totals and actual costs"""
    query = db.query(Expense)
    if period:
        query = query.filter(Expense.period == period)
    
    expenses = query.all()
    
    # Group by category
    category_data = {}
    for expense in expenses:
        if expense.category not in category_data:
            category_data[expense.category] = {
                "category": expense.category,
                "budget": 0.0,
                "total": 0.0
            }
        category_data[expense.category]["budget"] += expense.budget or 0.0
        category_data[expense.category]["total"] += expense.cost or 0.0
    
    # Convert to list and calculate over_budget
    summaries = []
    for cat_data in category_data.values():
        summaries.append(CategorySummary(
            category=cat_data["category"],
            budget=cat_data["budget"],
            total=cat_data["total"],
            over_budget=cat_data["budget"] >= cat_data["total"]
        ))
    
    return sorted(summaries, key=lambda x: x.category)


# Period endpoints
@app.get("/api/periods", response_model=List[PeriodFullResponse])
def get_periods(db: Session = Depends(get_db)):
    """Get all managed periods"""
    periods = db.query(Period).order_by(Period.name).all()
    return periods


@app.post("/api/periods", response_model=PeriodFullResponse)
def create_period(period: PeriodCreate, db: Session = Depends(get_db)):
    """Create a new period"""
    # Check if period already exists
    existing = db.query(Period).filter(Period.name == period.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Period already exists")
    
    db_period = Period(name=period.name)
    db.add(db_period)
    db.commit()
    db.refresh(db_period)
    return db_period


@app.put("/api/periods/{period_id}", response_model=PeriodFullResponse)
def update_period(
    period_id: int,
    period_update: PeriodUpdate,
    db: Session = Depends(get_db)
):
    """Update a period"""
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    
    # Check if new name already exists
    existing = db.query(Period).filter(
        Period.name == period_update.name,
        Period.id != period_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Period name already exists")
    
    # Update expenses that use this period
    old_name = period.name
    period.name = period_update.name
    db.query(Expense).filter(Expense.period == old_name).update(
        {Expense.period: period_update.name}
    )
    
    db.commit()
    db.refresh(period)
    return period


@app.delete("/api/periods/{period_id}")
def delete_period(period_id: int, db: Session = Depends(get_db)):
    """Delete a period"""
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    
    # Check if period is used in expenses
    expense_count = db.query(Expense).filter(Expense.period == period.name).count()
    if expense_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete period: it is used by {expense_count} expense(s)"
        )
    
    db.delete(period)
    db.commit()
    return {"message": "Period deleted successfully"}


@app.post("/api/import/excel")
async def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import expenses from Excel file"""
    try:
        contents = await file.read()
        
        # Try to read the Excel file
        try:
            df = pd.read_excel(io.BytesIO(contents), sheet_name=0, header=0)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error reading Excel file: {str(e)}"
            )
        
        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="Excel file is empty or has no data"
            )
        
        # Normalize column names (handle variations)
        df.columns = df.columns.str.strip()
        
        # Map possible column name variations (case-insensitive)
        column_mapping = {
            'expense details': 'Expense details',
            'expense_details': 'Expense details',
            'expense': 'Expense details',
            'expense name': 'Expense details',
            'name': 'Expense details',
            'period': 'Period',
            'category': 'Category',
            'budget': 'Budget',
            'cost': 'Cost',
            'actual': 'Cost',
            'actual cost': 'Cost',
            'notes': 'Notes',
            'note': 'Notes',
        }
        
        # Normalize column names to match expected format
        df_columns_lower = {col.lower(): col for col in df.columns}
        rename_dict = {}
        
        for col_lower, standard_name in column_mapping.items():
            if col_lower in df_columns_lower:
                original_col = df_columns_lower[col_lower]
                if original_col != standard_name:
                    rename_dict[original_col] = standard_name
        
        if rename_dict:
            df.rename(columns=rename_dict, inplace=True)
        
        # Check if required columns exist
        required_cols = ['Expense details', 'Category']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            available_cols = ', '.join(df.columns.tolist())
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_cols)}. Available columns: {available_cols}"
            )
        
        imported_count = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                # Skip rows with missing essential data
                expense_name = row.get('Expense details', '')
                category_name = row.get('Category', '')
                
                # Handle NaN values
                if pd.isna(expense_name) or pd.isna(category_name):
                    continue
                
                expense_name = str(expense_name).strip()
                category_name = str(category_name).strip()
                
                if expense_name == '' or category_name == '':
                    continue
                
                # Get period, default to 'Fixed/1st Period' if not provided
                period_value = row.get('Period', 'Fixed/1st Period')
                if pd.isna(period_value):
                    period_name = 'Fixed/1st Period'
                else:
                    period_name = str(period_value).strip()
                
                if period_name == '':
                    period_name = 'Fixed/1st Period'
                
                # Create category if it doesn't exist
                category = db.query(Category).filter(Category.name == category_name).first()
                if not category:
                    try:
                        category = Category(name=category_name)
                        db.add(category)
                        db.flush()
                    except Exception:
                        # Category might already exist from a concurrent insert
                        db.rollback()
                        category = db.query(Category).filter(Category.name == category_name).first()
                        if not category:
                            raise
                        db.commit()
                
                # Create period if it doesn't exist
                period = db.query(Period).filter(Period.name == period_name).first()
                if not period:
                    try:
                        period = Period(name=period_name)
                        db.add(period)
                        db.flush()
                    except Exception:
                        # Period might already exist from a concurrent insert
                        db.rollback()
                        period = db.query(Period).filter(Period.name == period_name).first()
                        if not period:
                            raise
                        db.commit()
                
                # Get budget and cost values
                budget_value = row.get('Budget', 0)
                cost_value = row.get('Cost', 0)
                
                budget = 0.0
                if not pd.isna(budget_value):
                    try:
                        budget = float(budget_value)
                    except (ValueError, TypeError):
                        budget = 0.0
                
                cost = 0.0
                if not pd.isna(cost_value):
                    try:
                        cost = float(cost_value)
                    except (ValueError, TypeError):
                        cost = 0.0
                
                # Get notes
                notes_value = row.get('Notes', '')
                notes = None
                if not pd.isna(notes_value):
                    notes_str = str(notes_value).strip()
                    notes = notes_str if notes_str else None
                
                expense = Expense(
                    expense_name=expense_name,
                    period=period_name,
                    category=category_name,
                    budget=budget,
                    cost=cost,
                    notes=notes
                )
                db.add(expense)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
                continue
        
        if imported_count == 0 and errors:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"No expenses imported. Errors: {'; '.join(errors[:5])}"
            )
        
        db.commit()
        
        message = f"Successfully imported {imported_count} expense(s)"
        if errors:
            message += f". {len(errors)} row(s) had errors"
        
        return {"message": message, "imported": imported_count, "errors": len(errors)}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = str(e)
        raise HTTPException(
            status_code=400,
            detail=f"Error importing file: {error_detail}"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
