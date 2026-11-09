import React, { useState } from 'react';
import {
  GitFork,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { WeightStatusBadge, LuggageStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SortingRecord } from '../types';

export const SmartSorting: React.FC = () => {
  const {
    luggage,
    sortingHistory,
    settings,
    sortSingleBaggage,
    sortAllPendingBaggage,
    isAutomaticSortingRunning,
    setIsAutomaticSortingRunning,
  } = useApp();

  const [selectedRecord, setSelectedRecord] = useState<SortingRecord | null>(null);

  // Dynamic counts
  const pendingBags = luggage.filter((b) => b.status === 'REGISTERED');
  const sortedBags = luggage.filter((b) => b.status === 'SORTED');
  const overweightBags = luggage.filter((b) => b.status === 'OVERWEIGHT');
  const exceptionBags = luggage.filter((b) => b.status === 'MANUAL_INSPECTION' || b.status === 'REJECTED');

  // Trigger Automatic Batch Sorting
  const handleStartAutoSorting = () => {
    setIsAutomaticSortingRunning(true);
    sortAllPendingBaggage();
    setTimeout(() => {
      setIsAutomaticSortingRunning(false);
    }, (pendingBags.length + 1) * 600);
  };

  // Process single next bag
  const handleProcessNext = () => {
    const nextBag = luggage.find((b) => b.status === 'REGISTERED');
    if (nextBag) {
      sortSingleBaggage(nextBag.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Engine Status & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Queue"
          value={pendingBags.length}
          subtitle="Waiting for automated gate"
          icon={GitFork}
          badge={{ text: 'Queue', variant: pendingBags.length > 0 ? 'warning' : 'neutral' }}
          iconBgColor="bg-[#FEF6E9]"
          iconColor="text-[#E99A25]"
        />
        <StatCard
          title="Successfully Sorted"
          value={sortedBags.length}
          subtitle="Dispatched to Flight Chutes"
          icon={CheckCircle2}
          badge={{ text: 'Passed', variant: 'success' }}
          iconBgColor="bg-[#E8F7F0]"
          iconColor="text-[#16A36A]"
        />
        <StatCard
          title="Overweight Diverted"
          value={overweightBags.length}
          subtitle="Re-routed to Lane 06"
          icon={AlertTriangle}
          badge={{ text: 'Diverted', variant: 'danger' }}
          iconBgColor="bg-[#FCEBEB]"
          iconColor="text-[#DC4545]"
        />
        <StatCard
          title="Exception / Invalid"
          value={exceptionBags.length}
          subtitle="Tag or Flight Issues"
          icon={ShieldAlert}
          badge={{ text: 'Security', variant: 'info' }}
          iconBgColor="bg-[#EAF3FC]"
          iconColor="text-[#2878D0]"
        />
      </div>

      {/* Sorting Controls & Lane Overview */}
      <div className="bg-white p-5 rounded-xl border border-aviation-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-aviation-navy flex items-center gap-2">
            <span>Rule-Based Automated Sorting Engine</span>
            <span className="text-xs font-mono font-bold bg-[#EAF3FC] text-aviation-accent px-2 py-0.5 rounded">
              DECISION MATRIX: ACTIVE
            </span>
          </h2>
          <p className="text-xs text-aviation-textSecondary mt-0.5">
            Evaluates Boolean flags (I: Valid ID, W: Weight within limit, F: Flight Valid) to assign chutes.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleStartAutoSorting}
            disabled={pendingBags.length === 0 || isAutomaticSortingRunning}
            className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all flex items-center gap-1.5 shadow-sm ${
              pendingBags.length > 0 && !isAutomaticSortingRunning
                ? 'bg-aviation-navy hover:bg-aviation-navyDark'
                : 'bg-slate-300 cursor-not-allowed text-slate-500'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isAutomaticSortingRunning ? 'animate-spin' : ''}`} />
            {isAutomaticSortingRunning ? 'Sorting in Progress...' : 'START AUTOMATIC SORTING'}
          </button>

          <button
            onClick={handleProcessNext}
            disabled={pendingBags.length === 0 || isAutomaticSortingRunning}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-aviation-border text-aviation-navy hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Process Next Bag
          </button>
        </div>
      </div>

      {/* Destination Sorting Lanes 01 to 06 Visual Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {settings.lanesConfig.map((lane) => {
          const bagsInLane = luggage.filter((b) => b.assignedLane === lane.laneId).length;
          const isSecurity = lane.laneId === 'Lane 06';

          return (
            <div
              key={lane.laneId}
              className={`p-3 rounded-xl border transition-all ${
                isSecurity
                  ? 'bg-[#FEF5F5] border-[#F8C6C6]'
                  : 'bg-white border-aviation-border hover:border-aviation-accent'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                <span className={isSecurity ? 'text-[#DC4545]' : 'text-aviation-navy'}>
                  {lane.laneId}
                </span>
                <span className="text-[11px] font-sans px-1.5 py-0.2 rounded bg-white border border-aviation-border text-aviation-textSecondary">
                  {bagsInLane} Bags
                </span>
              </div>
              <div className="text-sm font-bold text-aviation-navy truncate">{lane.destination}</div>
              <p className="text-[10px] text-aviation-textSecondary mt-0.5 truncate">{lane.description}</p>
            </div>
          );
        })}
      </div>

      {/* Main Sorting Decisions & Activity Log Table */}
      <Card
        title="Authoritative Baggage Sorting Manifest"
        subtitle="Click any row to inspect digital logic inputs (I, W, F) and decision trail"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-aviation-border text-aviation-textSecondary font-semibold">
                <th className="pb-3 px-3">Baggage ID</th>
                <th className="pb-3 px-3">Flight</th>
                <th className="pb-3 px-3">Destination</th>
                <th className="pb-3 px-3">Measured Weight</th>
                <th className="pb-3 px-3">Digital Logic (I, W, F)</th>
                <th className="pb-3 px-3">Assigned Lane</th>
                <th className="pb-3 px-3">Decision Reason</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aviation-border">
              {luggage.map((bag) => {
                // Find historical record if sorted
                const historyRecord = sortingHistory.find((h) => h.baggageId === bag.id);

                return (
                  <tr
                    key={bag.id}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                    onClick={() => {
                      if (historyRecord) setSelectedRecord(historyRecord);
                    }}
                  >
                    <td className="py-3 px-3 font-mono font-semibold text-aviation-navy">
                      {bag.id}
                    </td>
                    <td className="py-3 px-3 font-semibold text-aviation-navy">{bag.flightNumber}</td>
                    <td className="py-3 px-3 text-aviation-textSecondary">{bag.destination}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{bag.weight.toFixed(1)} kg</span>
                        <WeightStatusBadge status={bag.weightStatus} />
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {historyRecord ? (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span
                            className={`px-1 rounded font-bold ${
                              historyRecord.logicInputs.I ? 'bg-[#E8F7F0] text-[#16A36A]' : 'bg-[#FCEBEB] text-[#DC4545]'
                            }`}
                          >
                            I:{historyRecord.logicInputs.I ? '1' : '0'}
                          </span>
                          <span
                            className={`px-1 rounded font-bold ${
                              historyRecord.logicInputs.W ? 'bg-[#E8F7F0] text-[#16A36A]' : 'bg-[#FCEBEB] text-[#DC4545]'
                            }`}
                          >
                            W:{historyRecord.logicInputs.W ? '1' : '0'}
                          </span>
                          <span
                            className={`px-1 rounded font-bold ${
                              historyRecord.logicInputs.F ? 'bg-[#E8F7F0] text-[#16A36A]' : 'bg-[#FCEBEB] text-[#DC4545]'
                            }`}
                          >
                            F:{historyRecord.logicInputs.F ? '1' : '0'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-aviation-textMuted text-[11px]">Awaiting Evaluation</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                        bag.assignedLane === 'Lane 06'
                          ? 'bg-[#FCEBEB] text-[#DC4545] border-[#F8C6C6]'
                          : bag.assignedLane
                          ? 'bg-aviation-lightBlue text-aviation-accent border-[#C5DFF8]'
                          : 'bg-[#F1F5F9] text-aviation-textSecondary border-aviation-border'
                      }`}>
                        {bag.assignedLane || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-aviation-textSecondary max-w-xs truncate" title={bag.rejectionReason || historyRecord?.reason}>
                      {bag.rejectionReason || historyRecord?.reason || 'Pending sorting decision'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {bag.status === 'REGISTERED' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sortSingleBaggage(bag.id);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-aviation-navy text-white rounded hover:bg-aviation-navyDark transition-colors"
                        >
                          Sort Now
                        </button>
                      ) : (
                        <span className="text-[11px] text-aviation-success font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Logic Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={`Sorting Telemetry Audit — ${selectedRecord?.baggageId}`}
        subtitle={`Evaluation Timestamp: ${selectedRecord?.timestamp}`}
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-aviation-border space-y-2">
              <div className="flex justify-between">
                <span className="text-aviation-textSecondary">Passenger:</span>
                <span className="font-semibold text-aviation-navy">{selectedRecord.passengerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-aviation-textSecondary">Flight & Destination:</span>
                <span className="font-semibold text-aviation-navy">
                  {selectedRecord.flightNumber} ({selectedRecord.destination})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-aviation-textSecondary">Measured Weight:</span>
                <span className="font-mono font-bold text-aviation-navy">{selectedRecord.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-aviation-textSecondary">Assigned Lane:</span>
                <span className="font-mono font-bold text-aviation-accent">{selectedRecord.assignedLane}</span>
              </div>
            </div>

            {/* Boolean Signals */}
            <div className="border border-aviation-border rounded-lg p-3 space-y-2">
              <h4 className="font-bold text-aviation-navy uppercase tracking-wider text-[11px]">
                Digital Logic Gate Signals
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500">I (Valid ID)</div>
                  <div className={`font-bold text-sm ${selectedRecord.logicInputs.I ? 'text-[#16A36A]' : 'text-[#DC4545]'}`}>
                    {selectedRecord.logicInputs.I ? '1 (HIGH)' : '0 (LOW)'}
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500">W (Weight OK)</div>
                  <div className={`font-bold text-sm ${selectedRecord.logicInputs.W ? 'text-[#16A36A]' : 'text-[#DC4545]'}`}>
                    {selectedRecord.logicInputs.W ? '1 (HIGH)' : '0 (LOW)'}
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500">F (Flight OK)</div>
                  <div className={`font-bold text-sm ${selectedRecord.logicInputs.F ? 'text-[#16A36A]' : 'text-[#DC4545]'}`}>
                    {selectedRecord.logicInputs.F ? '1 (HIGH)' : '0 (LOW)'}
                  </div>
                </div>
              </div>

              {/* Gate Outputs */}
              <div className="mt-2 pt-2 border-t border-aviation-border grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-2 rounded bg-[#EAF3FC] text-aviation-navy">
                  <div className="text-[10px] font-sans text-aviation-textSecondary">SORT = I · W · F</div>
                  <div className="font-bold text-base text-[#17365D]">
                    {selectedRecord.logicOutputs.SORT ? '1 (PASS)' : '0 (FAIL)'}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#FCEBEB] text-aviation-navy">
                  <div className="text-[10px] font-sans text-aviation-textSecondary">ALERT = I' + W' + F'</div>
                  <div className="font-bold text-base text-[#DC4545]">
                    {selectedRecord.logicOutputs.ALERT ? '1 (DIVERT)' : '0 (CLEAR)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation Reason */}
            <div className="p-3 rounded-lg bg-[#FAFCFE] border border-aviation-border">
              <span className="font-bold text-aviation-navy block mb-1">Decision Reason:</span>
              <p className="text-aviation-text leading-relaxed">{selectedRecord.reason}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

