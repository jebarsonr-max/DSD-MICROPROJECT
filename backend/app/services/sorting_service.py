import json
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models.models import (
    BaggageModel,
    FlightModel,
    SortingRecordModel,
    NotificationModel,
    SystemSettingsModel
)
from backend.app.services.logic_service import evaluate_logic_gates

def evaluate_and_sort_baggage(bag: BaggageModel, db: Session, settings: SystemSettingsModel):
    max_weight = settings.max_baggage_weight
    near_limit = settings.near_limit_threshold
    measured_weight = round(bag.weight, 2)

    # 1. Weight status
    if measured_weight > max_weight:
        weight_status = "OVERWEIGHT"
    elif measured_weight >= near_limit:
        weight_status = "NEAR_LIMIT"
    else:
        weight_status = "ACCEPTED"

    # 2. Logic input signals
    I = bool(bag.id and bag.passenger_name and bag.passenger_id)
    W = measured_weight <= max_weight

    # Query flight
    matching_flight = db.query(FlightModel).filter(
        FlightModel.flight_number.ilike(bag.flight_number.strip())
    ).first()

    F = bool(matching_flight and matching_flight.status != "Cancelled")

    # 3. Evaluate logic gates
    logic_res = evaluate_logic_gates(I, W, F)
    SORT = logic_res["outputs"]["SORT"]
    ALERT = logic_res["outputs"]["ALERT"]

    # 4. Lane assignment & reasoning
    if SORT:
        decision = "ACCEPTED"
        assigned_lane = matching_flight.assigned_lane if matching_flight and matching_flight.assigned_lane else "Lane 01"
        if weight_status == "NEAR_LIMIT":
            reason = f"Normal sort approved via (I=1, W=1, F=1). Warning: Weight {measured_weight} kg is near maximum allowable limit ({max_weight} kg). Dispatched to {assigned_lane}."
        else:
            reason = f"Full automated pass approved via (I=1, W=1, F=1). Routed directly to {assigned_lane} for {bag.destination}."
    else:
        assigned_lane = "Lane 06"  # Manual Inspection / Security Chute
        if not W:
            decision = "DIVERTED_OVERWEIGHT"
            excess = round(measured_weight - max_weight, 2)
            reason = f"Digital Comparator Alert (W=0): Measured weight {measured_weight} kg exceeds limit of {max_weight} kg by {excess} kg. Diverted to Lane 06 for manual inspection and excess baggage handling."
        elif not F:
            decision = "DIVERTED_INVALID"
            reason = f"Flight Manifest Error (F=0): Flight '{bag.flight_number}' is unlisted, departed, or cancelled. Diverted to Lane 06."
        else:
            decision = "DIVERTED_INVALID"
            reason = f"Identification Fault (I=0): Incomplete or unreadable RFID barcode tag. Diverted to Lane 06 for security verification."

    # 5. Persist Sorting Record in DB
    record_id = f"SRT-{int(datetime.utcnow().timestamp())}-{bag.id.replace('BAG-', '')}"
    time_str = datetime.now().strftime("%I:%M:%S %p")

    sorting_record = SortingRecordModel(
        id=record_id,
        timestamp=time_str,
        baggage_id=bag.id,
        passenger_name=bag.passenger_name,
        flight_number=bag.flight_number,
        destination=bag.destination,
        weight=measured_weight,
        weight_status=weight_status,
        decision=decision,
        assigned_lane=assigned_lane,
        reason=reason,
        logic_i=I,
        logic_w=W,
        logic_f=F,
        logic_sort=SORT,
        logic_alert=ALERT
    )
    db.add(sorting_record)

    # 6. Update Baggage status in DB
    final_status = "SORTED" if SORT else ("OVERWEIGHT" if not W else "MANUAL_INSPECTION")
    bag.status = final_status
    bag.weight_status = weight_status
    bag.assigned_lane = assigned_lane
    bag.processing_stage = "MANUAL_INSPECTION_LANE" if ALERT else "DESTINATION_LANE"
    bag.rejection_reason = reason if ALERT else None

    # 7. Add Notification in DB
    notif_id = f"NOTIF-{int(datetime.utcnow().timestamp())}"
    if ALERT:
        notif_title = f"Safety Divert: Overweight {bag.id}" if not W else f"Manifest Divert: {bag.id}"
        notif = NotificationModel(
            id=notif_id,
            title=notif_title,
            description=reason,
            timestamp=datetime.now().strftime("%I:%M %p"),
            severity="high",
            read=False,
            category="OVERWEIGHT" if not W else "SORTING"
        )
    else:
        notif = NotificationModel(
            id=notif_id,
            title=f"Sorting Complete: {bag.id} → {assigned_lane}",
            description=f"Dispatched to {bag.destination} via flight {bag.flight_number}. AND Gate: I·W·F = 1.",
            timestamp=datetime.now().strftime("%I:%M %p"),
            severity="warning" if weight_status == "NEAR_LIMIT" else "success",
            read=False,
            category="SORTING"
        )
    db.add(notif)
    db.commit()
    db.refresh(bag)
    db.refresh(sorting_record)

    return sorting_record

