from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# ==========================================
# DATABASE URL
# ==========================================

DATABASE_URL = "mysql+pymysql://root:Manisha@localhost/industrial_twin"


# ==========================================
# CREATE DATABASE ENGINE
# ==========================================

engine = create_engine(
    DATABASE_URL,
    echo=False
)


# ==========================================
# SESSION
# ==========================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ==========================================
# BASE
# ==========================================

Base = declarative_base()


# ==========================================
# DATABASE SESSION
# ==========================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()