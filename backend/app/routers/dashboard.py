from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

LOW_STOCK_THRESHOLD = 10


@router.get("/summary", response_model=schemas.DashboardSummary)
def get_summary(db: Session = Depends(get_db)):
    total_products = db.query(func.count(models.Product.id)).scalar()
    total_customers = db.query(func.count(models.Customer.id)).scalar()
    total_orders = db.query(func.count(models.Order.id)).scalar()
    low_stock_products = (
        db.query(models.Product)
        .filter(models.Product.quantity <= LOW_STOCK_THRESHOLD)
        .order_by(models.Product.quantity.asc())
        .all()
    )
    return schemas.DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=low_stock_products,
    )
