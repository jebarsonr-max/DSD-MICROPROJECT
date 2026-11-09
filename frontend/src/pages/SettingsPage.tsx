import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Scale,
  Activity,
  Bell,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetDemoData } = useApp();

  // Local form state initialized from context
  const [airportName, setAirportName] = useState(settings.airportName);
  const [airportCode, setAirportCode] = useState(settings.airportCode);
  const [terminalName, setTerminalName] = useState(settings.terminalName);
  const [maxBaggageWeight, setMaxBaggageWeight] = useState(settings.maxBaggageWeight.toString());
  const [nearLimitThreshold, setNearLimitThreshold] = useState(settings.nearLimitThreshold.toString());
  const [conveyorSpeed, setConveyorSpeed] = useState(settings.conveyorSpeedMultiplier);
  const [soundAlerts, setSoundAlerts] = useState(settings.soundAlertsEnabled);
  const [autoProcessQueue, setAutoProcessQueue] = useState(settings.autoProcessQueue);

  const [savedFeedback, setSavedFeedback] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const maxWeight = parseFloat(maxBaggageWeight) || 15.0;
    const nearLimit = parseFloat(nearLimitThreshold) || 14.0;

    updateSettings({
      airportName: airportName.trim(),
      airportCode: airportCode.trim().toUpperCase(),
      terminalName: terminalName.trim(),
      maxBaggageWeight: maxWeight,
      nearLimitThreshold: nearLimit,
      conveyorSpeedMultiplier: conveyorSpeed,
      soundAlertsEnabled: soundAlerts,
      autoProcessQueue: autoProcessQueue,
    });

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const confirmResetDemo = () => {
    resetDemoData();
    setIsResetModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-aviation-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-aviation-navy">Airport Automation & System Configuration</h2>
            <span className="text-xs font-mono font-bold bg-[#EAF3FC] text-aviation-accent px-2.5 py-0.5 rounded-full">
              LOCAL PERSISTENCE
            </span>
          </div>
          <p className="text-xs text-aviation-textSecondary mt-0.5">
            Configure airport operational thresholds, digital weight limit comparator parameters, and conveyor velocity.
          </p>
        </div>

        {savedFeedback && (
          <div className="flex items-center gap-1.5 text-xs text-[#16A36A] bg-[#E8F7F0] border border-[#C2EBDA] px-3 py-1.5 rounded-lg font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Configurations Saved to LocalStorage!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Airport Facility Details */}
          <Card
            title="Airport Terminal & Facility Identification"
            subtitle="Display names for passenger tags, reports, and flight manifests"
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-aviation-navy mb-1">Airport Name</label>
                  <input
                    type="text"
                    value={airportName}
                    onChange={(e) => setAirportName(e.target.value)}
                    placeholder="e.g. Chennai International Airport"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-aviation-navy mb-1">IATA Airport Code</label>
                  <input
                    type="text"
                    value={airportCode}
                    onChange={(e) => setAirportCode(e.target.value)}
                    placeholder="MAA"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border font-mono font-bold focus:outline-none focus:border-aviation-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-aviation-navy mb-1">Terminal / Concourse Name</label>
                <input
                  type="text"
                  value={terminalName}
                  onChange={(e) => setTerminalName(e.target.value)}
                  placeholder="Terminal 2 — Domestic Departures"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Digital Weight Comparator Thresholds */}
          <Card
            title="Digital Weight Analyzer Safety Thresholds"
            subtitle="Parameters fed into the digital comparator logic (W = Weight OK)"
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-aviation-border bg-[#F8FAFC]">
                  <label className="block font-bold text-aviation-navy text-xs mb-1">
                    Maximum Permitted Baggage Weight (kg)
                  </label>
                  <p className="text-[11px] text-aviation-textSecondary mb-2">
                    Bags exceeding this value cause W=0 and are diverted to Lane 06 (Security).
                  </p>
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="40"
                    value={maxBaggageWeight}
                    onChange={(e) => setMaxBaggageWeight(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-aviation-border font-mono font-bold text-aviation-navy focus:outline-none focus:border-aviation-accent"
                  />
                </div>

                <div className="p-4 rounded-xl border border-aviation-border bg-[#F8FAFC]">
                  <label className="block font-bold text-aviation-navy text-xs mb-1">
                    Near-Limit Warning Threshold (kg)
                  </label>
                  <p className="text-[11px] text-aviation-textSecondary mb-2">
                    Flags cautionary amber alert on scale and tag prior to reaching max limit.
                  </p>
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="40"
                    value={nearLimitThreshold}
                    onChange={(e) => setNearLimitThreshold(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-aviation-border font-mono font-bold text-aviation-navy focus:outline-none focus:border-aviation-accent"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Section 3: Sorting Chutes Mapping */}
          <Card
            title="Automated Sorting Chutes Configuration"
            subtitle="Default destination allocations for conveyor exit lanes"
          >
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-aviation-border text-aviation-textSecondary font-semibold">
                    <th className="pb-2 px-2">Lane ID</th>
                    <th className="pb-2 px-2">Assigned City</th>
                    <th className="pb-2 px-2">Description / Chute Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aviation-border">
                  {settings.lanesConfig.map((lane) => (
                    <tr key={lane.laneId}>
                      <td className="py-2 px-2 font-mono font-bold text-aviation-navy">{lane.laneId}</td>
                      <td className="py-2 px-2 font-semibold text-aviation-text">{lane.destination}</td>
                      <td className="py-2 px-2 text-aviation-textSecondary">{lane.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Col: Conveyor & System State Management */}
        <div className="space-y-6">
          {/* Conveyor Preferences */}
          <Card
            title="Conveyor Velocity & Automation"
            subtitle="Simulation engine parameters"
          >
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-aviation-navy mb-2">
                  Simulation Speed Multiplier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[0.5, 1.0, 2.0].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setConveyorSpeed(spd)}
                      className={`py-2 px-3 rounded-lg border font-mono font-bold text-xs transition-colors ${
                        conveyorSpeed === spd
                          ? 'bg-aviation-navy text-white border-aviation-navy shadow-sm'
                          : 'bg-white text-aviation-text border-aviation-border hover:bg-slate-50'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-aviation-border space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoProcessQueue}
                    onChange={(e) => setAutoProcessQueue(e.target.checked)}
                    className="w-4 h-4 text-aviation-navy rounded border-aviation-border focus:ring-aviation-accent"
                  />
                  <span className="font-semibold text-aviation-navy">Continuous Auto-Feed Conveyor</span>
                </label>
                <p className="text-[11px] text-aviation-textSecondary pl-6">
                  Automatically feeds subsequent queued bags when a bag exits into its destination chute.
                </p>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => setSoundAlerts(e.target.checked)}
                    className="w-4 h-4 text-aviation-navy rounded border-aviation-border focus:ring-aviation-accent"
                  />
                  <span className="font-semibold text-aviation-navy">System Alert Notifications</span>
                </label>
                <p className="text-[11px] text-aviation-textSecondary pl-6">
                  Log audio and banner alerts on overweight diverts and RFID scan mismatch.
                </p>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 px-4 bg-aviation-navy hover:bg-aviation-navyDark text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                Save System Configuration
              </button>
            </div>
          </Card>

          {/* Demo Data Management */}
          <Card
            title="Demo Data & Faculty Viva Environment"
            subtitle="Reset application state for fresh evaluation"
          >
            <div className="space-y-3 text-xs">
              <p className="text-aviation-textSecondary leading-relaxed">
                Resetting clears custom edits in LocalStorage and restores the clean 10-bag, 5-flight verified demonstration manifest.
              </p>

              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="w-full py-2.5 px-4 bg-white border border-[#F8C6C6] hover:bg-[#FCEBEB] text-[#DC4545] font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Demo Data Environment
              </button>
            </div>
          </Card>
        </div>
      </form>

      {/* Confirmation Modal for Reset Demo */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Confirm Reset Demo Data"
        subtitle="This will restore the original flight and baggage demonstration dataset"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-[#FEF6E9] border border-[#FCE2B6] text-[#E99A25] flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>
              Are you sure you want to reset all data? This will restore the original 12 demo luggage records, 5 demo flights, and initial sorting logs.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="px-3 py-1.5 text-xs text-aviation-textSecondary hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmResetDemo}
              className="px-4 py-1.5 text-xs bg-[#DC4545] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              Confirm & Reset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

