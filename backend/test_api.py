import sys
from fastapi.testclient import TestClient
from backend.app.main import app

def run_tests():
    print("Testing AeroSort AI Backend APIs...", flush=True)

    with TestClient(app) as client:
        # 1. Root & Health
        r = client.get("/")
        assert r.status_code == 200, f"Root failed: {r.text}"
        print("✓ GET /: 200 OK", flush=True)

        r = client.get("/api/health")
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print("✓ GET /api/health: 200 OK", flush=True)

        # 2. Baggage APIs
        r = client.get("/api/baggage")
        assert r.status_code == 200, f"Get baggage failed: {r.text}"
        baggage_list = r.json()
        assert len(baggage_list) >= 10, f"Expected seeded baggage, got {len(baggage_list)}"
        print(f"✓ GET /api/baggage: Found {len(baggage_list)} records", flush=True)

        # Register new baggage
        new_bag_payload = {
            "id": "BAG-TEST-99",
            "passenger_name": "Test Passenger",
            "passenger_id": "PAX-999",
            "flight_number": "AI 101",
            "destination": "Delhi",
            "airline": "Air India",
            "weight": 13.5
        }
        r = client.post("/api/baggage", json=new_bag_payload)
        assert r.status_code == 201, f"Create baggage failed: {r.text}"
        print("✓ POST /api/baggage: Created BAG-TEST-99 successfully", flush=True)

        # Check ID availability
        r = client.get("/api/baggage/check-id/BAG-TEST-99")
        assert r.json()["available"] is False, "Duplicate ID should not be available"
        print("✓ GET /api/baggage/check-id: Duplicate detected correctly", flush=True)

        # 3. Flights APIs
        r = client.get("/api/flights")
        assert r.status_code == 200, f"Get flights failed: {r.text}"
        flights_list = r.json()
        assert len(flights_list) >= 5, f"Expected seeded flights, got {len(flights_list)}"
        print(f"✓ GET /api/flights: Found {len(flights_list)} flights", flush=True)

        # 4. Weight Analyzer APIs
        r = client.post("/api/weight/analyze", json={"weight": 16.5})
        assert r.status_code == 200, f"Analyze weight failed: {r.text}"
        res = r.json()
        assert res["weight_status"] == "OVERWEIGHT", "16.5kg should be OVERWEIGHT"
        assert res["w_signal"] is False, "W signal should be False for overweight"
        assert res["excess_weight"] == 1.5, f"Excess should be 1.5kg, got {res['excess_weight']}"
        print("✓ POST /api/weight/analyze: Overweight logic verified (16.5 kg > 15.0 kg)", flush=True)

        r = client.post("/api/weight/simulate-sensor")
        assert r.status_code == 200, f"Sensor simulation failed: {r.text}"
        print(f"✓ POST /api/weight/simulate-sensor: Simulated {r.json()['simulated_weight']} kg", flush=True)

        # 5. Digital Logic APIs
        # AND Gate: I=1, W=1, F=1 -> SORT=1
        r = client.post("/api/logic/simulate", json={"I": True, "W": True, "F": True})
        assert r.json()["outputs"]["SORT"] is True, "AND gate failed for (1,1,1)"
        assert r.json()["outputs"]["ALERT"] is False, "OR gate should be 0 for (1,1,1)"
        print("✓ POST /api/logic/simulate: (1,1,1) -> SORT=1, ALERT=0 verified", flush=True)

        # Comparator: A < B
        r = client.post("/api/logic/comparator", json={"measured_weight": 12.0, "reference_weight": 15.0})
        assert r.json()["is_less_than"] is True, "Comparator A < B failed"
        assert r.json()["w_output"] is True, "W output failed"
        print("✓ POST /api/logic/comparator: A < B verified", flush=True)

        # Truth Table
        r = client.get("/api/logic/truth-table")
        assert len(r.json()["rows"]) == 8, "Truth table must have exactly 8 rows"
        print("✓ GET /api/logic/truth-table: 8 rows returned", flush=True)

        # 6. Smart Sorting API
        r = client.post("/api/sorting/evaluate/BAG-TEST-99")
        assert r.status_code == 200, f"Sorting evaluate failed: {r.text}"
        sort_res = r.json()
        assert sort_res["decision"] == "ACCEPTED", f"Expected ACCEPTED, got {sort_res['decision']}"
        assert sort_res["assigned_lane"] == "Lane 01", f"Expected Lane 01, got {sort_res['assigned_lane']}"
        print(f"✓ POST /api/sorting/evaluate/BAG-TEST-99: Sorted to {sort_res['assigned_lane']}", flush=True)

        # 7. Conveyor Simulation API
        r = client.get("/api/conveyor/status")
        assert r.status_code == 200
        print("✓ GET /api/conveyor/status: OK", flush=True)

        r = client.post("/api/conveyor/start", json={})
        assert r.status_code == 200
        print(f"✓ POST /api/conveyor/start: Started with {r.json()['current_bag_id']}", flush=True)

        r = client.post("/api/conveyor/step")
        assert r.status_code == 200
        print(f"✓ POST /api/conveyor/step: Advanced to {r.json()['current_station']}", flush=True)

        # 8. Reports API
        r = client.get("/api/reports/statistics")
        assert r.status_code == 200
        stats = r.json()
        print(f"✓ GET /api/reports/statistics: {stats['total_registered']} registered, {stats['sorting_success_rate']}% rate", flush=True)

        r = client.get("/api/reports/export-csv")
        assert r.status_code == 200
        assert "Baggage ID,Passenger Name" in r.text
        print("✓ GET /api/reports/export-csv: CSV content verified", flush=True)

        # 9. Notifications API
        r = client.get("/api/notifications")
        assert r.status_code == 200
        print(f"✓ GET /api/notifications: {len(r.json())} notifications", flush=True)

        # 10. Settings API
        r = client.get("/api/settings")
        assert r.status_code == 200
        assert r.json()["airport_code"] == "MAA"
        print("✓ GET /api/settings: Airport MAA verified", flush=True)

    print("\nALL 10 BACKEND MODULE TESTS PASSED WITH 100% SUCCESS!", flush=True)

if __name__ == "__main__":
    run_tests()
