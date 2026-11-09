from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models.models import BaggageModel, SystemSettingsModel
from backend.app.services.sorting_service import evaluate_and_sort_baggage

STATION_SEQUENCE = [
    "ENTRY",
    "SCANNING",
    "WEIGHING",
    "FLIGHT_ID",
    "LOGIC_DECISION",
    "SORTING_JUNCTION",
    "DESTINATION_LANE"
]

class ConveyorManager:
    def __init__(self):
        self.is_running: bool = False
        self.is_paused: bool = False
        self.current_bag_id: Optional[str] = None
        self.current_station: str = "ENTRY"
        self.progress_percent: float = 0.0
        self.total_processed_count: int = 0
        self.active_lane_id: Optional[str] = None

    def get_state(self):
        return {
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "current_bag_id": self.current_bag_id,
            "current_station": self.current_station,
            "progress_percent": self.progress_percent,
            "total_processed_count": self.total_processed_count,
            "active_lane_id": self.active_lane_id
        }

    def start(self, bag_id: str, db: Session):
        # Validate that bag exists and is not currently in transit or already sorted
        bag = db.query(BaggageModel).filter(BaggageModel.id == bag_id).first()
        if not bag:
            raise ValueError(f"Baggage '{bag_id}' does not exist.")
        if bag.status == "IN_TRANSIT" and self.current_bag_id != bag_id:
            raise ValueError(f"Baggage '{bag_id}' is already in transit.")

        self.is_running = True
        self.is_paused = False
        self.current_bag_id = bag_id
        self.current_station = "ENTRY"
        self.progress_percent = 0.0
        self.active_lane_id = None

        bag.status = "IN_TRANSIT"
        bag.processing_stage = "ENTRY"
        db.commit()

        return self.get_state()

    def pause(self):
        self.is_running = False
        self.is_paused = True
        return self.get_state()

    def resume(self):
        if self.current_bag_id:
            self.is_running = True
            self.is_paused = False
        return self.get_state()

    def reset(self):
        self.is_running = False
        self.is_paused = False
        self.current_bag_id = None
        self.current_station = "ENTRY"
        self.progress_percent = 0.0
        self.active_lane_id = None
        return self.get_state()

    def step(self, db: Session, settings: SystemSettingsModel):
        if not self.is_running or not self.current_bag_id:
            return {"is_finished": True, "state": self.get_state(), "sorting_record": None}

        self.progress_percent = min(100.0, self.progress_percent + 15.0)

        # Update station based on progress
        if self.progress_percent < 20:
            self.current_station = "ENTRY"
        elif self.progress_percent < 40:
            self.current_station = "SCANNING"
        elif self.progress_percent < 60:
            self.current_station = "WEIGHING"
        elif self.progress_percent < 75:
            self.current_station = "FLIGHT_ID"
        elif self.progress_percent < 88:
            self.current_station = "LOGIC_DECISION"
        elif self.progress_percent < 98:
            self.current_station = "SORTING_JUNCTION"
        else:
            self.current_station = "DESTINATION_LANE"

        bag = db.query(BaggageModel).filter(BaggageModel.id == self.current_bag_id).first()
        if bag:
            bag.processing_stage = self.current_station
            db.commit()

        sorting_record = None
        is_finished = False

        if self.progress_percent >= 100.0:
            is_finished = True
            self.is_running = False
            self.progress_percent = 100.0
            self.total_processed_count += 1

            if bag:
                sorting_record = evaluate_and_sort_baggage(bag, db, settings)
                self.active_lane_id = sorting_record.assigned_lane
                if sorting_record.logic_alert:
                    self.current_station = "MANUAL_INSPECTION_LANE"
                else:
                    self.current_station = "DESTINATION_LANE"

        return {
            "is_finished": is_finished,
            "state": self.get_state(),
            "sorting_record": sorting_record
        }

conveyor_manager = ConveyorManager()

