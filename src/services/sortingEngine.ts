import { Baggage, Flight, SortingRecord, SystemSettings, WeightStatus } from '../types';

export interface LogicEvaluationResult {
  inputs: {
    I: boolean; // Valid identification
    W: boolean; // Weight within limit
    F: boolean; // Valid flight
  };
  outputs: {
    SORT: boolean;  // I && W && F
    ALERT: boolean; // (!I) || (!W) || (!F)
    ID_ERROR: boolean;
    WEIGHT_ERROR: boolean;
    FLIGHT_ERROR: boolean;
  };
  comparator: {
    measured: number;
    maximum: number;
    isLessThan: boolean;
    isEqual: boolean;
    isGreaterThan: boolean;
    remainingAllowance: number;
    excessWeight: number;
  };
  weightStatus: WeightStatus;
  assignedLane: string;
  reason: string;
  decision: 'ACCEPTED' | 'DIVERTED_OVERWEIGHT' | 'DIVERTED_INVALID';
}

/**
 * Evaluates baggage item through the Digital Logic Control Unit
 */
export function evaluateBaggageLogic(
  baggage: Baggage,
  flights: Flight[],
  settings: SystemSettings
): LogicEvaluationResult {
  const maxWeight = settings.maxBaggageWeight;
  const nearLimit = settings.nearLimitThreshold;
  const measuredWeight = Number(baggage.weight.toFixed(2));

  // 1. Digital Comparator
  const isLessThan = measuredWeight < maxWeight;
  const isEqual = Math.abs(measuredWeight - maxWeight) < 0.01;
  const isGreaterThan = measuredWeight > maxWeight;
  const remainingAllowance = Math.max(0, Number((maxWeight - measuredWeight).toFixed(2)));
  const excessWeight = Math.max(0, Number((measuredWeight - maxWeight).toFixed(2)));

  // Weight status categorization
  let weightStatus: WeightStatus = 'ACCEPTED';
  if (measuredWeight > maxWeight) {
    weightStatus = 'OVERWEIGHT';
  } else if (measuredWeight >= nearLimit) {
    weightStatus = 'NEAR_LIMIT';
  } else {
    weightStatus = 'ACCEPTED';
  }

  // 2. Logic Inputs (Binary Flags)
  // I: Valid identification (non-empty ID and passenger name)
  const I = Boolean(baggage.id && baggage.passengerName && baggage.passengerId);

  // W: Weight within limit (W = 1 if weight <= maxWeight)
  const W = measuredWeight <= maxWeight;

  // F: Valid flight (matches an existing flight in the active manifest that is not cancelled)
  const matchingFlight = flights.find(
    (f) => f.flightNumber.trim().toUpperCase() === baggage.flightNumber.trim().toUpperCase()
  );
  const F = Boolean(matchingFlight && matchingFlight.status !== 'Cancelled');

  // 3. Logic Gates
  // AND GATE: SORT = I AND W AND F
  const SORT = I && W && F;

  // OR GATE: ALERT = NOT(I) OR NOT(W) OR NOT(F)
  const ID_ERROR = !I;
  const WEIGHT_ERROR = !W;
  const FLIGHT_ERROR = !F;
  const ALERT = ID_ERROR || WEIGHT_ERROR || FLIGHT_ERROR;

  // 4. Destination & Lane Assignment
  let assignedLane = 'Lane 06'; // Default security/manual inspection
  let decision: 'ACCEPTED' | 'DIVERTED_OVERWEIGHT' | 'DIVERTED_INVALID' = 'ACCEPTED';
  let reason = '';

  if (SORT) {
    // Determine destination lane based on flight or settings mapping
    if (matchingFlight?.assignedLane) {
      assignedLane = matchingFlight.assignedLane;
    } else {
      // Map based on destination
      const laneMatch = settings.lanesConfig.find(
        (l) => l.destination.toLowerCase() === (matchingFlight?.destination || baggage.destination).toLowerCase()
      );
      assignedLane = laneMatch ? laneMatch.laneId : 'Lane 01';
    }

    if (weightStatus === 'NEAR_LIMIT') {
      decision = 'ACCEPTED';
      reason = `Normal sort approved via (I=1, W=1, F=1). Warning: Weight ${measuredWeight}kg is within near-limit zone [${nearLimit}-${maxWeight}kg]. Dispatched to ${assignedLane}.`;
    } else {
      decision = 'ACCEPTED';
      reason = `Full automated pass approved via (I=1, W=1, F=1). Routed directly to ${assignedLane} for ${baggage.destination}.`;
    }
  } else {
    // Diverted to Lane 06 (Manual Inspection)
    assignedLane = 'Lane 06';
    if (!W) {
      decision = 'DIVERTED_OVERWEIGHT';
      reason = `Digital Comparator Triggered: Measured weight ${measuredWeight}kg exceeds limit of ${maxWeight}kg by ${excessWeight}kg (W=0). Diverted to Lane 06 for manual inspection/excess baggage payment.`;
    } else if (!F) {
      decision = 'DIVERTED_INVALID';
      reason = `Flight Verification Failure: Flight "${baggage.flightNumber}" is either invalid, not scheduled, or cancelled (F=0). Diverted to Lane 06 for manifest verification.`;
    } else {
      decision = 'DIVERTED_INVALID';
      reason = `Identification Fault: Incomplete or unreadable RFID/Barcode baggage tag detected (I=0). Diverted to Lane 06 for security inspection.`;
    }
  }

  return {
    inputs: { I, W, F },
    outputs: {
      SORT,
      ALERT,
      ID_ERROR,
      WEIGHT_ERROR,
      FLIGHT_ERROR,
    },
    comparator: {
      measured: measuredWeight,
      maximum: maxWeight,
      isLessThan,
      isEqual,
      isGreaterThan,
      remainingAllowance,
      excessWeight,
    },
    weightStatus,
    assignedLane,
    reason,
    decision,
  };
}

/**
 * Creates an authoritative Sorting Record from evaluation
 */
export function createSortingRecord(
  baggage: Baggage,
  result: LogicEvaluationResult
): SortingRecord {
  return {
    id: `SRT-${Date.now().toString().slice(-6)}-${baggage.id.replace('BAG-', '')}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    baggageId: baggage.id,
    passengerName: baggage.passengerName,
    flightNumber: baggage.flightNumber,
    destination: baggage.destination,
    weight: baggage.weight,
    weightStatus: result.weightStatus,
    decision: result.decision,
    assignedLane: result.assignedLane,
    reason: result.reason,
    logicInputs: result.inputs,
    logicOutputs: {
      SORT: result.outputs.SORT,
      ALERT: result.outputs.ALERT,
    },
  };
}

