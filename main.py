from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
from database import engine, get_db

from schemas import (
    MachineCreate,
    MachineResponse,
    SensorDataCreate,
    SensorDataResponse
)


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="Industrial Digital Twin API",
    description="Backend API for Industrial Digital Twin",
    version="1.0.0"
)

# Enable CORS for dashboard frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# CREATE DATABASE TABLES
# ==========================================

models.Base.metadata.create_all(bind=engine)


# ==========================================
# HOME API
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Industrial Digital Twin Backend is Running!"
    }


# ==========================================
# HEALTH CHECK API
# ==========================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ==========================================
# MYSQL DATABASE TEST API
# ==========================================

@app.get("/db-test")
def database_test():
    try:
        with engine.connect():
            return {
                "status": "success",
                "message": "MySQL database connected successfully!"
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


# ==========================================
# MACHINE APIs
# ==========================================

# ------------------------------------------
# CREATE MACHINE
# ------------------------------------------

@app.post(
    "/machines",
    response_model=MachineResponse
)
def create_machine(
    machine: MachineCreate,
    db: Session = Depends(get_db)
):

    new_machine = models.Machine(
        name=machine.name,
        machine_type=machine.machine_type,
        status=machine.status
    )

    db.add(new_machine)
    db.commit()
    db.refresh(new_machine)

    return new_machine


# ------------------------------------------
# GET ALL MACHINES
# ------------------------------------------

@app.get(
    "/machines",
    response_model=list[MachineResponse]
)
def get_machines(
    db: Session = Depends(get_db)
):

    return db.query(models.Machine).all()


# ------------------------------------------
# GET ONE MACHINE
# ------------------------------------------

@app.get(
    "/machines/{machine_id}",
    response_model=MachineResponse
)
def get_machine(
    machine_id: int,
    db: Session = Depends(get_db)
):

    machine = db.query(models.Machine).filter(
        models.Machine.id == machine_id
    ).first()

    return machine


# ==========================================
# SENSOR DATA APIs
# ==========================================

# ------------------------------------------
# CREATE SENSOR DATA
# ------------------------------------------

@app.post(
    "/sensor-data",
    response_model=SensorDataResponse
)
def create_sensor_data(
    data: SensorDataCreate,
    db: Session = Depends(get_db)
):

    new_data = models.SensorData(
        machine_id=data.machine_id,
        temperature=data.temperature,
        humidity=data.humidity,
        vibration=data.vibration,
        current=data.current,
        smoke=data.smoke,
        voltage=data.voltage,
        power=data.power
    )

    db.add(new_data)
    db.commit()
    db.refresh(new_data)

    return new_data


# ------------------------------------------
# GET ALL SENSOR DATA
# ------------------------------------------

@app.get(
    "/sensor-data",
    response_model=list[SensorDataResponse]
)
def get_sensor_data(
    db: Session = Depends(get_db)
):

    return db.query(models.SensorData).all()


# ------------------------------------------
# GET SENSOR DATA FOR ONE MACHINE
# ------------------------------------------

@app.get(
    "/sensor-data/machine/{machine_id}",
    response_model=list[SensorDataResponse]
)
def get_machine_sensor_data(
    machine_id: int,
    db: Session = Depends(get_db)
):

    return db.query(models.SensorData).filter(
        models.SensorData.machine_id == machine_id
    ).all()