import { useState, useEffect, useCallback } from 'react';
import {
  baggageApi,
  flightsApi,
  sortingApi,
  weightApi,
  logicApi,
  conveyorApi,
  reportsApi,
  notificationsApi,
  settingsApi,
} from '../services/api';
import { Baggage, Flight, SortingRecord, NotificationItem, SystemSettings } from '../types';

export function useAeroSortApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  return {
    loading,
    error,
    clearError,
    baggage: baggageApi,
    flights: flightsApi,
    sorting: sortingApi,
    weight: weightApi,
    logic: logicApi,
    conveyor: conveyorApi,
    reports: reportsApi,
    notifications: notificationsApi,
    settings: settingsApi,
  };
}

