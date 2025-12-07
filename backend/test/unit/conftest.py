import pytest
from sqlalchemy import create_engine

from db.base import Base
from utils.config import settings


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    engine = create_engine(
        settings.DATABASE_URL, connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    yield
    # Optionally, drop tables after tests
    # UserBase.metadata.drop_all(engine)
    # SalaryBase.metadata.drop_all(engine)
    # IdCardBase.metadata.drop_all(engine)
    # SalaryHistoryBase.metadata.drop_all(engine)
    # LeaveBase.metadata.drop_all(engine)
