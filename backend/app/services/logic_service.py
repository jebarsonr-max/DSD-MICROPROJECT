"""
Digital Logic Control Service
Implements Boolean logic circuits (AND, OR, NOT) and Digital Magnitude Comparator
for Academic Digital System Design (DSD) evaluation.
"""

def evaluate_logic_gates(I: bool, W: bool, F: bool):
    # NOT Gates (Inverters)
    not_I = not I
    not_W = not W
    not_F = not F

    # 3-Input AND Gate: SORT = I · W · F
    SORT = I and W and F

    # 3-Input OR Gate (De Morgan's Fault Detector): ALERT = I' + W' + F'
    ALERT = not_I or not_W or not_F

    if SORT:
        decision = "ACCEPTED: Dispatched to destination sorting chute"
        assigned_chute_type = "NORMAL_DESTINATION_LANE"
    elif not_W:
        decision = "DIVERTED_OVERWEIGHT: Diverted to Lane 06 for manual inspection"
        assigned_chute_type = "MANUAL_INSPECTION_LANE_06"
    elif not_F:
        decision = "DIVERTED_INVALID_FLIGHT: Diverted to Lane 06 due to cancelled/unlisted flight"
        assigned_chute_type = "MANUAL_INSPECTION_LANE_06"
    else:
        decision = "DIVERTED_INVALID_ID: Diverted to Lane 06 due to unreadable baggage tag"
        assigned_chute_type = "MANUAL_INSPECTION_LANE_06"

    return {
        "inputs": {"I": I, "W": W, "F": F},
        "outputs": {
            "SORT": SORT,
            "ALERT": ALERT,
            "NOT_I": not_I,
            "NOT_W": not_W,
            "NOT_F": not_F
        },
        "comparator_note": "A <= B condition evaluates W input line",
        "decision": decision,
        "assigned_chute_type": assigned_chute_type
    }


def evaluate_digital_comparator(measured_weight: float, reference_weight: float):
    diff = round(measured_weight - reference_weight, 2)
    is_less_than = measured_weight < reference_weight
    is_equal = abs(diff) < 0.01
    is_greater_than = measured_weight > reference_weight
    w_output = measured_weight <= reference_weight

    if is_greater_than:
        symbol = ">"
        desc = f"Measured weight ({measured_weight} kg) exceeds maximum allowance ({reference_weight} kg) by {abs(diff)} kg."
    elif is_equal:
        symbol = "="
        desc = f"Measured weight ({measured_weight} kg) is exactly at maximum allowance limit ({reference_weight} kg)."
    else:
        symbol = "<"
        desc = f"Measured weight ({measured_weight} kg) is strictly within allowable limit ({reference_weight} kg). Allowance remaining: {abs(diff)} kg."

    return {
        "measured_weight": measured_weight,
        "reference_weight": reference_weight,
        "is_less_than": is_less_than,
        "is_equal": is_equal,
        "is_greater_than": is_greater_than,
        "w_output": w_output,
        "condition_symbol": symbol,
        "condition_description": desc
    }


def get_truth_table():
    rows = []
    for i in [False, True]:
        for w in [False, True]:
            for f in [False, True]:
                res = evaluate_logic_gates(i, w, f)
                rows.append({
                    "I": 1 if i else 0,
                    "W": 1 if w else 0,
                    "F": 1 if f else 0,
                    "SORT": 1 if res["outputs"]["SORT"] else 0,
                    "ALERT": 1 if res["outputs"]["ALERT"] else 0,
                    "decision": res["decision"]
                })
    return rows

