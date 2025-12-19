"""Income model"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    income_type_id = Column(Integer, ForeignKey("income_types.id"), nullable=False, index=True)
    period = Column(String, nullable=False, index=True)
    budget = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    month_id = Column(Integer, ForeignKey("months.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)

    # Relationships
    month_obj = relationship("Month", back_populates="incomes")
    income_type_obj = relationship("IncomeType", back_populates="incomes")
