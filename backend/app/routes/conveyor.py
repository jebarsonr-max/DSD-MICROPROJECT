from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import BaggageModel, SystemSettingsModel
from backend.app.schemas.schemas import ConveyorStatusResponse, ConveyorStartRequest, ConveyorStepResponse
from backend.app.services.conveyor_service import conveyor_manager
from backend.app.routes.sorting import format_sorting_response

router = APIRouter(prefix="/api/conveyor", tags=["Conveyor Simulation"])

@router.get("/status", response_model=ConveyorStatusResponse)
def get_conveyor_status():
    return conveyor_manager.get_state()


@router.post("/start", response_model=ConveyorStatusResponse)
def start_conveyor(payload: ConveyorStartRequest, db: Session = Depends(get_db)):
    bag_id = payload.baggage_id

    # If no bag specified, pick the first pending registered bag
    if not bag_id:
        pending_bag = db.query(BaggageModel).filter(BaggageModel.status == "REGISTERED").first()
        if not pending_bag:
            raise HTTPException(status_code=400, detail="No pending registered baggage found in queue.")
        bag_id = pending_bag.id

    try:
        state = conveyor_manager.start(bag_id, db)
        return state
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/pause", response_model=ConveyorStatusResponse)
def pause_conveyor():
    return conveyor_manager.pause()


@router.post("/resume", response_model=ConveyorStatusResponse)
def resume_conveyor():
    return conveyor_manager.resume()


@router.post("/reset", response_model=ConveyorStatusResponse)
def reset_conveyor():
    return conveyor_manager.reset()


@router.post("/step", response_model=ConveyorStepResponse)
def step_conveyor(db: Session = Depends(get_db)):
    settings = db.query(SystemSettingsModel).filter(SystemSettingsModel.id == 1).first()
    if not settings:
        raise HTTPException(status_code=500, detail="System settings not configured.")

    res = conveyor_manager.step(db, settings)
    sorting_resp = None
    if res["sorting_record"]:
        sorting_resp = format_sorting_response(res["sorting_record"])

    return {
        "current_station": res["state"]["current_station"],
        "progress_percent": res["state"]["progress_percent"],
        "is_finished": res["is_finished"],
        "sorting_record": sorting_resp
    }


@router.post("/process-next", response_model=ConveyorStatusResponse)
def process_next_bag(db: Session = Depends(get_db)):
    next_bag = db.query(BaggageModel).filter(BaggageModel.status == "REGISTERED").first()
    if not next_bag:
        raise HTTPException(status_code=400, detail="No pending baggage remaining to process.")

    try:
        return conveyor_manager.start(next_bag.id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

