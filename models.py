from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func

from database import Base


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    machine_type = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)


class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)

    machine_id = Column(
        Integer,
        ForeignKey("machines.id"),
        nullable=False
    )

    temperature = Column(Float)
    humidity = Column(Float)
    vibration = Column(Float)
    current = Column(Float)
    smoke = Column(Float)
    voltage = Column(Float, nullable=True)
    power = Column(Float, nullable=True)

    timestamp = Column(
        DateTime,
        server_default=func.now()
    )