from fastapi import APIRouter
from backend.app.schemas.schemas import (
    LogicSimulationRequest,
    LogicSimulationResponse,
    DigitalComparatorRequest,
    DigitalComparatorResponse
)
from backend.app.services.logic_service import (
    evaluate_logic_gates,
    evaluate_digital_comparator,
    get_truth_table
)

router = APIRouter(prefix="/api/logic", tags=["Digital Logic Control"])

@router.post("/simulate", response_model=LogicSimulationResponse)
def simulate_digital_logic(payload: LogicSimulationRequest):
    """
    Evaluates 3-input AND gate (SORT = I · W · F),
    3-input OR gate (ALERT = I' + W' + F'),
    and NOT gates (I', W', F').
    """
    result = evaluate_logic_gates(payload.I, payload.W, payload.F)
    return result


@router.post("/comparator", response_model=DigitalComparatorResponse)
def simulate_comparator(payload: DigitalComparatorRequest):
    """
    Evaluates Digital Magnitude Comparator for Measured Weight (A) vs Reference Limit (B).
    Outputs condition (<, =, >) and Boolean W signal.
    """
    return evaluate_digital_comparator(payload.measured_weight, payload.reference_weight)


@router.get("/truth-table")
def fetch_truth_table():
    """
    Returns the complete 8-row combinatorial truth table for 3-input AND/OR gates.
    """
    return {
        "title": "AeroSort AI 3-Input Combinatorial Truth Table",
        "inputs": ["I (Valid Identification)", "W (Weight Compliance)", "F (Flight Manifest Validity)"],
        "and_gate_expression": "SORT = I · W · F",
        "or_gate_fault_expression": "ALERT = I' + W' + F'",
        "rows": get_truth_table()
    }

