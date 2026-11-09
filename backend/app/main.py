import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.app.database import engine, Base, SessionLocal
from backend.app.models.models import (
    BaggageModel,
    FlightModel,
    SortingRecordModel,
    NotificationModel,
    SystemSettingsModel
)
from backend.app.routes import (
    baggage_router,
    weight_router,
    sorting_router,
    logic_router,
    flights_router,
    conveyor_router,
    reports_router,
    notifications_router,
    settings_router
)

def seed_initial_demo_data(db: Session):
    # Check if settings already seeded
    if not db.query(SystemSettingsModel).first():
        lanes_config = [
            {"laneId": "Lane 01", "laneName": "Sort Lane 01", "destination": "Delhi", "description": "Flight AI 101 Dedicated Chute", "color": "#17365D"},
            {"laneId": "Lane 02", "laneName": "Sort Lane 02", "destination": "Mumbai", "description": "Flight AI 202 Dedicated Chute", "color": "#2878D0"},
            {"laneId": "Lane 03", "laneName": "Sort Lane 03", "destination": "Bengaluru", "description": "Flight AI 303 Dedicated Chute", "color": "#0284C7"},
            {"laneId": "Lane 04", "laneName": "Sort Lane 04", "destination": "Hyderabad", "description": "Flight AI 404 Dedicated Chute", "color": "#0D9488"},
            {"laneId": "Lane 05", "laneName": "Sort Lane 05", "destination": "Kolkata", "description": "Flight AI 505 Dedicated Chute", "color": "#16A36A"},
            {"laneId": "Lane 06", "laneName": "Sort Lane 06 (Security)", "destination": "Manual Inspection", "description": "Overweight & Invalid Baggage Diverter", "color": "#DC4545"}
        ]
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
            lanes_config_json=json.dumps(lanes_config)
        )
        db.add(settings)

    # Seed Flights
    if db.query(FlightModel).count() == 0:
        demo_flights = [
            FlightModel(id="FLT-001", flight_number="AI 101", airline="Air India", destination="Delhi", departure_time="13:45", gate_number="G-12", assigned_lane="Lane 01", status="Boarding", is_demo=True),
            FlightModel(id="FLT-002", flight_number="AI 202", airline="Air India", destination="Mumbai", departure_time="14:30", gate_number="G-08", assigned_lane="Lane 02", status="Scheduled", is_demo=True),
            FlightModel(id="FLT-003", flight_number="AI 303", airline="Air India", destination="Bengaluru", departure_time="15:15", gate_number="G-04", assigned_lane="Lane 03", status="Scheduled", is_demo=True),
            FlightModel(id="FLT-004", flight_number="AI 404", airline="Air India", destination="Hyderabad", departure_time="16:00", gate_number="G-15", assigned_lane="Lane 04", status="Scheduled", is_demo=True),
            FlightModel(id="FLT-005", flight_number="AI 505", airline="Air India", destination="Kolkata", departure_time="17:20", gate_number="G-09", assigned_lane="Lane 05", status="Delayed", is_demo=True),
        ]
        db.add_all(demo_flights)

    # Seed Baggage
    if db.query(BaggageModel).count() == 0:
        demo_baggage = [
            BaggageModel(id="BAG-1011", passenger_name="Aarav Sharma", passenger_id="PAX-801", flight_number="AI 101", destination="Delhi", airline="Air India", weight=11.4, registration_time="10:15 AM", status="SORTED", weight_status="ACCEPTED", assigned_lane="Lane 01", processing_stage="DESTINATION_LANE", is_demo=True),
            BaggageModel(id="BAG-1012", passenger_name="Priya Sundaram", passenger_id="PAX-802", flight_number="AI 202", destination="Mumbai", airline="Air India", weight=14.6, registration_time="10:22 AM", status="SORTED", weight_status="NEAR_LIMIT", assigned_lane="Lane 02", processing_stage="DESTINATION_LANE", is_demo=True),
            BaggageModel(id="BAG-1013", passenger_name="Vikram Malhotra", passenger_id="PAX-803", flight_number="AI 101", destination="Delhi", airline="Air India", weight=18.2, registration_time="10:30 AM", status="OVERWEIGHT", weight_status="OVERWEIGHT", assigned_lane="Lane 06", processing_stage="MANUAL_INSPECTION_LANE", rejection_reason="Exceeds 15.0 kg allowance by 3.2 kg (Safety Limit Divert)", is_demo=True),
            BaggageModel(id="BAG-1014", passenger_name="Ananya Deshmukh", passenger_id="PAX-804", flight_number="AI 303", destination="Bengaluru", airline="Air India", weight=9.8, registration_time="10:35 AM", status="SORTED", weight_status="ACCEPTED", assigned_lane="Lane 03", processing_stage="DESTINATION_LANE", is_demo=True),
            BaggageModel(id="BAG-1015", passenger_name="Karthik Raman", passenger_id="PAX-805", flight_number="AI 404", destination="Hyderabad", airline="Air India", weight=12.5, registration_time="10:42 AM", status="SORTED", weight_status="ACCEPTED", assigned_lane="Lane 04", processing_stage="DESTINATION_LANE", is_demo=True),
            BaggageModel(id="BAG-1016", passenger_name="Meera Nambiar", passenger_id="PAX-806", flight_number="AI 505", destination="Kolkata", airline="Air India", weight=16.9, registration_time="10:50 AM", status="OVERWEIGHT", weight_status="OVERWEIGHT", assigned_lane="Lane 06", processing_stage="MANUAL_INSPECTION_LANE", rejection_reason="Exceeds 15.0 kg allowance by 1.9 kg (Safety Limit Divert)", is_demo=True),
            BaggageModel(id="BAG-1017", passenger_name="Rohan Varma", passenger_id="PAX-807", flight_number="AI 202", destination="Mumbai", airline="Air India", weight=13.8, registration_time="11:00 AM", status="REGISTERED", weight_status="ACCEPTED", assigned_lane=None, processing_stage="ENTRY", is_demo=True),
            BaggageModel(id="BAG-1018", passenger_name="Sneha Patel", passenger_id="PAX-808", flight_number="AI 303", destination="Bengaluru", airline="Air India", weight=14.8, registration_time="11:05 AM", status="REGISTERED", weight_status="NEAR_LIMIT", assigned_lane=None, processing_stage="ENTRY", is_demo=True),
            BaggageModel(id="BAG-1019", passenger_name="Tanvi Chatterjee", passenger_id="PAX-809", flight_number="AI 505", destination="Kolkata", airline="Air India", weight=17.5, registration_time="11:10 AM", status="REGISTERED", weight_status="OVERWEIGHT", assigned_lane=None, processing_stage="ENTRY", is_demo=True),
            BaggageModel(id="BAG-1020", passenger_name="Deepak Reddy", passenger_id="PAX-810", flight_number="AI 101", destination="Delhi", airline="Air India", weight=10.2, registration_time="11:15 AM", status="REGISTERED", weight_status="ACCEPTED", assigned_lane=None, processing_stage="ENTRY", is_demo=True),
            BaggageModel(id="BAG-1021", passenger_name="Fatima Sheikh", passenger_id="PAX-811", flight_number="AI 404", destination="Hyderabad", airline="Air India", weight=12.1, registration_time="11:18 AM", status="REGISTERED", weight_status="ACCEPTED", assigned_lane=None, processing_stage="ENTRY", is_demo=True),
            BaggageModel(id="BAG-1022", passenger_name="Sanjay Nair", passenger_id="PAX-812", flight_number="AI 202", destination="Mumbai", airline="Air India", weight=14.1, registration_time="11:22 AM", status="REGISTERED", weight_status="NEAR_LIMIT", assigned_lane=None, processing_stage="ENTRY", is_demo=True),
        ]
        db.add_all(demo_baggage)

    # Seed Sorting History
    if db.query(SortingRecordModel).count() == 0:
        demo_sorting = [
            SortingRecordModel(
                id="SRT-100001-1011",
                timestamp="10:16 AM",
                baggage_id="BAG-1011",
                passenger_name="Aarav Sharma",
                flight_number="AI 101",
                destination="Delhi",
                weight=11.4,
                weight_status="ACCEPTED",
                decision="ACCEPTED",
                assigned_lane="Lane 01",
                reason="Full automated pass approved via (I=1, W=1, F=1). Routed directly to Lane 01 for Delhi.",
                logic_i=True,
                logic_w=True,
                logic_f=True,
                logic_sort=True,
                logic_alert=False
            ),
            SortingRecordModel(
                id="SRT-100002-1012",
                timestamp="10:23 AM",
                baggage_id="BAG-1012",
                passenger_name="Priya Sundaram",
                flight_number="AI 202",
                destination="Mumbai",
                weight=14.6,
                weight_status="NEAR_LIMIT",
                decision="ACCEPTED",
                assigned_lane="Lane 02",
                reason="Normal sort approved via (I=1, W=1, F=1). Warning: Weight 14.6kg is near limit. Dispatched to Lane 02.",
                logic_i=True,
                logic_w=True,
                logic_f=True,
                logic_sort=True,
                logic_alert=False
            ),
            SortingRecordModel(
                id="SRT-100003-1013",
                timestamp="10:31 AM",
                baggage_id="BAG-1013",
                passenger_name="Vikram Malhotra",
                flight_number="AI 101",
                destination="Delhi",
                weight=18.2,
                weight_status="OVERWEIGHT",
                decision="DIVERTED_OVERWEIGHT",
                assigned_lane="Lane 06",
                reason="Digital Comparator Alert (W=0): Measured weight 18.2kg exceeds limit of 15.0kg by 3.2kg. Diverted to Lane 06.",
                logic_i=True,
                logic_w=False,
                logic_f=True,
                logic_sort=False,
                logic_alert=True
            ),
        ]
        db.add_all(demo_sorting)

    # Seed Notifications
    if db.query(NotificationModel).count() == 0:
        demo_notifs = [
            NotificationModel(
                id="NOTIF-001",
                title="Overweight Baggage Diverted to Lane 06",
                description="BAG-1013 (18.2 kg) exceeded maximum 15.0 kg threshold. Automated divert gate triggered for Vikram Malhotra.",
                timestamp="10:31 AM",
                severity="high",
                read=False,
                category="OVERWEIGHT"
            ),
            NotificationModel(
                id="NOTIF-002",
                title="Near-Limit Warning Flagged",
                description="BAG-1012 (14.6 kg) flagged as near allowable limit of 15.0 kg. Passed to Lane 02 with yellow tag caution.",
                timestamp="10:23 AM",
                severity="warning",
                read=False,
                category="SORTING"
            ),
            NotificationModel(
                id="NOTIF-003",
                title="Baggage Dispatch Verified — Delhi AI 101",
                description="BAG-1011 successfully routed to Sort Lane 01 (Delhi) via 3-input AND gate confirmation.",
                timestamp="10:16 AM",
                severity="success",
                read=True,
                category="SORTING"
            ),
            NotificationModel(
                id="NOTIF-004",
                title="Conveyor Optical Line Sensor Calibrated",
                description="System self-test passed at Station 02 (RFID/Barcode Scanner) & Station 03 (Weight Load Cell).",
                timestamp="09:00 AM",
                severity="info",
                read=True,
                category="CONVEYOR"
            )
        ]
        db.add_all(demo_notifs)

    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_demo_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="AeroSort AI Backend API",
    description="Smart Airport Luggage Sorting and Weight Analyzer System REST APIs with Digital Logic Control",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration to allow all frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers
app.include_router(baggage_router)
app.include_router(weight_router)
app.include_router(sorting_router)
app.include_router(logic_router)
app.include_router(flights_router)
app.include_router(conveyor_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(settings_router)

@app.get("/")
def root():
    return {
        "system": "AeroSort AI",
        "tagline": "Intelligent Baggage. Accurate Weighing. Automated Sorting.",
        "status": "OPERATIONAL",
        "version": "2.0.0",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "AeroSort AI API", "database": "SQLite Connected"}

