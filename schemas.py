from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MachineCreate(BaseModel):
    name: str
    machine_type: str
    status: str = "Running"


class MachineResponse(BaseModel):
    id: int
    name: str
    machine_type: str
    status: str

    class Config:
        from_attributes = True


class SensorDataCreate(BaseModel):
    machine_id: int
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    vibration: Optional[float] = None
    current: Optional[float] = None
    smoke: Optional[float] = None
    voltage: Optional[float] = None
    power: Optional[float] = None


class SensorDataResponse(BaseModel):
    id: int
    machine_id: int
    temperature: Optional[float]
    humidity: Optional[float]
    vibration: Optional[float]
    current: Optional[float]
    smoke: Optional[float]
    voltage: Optional[float] = None
    power: Optional[float] = None
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True