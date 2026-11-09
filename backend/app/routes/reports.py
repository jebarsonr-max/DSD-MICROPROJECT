import csv
import io
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import BaggageModel, SortingRecordModel, SystemSettingsModel
from backend.app.schemas.schemas import ReportStatisticsResponse

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/statistics", response_model=ReportStatisticsResponse)
def get_reports_statistics(db: Session = Depends(get_db)):
    all_bags = db.query(BaggageModel).all()
    total_reg = len(all_bags)

    processed_bags = [b for b in all_bags if b.status in ("SORTED", "OVERWEIGHT", "MANUAL_INSPECTION")]
    total_proc = len(processed_bags)
    sorted_bags = [b for b in all_bags if b.status == "SORTED"]
    total_sorted = len(sorted_bags)
    overweight_bags = [b for b in all_bags if b.status == "OVERWEIGHT" or b.weight_status == "OVERWEIGHT"]
    total_overweight = len(overweight_bags)
    pending_bags = [b for b in all_bags if b.status == "REGISTERED"]
    total_pending = len(pending_bags)

    success_rate = round((total_sorted / total_proc * 100.0), 1) if total_proc > 0 else 100.0
    avg_weight = round(sum(b.weight for b in all_bags) / total_reg, 1) if total_reg > 0 else 0.0

    # Destination breakdown
    dest_counts = {}
    for b in all_bags:
        dest_counts[b.destination] = dest_counts.get(b.destination, 0) + 1
    dest_dist = [{"name": dest, "count": count} for dest, count in dest_counts.items()]

    # Weight distribution
    w_ranges = [
        {"range": "< 10 kg", "count": 0, "fill": "#2878D0"},
        {"range": "10 - 13.9 kg", "count": 0, "fill": "#16A36A"},
        {"range": "14 - 15 kg (Near Limit)", "count": 0, "fill": "#E99A25"},
        {"range": "> 15 kg (Overweight)", "count": 0, "fill": "#DC4545"}
    ]
    for b in all_bags:
        if b.weight < 10.0:
            w_ranges[0]["count"] += 1
        elif b.weight < 14.0:
            w_ranges[1]["count"] += 1
        elif b.weight <= 15.0:
            w_ranges[2]["count"] += 1
        else:
            w_ranges[3]["count"] += 1

    return {
        "total_registered": total_reg,
        "total_processed": total_proc,
        "successfully_sorted": total_sorted,
        "overweight_baggage": total_overweight,
        "pending_baggage": total_pending,
        "sorting_success_rate": success_rate,
        "average_bag_weight": avg_weight,
        "destination_distribution": dest_dist,
        "weight_distribution": w_ranges
    }


@router.get("/export-csv")
def export_csv_report(db: Session = Depends(get_db)):
    bags = db.query(BaggageModel).order_by(BaggageModel.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Baggage ID",
        "Passenger Name",
        "Passenger ID",
        "Flight Number",
        "Destination",
        "Airline",
        "Weight (kg)",
        "Weight Status",
        "Sorting Status",
        "Assigned Lane",
        "Registration Time",
        "Is Demo Record"
    ])

    for b in bags:
        writer.writerow([
            b.id,
            b.passenger_name,
            b.passenger_id,
            b.flight_number,
            b.destination,
            b.airline,
            f"{b.weight:.2f}",
            b.weight_status,
            b.status,
            b.assigned_lane or "Unassigned",
            b.registration_time,
            "Yes" if b.is_demo else "No"
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=AeroSort_AI_Baggage_Report.csv"
        }
    )

