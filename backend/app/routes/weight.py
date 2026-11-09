import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import BaggageModel, SystemSettingsModel, NotificationModel
from backend.app.schemas.schemas import WeightAnalysisRequest, WeightAnalysisResponse, BaggageResponse

router = APIRouter(prefix="/api/weight", tags=["Weight Analyzer"])

@router.post("/analyze", response_model=WeightAnalysisResponse)
def analyze_weight(payload: WeightAnalysisRequest, db: Session = Depends(get_db)):
    settings = db.query(SystemSettingsModel).filter(SystemSettingsModel.id == 1).first()
    max_weight = settings.max_baggage_weight if settings else 15.0
    near_limit = settings.near_limit_threshold if settings else 14.0

    measured = round(payload.weight, 2)

    if measured > max_weight:
        weight_status = "OVERWEIGHT"
        symbol = ">"
        text = f"A > B ({measured} kg > {max_weight} kg) — Safety Limit Exceeded. Excess penalty applies."
    elif measured >= near_limit:
        weight_status = "NEAR_LIMIT"
        symbol = "≈"
        text = f"A ≈ B ({measured} kg, limit {max_weight} kg) — Near Limit Warning. Dispatch with caution."
    else:
        weight_status = "ACCEPTED"
        symbol = "<"
        text = f"A < B ({measured} kg < {max_weight} kg) — Normal Weight Within Permitted Safety Margin."

    remaining = max(0.0, round(max_weight - measured, 2))
    excess = max(0.0, round(measured - max_weight, 2))
    w_signal = measured <= max_weight

    return {
        "measured_weight": measured,
        "maximum_weight": max_weight,
        "near_limit_threshold": near_limit,
        "weight_status": weight_status,
        "remaining_allowance": remaining,
        "excess_weight": excess,
        "comparator_symbol": symbol,
        "comparator_text": text,
        "w_signal": w_signal
    }


@router.post("/simulate-sensor")
def simulate_load_cell_sensor(db: Session = Depends(get_db)):
    """
    Simulates analog-to-digital converter (ADC) sampling of a piezoelectric strain gauge load-cell.
    Returns simulated weight, analog voltage (0-5V), and status.
    """
    settings = db.query(SystemSettingsModel).filter(SystemSettingsModel.id == 1).first()
    max_weight = settings.max_baggage_weight if settings else 15.0

    # Realistic baggage weight range: 8.5 kg to 18.5 kg
    simulated_weight = round(random.uniform(8.5, 18.5), 2)
    analog_voltage = round((simulated_weight / 30.0) * 5.0, 3)

    return {
        "simulated_weight": simulated_weight,
        "analog_voltage_v": analog_voltage,
        "adc_resolution_bits": 24,
        "sampling_rate_hz": 1000,
        "sensor_type": "Simulated Piezoelectric Strain Gauge (Hardware Emulation)",
        "is_overweight": simulated_weight > max_weight
    }


@router.put("/apply/{bag_id}", response_model=BaggageResponse)
def apply_weight_to_baggage(bag_id: str, payload: WeightAnalysisRequest, db: Session = Depends(get_db)):
    bag = db.query(BaggageModel).filter(BaggageModel.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail=f"Baggage '{bag_id}' not found.")

    settings = db.query(SystemSettingsModel).filter(SystemSettingsModel.id == 1).first()
    max_weight = settings.max_baggage_weight if settings else 15.0
    near_limit = settings.near_limit_threshold if settings else 14.0

    w = round(payload.weight, 2)
    bag.weight = w
    if w > max_weight:
        bag.weight_status = "OVERWEIGHT"
    elif w >= near_limit:
        bag.weight_status = "NEAR_LIMIT"
    else:
        bag.weight_status = "ACCEPTED"

    db.commit()
    db.refresh(bag)
    return bag

