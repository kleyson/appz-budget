"""Seed tracking model"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from database import Base


class SeedRecord(Base):
    __tablename__ = "seed_records"

    id = Column(Integer, primary_key=True, index=True)
    seed_id = Column(String, unique=True, nullable=False, index=True)
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
