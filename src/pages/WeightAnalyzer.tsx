import React, { useState, useEffect, useRef } from 'react';
import {
  Scale,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Zap,
  Save,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { WeightStatusBadge } from '../components/common/Badge';

export const WeightAnalyzer: React.FC = () => {
  const { settings, luggage, updateLuggage, addNotification } = useApp();

  // State
  const [selectedBagId, setSelectedBagId] = useState<string>(
    luggage.find((b) => b.status === 'REGISTERED')?.id || luggage[0]?.id || ''
  );
  const [displayedWeight, setDisplayedWeight] = useState<number>(0);
  const [manualInput, setManualInput] = useState<string>('12.0');
  const [mode, setMode] = useState<'MANUAL' | 'SIMULATED'>('SIMULATED');
  const [isSimulating, setIsSimulating] = useState(false);
  const [tare, setTare] = useState(0.0);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  const simTimerRef = useRef<number | null>(null);

  const activeBag = luggage.find((b) => b.id === selectedBagId) || null;

  // Sync display weight when bag changes
  useEffect(() => {
    if (activeBag) {
      setDisplayedWeight(activeBag.weight);
      setManualInput(activeBag.weight.toFixed(1));
    }
  }, [selectedBagId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update displayed weight in manual mode
  useEffect(() => {
    if (mode === 'MANUAL') {
      const parsed = parseFloat(manualInput);
      if (!isNaN(parsed) && parsed >= 0) {
        setDisplayedWeight(Math.max(0, parsed - tare));
      }
    }
  }, [manualInput, tare, mode]);

  const measuredWeight = parseFloat(displayedWeight.toFixed(2));
  const maxWeight = settings.maxBaggageWeight;
  const nearLimit = settings.nearLimitThreshold;

  // Weight status evaluation
  let weightStatus: 'ACCEPTED' | 'NEAR_LIMIT' | 'OVERWEIGHT' = 'ACCEPTED';
  let statusColor = '#16A36A';
  let statusLabel = 'ACCEPTED';
  let comparatorSymbol = '<';
  let comparatorLabel = `A < B  (${measuredWeight} kg < ${maxWeight} kg) — Within Safety Margin`;

  if (measuredWeight > maxWeight) {
    weightStatus = 'OVERWEIGHT';
    statusColor = '#DC4545';
    statusLabel = 'OVERWEIGHT';
    comparatorSymbol = '>';
    comparatorLabel = `A > B  (${measuredWeight} kg > ${maxWeight} kg) — Safety Limit Exceeded`;
  } else if (measuredWeight >= nearLimit) {
    weightStatus = 'NEAR_LIMIT';
    statusColor = '#E99A25';
    statusLabel = 'NEAR LIMIT';
    comparatorSymbol = '≈';
    comparatorLabel = `A ≈ B  (${measuredWeight} kg, limit ${maxWeight} kg) — Dispatch with Caution`;
  }

  const remainingAllowance = Math.max(0, maxWeight - measuredWeight);
  const excessWeight = Math.max(0, measuredWeight - maxWeight);
  const barPercent = Math.min(100, (measuredWeight / (maxWeight * 1.4)) * 100);
  const W_signal = measuredWeight <= maxWeight;

  // Run simulated load cell
  const runSimulation = () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setIsSimulating(true);
    let step = 0;
    // Pick a realistic random final value
    const finalWeight = parseFloat((7 + Math.random() * 11.5).toFixed(2)); // 7–18.5 kg
    simTimerRef.current = window.setInterval(() => {
      step++;
      const jitter = (Math.random() - 0.5) * 2.4;
      const settling = finalWeight + jitter * Math.max(0, (8 - step) / 8);
      const val = Math.max(0, parseFloat(settling.toFixed(2)));
      setDisplayedWeight(val);
      setManualInput(val.toFixed(1));
      if (step >= 10) {
        clearInterval(simTimerRef.current!);
        setDisplayedWeight(finalWeight);
        setManualInput(finalWeight.toFixed(1));
        setIsSimulating(false);
        addNotification({
          title: 'Simulated Load-Cell Measurement Complete',
          description: `Piezoelectric strain gauge settled at ${finalWeight} kg. Status: ${finalWeight > maxWeight ? 'OVERWEIGHT' : finalWeight >= nearLimit ? 'NEAR LIMIT' : 'ACCEPTED'}.`,
          severity: 'info',
          category: 'CONVEYOR',
        });
      }
    }, 130);
  };

  const handleTare = () => {
    setTare(0);
    setDisplayedWeight(0);
    setManualInput('0.0');
  };

  // Apply measured weight back to the selected bag record
  const handleApplyToBag = () => {
    if (!activeBag) {
      setApplyFeedback('No bag selected.');
      return;
    }
    updateLuggage(activeBag.id, { weight: measuredWeight });
    setApplyFeedback(`Weight ${measuredWeight} kg applied to ${activeBag.id} — record updated.`);
    setTimeout(() => setApplyFeedback(null), 3500);
    addNotification({
      title: `Weight Updated: ${activeBag.id}`,
      description: `Measured weight ${measuredWeight} kg saved to passenger record for ${activeBag.passengerName}.`,
      severity: weightStatus === 'OVERWEIGHT' ? 'warning' : 'info',
      category: 'CONVEYOR',
    });
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="bg-[#EAF3FC] border border-[#C5DFF8] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#2878D0] text-white flex-shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-aviation-navy">
              AeroWeigh Station 03 — Piezoelectric Load-Cell Scale
            </h4>
            <p className="text-xs text-aviation-textSecondary">
              Dynamic weighing platform with 24-bit ADC and digital comparator output feeding the PLC Boolean unit.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-white border border-[#CBD5E1] text-[#2878D0] font-bold text-[10px] uppercase px-2.5 py-1 rounded tracking-wide">
            SIMULATED SENSOR
          </span>
          <span className="text-[11px] text-aviation-textSecondary">Software-emulated. No physical hardware connected.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Digital Scale Console ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main scale housing */}
          <div className="bg-white rounded-2xl border-2 border-aviation-border shadow-card overflow-hidden">
            {/* Scale Header Plate */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-aviation-border bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-aviation-navy" />
                <span className="font-bold text-sm text-aviation-navy tracking-wider">
                  AeroWeigh Terminal — Model DSD-3000
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold bg-[#EAF3FC] text-aviation-accent px-2.5 py-0.5 rounded border border-[#C5DFF8]">
                  ADC: 24-BIT Σ-Δ
                </span>
                <span className="font-mono text-[11px] text-aviation-textSecondary">Class III</span>
              </div>
            </div>

            {/* Large Digital LED Display */}
            <div className="bg-[#0B1522] mx-5 mt-5 rounded-xl px-6 py-5 border-4 border-[#1E293B] relative">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-3">
                <span>Load-Cell Readout</span>
                <span>Ref: {maxWeight.toFixed(1)} kg Max</span>
              </div>

              <div className="flex items-baseline justify-center gap-3 py-3">
                <span
                  className="font-mono font-black tracking-tighter transition-all duration-150"
                  style={{
                    fontSize: 'clamp(48px, 8vw, 72px)',
                    color: statusColor,
                    textShadow: `0 0 20px ${statusColor}50`,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {isSimulating ? (
                    <span className="animate-pulse">---.--</span>
                  ) : (
                    measuredWeight.toFixed(2)
                  )}
                </span>
                <span className="text-2xl font-mono font-bold text-[#64748B]">kg</span>
              </div>

              {/* Status + Signal line */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: statusColor,
                      boxShadow: `0 0 6px ${statusColor}`,
                    }}
                  />
                  <span className="font-mono font-bold text-xs" style={{ color: statusColor }}>
                    {statusLabel}
                  </span>
                </div>
                <span className="font-mono text-xs text-[#475569]">
                  W = <span className="font-bold" style={{ color: W_signal ? '#16A36A' : '#DC4545' }}>{W_signal ? '1' : '0'}</span>
                  {' '}(Weight Signal to AND Gate)
                </span>
              </div>
            </div>

            {/* Visual Threshold Progress Bar */}
            <div className="px-5 mt-5 space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-aviation-textSecondary">
                <span>0 kg</span>
                <span className="text-[#E99A25]">Near-Limit ({nearLimit} kg)</span>
                <span className="text-[#DC4545]">Max ({maxWeight} kg)</span>
                <span>20+ kg</span>
              </div>
              <div className="relative w-full bg-[#E2E8F0] h-4 rounded-full overflow-hidden border border-aviation-border">
                {/* Near-limit zone */}
                <div
                  className="absolute top-0 bottom-0 opacity-20"
                  style={{
                    left: `${(nearLimit / (maxWeight * 1.4)) * 100}%`,
                    width: `${((maxWeight - nearLimit) / (maxWeight * 1.4)) * 100}%`,
                    backgroundColor: '#E99A25',
                  }}
                />
                {/* Over-limit zone */}
                <div
                  className="absolute top-0 bottom-0 opacity-20"
                  style={{
                    left: `${(maxWeight / (maxWeight * 1.4)) * 100}%`,
                    right: 0,
                    backgroundColor: '#DC4545',
                  }}
                />
                {/* Fill bar */}
                <div
                  className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-300"
                  style={{ width: `${barPercent}%`, backgroundColor: statusColor }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 mt-2 border-t border-aviation-border">
              {/* Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-aviation-navy mb-2">
                  Measurement Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['SIMULATED', 'MANUAL'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        mode === m
                          ? 'bg-aviation-navy text-white border-aviation-navy shadow-sm'
                          : 'bg-white text-aviation-text border-aviation-border hover:bg-slate-50'
                      }`}
                    >
                      {m === 'SIMULATED' ? 'Simulated Sensor' : 'Manual Entry'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="flex items-end gap-2">
                {mode === 'SIMULATED' ? (
                  <button
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-aviation-accent hover:bg-aviation-accentHover text-white transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                    {isSimulating ? 'Measuring...' : 'Activate Load-Cell'}
                  </button>
                ) : (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="40"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold text-aviation-navy rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent"
                    placeholder="Enter weight kg"
                  />
                )}
                <button
                  onClick={handleTare}
                  className="py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-aviation-border text-aviation-text hover:bg-slate-50 transition"
                >
                  Tare / Zero
                </button>
              </div>
            </div>

            {/* Apply to Bag Record */}
            <div className="px-5 pb-5">
              {applyFeedback && (
                <div className="mb-2 p-2 rounded-lg bg-[#E8F7F0] border border-[#C2EBDA] text-[11px] text-aviation-success font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {applyFeedback}
                </div>
              )}
              <button
                onClick={handleApplyToBag}
                disabled={!activeBag}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-[#EAF3FC] hover:bg-[#D6EAFB] text-aviation-accent border border-[#C5DFF8] transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Save className="w-4 h-4" />
                Apply {measuredWeight.toFixed(2)} kg → Update{' '}
                {activeBag ? activeBag.id : 'Selected Bag'} Record
              </button>
            </div>
          </div>

          {/* Bag Selector */}
          <Card
            title="Test Scale with Registered Baggage"
            subtitle="Click any bag to load its profile onto the scale"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {luggage.slice(0, 8).map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBagId(b.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedBagId === b.id
                      ? 'border-aviation-navy bg-[#EAF3FC] shadow-sm ring-1 ring-aviation-navy/20'
                      : 'border-aviation-border hover:border-aviation-borderDark hover:bg-slate-50'
                  }`}
                >
                  <div className="font-mono font-bold text-xs text-aviation-navy">{b.id}</div>
                  <div className="text-[11px] text-aviation-textSecondary truncate">{b.passengerName}</div>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <span className="font-mono font-bold text-xs text-aviation-navy">{b.weight} kg</span>
                    <WeightStatusBadge status={b.weightStatus} />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Right: Calculations & Comparator ── */}
        <div className="space-y-5">
          {/* Active Bag Identification */}
          <Card title="RFID Tag — Baggage Profile" subtitle="Active manifest identification">
            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Baggage RFID ID:', value: activeBag?.id ?? 'No bag selected', mono: true },
                { label: 'Passenger:', value: activeBag?.passengerName ?? '—' },
                { label: 'Passenger ID:', value: activeBag?.passengerId ?? '—', mono: true },
                { label: 'Flight:', value: activeBag ? `${activeBag.flightNumber} → ${activeBag.destination}` : '—' },
                { label: 'Check-in Time:', value: activeBag?.registrationTime ?? '—', mono: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-aviation-border last:border-0">
                  <span className="text-aviation-textSecondary">{row.label}</span>
                  <span className={`font-semibold text-aviation-navy ${row.mono ? 'font-mono' : ''}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Comparator Formula Card */}
          <Card title="Digital Comparator Calculations" subtitle="A = Measured Weight, B = Max Limit">
            <div className="space-y-3 text-xs">
              {/* Comparator Result */}
              <div className="p-3 rounded-lg border-2" style={{ borderColor: statusColor + '50', backgroundColor: statusColor + '10' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-aviation-textSecondary mb-1">
                  Comparator Condition
                </div>
                <div
                  className="text-2xl font-mono font-black"
                  style={{ color: statusColor }}
                >
                  A {comparatorSymbol} B
                </div>
                <p className="text-[11px] text-aviation-textSecondary mt-1">{comparatorLabel}</p>
                <div className="mt-2 pt-2 border-t border-aviation-border flex justify-between items-center">
                  <span className="text-aviation-textSecondary">W Signal:</span>
                  <span
                    className="font-mono font-bold px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: W_signal ? '#16A36A' : '#DC4545' }}
                  >
                    W = {W_signal ? '1 (TRUE)' : '0 (FALSE)'}
                  </span>
                </div>
              </div>

              {/* Remaining Allowance */}
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-aviation-border">
                <div className="text-[10px] font-semibold uppercase text-aviation-textSecondary mb-1">
                  Remaining Allowance
                </div>
                <div className="font-mono text-aviation-text">
                  = {maxWeight} − {measuredWeight.toFixed(2)} kg
                </div>
                <div
                  className="text-lg font-mono font-bold mt-1"
                  style={{ color: remainingAllowance > 0 ? '#16A36A' : '#DC4545' }}
                >
                  = {remainingAllowance.toFixed(2)} kg {remainingAllowance <= 0 ? '(None)' : ''}
                </div>
              </div>

              {/* Excess Weight */}
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-aviation-border">
                <div className="text-[10px] font-semibold uppercase text-aviation-textSecondary mb-1">
                  Excess Weight Penalty
                </div>
                <div className="font-mono text-aviation-text">
                  = {measuredWeight.toFixed(2)} − {maxWeight} kg
                </div>
                <div
                  className="text-lg font-mono font-bold mt-1"
                  style={{ color: excessWeight > 0 ? '#DC4545' : '#16A36A' }}
                >
                  = {excessWeight > 0 ? `+${excessWeight.toFixed(2)} kg OVERWEIGHT` : '0.00 kg (None)'}
                </div>
              </div>

              {/* Quick test presets */}
              <div>
                <div className="text-[10px] font-semibold uppercase text-aviation-textSecondary mb-2">
                  Quick Test Values:
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: '11.5 kg', value: '11.5', color: '#16A36A', variant: 'Normal' },
                    { label: '14.6 kg', value: '14.6', color: '#E99A25', variant: 'Near' },
                    { label: '18.2 kg', value: '18.2', color: '#DC4545', variant: 'Over' },
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => {
                        setMode('MANUAL');
                        setManualInput(p.value);
                        setDisplayedWeight(parseFloat(p.value));
                      }}
                      className="py-1.5 text-[11px] font-bold rounded-lg border transition-all text-center"
                      style={{
                        backgroundColor: p.color + '15',
                        borderColor: p.color + '50',
                        color: p.color,
                      }}
                    >
                      {p.label}
                      <div className="text-[9px] opacity-70">{p.variant}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
