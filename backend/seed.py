"""
Seed script — populates the database with realistic fake data for local
development and demo purposes.

Usage:
    python seed.py              # default: 3 tenants
    python seed.py --tenants 5  # custom tenant count

Each tenant gets:
  - 1 owner, 1 admin, 2 agents
  - 10 customers
  - 30 tickets spread across statuses and priorities
  - 2–5 comments per ticket (mix of internal and public)

Existing data is wiped before seeding so the script is idempotent.
"""

import argparse
import random
import sys

from faker import Faker
from sqlalchemy.orm import Session

# Ensure the backend package resolves correctly when run from backend/
sys.path.insert(0, ".")

from core.security import hash_password
from db.database import SessionLocal, Base, engine
from models.comment import Comment
from models.customer import Customer
from models.subscription import Subscription
from models.tenant import Tenant
from models.ticket import Ticket
from models.user import User, UserRole

fake = Faker()

TICKET_STATUSES = ["open", "pending", "resolved", "closed"]
TICKET_PRIORITIES = ["low", "normal", "high", "urgent"]

# Rough distribution weights so the seed data looks realistic
STATUS_WEIGHTS = [0.45, 0.25, 0.20, 0.10]
PRIORITY_WEIGHTS = [0.15, 0.45, 0.30, 0.10]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slugify(name: str) -> str:
    import re
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug)
    return slug.strip("-")


def _wipe(db: Session) -> None:
    """Delete all rows in dependency order to avoid FK violations."""
    db.query(Comment).delete()
    db.query(Ticket).delete()
    db.query(Customer).delete()
    db.query(Subscription).delete()
    db.query(User).delete()
    db.query(Tenant).delete()
    db.commit()
    print("  Wiped existing data.")


def _create_tenant(db: Session, tier: str = "free") -> Tenant:
    company = fake.unique.company()
    tenant = Tenant(
        company_name=company,
        slug=_slugify(company),
        subscription_tier=tier,
    )
    db.add(tenant)
    db.flush()

    sub = Subscription(
        tenant_id=tenant.id,
        subscription_tier=tier,
        is_subscribed=(tier == "paid"),
    )
    db.add(sub)
    return tenant


def _create_user(db: Session, tenant_id: int, role: UserRole) -> User:
    user = User(
        tenant_id=tenant_id,
        email=fake.unique.email(),
        hashed_password=hash_password("Password1!"),
        first_name=fake.first_name(),
        last_name=fake.last_name(),
        role=role,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    return user


def _create_customers(db: Session, tenant_id: int, count: int = 10) -> list[Customer]:
    customers = []
    for _ in range(count):
        c = Customer(
            tenant_id=tenant_id,
            name=fake.name(),
            email=fake.unique.email(),
        )
        db.add(c)
        customers.append(c)
    return customers


def _create_tickets(
    db: Session,
    tenant_id: int,
    customers: list[Customer],
    agents: list[User],
    count: int = 30,
) -> list[Ticket]:
    tickets = []
    for _ in range(count):
        status = random.choices(TICKET_STATUSES, weights=STATUS_WEIGHTS)[0]
        priority = random.choices(TICKET_PRIORITIES, weights=PRIORITY_WEIGHTS)[0]
        ticket = Ticket(
            tenant_id=tenant_id,
            customer_id=random.choice(customers).id,
            assigned_agent_id=random.choice(agents).id if random.random() > 0.2 else None,
            subject=fake.sentence(nb_words=6).rstrip("."),
            description=fake.paragraph(nb_sentences=3),
            status=status,
            priority=priority,
        )
        db.add(ticket)
        tickets.append(ticket)
    return tickets


def _create_comments(
    db: Session,
    tickets: list[Ticket],
    users: list[User],
    min_per_ticket: int = 2,
    max_per_ticket: int = 5,
) -> None:
    for ticket in tickets:
        for _ in range(random.randint(min_per_ticket, max_per_ticket)):
            is_internal = random.random() < 0.25
            comment = Comment(
                ticket_id=ticket.id,
                author_user_id=random.choice(users).id,
                body=fake.paragraph(nb_sentences=2),
                is_internal=is_internal,
            )
            db.add(comment)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def seed(num_tenants: int = 3) -> None:
    Base.metadata.create_all(engine)

    db: Session = SessionLocal()
    try:
        print(f"\nSeeding {num_tenants} tenant(s)...\n")
        _wipe(db)

        # One tenant gets the paid tier for variety
        tiers = ["paid"] + ["free"] * (num_tenants - 1)
        random.shuffle(tiers)

        for i, tier in enumerate(tiers, start=1):
            print(f"  [{i}/{num_tenants}] Creating tenant ({tier} tier)...")
            tenant = _create_tenant(db, tier=tier)
            db.flush()

            owner = _create_user(db, tenant.id, UserRole.OWNER)
            admin = _create_user(db, tenant.id, UserRole.ADMIN)
            agent1 = _create_user(db, tenant.id, UserRole.AGENT)
            agent2 = _create_user(db, tenant.id, UserRole.AGENT)
            db.flush()

            customers = _create_customers(db, tenant.id, count=10)
            db.flush()

            all_users = [owner, admin, agent1, agent2]
            agents = [agent1, agent2]
            tickets = _create_tickets(db, tenant.id, customers, agents, count=30)
            db.flush()

            _create_comments(db, tickets, all_users)

            print(f"      Tenant : {tenant.company_name}")
            print(f"      Owner  : {owner.email}  /  Password1!")
            print(f"      Admin  : {admin.email}  /  Password1!")
            print(f"      Agent1 : {agent1.email}  /  Password1!")
            print(f"      Agent2 : {agent2.email}  /  Password1!")
            print()

        db.commit()
        print("Done. Database seeded successfully.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the TicketDesk database.")
    parser.add_argument(
        "--tenants",
        type=int,
        default=3,
        help="Number of tenants to create (default: 3)",
    )
    args = parser.parse_args()
    seed(num_tenants=args.tenants)
