from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# ── Baggage Schemas ──
class BaggageBase(BaseModel):
    passenger_name: str = Field(..., min_length=1, max_length=100)
    passenger_id: str = Field(..., min_length=1, max_length=50)
    flight_number: str = Field(..., min_length=1, max_length=20)
    destination: str = Field(..., min_length=1, max_length=100)
    airline: str = Field(..., min_length=1, max_length=100)
    weight: float = Field(..., gt=0)

class BaggageCreate(BaggageBase):
    id: Optional[str] = None
    check_in_time: Optional[str] = None

class BaggageUpdate(BaseModel):
    passenger_name: Optional[str] = None
    passenger_id: Optional[str] = None
    flight_number: Optional[str] = None
    destination: Optional[str] = None
    airline: Optional[str] = None
    weight: Optional[float] = Field(None, gt=0)
    status: Optional[str] = None
    assigned_lane: Optional[str] = None
    processing_stage: Optional[str] = None
    rejection_reason: Optional[str] = None

class BaggageResponse(BaggageBase):
    id: str
    registration_time: str
    status: str
    weight_status: str
    assigned_lane: Optional[str] = None
    processing_stage: str
    rejection_reason: Optional[str] = None
    is_demo: bool = False

    class Config:
        from_attributes = True


# ── Flight Schemas ──
class FlightBase(BaseModel):
    flight_number: str = Field(..., min_length=1, max_length=20)
    airline: str = Field(..., min_length=1, max_length=100)
    destination: str = Field(..., min_length=1, max_length=100)
    departure_time: str = Field(..., min_length=1, max_length=20)
    gate_number: str = Field(..., min_length=1, max_length=20)
    assigned_lane: str = Field(..., min_length=1, max_length=50)
    status: str = Field(default="Scheduled")

class FlightCreate(FlightBase):
    pass

class FlightUpdate(BaseModel):
    airline: Optional[str] = None
    destination: Optional[str] = None
    departure_time: Optional[str] = None
    gate_number: Optional[str] = None
    assigned_lane: Optional[str] = None
    status: Optional[str] = None

class FlightResponse(FlightBase):
    id: str
    is_demo: bool = False

    class Config:
        from_attributes = True


# ── Sorting Record Schemas ──
class LogicInputsSchema(BaseModel):
    I: bool
    W: bool
    F: bool

class LogicOutputsSchema(BaseModel):
    SORT: bool
    ALERT: bool

class SortingRecordResponse(BaseModel):
    id: str
    timestamp: str
    baggage_id: str
    passenger_name: str
    flight_number: str
    destination: str
    weight: float
    weight_status: str
    decision: str
    assigned_lane: str
    reason: str
    logic_inputs: LogicInputsSchema
    logic_outputs: LogicOutputsSchema

    class Config:
        from_attributes = True


# ── Notification Schemas ──
class NotificationBase(BaseModel):
    title: str
    description: str
    severity: str = "info"
    category: str = "SYSTEM"

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: str
    timestamp: str
    read: bool

    class Config:
        from_attributes = True


# ── System Settings Schemas ──
class LaneConfigItem(BaseModel):
    laneId: str
    laneName: str
    destination: str
    description: str
    color: str

class SystemSettingsBase(BaseModel):
    airport_name: str
    airport_code: str
    terminal_name: str
    max_baggage_weight: float
    near_limit_threshold: float
    conveyor_speed_multiplier: float
    sound_alerts_enabled: bool
    auto_process_queue: bool
    lanes_config: List[LaneConfigItem]

class SystemSettingsUpdate(BaseModel):
    airport_name: Optional[str] = None
    airport_code: Optional[str] = None
    terminal_name: Optional[str] = None
    max_baggage_weight: Optional[float] = None
    near_limit_threshold: Optional[float] = None
    conveyor_speed_multiplier: Optional[float] = None
    sound_alerts_enabled: Optional[bool] = None
    auto_process_queue: Optional[bool] = None
    lanes_config: Optional[List[LaneConfigItem]] = None

class SystemSettingsResponse(SystemSettingsBase):
    id: int

    class Config:
        from_attributes = True


# ── Weight Analyzer Schemas ──
class WeightAnalysisRequest(BaseModel):
    weight: float = Field(..., ge=0)

class WeightAnalysisResponse(BaseModel):
    measured_weight: float
    maximum_weight: float
    near_limit_threshold: float
    weight_status: str
    remaining_allowance: float
    excess_weight: float
    comparator_symbol: str
    comparator_text: str
    w_signal: bool


# ── Digital Logic Schemas ──
class LogicSimulationRequest(BaseModel):
    I: bool
    W: bool
    F: bool

class LogicSimulationResponse(BaseModel):
    inputs: Dict[str, bool]
    outputs: Dict[str, bool]
    comparator_note: str
    decision: str
    assigned_chute_type: str

class DigitalComparatorRequest(BaseModel):
    measured_weight: float
    reference_weight: float

class DigitalComparatorResponse(BaseModel):
    measured_weight: float
    reference_weight: float
    is_less_than: bool
    is_equal: bool
    is_greater_than: bool
    w_output: bool
    condition_symbol: str
    condition_description: str


# ── Conveyor State Schemas ──
class ConveyorStatusResponse(BaseModel):
    is_running: bool
    is_paused: bool
    current_bag_id: Optional[str] = None
    current_station: str
    progress_percent: float
    total_processed_count: int
    active_lane_id: Optional[str] = None

class ConveyorStartRequest(BaseModel):
    baggage_id: Optional[str] = None

class ConveyorStepResponse(BaseModel):
    current_station: str
    progress_percent: float
    is_finished: bool
    sorting_record: Optional[SortingRecordResponse] = None


# ── Reports & Statistics Schemas ──
class ReportStatisticsResponse(BaseModel):
    total_registered: int
    total_processed: int
    successfully_sorted: int
    overweight_baggage: int
    pending_baggage: int
    sorting_success_rate: float
    average_bag_weight: float
    destination_distribution: List[Dict[str, Any]]
    weight_distribution: List[Dict[str, Any]]

