from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import BaggageModel, FlightModel, SystemSettingsModel, NotificationModel
from backend.app.schemas.schemas import BaggageCreate, BaggageUpdate, BaggageResponse

router = APIRouter(prefix="/api/baggage", tags=["Baggage"])

@router.get("", response_model=List[BaggageResponse])
def get_all_baggage(
    search: Optional[str] = None,
    status: Optional[str] = None,
    flight: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(BaggageModel)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (BaggageModel.id.ilike(search_filter)) |
            (BaggageModel.passenger_name.ilike(search_filter)) |
            (BaggageModel.passenger_id.ilike(search_filter)) |
            (BaggageModel.flight_number.ilike(search_filter)) |
            (BaggageModel.destination.ilike(search_filter))
        )

    if status and status != "ALL":
        if status == "PENDING":
            query = query.filter(BaggageModel.status == "REGISTERED")
        elif status == "OVERWEIGHT":
            query = query.filter(
                (BaggageModel.status == "OVERWEIGHT") | (BaggageModel.weight_status == "OVERWEIGHT")
            )
        else:
            query = query.filter(BaggageModel.status == status)

    if flight and flight != "ALL":
        query = query.filter(BaggageModel.flight_number.ilike(flight))

    return query.order_by(BaggageModel.created_at.desc()).all()


@router.get("/check-id/{bag_id}")
def check_baggage_id_availability(bag_id: str, db: Session = Depends(get_db)):
    existing = db.query(BaggageModel).filter(BaggageModel.id.ilike(bag_id.strip())).first()
    return {"available": existing is None, "id": bag_id}


@router.get("/{bag_id}", response_model=BaggageResponse)
def get_baggage_by_id(bag_id: str, db: Session = Depends(get_db)):
    bag = db.query(BaggageModel).filter(BaggageModel.id.ilike(bag_id.strip())).first()
    if not bag:
        raise HTTPException(status_code=404, detail=f"Baggage with ID '{bag_id}' not found.")
    return bag


@router.post("", response_model=BaggageResponse, status_code=201)
def register_baggage(payload: BaggageCreate, db: Session = Depends(get_db)):
    # 1. Determine & Validate Baggage ID
    bag_id = payload.id.strip().upper() if payload.id and payload.id.strip() else f"BAG-{int(datetime.utcnow().timestamp() % 10000 + 1000)}"

    existing = db.query(BaggageModel).filter(BaggageModel.id == bag_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate Baggage ID: '{bag_id}' is already registered."
        )

    # 2. Query Settings to determine weight status
    settings = db.query(SystemSettingsModel).filter(SystemSettingsModel.id == 1).first()
    max_weight = settings.max_baggage_weight if settings else 15.0
    near_limit = settings.near_limit_threshold if settings else 14.0

    weight_val = round(payload.weight, 2)
    if weight_val > max_weight:
        weight_status = "OVERWEIGHT"
    elif weight_val >= near_limit:
        weight_status = "NEAR_LIMIT"
    else:
        weight_status = "ACCEPTED"

    # 3. Create Baggage Record
    reg_time = payload.check_in_time if payload.check_in_time else datetime.now().strftime("%I:%M %p")

    new_bag = BaggageModel(
        id=bag_id,
        passenger_name=payload.passenger_name.strip(),
        passenger_id=payload.passenger_id.strip().upper(),
        flight_number=payload.flight_number.strip().upper(),
        destination=payload.destination.strip(),
        airline=payload.airline.strip(),
        weight=weight_val,
        registration_time=reg_time,
        status="REGISTERED",
        weight_status=weight_status,
        assigned_lane=None,
        processing_stage="ENTRY",
        is_demo=False
    )
    db.add(new_bag)

    # 4. Generate system notification
    notif = NotificationModel(
        id=f"NOTIF-{int(datetime.utcnow().timestamp())}",
        title=f"Baggage Registered: {bag_id}",
        description=f"Checked in for {new_bag.passenger_name} ({new_bag.flight_number} to {new_bag.destination}), measured {new_bag.weight} kg.",
        timestamp=reg_time,
        severity="warning" if weight_status == "OVERWEIGHT" else "info",
        read=False,
        category="SYSTEM"
    )
    db.add(notif)
    db.commit()
    db.refresh(new_bag)

    return new_bag


@router.put("/{bag_id}", response_model=BaggageResponse)
def update_baggage(bag_id: str, payload: BaggageUpdate, db: Session = Depends(get_db)):
    bag = db.query(BaggageModel).filter(BaggageModel.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail=f"Baggage '{bag_id}' not found.")

    update_data = payload.model_dump(exclude_unset=True)

    # If weight is updated, recalculate weight status
    if "weight" in update_data and update_data["weight"] is not None:
        settings = db.query(SystemSettingsModel).filter(SystemSettingsModel.id == 1).first()
        max_weight = settings.max_baggage_weight if settings else 15.0
        near_limit = settings.near_limit_threshold if settings else 14.0

        w = round(update_data["weight"], 2)
        bag.weight = w
        if w > max_weight:
            bag.weight_status = "OVERWEIGHT"
        elif w >= near_limit:
            bag.weight_status = "NEAR_LIMIT"
        else:
            bag.weight_status = "ACCEPTED"
        del update_data["weight"]

    for key, val in update_data.items():
        setattr(bag, key, val)

    db.commit()
    db.refresh(bag)
    return bag


@router.delete("/{bag_id}")
def delete_baggage(bag_id: str, db: Session = Depends(get_db)):
    bag = db.query(BaggageModel).filter(BaggageModel.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail=f"Baggage '{bag_id}' not found.")

    db.delete(bag)
    db.commit()
    return {"message": f"Baggage '{bag_id}' successfully deleted.", "id": bag_id}

