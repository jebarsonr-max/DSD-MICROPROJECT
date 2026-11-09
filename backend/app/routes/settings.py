import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import (
    SystemSettingsModel,
    BaggageModel,
    FlightModel,
    SortingRecordModel,
    NotificationModel
)
from backend.app.schemas.schemas import SystemSettingsResponse, SystemSettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["System Settings"])

DEFAULT_LANES_CONFIG = [
    {"laneId": "Lane 01", "laneName": "Sort Lane 01", "destination": "Delhi", "description": "Flight AI 101 Dedicated Chute", "color": "#17365D"},
    {"laneId": "Lane 02", "laneName": "Sort Lane 02", "destination": "Mumbai", "description": "Flight AI 202 Dedicated Chute", "color": "#2878D0"},
    {"laneId": "Lane 03", "laneName": "Sort Lane 03", "destination": "Bengaluru", "description": "Flight AI 303 Dedicated Chute", "color": "#0284C7"},
    {"laneId": "Lane 04", "laneName": "Sort Lane 04", "destination": "Hyderabad", "description": "Flight AI 404 Dedicated Chute", "color": "#0D9488"},
    {"laneId": "Lane 05", "laneName": "Sort Lane 05", "destination": "Kolkata", "description": "Flight AI 505 Dedicated Chute", "color": "#16A36A"},
    {"laneId": "Lane 06", "laneName": "Sort Lane 06 (Security)", "destination": "Manual Inspection", "description": "Overweight & Invalid Baggage Diverter", "color": "#DC4545"}
]

@router.get("", response_model=SystemSettingsResponse)
def get_system_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSettingsModel).filter(SystemSettingsModel.id == 1).first()
    if not settings:
        settings = SystemSettingsModel(
            id=1,
            airport_name="Chennai International Airport",
            airport_code="MAA",
            terminal_name="Terminal 2 — Domestic Departures",
            max_baggage_weight=15.0,
            near_limit_threshold=14.0,
            conveyor_speed_multiplier=1.0,
            sound_alerts_enabled=True,
            auto_process_queue=False,
            lanes_config_json=json.dumps(DEFAULT_LANES_CONFIG)
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return {
        "id": settings.id,
        "airport_name": settings.airport_name,
        "airport_code": settings.airport_code,
        "terminal_name": settings.terminal_name,
        "max_baggage_weight": settings.max_baggage_weight,
        "near_limit_threshold": settings.near_limit_threshold,
        "conveyor_speed_multiplier": settings.conveyor_speed_multiplier,
        "sound_alerts_enabled": settings.sound_alerts_enabled,
        "auto_process_queue": settings.auto_process_queue,
        "lanes_config": json.loads(settings.lanes_config_json)
    }


@router.put("", response_model=SystemSettingsResponse)
def update_system_settings(payload: SystemSettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(SystemSettingsModel).filter(SystemSettingsModel.id == 1).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found.")

    update_dict = payload.model_dump(exclude_unset=True)

    if "lanes_config" in update_dict and update_dict["lanes_config"] is not None:
        settings.lanes_config_json = json.dumps([item.model_dump() for item in payload.lanes_config])
        del update_dict["lanes_config"]

    for key, val in update_dict.items():
        if val is not None:
            setattr(settings, key, val)

    db.commit()
    db.refresh(settings)

    return {
        "id": settings.id,
        "airport_name": settings.airport_name,
        "airport_code": settings.airport_code,
        "terminal_name": settings.terminal_name,
        "max_baggage_weight": settings.max_baggage_weight,
        "near_limit_threshold": settings.near_limit_threshold,
        "conveyor_speed_multiplier": settings.conveyor_speed_multiplier,
        "sound_alerts_enabled": settings.sound_alerts_enabled,
        "auto_process_queue": settings.auto_process_queue,
        "lanes_config": json.loads(settings.lanes_config_json)
    }


@router.post("/reset-demo")
def reset_demo_environment(db: Session = Depends(get_db)):
    """
    Clears current tables and seeds fresh demonstration database with 12 bags,
    5 flights, demo sorting records and notifications.
    """
    from backend.app.database import Base, engine
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    from backend.app.main import seed_initial_demo_data
    seed_initial_demo_data(db)

    return {"message": "Demo data successfully restored in SQLite database."}

