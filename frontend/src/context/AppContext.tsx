import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import {
  Baggage,
  Flight,
  SortingRecord,
  NotificationItem,
  SystemSettings,
  ConveyorSimulationState,
  DigitalLogicState,
  ProcessingStation,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_FLIGHTS,
  INITIAL_LUGGAGE,
  INITIAL_NOTIFICATIONS,
} from '../data/demoData';
import {
  baggageApi,
  flightsApi,
  sortingApi,
  weightApi,
  logicApi,
  conveyorApi,
  notificationsApi,
  settingsApi,
  systemApi,
} from '../services/api';
import { evaluateBaggageLogic, createSortingRecord } from '../services/sortingEngine';

export type ApiConnectionStatus = 'connected' | 'connecting' | 'disconnected';

interface AppContextType {
  luggage: Baggage[];
  flights: Flight[];
  sortingHistory: SortingRecord[];
  notifications: NotificationItem[];
  settings: SystemSettings;
  conveyorState: ConveyorSimulationState;
  activeConveyorLuggage: Baggage | null;
  logicSandbox: DigitalLogicState;
  isBackendConnected: boolean;
  connectionStatus: ApiConnectionStatus;
  apiBaseUrl: string;
  apiLoading: boolean;
  apiError: string | null;
  retryBackendConnection: () => Promise<void>;

  // Baggage actions
  registerLuggage: (data: {
    id?: string;
    passengerName: string;
    passengerId: string;
    flightNumber: string;
    destination: string;
    airline: string;
    weight: number;
    checkInTime?: string;
  }) => Promise<{ success: boolean; message: string; baggage?: Baggage }>;
  updateLuggage: (id: string, updates: Partial<Baggage>) => Promise<void>;
  deleteLuggage: (id: string) => Promise<void>;

  // Flight actions
  addFlight: (flight: Omit<Flight, 'id'>) => Promise<{ success: boolean; message: string }>;
  updateFlight: (id: string, updates: Partial<Flight>) => Promise<void>;
  deleteFlight: (id: string) => Promise<void>;

  // Sorting actions
  sortSingleBaggage: (baggageId: string) => Promise<SortingRecord | null>;
  sortAllPendingBaggage: () => Promise<void>;
  isAutomaticSortingRunning: boolean;
  setIsAutomaticSortingRunning: (running: boolean) => void;

  // Conveyor simulation actions
  startConveyorSimulation: (specificBagId?: string) => void;
  pauseConveyorSimulation: () => void;
  resumeConveyorSimulation: () => void;
  resetConveyorSimulation: () => void;
  processNextInConveyor: () => void;

  // Logic sandbox
  setLogicSandbox: (updates: Partial<DigitalLogicState>) => void;

  // Notification actions
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;

  // System settings actions
  updateSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  resetDemoData: () => Promise<void>;
  refreshFromBackend: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function buildInitialHistory(bags: Baggage[], flts: Flight[], sett: SystemSettings): SortingRecord[] {
  return bags
    .filter((b) => b.status === 'SORTED' || b.status === 'OVERWEIGHT' || b.status === 'MANUAL_INSPECTION')
    .map((bag) => {
      const evalRes = evaluateBaggageLogic(bag, flts, sett);
      return createSortingRecord(bag, evalRes);
    });
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ─── State ───────────────────────────────────────────────────────────────
  const [luggage, setLuggage] = useState<Baggage[]>(INITIAL_LUGGAGE);
  const [flights, setFlights] = useState<Flight[]>(INITIAL_FLIGHTS);
  const [sortingHistory, setSortingHistory] = useState<SortingRecord[]>(() =>
    buildInitialHistory(INITIAL_LUGGAGE, INITIAL_FLIGHTS, INITIAL_SETTINGS)
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ApiConnectionStatus>('connecting');
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const apiBaseUrl = systemApi.getBaseUrl();

  const [logicSandbox, setLogicSandboxState] = useState<DigitalLogicState>({
    I: true,
    W: true,
    F: true,
  });

  const [conveyorState, setConveyorState] = useState<ConveyorSimulationState>({
    isRunning: false,
    isPaused: false,
    currentBagId: null,
    currentStation: 'ENTRY',
    progressPercent: 0,
    totalProcessedCount: 0,
    activeLaneId: null,
  });

  const [isAutomaticSortingRunning, setIsAutomaticSortingRunning] = useState(false);

  // Refs for callbacks & interval loops
  const conveyorTimerRef = useRef<number | null>(null);
  const luggageRef = useRef<Baggage[]>(luggage);
  const flightsRef = useRef<Flight[]>(flights);
  const settingsRef = useRef<SystemSettings>(settings);

  useEffect(() => { luggageRef.current = luggage; }, [luggage]);
  useEffect(() => { flightsRef.current = flights; }, [flights]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // ─── Backend Synchronization on Mount & Retry ──────────────────────────────
  const refreshFromBackend = useCallback(async () => {
    setApiLoading(true);
    setConnectionStatus('connecting');
    setApiError(null);
    try {
      // 1. First probe backend health endpoint
      const health = await systemApi.healthCheck();
      if (!health || health.status !== 'ok') {
        throw new Error('Health check responded with non-ok status');
      }

      // 2. Fetch live data from SQLite tables
      const [backendBaggage, backendFlights, backendHistory, backendNotifs, backendSettings] =
        await Promise.all([
          baggageApi.getAll(),
          flightsApi.getAll(),
          sortingApi.getHistory().catch(() => null),
          notificationsApi.getAll().catch(() => null),
          settingsApi.get().catch(() => null),
        ]);

      if (backendBaggage && backendFlights) {
        setLuggage(backendBaggage);
        setFlights(backendFlights);
        if (backendHistory) setSortingHistory(backendHistory);
        if (backendNotifs) setNotifications(backendNotifs);
        if (backendSettings) setSettings(backendSettings);

        setIsBackendConnected(true);
        setConnectionStatus('connected');
        setApiError(null);
      } else {
        throw new Error('Incomplete data payload received from backend.');
      }
    } catch (err: any) {
      console.warn(`AeroSort AI Backend offline at ${apiBaseUrl}:`, err.message || err);
      setIsBackendConnected(false);
      setConnectionStatus('disconnected');
      setApiError(`Backend API is currently unreachable at ${apiBaseUrl}. Showing local demonstration records.`);
    } finally {
      setApiLoading(false);
    }
  }, [apiBaseUrl]);

  const retryBackendConnection = useCallback(async () => {
    await refreshFromBackend();
  }, [refreshFromBackend]);

  useEffect(() => {
    refreshFromBackend();
    const interval = setInterval(async () => {
      // Periodic background health check every 10 seconds
      try {
        const health = await systemApi.healthCheck();
        if (health && health.status === 'ok') {
          if (!isBackendConnected) {
            refreshFromBackend();
          }
        } else {
          setIsBackendConnected(false);
          setConnectionStatus('disconnected');
        }
      } catch {
        setIsBackendConnected(false);
        setConnectionStatus('disconnected');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshFromBackend, isBackendConnected]);

  // ─── Notifications ────────────────────────────────────────────────────────
  const addNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
      const newItem: NotificationItem = {
        ...item,
        id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      setNotifications((prev) => [newItem, ...prev.slice(0, 99)]);
    },
    []
  );

  const markNotificationAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationsApi.markRead(id);
    } catch {
      // Local state already updated
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationsApi.markAllRead();
    } catch {
      // Local state already updated
    }
  }, []);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    try {
      await notificationsApi.clear();
    } catch {
      // Local state already updated
    }
  }, []);

  // ─── Logic Sandbox ────────────────────────────────────────────────────────
  const setLogicSandbox = useCallback((updates: Partial<DigitalLogicState>) => {
    setLogicSandboxState((prev) => {
      const next = { ...prev, ...updates };
      // Call backend logic simulator API
      logicApi.simulate(next.I, next.W, next.F).catch(() => {});
      return next;
    });
  }, []);

  // ─── Luggage Management ───────────────────────────────────────────────────
  const registerLuggage = useCallback(
    async (data: {
      id?: string;
      passengerName: string;
      passengerId: string;
      flightNumber: string;
      destination: string;
      airline: string;
      weight: number;
      checkInTime?: string;
    }) => {
      const bagId = (data.id?.trim() || `BAG-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();

      // Check unique ID locally first
      const existsLocally = luggageRef.current.some(
        (b) => b.id.toLowerCase() === bagId.toLowerCase()
      );
      if (existsLocally) {
        addNotification({
          title: 'Duplicate Baggage ID Rejected',
          description: `Baggage ID "${bagId}" already exists in the check-in database.`,
          severity: 'high',
          category: 'DUPLICATE_ID',
        });
        return { success: false, message: `Baggage ID "${bagId}" already exists. Please assign a unique ID.` };
      }

      try {
        const registered = await baggageApi.register({
          id: bagId,
          passengerName: data.passengerName,
          passengerId: data.passengerId,
          flightNumber: data.flightNumber,
          destination: data.destination,
          airline: data.airline,
          weight: data.weight,
          checkInTime: data.checkInTime,
        });

        setLuggage((prev) => [registered, ...prev]);
        setIsBackendConnected(true);

        addNotification({
          title: `Baggage Registered: ${registered.id}`,
          description: `${registered.passengerName} — ${registered.flightNumber} to ${registered.destination} (${registered.weight} kg). Saved to SQLite Database.`,
          severity: registered.weightStatus === 'OVERWEIGHT' ? 'warning' : 'info',
          category: 'SYSTEM',
        });

        return { success: true, message: `Baggage ${registered.id} registered and persisted in SQLite.`, baggage: registered };
      } catch (err: any) {
        // Fallback local registration if backend unreachable
        const currentSettings = settingsRef.current;
        let weightStatus: Baggage['weightStatus'] = 'ACCEPTED';
        if (data.weight > currentSettings.maxBaggageWeight) weightStatus = 'OVERWEIGHT';
        else if (data.weight >= currentSettings.nearLimitThreshold) weightStatus = 'NEAR_LIMIT';

        const fallbackBag: Baggage = {
          id: bagId,
          passengerName: data.passengerName.trim(),
          passengerId: (data.passengerId.trim() || `PAX-${Math.floor(100 + Math.random() * 900)}`).toUpperCase(),
          flightNumber: data.flightNumber.trim().toUpperCase(),
          destination: data.destination.trim(),
          airline: data.airline.trim(),
          weight: parseFloat(data.weight.toFixed(2)),
          registrationTime: data.checkInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'REGISTERED',
          weightStatus,
          assignedLane: null,
          processingStage: 'ENTRY',
          isDemo: false,
        };

        setLuggage((prev) => [fallbackBag, ...prev]);
        return { success: true, message: `Baggage ${fallbackBag.id} registered locally.`, baggage: fallbackBag };
      }
    },
    [addNotification]
  );

  const updateLuggage = useCallback(async (id: string, updates: Partial<Baggage>) => {
    setLuggage((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, ...updates };
        if (updates.weight !== undefined) {
          const s = settingsRef.current;
          if (updated.weight > s.maxBaggageWeight) updated.weightStatus = 'OVERWEIGHT';
          else if (updated.weight >= s.nearLimitThreshold) updated.weightStatus = 'NEAR_LIMIT';
          else updated.weightStatus = 'ACCEPTED';
        }
        return updated;
      })
    );
    try {
      await baggageApi.update(id, updates);
      setIsBackendConnected(true);
    } catch {
      // Local state already updated
    }
  }, []);

  const deleteLuggage = useCallback(
    async (id: string) => {
      setLuggage((prev) => prev.filter((b) => b.id !== id));
      addNotification({
        title: 'Baggage Record Removed',
        description: `Baggage ${id} was deleted from database.`,
        severity: 'info',
        category: 'SYSTEM',
      });
      try {
        await baggageApi.delete(id);
        setIsBackendConnected(true);
      } catch {
        // Local state already updated
      }
    },
    [addNotification]
  );

  // ─── Flight Management ────────────────────────────────────────────────────
  const addFlight = useCallback(
    async (flightData: Omit<Flight, 'id'>) => {
      try {
        const created = await flightsApi.create(flightData);
        setFlights((prev) => [...prev, created]);
        setIsBackendConnected(true);
        addNotification({
          title: `Flight Added: ${created.flightNumber}`,
          description: `${created.airline} to ${created.destination} (Gate ${created.gateNumber}, ${created.assignedLane}). Saved to SQLite.`,
          severity: 'info',
          category: 'SYSTEM',
        });
        return { success: true, message: `Flight ${created.flightNumber} added to database.` };
      } catch (err: any) {
        const newFlight: Flight = {
          ...flightData,
          id: `FLT-${Math.floor(100 + Math.random() * 900)}`,
          flightNumber: flightData.flightNumber.toUpperCase().trim(),
          isDemo: false,
        };
        setFlights((prev) => [...prev, newFlight]);
        return { success: true, message: `Flight ${newFlight.flightNumber} added locally.` };
      }
    },
    [addNotification]
  );

  const updateFlight = useCallback(async (id: string, updates: Partial<Flight>) => {
    setFlights((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    try {
      await flightsApi.update(id, updates);
      setIsBackendConnected(true);
    } catch {
      // Local state already updated
    }
  }, []);

  const deleteFlight = useCallback(async (id: string) => {
    setFlights((prev) => prev.filter((f) => f.id !== id));
    try {
      await flightsApi.delete(id);
      setIsBackendConnected(true);
    } catch {
      // Local state already updated
    }
  }, []);

  // ─── Smart Sorting ────────────────────────────────────────────────────────
  const sortSingleBaggage = useCallback(
    async (baggageId: string): Promise<SortingRecord | null> => {
      const bag = luggageRef.current.find((b) => b.id === baggageId);
      if (!bag) return null;

      try {
        // Call FastAPI Sorting Evaluate API
        const record = await sortingApi.evaluate(baggageId);
        setIsBackendConnected(true);

        // Update local state with authoritative backend response
        setLuggage((prev) =>
          prev.map((b) =>
            b.id === baggageId
              ? {
                  ...b,
                  status: record.decision === 'ACCEPTED' ? 'SORTED' : record.logicOutputs.ALERT && record.weightStatus === 'OVERWEIGHT' ? 'OVERWEIGHT' : 'MANUAL_INSPECTION',
                  weightStatus: record.weightStatus,
                  assignedLane: record.assignedLane,
                  processingStage: record.logicOutputs.ALERT ? 'MANUAL_INSPECTION_LANE' : 'DESTINATION_LANE',
                  rejectionReason: record.logicOutputs.ALERT ? record.reason : undefined,
                }
              : b
          )
        );

        setSortingHistory((prev) => [record, ...prev]);
        return record;
      } catch {
        // Fallback pure service evaluation if backend temporarily unreachable
        const evalResult = evaluateBaggageLogic(bag, flightsRef.current, settingsRef.current);
        const record = createSortingRecord(bag, evalResult);

        setLuggage((prev) =>
          prev.map((b) =>
            b.id === baggageId
              ? {
                  ...b,
                  status: evalResult.outputs.ALERT ? (evalResult.outputs.WEIGHT_ERROR ? 'OVERWEIGHT' : 'MANUAL_INSPECTION') : 'SORTED',
                  assignedLane: evalResult.assignedLane,
                  processingStage: evalResult.outputs.ALERT ? 'MANUAL_INSPECTION_LANE' : 'DESTINATION_LANE',
                  rejectionReason: evalResult.outputs.ALERT ? evalResult.reason : undefined,
                }
              : b
          )
        );

        setSortingHistory((prev) => [record, ...prev]);
        return record;
      }
    },
    []
  );

  const sortAllPendingBaggage = useCallback(async () => {
    try {
      const records = await sortingApi.batchSort();
      setIsBackendConnected(true);
      await refreshFromBackend();
    } catch {
      const pendingBags = luggageRef.current.filter((b) => b.status === 'REGISTERED');
      pendingBags.forEach((bag, idx) => {
        setTimeout(() => {
          sortSingleBaggage(bag.id);
        }, idx * 400);
      });
    }
  }, [refreshFromBackend, sortSingleBaggage]);

  // ─── Conveyor Simulation ──────────────────────────────────────────────────
  const activeConveyorLuggage =
    luggage.find((b) => b.id === conveyorState.currentBagId) || null;

  const resetConveyorSimulation = useCallback(() => {
    if (conveyorTimerRef.current) {
      clearInterval(conveyorTimerRef.current);
      conveyorTimerRef.current = null;
    }
    setConveyorState({
      isRunning: false,
      isPaused: false,
      currentBagId: null,
      currentStation: 'ENTRY',
      progressPercent: 0,
      totalProcessedCount: 0,
      activeLaneId: null,
    });
    conveyorApi.reset().catch(() => {});
  }, []);

  const pauseConveyorSimulation = useCallback(() => {
    if (conveyorTimerRef.current) {
      clearInterval(conveyorTimerRef.current);
      conveyorTimerRef.current = null;
    }
    setConveyorState((prev) => ({ ...prev, isPaused: true, isRunning: false }));
    conveyorApi.pause().catch(() => {});
  }, []);

  const startConveyorSimulation = useCallback(
    (specificBagId?: string) => {
      if (conveyorTimerRef.current) {
        clearInterval(conveyorTimerRef.current);
        conveyorTimerRef.current = null;
      }

      let targetBagId = specificBagId;
      if (!targetBagId) {
        const candidate = luggageRef.current.find((b) => b.status === 'REGISTERED');
        targetBagId = candidate?.id;
      }

      if (!targetBagId) {
        addNotification({
          title: 'Conveyor Queue Empty',
          description: 'No pending registered baggage available to load onto the conveyor.',
          severity: 'warning',
          category: 'CONVEYOR',
        });
        return;
      }

      setLuggage((prev) =>
        prev.map((b) =>
          b.id === targetBagId ? { ...b, status: 'IN_TRANSIT', processingStage: 'ENTRY' } : b
        )
      );

      setConveyorState({
        isRunning: true,
        isPaused: false,
        currentBagId: targetBagId,
        currentStation: 'ENTRY',
        progressPercent: 0,
        totalProcessedCount: conveyorState.totalProcessedCount,
        activeLaneId: null,
      });

      conveyorApi.start(targetBagId).catch(() => {});
    },
    [addNotification, conveyorState.totalProcessedCount]
  );

  const resumeConveyorSimulation = useCallback(() => {
    setConveyorState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
    conveyorApi.resume().catch(() => {});
  }, []);

  const processNextInConveyor = useCallback(() => {
    const nextBag = luggageRef.current.find((b) => b.status === 'REGISTERED');
    if (nextBag) {
      startConveyorSimulation(nextBag.id);
    } else {
      addNotification({
        title: 'All Baggage Processed',
        description: 'No more pending bags in queue. Conveyor belt halted.',
        severity: 'info',
        category: 'CONVEYOR',
      });
    }
  }, [startConveyorSimulation, addNotification]);

  // Conveyor belt animation interval
  useEffect(() => {
    if (!conveyorState.isRunning || conveyorState.isPaused || !conveyorState.currentBagId) {
      return;
    }

    const intervalMs = Math.max(100, Math.round(350 / settingsRef.current.conveyorSpeedMultiplier));

    conveyorTimerRef.current = window.setInterval(() => {
      setConveyorState((prev) => {
        if (!prev.isRunning || prev.isPaused) return prev;

        const nextProgress = Math.min(100, prev.progressPercent + 2);

        let nextStation: ProcessingStation;
        if (nextProgress < 15) nextStation = 'ENTRY';
        else if (nextProgress < 30) nextStation = 'SCANNING';
        else if (nextProgress < 50) nextStation = 'WEIGHING';
        else if (nextProgress < 65) nextStation = 'FLIGHT_ID';
        else if (nextProgress < 80) nextStation = 'LOGIC_DECISION';
        else if (nextProgress < 93) nextStation = 'SORTING_JUNCTION';
        else nextStation = 'DESTINATION_LANE';

        // Reached end of line
        if (nextProgress >= 100 && prev.currentBagId) {
          const finishedBagId = prev.currentBagId;

          setTimeout(async () => {
            const rec = await sortSingleBaggage(finishedBagId);
            const finalStation: ProcessingStation =
              rec && rec.logicOutputs.ALERT ? 'MANUAL_INSPECTION_LANE' : 'DESTINATION_LANE';
            const finalLane = rec ? rec.assignedLane : null;

            setConveyorState((s) => ({
              ...s,
              isRunning: false,
              progressPercent: 100,
              currentStation: finalStation,
              activeLaneId: finalLane,
              totalProcessedCount: s.totalProcessedCount + 1,
            }));

            if (settingsRef.current.autoProcessQueue) {
              const remaining = luggageRef.current.find(
                (b) => b.status === 'REGISTERED' && b.id !== finishedBagId
              );
              if (remaining) {
                setTimeout(() => startConveyorSimulation(remaining.id), 800);
              }
            }
          }, 50);

          return {
            ...prev,
            progressPercent: 100,
            currentStation: 'DESTINATION_LANE' as ProcessingStation,
          };
        }

        return { ...prev, progressPercent: nextProgress, currentStation: nextStation };
      });
    }, intervalMs);

    return () => {
      if (conveyorTimerRef.current) {
        clearInterval(conveyorTimerRef.current);
        conveyorTimerRef.current = null;
      }
    };
  }, [
    conveyorState.isRunning,
    conveyorState.isPaused,
    conveyorState.currentBagId,
    sortSingleBaggage,
    startConveyorSimulation,
  ]);

  // ─── Settings ─────────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (updates: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    try {
      const updated = await settingsApi.update(updates);
      setSettings(updated);
      setIsBackendConnected(true);
    } catch {
      // Local state already updated
    }
  }, []);

  // ─── Reset Demo Data ──────────────────────────────────────────────────────
  const resetDemoData = useCallback(async () => {
    if (conveyorTimerRef.current) {
      clearInterval(conveyorTimerRef.current);
      conveyorTimerRef.current = null;
    }

    try {
      await settingsApi.resetDemo();
      await refreshFromBackend();
    } catch {
      setLuggage(INITIAL_LUGGAGE);
      setFlights(INITIAL_FLIGHTS);
      setSettings(INITIAL_SETTINGS);
      setNotifications(INITIAL_NOTIFICATIONS);
      setSortingHistory(buildInitialHistory(INITIAL_LUGGAGE, INITIAL_FLIGHTS, INITIAL_SETTINGS));
    }

    setConveyorState({
      isRunning: false,
      isPaused: false,
      currentBagId: null,
      currentStation: 'ENTRY',
      progressPercent: 0,
      totalProcessedCount: 0,
      activeLaneId: null,
    });

    addNotification({
      title: 'Demo Environment Restored in SQLite',
      description: 'SQLite database re-seeded with 12 bags, 5 flights, and verified sorting records.',
      severity: 'info',
      category: 'SYSTEM',
    });
  }, [addNotification, refreshFromBackend]);

  return (
    <AppContext.Provider
      value={{
        luggage,
        flights,
        sortingHistory,
        notifications,
        settings,
        conveyorState,
        activeConveyorLuggage,
        logicSandbox,
        isBackendConnected,
        connectionStatus,
        apiBaseUrl,
        apiLoading,
        apiError,
        retryBackendConnection,
        registerLuggage,
        updateLuggage,
        deleteLuggage,
        addFlight,
        updateFlight,
        deleteFlight,
        sortSingleBaggage,
        sortAllPendingBaggage,
        isAutomaticSortingRunning,
        setIsAutomaticSortingRunning,
        startConveyorSimulation,
        pauseConveyorSimulation,
        resumeConveyorSimulation,
        resetConveyorSimulation,
        processNextInConveyor,
        setLogicSandbox,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        addNotification,
        updateSettings,
        resetDemoData,
        refreshFromBackend,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
