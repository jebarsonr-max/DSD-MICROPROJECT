from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import FlightModel, NotificationModel
from backend.app.schemas.schemas import FlightCreate, FlightUpdate, FlightResponse

router = APIRouter(prefix="/api/flights", tags=["Flight Management"])

@router.get("", response_model=List[FlightResponse])
def get_all_flights(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(FlightModel)
    if status and status != "ALL":
        query = query.filter(FlightModel.status == status)
    return query.order_by(FlightModel.departure_time.asc()).all()


@router.get("/{flight_id}", response_model=FlightResponse)
def get_flight_by_id(flight_id: str, db: Session = Depends(get_db)):
    flight = db.query(FlightModel).filter(
        (FlightModel.id == flight_id) | (FlightModel.flight_number.ilike(flight_id))
    ).first()
    if not flight:
        raise HTTPException(status_code=404, detail=f"Flight '{flight_id}' not found.")
    return flight


@router.post("", response_model=FlightResponse, status_code=201)
def create_flight(payload: FlightCreate, db: Session = Depends(get_db)):
    flight_num = payload.flight_number.strip().upper()
    existing = db.query(FlightModel).filter(FlightModel.flight_number == flight_num).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Flight '{flight_num}' already exists in schedule.")

    flight_id = f"FLT-{int(datetime.utcnow().timestamp() % 1000 + 100)}"

    new_flight = FlightModel(
        id=flight_id,
        flight_number=flight_num,
        airline=payload.airline.strip(),
        destination=payload.destination.strip(),
        departure_time=payload.departure_time.strip(),
        gate_number=payload.gate_number.strip(),
        assigned_lane=payload.assigned_lane.strip(),
        status=payload.status,
        is_demo=False
    )
    db.add(new_flight)

    notif = NotificationModel(
        id=f"NOTIF-{int(datetime.utcnow().timestamp())}",
        title=f"Flight Added: {flight_num}",
        description=f"Scheduled to {new_flight.destination} at {new_flight.departure_time} (Gate {new_flight.gate_number}, {new_flight.assigned_lane}).",
        timestamp=datetime.now().strftime("%I:%M %p"),
        severity="info",
        read=False,
        category="SYSTEM"
    )
    db.add(notif)
    db.commit()
    db.refresh(new_flight)

    return new_flight


@router.put("/{flight_id}", response_model=FlightResponse)
def update_flight(flight_id: str, payload: FlightUpdate, db: Session = Depends(get_db)):
    flight = db.query(FlightModel).filter(
        (FlightModel.id == flight_id) | (FlightModel.flight_number.ilike(flight_id))
    ).first()
    if not flight:
        raise HTTPException(status_code=404, detail=f"Flight '{flight_id}' not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        if val is not None:
            setattr(flight, key, val)

    db.commit()
    db.refresh(flight)
    return flight


@router.delete("/{flight_id}")
def delete_flight(flight_id: str, db: Session = Depends(get_db)):
    flight = db.query(FlightModel).filter(
        (FlightModel.id == flight_id) | (FlightModel.flight_number.ilike(flight_id))
    ).first()
    if not flight:
        raise HTTPException(status_code=404, detail=f"Flight '{flight_id}' not found.")

    db.delete(flight)
    db.commit()
    return {"message": f"Flight '{flight.flight_number}' removed from schedule.", "id": flight_id}

