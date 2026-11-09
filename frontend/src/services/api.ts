/**
 * AeroSort AI — Unified Backend REST API Client
 * Connects React frontend directly to FastAPI Python backend with SQLite database
 */

import {
  Baggage,
  Flight,
  SortingRecord,
  NotificationItem,
  SystemSettings,
  ConveyorSimulationState,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // Use statusText fallback
    }
    throw new Error(errorDetail || `Request failed with status ${response.status}`);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text() as unknown as T;
}

// ── 1. Baggage APIs ──
export const baggageApi = {
  getAll: (params?: { search?: string; status?: string; flight?: string }): Promise<Baggage[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.flight) query.append('flight', params.flight);
    const qs = query.toString();
    return request<any[]>(`/baggage${qs ? `?${qs}` : ''}`).then((list) =>
      list.map((item) => ({
        id: item.id,
        passengerName: item.passenger_name,
        passengerId: item.passenger_id,
        flightNumber: item.flight_number,
        destination: item.destination,
        airline: item.airline,
        weight: item.weight,
        registrationTime: item.registration_time,
        status: item.status,
        weightStatus: item.weight_status,
        assignedLane: item.assigned_lane,
        processingStage: item.processing_stage,
        rejectionReason: item.rejection_reason,
        isDemo: item.is_demo,
      }))
    );
  },

  getById: (bagId: string): Promise<Baggage> => {
    return request<any>(`/baggage/${bagId}`).then((item) => ({
      id: item.id,
      passengerName: item.passenger_name,
      passengerId: item.passenger_id,
      flightNumber: item.flight_number,
      destination: item.destination,
      airline: item.airline,
      weight: item.weight,
      registrationTime: item.registration_time,
      status: item.status,
      weightStatus: item.weight_status,
      assignedLane: item.assigned_lane,
      processingStage: item.processing_stage,
      rejectionReason: item.rejection_reason,
      isDemo: item.is_demo,
    }));
  },

  register: (data: {
    id?: string;
    passengerName: string;
    passengerId: string;
    flightNumber: string;
    destination: string;
    airline: string;
    weight: number;
    checkInTime?: string;
  }): Promise<Baggage> => {
    return request<any>('/baggage', {
      method: 'POST',
      body: JSON.stringify({
        id: data.id,
        passenger_name: data.passengerName,
        passenger_id: data.passengerId,
        flight_number: data.flightNumber,
        destination: data.destination,
        airline: data.airline,
        weight: data.weight,
        check_in_time: data.checkInTime,
      }),
    }).then((item) => ({
      id: item.id,
      passengerName: item.passenger_name,
      passengerId: item.passenger_id,
      flightNumber: item.flight_number,
      destination: item.destination,
      airline: item.airline,
      weight: item.weight,
      registrationTime: item.registration_time,
      status: item.status,
      weightStatus: item.weight_status,
      assignedLane: item.assigned_lane,
      processingStage: item.processing_stage,
      rejectionReason: item.rejection_reason,
      isDemo: item.is_demo,
    }));
  },

  update: (bagId: string, updates: Partial<Baggage>): Promise<Baggage> => {
    const payload: any = {};
    if (updates.passengerName !== undefined) payload.passenger_name = updates.passengerName;
    if (updates.passengerId !== undefined) payload.passenger_id = updates.passengerId;
    if (updates.flightNumber !== undefined) payload.flight_number = updates.flightNumber;
    if (updates.destination !== undefined) payload.destination = updates.destination;
    if (updates.airline !== undefined) payload.airline = updates.airline;
    if (updates.weight !== undefined) payload.weight = updates.weight;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.assignedLane !== undefined) payload.assigned_lane = updates.assignedLane;
    if (updates.processingStage !== undefined) payload.processing_stage = updates.processingStage;
    if (updates.rejectionReason !== undefined) payload.rejection_reason = updates.rejectionReason;

    return request<any>(`/baggage/${bagId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((item) => ({
      id: item.id,
      passengerName: item.passenger_name,
      passengerId: item.passenger_id,
      flightNumber: item.flight_number,
      destination: item.destination,
      airline: item.airline,
      weight: item.weight,
      registrationTime: item.registration_time,
      status: item.status,
      weightStatus: item.weight_status,
      assignedLane: item.assigned_lane,
      processingStage: item.processing_stage,
      rejectionReason: item.rejection_reason,
      isDemo: item.is_demo,
    }));
  },

  delete: (bagId: string): Promise<{ message: string; id: string }> => {
    return request<{ message: string; id: string }>(`/baggage/${bagId}`, {
      method: 'DELETE',
    });
  },

  checkId: (bagId: string): Promise<{ available: boolean; id: string }> => {
    return request<{ available: boolean; id: string }>(`/baggage/check-id/${bagId}`);
  },
};

// ── 2. Weight Analyzer APIs ──
export const weightApi = {
  analyze: (weight: number) => {
    return request<{
      measured_weight: number;
      maximum_weight: number;
      near_limit_threshold: number;
      weight_status: 'ACCEPTED' | 'NEAR_LIMIT' | 'OVERWEIGHT';
      remaining_allowance: number;
      excess_weight: number;
      comparator_symbol: string;
      comparator_text: string;
      w_signal: boolean;
    }>('/weight/analyze', {
      method: 'POST',
      body: JSON.stringify({ weight }),
    });
  },

  simulateSensor: () => {
    return request<{
      simulated_weight: number;
      analog_voltage_v: number;
      adc_resolution_bits: number;
      sampling_rate_hz: number;
      sensor_type: string;
      is_overweight: boolean;
    }>('/weight/simulate-sensor', {
      method: 'POST',
    });
  },

  applyToBag: (bagId: string, weight: number): Promise<Baggage> => {
    return request<any>(`/weight/apply/${bagId}`, {
      method: 'PUT',
      body: JSON.stringify({ weight }),
    }).then((item) => ({
      id: item.id,
      passengerName: item.passenger_name,
      passengerId: item.passenger_id,
      flightNumber: item.flight_number,
      destination: item.destination,
      airline: item.airline,
      weight: item.weight,
      registrationTime: item.registration_time,
      status: item.status,
      weightStatus: item.weight_status,
      assignedLane: item.assigned_lane,
      processingStage: item.processing_stage,
      rejectionReason: item.rejection_reason,
      isDemo: item.is_demo,
    }));
  },
};

// ── 3. Smart Sorting APIs ──
export const sortingApi = {
  evaluate: (baggageId: string): Promise<SortingRecord> => {
    return request<any>(`/sorting/evaluate/${baggageId}`, {
      method: 'POST',
    }).then(transformSortingRecord);
  },

  batchSort: (): Promise<SortingRecord[]> => {
    return request<any[]>('/sorting/batch', {
      method: 'POST',
    }).then((list) => list.map(transformSortingRecord));
  },

  getHistory: (limit: number = 50): Promise<SortingRecord[]> => {
    return request<any[]>(`/sorting/history?limit=${limit}`).then((list) =>
      list.map(transformSortingRecord)
    );
  },

  getLanes: () => {
    return request<
      Array<{
        lane_id: string;
        lane_name: string;
        destination: string;
        description: string;
        color: string;
        bag_count: number;
      }>
    >('/sorting/lanes');
  },
};

function transformSortingRecord(item: any): SortingRecord {
  return {
    id: item.id,
    timestamp: item.timestamp,
    baggageId: item.baggage_id,
    passengerName: item.passenger_name,
    flightNumber: item.flight_number,
    destination: item.destination,
    weight: item.weight,
    weightStatus: item.weight_status,
    decision: item.decision,
    assignedLane: item.assigned_lane,
    reason: item.reason,
    logicInputs: {
      I: item.logic_inputs.I,
      W: item.logic_inputs.W,
      F: item.logic_inputs.F,
    },
    logicOutputs: {
      SORT: item.logic_outputs.SORT,
      ALERT: item.logic_outputs.ALERT,
    },
  };
}

// ── 4. Digital Logic APIs ──
export const logicApi = {
  simulate: (I: boolean, W: boolean, F: boolean) => {
    return request<{
      inputs: { I: boolean; W: boolean; F: boolean };
      outputs: { SORT: boolean; ALERT: boolean; NOT_I: boolean; NOT_W: boolean; NOT_F: boolean };
      comparator_note: string;
      decision: string;
      assigned_chute_type: string;
    }>('/logic/simulate', {
      method: 'POST',
      body: JSON.stringify({ I, W, F }),
    });
  },

  comparator: (measuredWeight: number, referenceWeight: number) => {
    return request<{
      measured_weight: number;
      reference_weight: number;
      is_less_than: boolean;
      is_equal: boolean;
      is_greater_than: boolean;
      w_output: boolean;
      condition_symbol: string;
      condition_description: string;
    }>('/logic/comparator', {
      method: 'POST',
      body: JSON.stringify({ measured_weight: measuredWeight, reference_weight: referenceWeight }),
    });
  },

  getTruthTable: () => {
    return request<{
      title: string;
      inputs: string[];
      and_gate_expression: string;
      or_gate_fault_expression: string;
      rows: Array<{
        I: number;
        W: number;
        F: number;
        SORT: number;
        ALERT: number;
        decision: string;
      }>;
    }>('/logic/truth-table');
  },
};

// ── 5. Flight Management APIs ──
export const flightsApi = {
  getAll: (status?: string): Promise<Flight[]> => {
    const qs = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    return request<any[]>(`/flights${qs}`).then((list) =>
      list.map((item) => ({
        id: item.id,
        flightNumber: item.flight_number,
        airline: item.airline,
        destination: item.destination,
        departureTime: item.departure_time,
        gateNumber: item.gate_number,
        assignedLane: item.assigned_lane,
        status: item.status,
        isDemo: item.is_demo,
      }))
    );
  },

  getById: (flightId: string): Promise<Flight> => {
    return request<any>(`/flights/${flightId}`).then((item) => ({
      id: item.id,
      flightNumber: item.flight_number,
      airline: item.airline,
      destination: item.destination,
      departureTime: item.departure_time,
      gateNumber: item.gate_number,
      assignedLane: item.assigned_lane,
      status: item.status,
      isDemo: item.is_demo,
    }));
  },

  create: (data: Omit<Flight, 'id' | 'isDemo'>): Promise<Flight> => {
    return request<any>('/flights', {
      method: 'POST',
      body: JSON.stringify({
        flight_number: data.flightNumber,
        airline: data.airline,
        destination: data.destination,
        departure_time: data.departureTime,
        gate_number: data.gateNumber,
        assigned_lane: data.assignedLane,
        status: data.status,
      }),
    }).then((item) => ({
      id: item.id,
      flightNumber: item.flight_number,
      airline: item.airline,
      destination: item.destination,
      departureTime: item.departure_time,
      gateNumber: item.gate_number,
      assignedLane: item.assigned_lane,
      status: item.status,
      isDemo: item.is_demo,
    }));
  },

  update: (flightId: string, updates: Partial<Flight>): Promise<Flight> => {
    const payload: any = {};
    if (updates.airline !== undefined) payload.airline = updates.airline;
    if (updates.destination !== undefined) payload.destination = updates.destination;
    if (updates.departureTime !== undefined) payload.departure_time = updates.departureTime;
    if (updates.gateNumber !== undefined) payload.gate_number = updates.gateNumber;
    if (updates.assignedLane !== undefined) payload.assigned_lane = updates.assignedLane;
    if (updates.status !== undefined) payload.status = updates.status;

    return request<any>(`/flights/${flightId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((item) => ({
      id: item.id,
      flightNumber: item.flight_number,
      airline: item.airline,
      destination: item.destination,
      departureTime: item.departure_time,
      gateNumber: item.gate_number,
      assignedLane: item.assigned_lane,
      status: item.status,
      isDemo: item.is_demo,
    }));
  },

  delete: (flightId: string): Promise<{ message: string; id: string }> => {
    return request<{ message: string; id: string }>(`/flights/${flightId}`, {
      method: 'DELETE',
    });
  },
};

// ── 6. Conveyor Simulation APIs ──
export const conveyorApi = {
  getStatus: () => {
    return request<{
      is_running: boolean;
      is_paused: boolean;
      current_bag_id: string | null;
      current_station: string;
      progress_percent: number;
      total_processed_count: number;
      active_lane_id: string | null;
    }>('/conveyor/status');
  },

  start: (baggageId?: string) => {
    return request<any>('/conveyor/start', {
      method: 'POST',
      body: JSON.stringify({ baggage_id: baggageId || null }),
    });
  },

  pause: () => {
    return request<any>('/conveyor/pause', { method: 'POST' });
  },

  resume: () => {
    return request<any>('/conveyor/resume', { method: 'POST' });
  },

  reset: () => {
    return request<any>('/conveyor/reset', { method: 'POST' });
  },

  step: () => {
    return request<{
      current_station: string;
      progress_percent: number;
      is_finished: boolean;
      sorting_record: any | null;
    }>('/conveyor/step', { method: 'POST' });
  },

  processNext: () => {
    return request<any>('/conveyor/process-next', { method: 'POST' });
  },
};

// ── 7. Reports & Analytics APIs ──
export const reportsApi = {
  getStatistics: () => {
    return request<{
      total_registered: number;
      total_processed: number;
      successfully_sorted: number;
      overweight_baggage: number;
      pending_baggage: number;
      sorting_success_rate: number;
      average_bag_weight: number;
      destination_distribution: Array<{ name: string; count: number }>;
      weight_distribution: Array<{ range: string; count: number; fill: string }>;
    }>('/reports/statistics');
  },

  getExportCsvUrl: () => `${API_BASE}/reports/export-csv`,
};

// ── 8. Notifications APIs ──
export const notificationsApi = {
  getAll: (severity?: string): Promise<NotificationItem[]> => {
    const qs = severity && severity !== 'ALL' ? `?severity=${encodeURIComponent(severity)}` : '';
    return request<NotificationItem[]>(`/notifications${qs}`);
  },

  markRead: (notifId: string): Promise<NotificationItem> => {
    return request<NotificationItem>(`/notifications/${notifId}/read`, {
      method: 'PUT',
    });
  },

  markAllRead: (): Promise<{ message: string }> => {
    return request<{ message: string }>('/notifications/read-all', {
      method: 'PUT',
    });
  },

  clear: (): Promise<{ message: string }> => {
    return request<{ message: string }>('/notifications', {
      method: 'DELETE',
    });
  },
};

// ── 9. System Settings APIs ──
export const settingsApi = {
  get: (): Promise<SystemSettings> => {
    return request<any>('/settings').then((item) => ({
      airportName: item.airport_name,
      airportCode: item.airport_code,
      terminalName: item.terminal_name,
      maxBaggageWeight: item.max_baggage_weight,
      nearLimitThreshold: item.near_limit_threshold,
      conveyorSpeedMultiplier: item.conveyor_speed_multiplier,
      soundAlertsEnabled: item.sound_alerts_enabled,
      autoProcessQueue: item.auto_process_queue,
      lanesConfig: item.lanes_config,
    }));
  },

  update: (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
    const payload: any = {};
    if (settings.airportName !== undefined) payload.airport_name = settings.airportName;
    if (settings.airportCode !== undefined) payload.airport_code = settings.airportCode;
    if (settings.terminalName !== undefined) payload.terminal_name = settings.terminalName;
    if (settings.maxBaggageWeight !== undefined) payload.max_baggage_weight = settings.maxBaggageWeight;
    if (settings.nearLimitThreshold !== undefined) payload.near_limit_threshold = settings.nearLimitThreshold;
    if (settings.conveyorSpeedMultiplier !== undefined) payload.conveyor_speed_multiplier = settings.conveyorSpeedMultiplier;
    if (settings.soundAlertsEnabled !== undefined) payload.sound_alerts_enabled = settings.soundAlertsEnabled;
    if (settings.autoProcessQueue !== undefined) payload.auto_process_queue = settings.autoProcessQueue;
    if (settings.lanesConfig !== undefined) payload.lanes_config = settings.lanesConfig;

    return request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((item) => ({
      airportName: item.airport_name,
      airportCode: item.airport_code,
      terminalName: item.terminal_name,
      maxBaggageWeight: item.max_baggage_weight,
      nearLimitThreshold: item.near_limit_threshold,
      conveyorSpeedMultiplier: item.conveyor_speed_multiplier,
      soundAlertsEnabled: item.sound_alerts_enabled,
      autoProcessQueue: item.auto_process_queue,
      lanesConfig: item.lanes_config,
    }));
  },

  resetDemo: (): Promise<{ message: string }> => {
    return request<{ message: string }>('/settings/reset-demo', {
      method: 'POST',
    });
  },
};
