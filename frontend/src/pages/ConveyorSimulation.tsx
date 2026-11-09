import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Activity,
  Scan,
  Scale,
  Plane,
  Cpu,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { ProcessingStation } from '../types';
import { WeightStatusBadge } from '../components/common/Badge';

const STATIONS: {
  id: ProcessingStation;
  label: string;
  short: string;
  number: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  { id: 'ENTRY', label: 'Baggage Entry', short: 'Entry', number: '01', icon: Activity, desc: 'Feeder chute & photo-eye intake sensor' },
  { id: 'SCANNING', label: 'RFID / Barcode Scanner', short: 'Scan', number: '02', icon: Scan, desc: 'Omnidirectional laser barcode + RFID' },
  { id: 'WEIGHING', label: 'Weight Measurement', short: 'Weigh', number: '03', icon: Scale, desc: 'ADC 24-bit piezoelectric load cell' },
  { id: 'FLIGHT_ID', label: 'Flight Identification', short: 'Flight', number: '04', icon: Plane, desc: 'Airline manifest database lookup' },
  { id: 'LOGIC_DECISION', label: 'Digital Logic Controller', short: 'Logic', number: '05', icon: Cpu, desc: '3-input AND/OR Boolean gate decision' },
  { id: 'SORTING_JUNCTION', label: 'Sorting Diverter Junction', short: 'Divert', number: '06', icon: GitFork, desc: 'Servo-actuated mechanical arm/pusher' },
  { id: 'DESTINATION_LANE', label: 'Destination Exit Chutes', short: 'Chute', number: '07', icon: CheckCircle2, desc: 'Lanes 01-05 flight make-up areas' },
  { id: 'MANUAL_INSPECTION_LANE', label: 'Security Inspection', short: 'Security', number: '08', icon: AlertTriangle, desc: 'Lane 06 overweight/invalid isolate bay' },
];

export const ConveyorSimulation: React.FC = () => {
  const {
    luggage,
    settings,
    conveyorState,
    startConveyorSimulation,
    pauseConveyorSimulation,
    resumeConveyorSimulation,
    resetConveyorSimulation,
    processNextInConveyor,
    updateSettings,
    sortingHistory,
  } = useApp();

  const [selectedBagToFeed, setSelectedBagToFeed] = useState<string>('');

  const activeBag = luggage.find((b) => b.id === conveyorState.currentBagId) || null;
  const pendingBags = luggage.filter((b) => b.status === 'REGISTERED');
  const currentIdx = STATIONS.findIndex((s) => s.id === conveyorState.currentStation);

  // Find last sorting decision for the active bag
  const lastRecord = sortingHistory.find((r) => r.baggageId === conveyorState.currentBagId);

  const statusColor =
    conveyorState.isRunning
      ? '#16A36A'
      : conveyorState.isPaused
      ? '#E99A25'
      : '#94A3B8';

  const handleStart = () => {
    startConveyorSimulation(selectedBagToFeed || undefined);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Control Bar ── */}
      <div className="bg-white p-5 rounded-2xl border border-aviation-border shadow-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-aviation-navy">
                Interactive Conveyor Belt Simulation
              </h2>
              <span
                className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: conveyorState.isRunning ? '#E8F7F0' : '#F1F5F9',
                  color: conveyorState.isRunning ? '#16A36A' : '#718096',
                  borderColor: conveyorState.isRunning ? '#C2EBDA' : '#E2E8F0',
                }}
              >
                {conveyorState.isRunning
                  ? '⬤ BELT IN MOTION'
                  : conveyorState.isPaused
                  ? '⏸ PAUSED'
                  : '◉ STANDBY'}
              </span>
            </div>
            <p className="text-xs text-aviation-textSecondary mt-1">
              Real-time baggage tracking from Entry Feeder through Digital Logic PLC to Destination Flight Chutes.
              All sorting decisions are saved to the Manifest.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Bag Selector */}
            <select
              value={selectedBagToFeed}
              onChange={(e) => setSelectedBagToFeed(e.target.value)}
              disabled={conveyorState.isRunning}
              className="text-xs border border-aviation-border rounded-lg px-3 py-2 bg-white text-aviation-navy font-medium focus:outline-none focus:border-aviation-accent disabled:opacity-50"
            >
              <option value="">Auto-select next bag ({pendingBags.length} queued)</option>
              {pendingBags.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} — {b.passengerName} ({b.weight} kg, {b.flightNumber})
                </option>
              ))}
            </select>

            {/* Start / Pause / Resume */}
            {!conveyorState.isRunning ? (
              conveyorState.isPaused ? (
                <button
                  onClick={resumeConveyorSimulation}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-aviation-success text-white hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={luggage.length === 0}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-aviation-navy hover:bg-aviation-navyDark text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start Conveyor
                </button>
              )
            ) : (
              <button
                onClick={pauseConveyorSimulation}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-aviation-border text-aviation-navy hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause
              </button>
            )}

            {/* Process Next */}
            <button
              onClick={processNextInConveyor}
              disabled={conveyorState.isRunning || pendingBags.length === 0}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-aviation-lightBlue hover:bg-aviation-lightBlueHover text-aviation-accent transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Next Bag
            </button>

            {/* Reset */}
            <button
              onClick={resetConveyorSimulation}
              className="p-2 rounded-lg text-aviation-textSecondary hover:text-aviation-navy hover:bg-slate-100 transition"
              title="Reset Conveyor"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed */}
            <div className="flex items-center gap-1 bg-[#F1F5F9] px-2 py-1 rounded-lg border border-aviation-border">
              <span className="text-[10px] text-aviation-textSecondary font-semibold pr-1">Speed:</span>
              {[0.5, 1.0, 2.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => updateSettings({ conveyorSpeedMultiplier: spd })}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition ${
                    settings.conveyorSpeedMultiplier === spd
                      ? 'bg-aviation-navy text-white shadow-sm'
                      : 'text-aviation-textSecondary hover:text-aviation-navy'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Conveyor Visualiser ── */}
      <div className="bg-white rounded-2xl border-2 border-aviation-border shadow-card overflow-hidden">
        {/* Progress Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#F8FAFC] border-b border-aviation-border">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full transition-all"
              style={{
                backgroundColor: statusColor,
                boxShadow: conveyorState.isRunning ? `0 0 8px ${statusColor}80` : 'none',
              }}
            />
            <span className="text-xs font-semibold text-aviation-navy">
              {activeBag
                ? `Processing: ${activeBag.id} — ${activeBag.passengerName}`
                : `System Idle — ${conveyorState.totalProcessedCount} bags processed this session`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-aviation-textSecondary">Progress:</span>
            <span className="font-bold text-aviation-navy">{conveyorState.progressPercent}%</span>
            <div className="w-32 bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${conveyorState.progressPercent}%`,
                  backgroundColor: statusColor,
                }}
              />
            </div>
          </div>
        </div>

        {/* Animated Conveyor Belt Track */}
        <div className="p-6">
          {/* Belt */}
          <div className="relative">
            <div className="h-20 w-full bg-[#1E293B] rounded-xl shadow-inner border-2 border-[#0F172A] overflow-hidden flex items-center relative">
              {/* Belt texture stripes — animated when running */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 4px, transparent 4px, transparent 22px)',
                  animation: conveyorState.isRunning
                    ? `conveyorRoll ${1 / settings.conveyorSpeedMultiplier}s linear infinite`
                    : 'none',
                }}
              />

              {/* Centre guide rail */}
              <div className="absolute inset-x-0 top-1/2 h-1 bg-[#334155] -translate-y-1/2" />

              {/* Roller lines */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-2 bottom-2 w-0.5 bg-[#334155] rounded"
                  style={{ left: `${(i + 1) * 8.3}%` }}
                />
              ))}

              {/* Moving suitcase */}
              {activeBag && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-linear z-10"
                  style={{
                    left: `calc(${Math.min(90, Math.max(2, conveyorState.progressPercent))}% - 36px)`,
                  }}
                >
                  <div
                    className="w-[72px] h-[52px] rounded-lg border-2 flex flex-col items-center justify-between p-1.5 shadow-xl"
                    style={{
                      backgroundColor:
                        activeBag.weightStatus === 'OVERWEIGHT'
                          ? '#FEF5F5'
                          : activeBag.weightStatus === 'NEAR_LIMIT'
                          ? '#FEF9F0'
                          : '#EAF3FC',
                      borderColor:
                        activeBag.weightStatus === 'OVERWEIGHT'
                          ? '#DC4545'
                          : activeBag.weightStatus === 'NEAR_LIMIT'
                          ? '#E99A25'
                          : '#2878D0',
                    }}
                  >
                    {/* Handle */}
                    <div
                      className="w-6 h-1.5 rounded-t border-2 -mt-2.5"
                      style={{
                        borderColor:
                          activeBag.weightStatus === 'OVERWEIGHT'
                            ? '#DC4545'
                            : activeBag.weightStatus === 'NEAR_LIMIT'
                            ? '#E99A25'
                            : '#2878D0',
                        backgroundColor: 'transparent',
                      }}
                    />
                    <div
                      className="font-mono text-[9px] font-extrabold tracking-tight truncate w-full text-center"
                      style={{
                        color:
                          activeBag.weightStatus === 'OVERWEIGHT'
                            ? '#DC4545'
                            : activeBag.weightStatus === 'NEAR_LIMIT'
                            ? '#E99A25'
                            : '#17365D',
                      }}
                    >
                      {activeBag.id}
                    </div>
                    <div
                      className="text-[9px] font-bold font-mono"
                      style={{
                        color:
                          activeBag.weightStatus === 'OVERWEIGHT'
                            ? '#DC4545'
                            : activeBag.weightStatus === 'NEAR_LIMIT'
                            ? '#E99A25'
                            : '#17365D',
                      }}
                    >
                      {activeBag.weight.toFixed(1)} kg
                    </div>
                  </div>

                  {/* Sensor detection beam */}
                  {conveyorState.isRunning && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-aviation-accent/60 rounded-full animate-pulse" />
                  )}
                </div>
              )}

              {/* Empty belt message */}
              {!activeBag && (
                <div className="absolute inset-0 flex items-center justify-center text-[#475569] text-xs font-mono">
                  CONVEYOR IDLE — AWAITING BAGGAGE DISPATCH
                </div>
              )}
            </div>
          </div>

          {/* Station Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-5">
            {STATIONS.map((station, idx) => {
              const Icon = station.icon;
              const isCurrent = station.id === conveyorState.currentStation;
              const isPassed = currentIdx > idx && conveyorState.progressPercent > 0;
              const isAlert =
                station.id === 'MANUAL_INSPECTION_LANE' &&
                conveyorState.currentStation === 'MANUAL_INSPECTION_LANE';

              return (
                <div
                  key={station.id}
                  className={`p-2.5 rounded-xl border text-center transition-all duration-300 ${
                    isCurrent
                      ? isAlert
                        ? 'bg-[#FEF5F5] border-[#DC4545] shadow-md ring-2 ring-[#DC4545]/20 scale-105'
                        : 'bg-[#EAF3FC] border-aviation-accent shadow-md ring-2 ring-aviation-accent/20 scale-105'
                      : isPassed
                      ? 'bg-white border-[#C2EBDA] opacity-90'
                      : 'bg-white border-aviation-border opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center text-[9px] font-mono mb-1">
                    <span className="text-aviation-textMuted font-semibold">ST</span>
                    <span
                      className={`font-extrabold ${
                        isCurrent
                          ? isAlert
                            ? 'text-[#DC4545]'
                            : 'text-aviation-accent'
                          : isPassed
                          ? 'text-aviation-success'
                          : 'text-aviation-textMuted'
                      }`}
                    >
                      {station.number}
                    </span>
                  </div>

                  <div
                    className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-1.5 ${
                      isCurrent
                        ? isAlert
                          ? 'bg-[#DC4545] text-white'
                          : 'bg-aviation-accent text-white shadow-sm'
                        : isPassed
                        ? 'bg-[#E8F7F0] text-aviation-success'
                        : 'bg-[#F1F5F9] text-aviation-textMuted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <p className="text-[9px] font-bold text-aviation-navy leading-tight truncate" title={station.label}>
                    {station.short}
                  </p>

                  <div className="mt-1.5">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold" style={{ color: isAlert ? '#DC4545' : '#2878D0' }}>
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-ping"
                          style={{ backgroundColor: isAlert ? '#DC4545' : '#2878D0' }}
                        />
                        ACTIVE
                      </span>
                    ) : isPassed ? (
                      <span className="text-[9px] font-semibold text-aviation-success">DONE</span>
                    ) : (
                      <span className="text-[9px] text-aviation-textMuted">IDLE</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Destination Exit Chutes */}
        <div className="border-t border-aviation-border px-6 py-4 bg-[#FAFCFE]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-aviation-accent" />
              <span className="text-xs font-bold text-aviation-navy uppercase tracking-wide">
                Automated Diverter Exit Chutes & Flight Make-Up Trays
              </span>
            </div>
            {conveyorState.activeLaneId && (
              <span className="text-xs font-mono font-bold text-aviation-accent bg-aviation-lightBlue px-2.5 py-1 rounded border border-[#C5DFF8]">
                Active Chute: {conveyorState.activeLaneId}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {settings.lanesConfig.map((lane) => {
              const isTarget = conveyorState.activeLaneId === lane.laneId;
              const isSecurity = lane.laneId === 'Lane 06';
              const bagCount = luggage.filter((b) => b.assignedLane === lane.laneId).length;

              return (
                <div
                  key={lane.laneId}
                  className={`p-3 rounded-xl border transition-all duration-300 ${
                    isTarget
                      ? isSecurity
                        ? 'bg-[#FEF5F5] border-[#DC4545] shadow-lg ring-2 ring-[#DC4545]/20'
                        : 'bg-[#EAF3FC] border-aviation-accent shadow-lg ring-2 ring-aviation-accent/20'
                      : 'bg-white border-aviation-border hover:border-aviation-borderDark'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                    <span className={isSecurity ? 'text-[#DC4545]' : 'text-aviation-navy'}>
                      {lane.laneId}
                    </span>
                    {isTarget && (
                      <span
                        className="w-2 h-2 rounded-full animate-ping"
                        style={{ backgroundColor: isSecurity ? '#DC4545' : '#16A36A' }}
                      />
                    )}
                  </div>
                  <div className="text-xs font-bold text-aviation-navy truncate">{lane.destination}</div>
                  <div className="text-[10px] text-aviation-textSecondary mt-0.5 truncate">{lane.description}</div>
                  <div className="mt-2 pt-1.5 border-t border-aviation-border flex justify-between text-[10px]">
                    <span className="text-aviation-textMuted">Bags:</span>
                    <span className="font-mono font-bold text-aviation-navy">{bagCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Live Telemetry & Workflow Guide ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Inspector */}
        <Card
          title="Live Conveyor Telemetry"
          subtitle="Real-time sensor readings during belt traversal"
          className="lg:col-span-2"
        >
          {activeBag ? (
            <div className="space-y-4">
              {/* Bag header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-aviation-border text-xs">
                <div>
                  <span className="text-aviation-textSecondary block">Baggage ID</span>
                  <div className="font-mono font-bold text-sm text-aviation-navy mt-0.5">{activeBag.id}</div>
                </div>
                <div>
                  <span className="text-aviation-textSecondary block">Passenger</span>
                  <div className="font-semibold text-sm text-aviation-navy mt-0.5">{activeBag.passengerName}</div>
                </div>
                <div>
                  <span className="text-aviation-textSecondary block">Flight</span>
                  <div className="font-semibold text-sm text-aviation-navy mt-0.5">{activeBag.flightNumber} → {activeBag.destination}</div>
                </div>
                <div>
                  <span className="text-aviation-textSecondary block">Load Cell</span>
                  <div className="font-mono font-bold text-sm text-aviation-navy mt-0.5 flex items-center gap-1.5">
                    {activeBag.weight.toFixed(1)} kg
                    <WeightStatusBadge status={activeBag.weightStatus} />
                  </div>
                </div>
              </div>

              {/* Station telemetry */}
              <div className="space-y-2 text-xs">
                {[
                  {
                    label: '1. RFID Tag / Barcode Scan:',
                    value: `MATCH CONFIRMED — ID: ${activeBag.passengerId}`,
                    ok: true,
                  },
                  {
                    label: '2. Digital Comparator (W signal):',
                    value:
                      activeBag.weight <= settings.maxBaggageWeight
                        ? `PASS — ${activeBag.weight} kg ≤ ${settings.maxBaggageWeight} kg (W=1)`
                        : `FAIL — ${activeBag.weight} kg > ${settings.maxBaggageWeight} kg (W=0)`,
                    ok: activeBag.weight <= settings.maxBaggageWeight,
                  },
                  {
                    label: '3. Flight Manifest Verification (F signal):',
                    value: `FLIGHT ACTIVE — ${activeBag.flightNumber} (F=1)`,
                    ok: true,
                  },
                  {
                    label: '4. AND Gate Output (I·W·F):',
                    value:
                      activeBag.weight <= settings.maxBaggageWeight
                        ? 'SORT = 1 → Normal destination chute'
                        : 'SORT = 0 → Divert to Lane 06 Security',
                    ok: activeBag.weight <= settings.maxBaggageWeight,
                  },
                ].map((row, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-aviation-border flex items-center justify-between gap-2">
                    <span className="font-medium text-aviation-navy">{row.label}</span>
                    <span
                      className={`font-mono font-bold text-right ${row.ok ? 'text-aviation-success' : 'text-aviation-danger'}`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : conveyorState.progressPercent === 100 && conveyorState.activeLaneId ? (
            <div className="p-4 rounded-xl bg-[#E8F7F0] border border-[#C2EBDA] text-xs text-aviation-success font-semibold flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>
                Last processed bag dispatched to <strong>{conveyorState.activeLaneId}</strong>.
                Conveyor ready for next baggage. {pendingBags.length > 0 ? `${pendingBags.length} bags remaining in queue.` : 'All bags processed!'}
              </span>
            </div>
          ) : (
            <div className="py-8 text-center text-aviation-textMuted text-xs">
              No baggage currently on the conveyor. Select a bag and click "Start Conveyor" to begin.
            </div>
          )}
        </Card>

        {/* Processing Flow Guide */}
        <Card
          title="Processing Workflow"
          subtitle="Step-by-step automated sorting sequence"
        >
          <div className="space-y-1.5 text-xs">
            {[
              { n: '1', t: 'REGISTRATION', d: 'Passenger check-in & RFID tag generation' },
              { n: '2', t: 'RFID SCANNING', d: 'Optical laser + RFID omnidirectional read' },
              { n: '3', t: 'LOAD CELL WEIGHING', d: 'ADC 24-bit piezoelectric strain gauge' },
              { n: '4', t: 'FLIGHT LOOKUP', d: 'Airline manifest database validation' },
              { n: '5', t: 'BOOLEAN DECISION', d: 'SORT = I AND W AND F gate evaluation' },
              { n: '6', t: 'SERVO DIVERSION', d: 'Mechanical arm actuates to target chute' },
              { n: '7', t: 'FLIGHT MAKE-UP', d: 'Bag arrives at destination lane tray' },
            ].map((st) => (
              <div key={st.n} className="flex gap-2.5 py-2 border-b border-aviation-border last:border-0 items-start">
                <span className="w-5 h-5 rounded-full bg-aviation-navy text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {st.n}
                </span>
                <div>
                  <div className="font-bold text-aviation-navy text-[11px] font-mono">{st.t}</div>
                  <div className="text-[10px] text-aviation-textSecondary leading-relaxed">{st.d}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-4 pt-4 border-t border-aviation-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-aviation-textSecondary">Session Processed:</span>
              <span className="font-mono font-bold text-aviation-navy">{conveyorState.totalProcessedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-aviation-textSecondary">Remaining in Queue:</span>
              <span className="font-mono font-bold text-aviation-navy">{pendingBags.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-aviation-textSecondary">Belt Speed:</span>
              <span className="font-mono font-bold text-aviation-navy">{settings.conveyorSpeedMultiplier}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-aviation-textSecondary">Auto-Feed:</span>
              <span className={`font-mono font-bold ${settings.autoProcessQueue ? 'text-aviation-success' : 'text-aviation-textMuted'}`}>
                {settings.autoProcessQueue ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
