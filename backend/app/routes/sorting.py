import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import BaggageModel, SortingRecordModel, SystemSettingsModel
from backend.app.schemas.schemas import SortingRecordResponse
from backend.app.services.sorting_service import evaluate_and_sort_baggage

router = APIRouter(prefix="/api/sorting", tags=["Smart Sorting"])

def format_sorting_response(record: SortingRecordModel) -> dict:
    return {
        "id": record.id,
        "timestamp": record.timestamp,
        "baggage_id": record.baggage_id,
        "passenger_name": record.passenger_name,
        "flight_number": record.flight_number,
        "destination": record.destination,
        "weight": record.weight,
        "weight_status": record.weight_status,
        "decision": record.decision,
        "assigned_lane": record.assigned_lane,
        "reason": record.reason,
        "logic_inputs": {
            "I": record.logic_i,
            "W": record.logic_w,
            "F": record.logic_f,
        },
        "logic_outputs": {
            "SORT": record.logic_sort,
            "ALERT": record.logic_alert,
        }
    }


@router.post("/evaluate/{bag_id}", response_model=SortingRecordResponse)
def sort_single_baggage(bag_id: str, db: Session = Depends(get_db)):
    bag = db.query(BaggageModel).filter(BaggageModel.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail=f"Baggage '{bag_id}' not found.")

    settings = db.query(SystemSettingsModel).filter(SystemSettingsModel.id == 1).first()
    if not settings:
        raise HTTPException(status_code=500, detail="System settings not configured.")

    record = evaluate_and_sort_baggage(bag, db, settings)
    return format_sorting_response(record)


@router.post("/batch", response_model=List[SortingRecordResponse])
def batch_sort_pending_baggage(db: Session = Depends(get_db)):
    settings = db.query(SystemSettingsModel).filter(SystemSettingsModel.id == 1).first()
    if not settings:
        raise HTTPException(status_code=500, detail="System settings not configured.")

    pending_bags = db.query(BaggageModel).filter(BaggageModel.status == "REGISTERED").all()
    results = []

    for bag in pending_bags:
        record = evaluate_and_sort_baggage(bag, db, settings)
        results.append(format_sorting_response(record))

    return results


@router.get("/history", response_model=List[SortingRecordResponse])
def get_sorting_history(limit: int = 50, db: Session = Depends(get_db)):
    records = db.query(SortingRecordModel).order_by(SortingRecordModel.created_at.desc()).limit(limit).all()
    return [format_sorting_response(r) for r in records]


@router.get("/lanes")
def get_lanes_status(db: Session = Depends(get_db)):
    settings = db.query(SystemSettingsModel).filter(SystemSettingsModel.id == 1).first()
    lanes_config = json.loads(settings.lanes_config_json) if settings else []

    all_bags = db.query(BaggageModel).all()

    lanes_summary = []
    for lane in lanes_config:
        lane_id = lane.get("laneId")
        count = sum(1 for b in all_bags if b.assigned_lane == lane_id)
        lanes_summary.append({
            "lane_id": lane_id,
            "lane_name": lane.get("laneName"),
            "destination": lane.get("destination"),
            "description": lane.get("description"),
            "color": lane.get("color"),
            "bag_count": count
        })

    return lanes_summary

