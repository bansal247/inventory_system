from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    # Validate products and stock before mutating anything
    products_map = {}
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} not found",
            )
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product '{product.name}'. "
                       f"Available: {product.quantity}, requested: {item.quantity}",
            )
        products_map[item.product_id] = product

    total_amount = 0.0
    order_items = []
    for item in order.items:
        product = products_map[item.product_id]
        subtotal = product.price * item.quantity
        total_amount += subtotal
        product.quantity -= item.quantity  # reduce stock
        order_items.append(
            models.OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price,
                subtotal=subtotal,
            )
        )

    db_order = models.Order(customer_id=order.customer_id, total_amount=total_amount, items=order_items)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("", response_model=List[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.customer))
        .order_by(models.Order.id.desc())
        .all()
    )


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.customer))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Cancel/delete an order and restock the products."""
    order = db.query(models.Order).options(joinedload(models.Order.items)).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # restock
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity

    db.delete(order)
    db.commit()
    return None
