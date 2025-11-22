"""Database models"""
from sqlalchemy import Column, Integer, String, Float, Text
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


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)


class Period(Base):
    __tablename__ = "periods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
