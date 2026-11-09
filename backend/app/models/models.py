from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime
from backend.app.database import Base

class BaggageModel(Base):
    __tablename__ = "baggage"

    id = Column(String(50), primary_key=True, index=True)
    passenger_name = Column(String(100), nullable=False)
    passenger_id = Column(String(50), nullable=False)
    flight_number = Column(String(20), nullable=False, index=True)
    destination = Column(String(100), nullable=False)
    airline = Column(String(100), nullable=False)
    weight = Column(Float, nullable=False)
    registration_time = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="REGISTERED")
    weight_status = Column(String(50), nullable=False, default="ACCEPTED")
    assigned_lane = Column(String(50), nullable=True)
    processing_stage = Column(String(50), nullable=False, default="ENTRY")
    rejection_reason = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FlightModel(Base):
    __tablename__ = "flights"

    id = Column(String(50), primary_key=True, index=True)
    flight_number = Column(String(20), unique=True, nullable=False, index=True)
    airline = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    departure_time = Column(String(20), nullable=False)
    gate_number = Column(String(20), nullable=False)
    assigned_lane = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="Scheduled")
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SortingRecordModel(Base):
    __tablename__ = "sorting_records"

    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(String(50), nullable=False)
    baggage_id = Column(String(50), nullable=False, index=True)
    passenger_name = Column(String(100), nullable=False)
    flight_number = Column(String(20), nullable=False)
    destination = Column(String(100), nullable=False)
    weight = Column(Float, nullable=False)
    weight_status = Column(String(50), nullable=False)
    decision = Column(String(50), nullable=False)
    assigned_lane = Column(String(50), nullable=False)
    reason = Column(Text, nullable=False)
    logic_i = Column(Boolean, nullable=False)
    logic_w = Column(Boolean, nullable=False)
    logic_f = Column(Boolean, nullable=False)
    logic_sort = Column(Boolean, nullable=False)
    logic_alert = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class NotificationModel(Base):
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    timestamp = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, default="info")
    read = Column(Boolean, default=False)
    category = Column(String(50), nullable=False, default="SYSTEM")
    created_at = Column(DateTime, default=datetime.utcnow)


class SystemSettingsModel(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, default=1)
    airport_name = Column(String(150), default="Chennai International Airport")
    airport_code = Column(String(10), default="MAA")
    terminal_name = Column(String(150), default="Terminal 2 — Domestic Departures")
    max_baggage_weight = Column(Float, default=15.0)
    near_limit_threshold = Column(Float, default=14.0)
    conveyor_speed_multiplier = Column(Float, default=1.0)
    sound_alerts_enabled = Column(Boolean, default=True)
    auto_process_queue = Column(Boolean, default=False)
    lanes_config_json = Column(Text, nullable=False)

