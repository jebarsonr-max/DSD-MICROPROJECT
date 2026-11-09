import os
import sys
from backend.app.database import SessionLocal, Base, engine
from backend.app.main import seed_initial_demo_data
from backend.app.routes import baggage, weight, sorting, logic, flights, conveyor, reports, notifications, settings
from backend.app.schemas.schemas import BaggageCreate, WeightAnalysisRequest, LogicSimulationRequest, DigitalComparatorRequest, FlightCreate, SystemSettingsUpdate

def run_direct_tests():
    print("Testing AeroSort AI Backend directly with SQLAlchemy...", flush=True)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_demo_data(db)
        print("✓ Database initialized & demo data seeded", flush=True)

        # 1. Test Baggage
        all_bags = baggage.get_all_baggage(None, None, None, db)
        assert len(all_bags) >= 10, f"Expected at least 10 bags, got {len(all_bags)}"
        print(f"✓ Baggage query: {len(all_bags)} bags found", flush=True)

        # 2. Test Flights
        all_flights = flights.get_all_flights(None, db)
        assert len(all_flights) >= 5, f"Expected at least 5 flights, got {len(all_flights)}"
        print(f"✓ Flights query: {len(all_flights)} flights found", flush=True)

        # 3. Test Weight Analysis
        weight_res = weight.analyze_weight(WeightAnalysisRequest(weight=18.5), db)
        assert weight_res["weight_status"] == "OVERWEIGHT"
        assert weight_res["w_signal"] is False
        assert weight_res["excess_weight"] == 3.5
        print(f"✓ Weight analysis: 18.5kg correctly classified as OVERWEIGHT (excess={weight_res['excess_weight']}kg)", flush=True)

        # 4. Test Digital Logic
        logic_res = logic.simulate_digital_logic(LogicSimulationRequest(I=True, W=True, F=True))
        assert logic_res["outputs"]["SORT"] is True
        assert logic_res["outputs"]["ALERT"] is False
        print("✓ Digital Logic: AND gate (1,1,1) -> SORT=1, ALERT=0 verified", flush=True)

        comp_res = logic.simulate_comparator(DigitalComparatorRequest(measured_weight=11.0, reference_weight=15.0))
        assert comp_res["is_less_than"] is True
        assert comp_res["w_output"] is True
        print("✓ Digital Comparator: 11kg < 15kg -> W=1 verified", flush=True)

        # 5. Test Smart Sorting on an un-sorted bag
        pending = next((b for b in all_bags if b.status == "REGISTERED"), None)
        if pending:
            sorted_res = sorting.sort_single_baggage(pending.id, db)
            print(f"✓ Smart Sorting: Evaluated {pending.id} -> Lane: {sorted_res['assigned_lane']} (decision: {sorted_res['decision']})", flush=True)

        # 6. Test Conveyor
        conv_status = conveyor.get_conveyor_status()
        print(f"✓ Conveyor status: Station={conv_status['current_station']}", flush=True)

        # 7. Test Reports Stats
        stats = reports.get_reports_statistics(db)
        print(f"✓ Reports statistics: Total registered={stats['total_registered']}, Success rate={stats['sorting_success_rate']}%", flush=True)

        # 8. Test Notifications
        notifs = notifications.get_notifications(None, db)
        assert len(notifs) >= 1
        print(f"✓ Notifications: {len(notifs)} alerts found", flush=True)

        # 9. Test Settings
        sys_settings = settings.get_system_settings(db)
        assert sys_settings["airport_code"] == "MAA"
        print(f"✓ Settings: Airport {sys_settings['airport_name']} ({sys_settings['airport_code']}) verified", flush=True)

        print("\nALL BACKEND DATABASE & ROUTE LOGIC TESTS PASSED PERFECTLY!", flush=True)

    finally:
        db.close()

if __name__ == "__main__":
    run_direct_tests()

