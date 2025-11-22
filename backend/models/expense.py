"""Expense model"""

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    expense_name = Column(String, nullable=False, index=True)
    period = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    budget = Column(Float, default=0.0)
    cost = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    month_id = Column(Integer, ForeignKey("months.id"), nullable=False, index=True)
    purchases = Column(
        JSON, nullable=True
    )  # JSON array of purchases: [{"name": "...", "amount": 0.0}, ...]
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)

    # Relationship to month
    month_obj = relationship("Month", back_populates="expenses")
