"""Import controller"""

from fastapi import APIRouter, Depends, File, HTTPException, Security, UploadFile
from sqlalchemy.orm import Session

from dependencies import get_api_key, get_client_info, get_db
from exceptions import ValidationError
from repositories import CategoryRepository, ExpenseRepository, MonthRepository, PeriodRepository
from services import ImportService

router = APIRouter(prefix="/api/v1/import", tags=["import"])


@router.post("/excel")
async def import_excel(
    file: UploadFile = File(...),
    month_id: int | None = None,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Import expenses from Excel file"""
    try:
        contents = await file.read()
        expense_repository = ExpenseRepository(db)
        category_repository = CategoryRepository(db)
        period_repository = PeriodRepository(db)
        month_repository = MonthRepository(db)
        service = ImportService(
            expense_repository, category_repository, period_repository, month_repository
        )

        result = service.import_excel(contents, month_id=month_id)
        db.commit()
        return result
    except ValidationError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e)) from None
    except Exception as e:
        db.rollback()
        error_detail = str(e)
        raise HTTPException(
            status_code=400, detail=f"Error importing file: {error_detail}"
        ) from None
