import os
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@db:5432/inventory_db",
)

# Retry connecting to the DB a few times (useful when db container is still starting)
engine = None
for attempt in range(10):
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        conn = engine.connect()
        conn.close()
        break
    except OperationalError:
        time.sleep(3)
if engine is None:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
