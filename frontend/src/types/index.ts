// Core Type Definitions for AeroSort AI

export type LuggageStatus = 
  | 'REGISTERED' 
  | 'WEIGHED' 
  | 'IN_TRANSIT' 
  | 'SORTED' 
  | 'OVERWEIGHT' 
  | 'REJECTED' 
  | 'MANUAL_INSPECTION';

export type WeightStatus = 'ACCEPTED' | 'NEAR_LIMIT' | 'OVERWEIGHT';

export type ProcessingStation = 
  | 'ENTRY'
  | 'SCANNING'
  | 'WEIGHING'
  | 'FLIGHT_ID'
  | 'LOGIC_DECISION'
  | 'SORTING_JUNCTION'
  | 'DESTINATION_LANE'
  | 'MANUAL_INSPECTION_LANE';

export interface Baggage {
  id: string; // e.g. "BAG-1042"
  passengerName: string;
  passengerId: string; // e.g. "PAX-8821"
  flightNumber: string; // e.g. "AI 101"
  destination: string; // e.g. "Delhi"
  airline: string; // e.g. "Air India"
  weight: number; // in kilograms
  registrationTime: string; // ISO string or formatted string
  status: LuggageStatus;
  weightStatus: WeightStatus;
  assignedLane: string | null; // e.g. "Lane 01", "Lane 06"
  processingStage: ProcessingStation;
  rejectionReason?: string;
  isDemo?: boolean;
}

export type FlightStatus = 'Scheduled' | 'Boarding' | 'Departed' | 'Delayed' | 'Cancelled';

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  destination: string;
  departureTime: string;
  gateNumber: string;
  assignedLane: string;
  status: FlightStatus;
  isDemo?: boolean;
}

export interface SortingRecord {
  id: string;
  timestamp: string;
  baggageId: string;
  passengerName: string;
  flightNumber: string;
  destination: string;
  weight: number;
  weightStatus: WeightStatus;
  decision: 'ACCEPTED' | 'DIVERTED_OVERWEIGHT' | 'DIVERTED_INVALID';
  assignedLane: string;
  reason: string;
  logicInputs: {
    I: boolean; // Valid ID
    W: boolean; // Weight within limit
    F: boolean; // Flight Valid
  };
  logicOutputs: {
    SORT: boolean;  // I AND W AND F
    ALERT: boolean; // NOT(I) OR NOT(W) OR NOT(F)
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'high' | 'warning' | 'info' | 'success';
  read: boolean;
  category: 'OVERWEIGHT' | 'INVALID_FLIGHT' | 'DUPLICATE_ID' | 'SORTING' | 'CONVEYOR' | 'SYSTEM';
}

export interface SystemSettings {
  airportName: string;
  airportCode: string;
  terminalName: string;
  maxBaggageWeight: number; // default 15.0 kg
  nearLimitThreshold: number; // default 14.0 kg
  conveyorSpeedMultiplier: number; // 0.5x, 1x, 2x
  soundAlertsEnabled: boolean;
  autoProcessQueue: boolean;
  lanesConfig: {
    laneId: string;
    laneName: string;
    destination: string;
    description: string;
    color: string;
  }[];
}

export interface ConveyorSimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentBagId: string | null;
  currentStation: ProcessingStation;
  progressPercent: number; // 0 to 100
  totalProcessedCount: number;
  activeLaneId: string | null;
}

export interface DigitalLogicState {
  I: boolean; // Valid identification
  W: boolean; // Weight within limit
  F: boolean; // Valid flight
}

