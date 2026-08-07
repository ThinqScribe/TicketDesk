from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.dependencies import get_current_user, require_role
from db.database import get_db
from models.customer import Customer
from models.user import User, UserRole
from schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["customers"])


def get_customer_or_404(customer_id: int, tenant_id: int, db: Session) -> Customer:
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.tenant_id == tenant_id,
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/", response_model=list[CustomerRead])
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    """List all customers for the current tenant. Agents do not have access."""
    return (
        db.query(Customer)
        .filter(Customer.tenant_id == current_user.tenant_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    """
    Register a new customer under the current tenant.
    Email must be unique within the tenant.
    """
    existing = db.query(Customer).filter(
        Customer.email == payload.email,
        Customer.tenant_id == current_user.tenant_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A customer with this email already exists")

    customer = Customer(
        tenant_id=current_user.tenant_id,
        name=payload.name,
        email=payload.email,
    )
    db.add(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="A customer with this email already exists")
    db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    return get_customer_or_404(customer_id, current_user.tenant_id, db)


@router.patch("/{customer_id}", response_model=CustomerRead)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    customer = get_customer_or_404(customer_id, current_user.tenant_id, db)

    if payload.name is not None:
        customer.name = payload.name
    if payload.email is not None:
        customer.email = payload.email

    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER)),
):
    """
    Permanently delete a customer. Owner only.
    The customer's tickets are left intact (assigned_agent_id / customer_id
    becomes orphaned) — callers should resolve or close open tickets first.
    """
    customer = get_customer_or_404(customer_id, current_user.tenant_id, db)
    db.delete(customer)
    db.commit()
