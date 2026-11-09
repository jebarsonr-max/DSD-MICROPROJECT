import React from 'react';
import {
  Luggage,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Plane,
  ArrowUpRight,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { WeightStatusBadge, LuggageStatusBadge, FlightStatusBadge } from '../components/common/Badge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PageId } from '../components/layout/Sidebar';

interface OverviewDashboardProps {
  onNavigate: (page: PageId) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const { luggage, flights, sortingHistory, conveyorState, settings } = useApp();

  // Dynamic KPI Calculations
  const totalRegistered = luggage.length;
  const processedBags = luggage.filter((b) => b.status === 'SORTED' || b.status === 'OVERWEIGHT' || b.status === 'MANUAL_INSPECTION');
  const totalProcessed = processedBags.length;
  const successfullySorted = luggage.filter((b) => b.status === 'SORTED').length;
  const overweightCount = luggage.filter((b) => b.status === 'OVERWEIGHT' || b.weightStatus === 'OVERWEIGHT').length;
  const pendingCount = luggage.filter((b) => b.status === 'REGISTERED').length;
  const sortingSuccessRate = totalProcessed > 0 ? ((successfullySorted / totalProcessed) * 100).toFixed(1) : '100.0';

  // Destination Distribution Data
  const destinationCounts: Record<string, number> = {};
  luggage.forEach((bag) => {
    destinationCounts[bag.destination] = (destinationCounts[bag.destination] || 0) + 1;
  });
  const destinationData = Object.entries(destinationCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Weight Distribution Ranges
  const weightRanges = [
    { range: '< 10 kg', count: 0, fill: '#2878D0' },
    { range: '10 - 13.9 kg', count: 0, fill: '#16A36A' },
    { range: '14 - 15 kg (Near Limit)', count: 0, fill: '#E99A25' },
    { range: '> 15 kg (Overweight)', count: 0, fill: '#DC4545' },
  ];

  luggage.forEach((b) => {
    if (b.weight < 10) weightRanges[0].count++;
    else if (b.weight < 14) weightRanges[1].count++;
    else if (b.weight <= 15) weightRanges[2].count++;
    else weightRanges[3].count++;
  });

  // Processing timeline mock data combined with real counts
  const timelineData = [
    { time: '09:00', processed: 4, normal: 3, overweight: 1 },
    { time: '10:00', processed: 8, normal: 7, overweight: 1 },
    { time: '11:00', processed: 14, normal: 11, overweight: 3 },
    { time: '12:00', processed: totalProcessed, normal: successfullySorted, overweight: overweightCount },
  ];

  const DESTINATION_COLORS = ['#17365D', '#2878D0', '#0284C7', '#0D9488', '#16A36A'];

  return (
    <div className="space-y-6">
      {/* 6 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Registered"
          value={totalRegistered}
          subtitle="Check-in Manifest"
          icon={Luggage}
          badge={{ text: 'Active Today', variant: 'info' }}
          iconBgColor="bg-[#EAF3FC]"
          iconColor="text-[#2878D0]"
        />
        <StatCard
          title="Luggage Processed"
          value={totalProcessed}
          subtitle="Evaluated by Logic"
          icon={Activity}
          badge={{ text: `${((totalProcessed / (totalRegistered || 1)) * 100).toFixed(0)}% Done`, variant: 'info' }}
          iconBgColor="bg-[#F1F5F9]"
          iconColor="text-aviation-navy"
        />
        <StatCard
          title="Successfully Sorted"
          value={successfullySorted}
          subtitle="Passed to Flight Chutes"
          icon={CheckCircle2}
          badge={{ text: 'Approved', variant: 'success' }}
          iconBgColor="bg-[#E8F7F0]"
          iconColor="text-[#16A36A]"
        />
        <StatCard
          title="Overweight Baggage"
          value={overweightCount}
          subtitle={`Above ${settings.maxBaggageWeight} kg Limit`}
          icon={AlertTriangle}
          badge={{ text: 'Diverted', variant: 'danger' }}
          iconBgColor="bg-[#FCEBEB]"
          iconColor="text-[#DC4545]"
        />
        <StatCard
          title="Pending Baggage"
          value={pendingCount}
          subtitle="Awaiting Conveyor"
          icon={Clock}
          badge={{ text: pendingCount > 0 ? 'Queued' : 'Clear', variant: pendingCount > 0 ? 'warning' : 'neutral' }}
          iconBgColor="bg-[#FEF6E9]"
          iconColor="text-[#E99A25]"
        />
        <StatCard
          title="Sorting Success Rate"
          value={`${sortingSuccessRate}%`}
          subtitle="AND Gate Pass Rate"
          icon={TrendingUp}
          badge={{ text: 'High Accuracy', variant: 'success' }}
          iconBgColor="bg-[#E8F7F0]"
          iconColor="text-[#16A36A]"
        />
      </div>

      {/* Middle Charts Grid: Section A & Section B */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section A: Baggage Processing Overview */}
        <Card
          title="Baggage Processing Overview"
          subtitle="Accumulated sorting volume and comparator diverts over operational hours"
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-aviation-textSecondary">
                <span className="w-2.5 h-2.5 rounded-full bg-aviation-navy" />
                Normal Sorted
              </span>
              <span className="flex items-center gap-1.5 text-aviation-textSecondary">
                <span className="w-2.5 h-2.5 rounded-full bg-aviation-danger" />
                Overweight Diverts
              </span>
            </div>
          }
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#17365D" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#17365D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOverweight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC4545" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#DC4545" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4EAF1" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#718096' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#718096' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E4EAF1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                />
                <Area type="monotone" dataKey="normal" stroke="#17365D" strokeWidth={2} fillOpacity={1} fill="url(#colorNormal)" name="Normal Sorted" />
                <Area type="monotone" dataKey="overweight" stroke="#DC4545" strokeWidth={2} fillOpacity={1} fill="url(#colorOverweight)" name="Overweight Diverts" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Section B: Destination Distribution */}
        <Card
          title="Destination Distribution"
          subtitle="Baggage count allocated per flight route"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={destinationData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4EAF1" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#718096' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#718096' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E4EAF1',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#2878D0" radius={[4, 4, 0, 0]} name="Bags Count">
                  {destinationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DESTINATION_COLORS[index % DESTINATION_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Lower Row: Weight Distribution & Conveyor Status & Upcoming Flights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section C: Weight Distribution */}
        <Card
          title="Weight Distribution & Thresholds"
          subtitle="Categorization across safety load limits"
        >
          <div className="space-y-4 pt-2">
            {weightRanges.map((w, idx) => {
              const pct = totalRegistered > 0 ? Math.round((w.count / totalRegistered) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-aviation-navy">{w.range}</span>
                    <span className="text-aviation-textSecondary font-semibold">
                      {w.count} bags ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: w.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-3 rounded-lg bg-[#FAFCFE] border border-aviation-border flex items-center justify-between">
            <div className="text-xs">
              <span className="text-aviation-textSecondary">Current Standard Limit:</span>
              <strong className="text-aviation-navy ml-1">{settings.maxBaggageWeight} kg</strong>
            </div>
            <button
              onClick={() => onNavigate('weight-analyzer')}
              className="text-xs text-aviation-accent hover:underline font-semibold flex items-center gap-1"
            >
              Open Analyzer
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* Section E: Conveyor System Status */}
        <Card
          title="Conveyor System Status"
          subtitle="Real-time handling telemetry and sensor feedback"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-aviation-border">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${conveyorState.isRunning ? 'bg-aviation-success animate-ping' : 'bg-aviation-textMuted'}`} />
                <div>
                  <h4 className="text-sm font-semibold text-aviation-navy">
                    {conveyorState.isRunning ? 'Conveyor Belt In Motion' : conveyorState.isPaused ? 'Conveyor Paused' : 'Conveyor System Idle'}
                  </h4>
                  <p className="text-xs text-aviation-textSecondary">
                    {conveyorState.currentBagId ? `Processing: ${conveyorState.currentBagId}` : 'Awaiting baggage dispatch'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-white border border-aviation-border px-2 py-1 rounded">
                {settings.conveyorSpeedMultiplier}x Speed
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-aviation-border">
                <span className="text-aviation-textSecondary">Active Processing Station:</span>
                <span className="font-semibold text-aviation-navy uppercase">{conveyorState.currentStation.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-aviation-border">
                <span className="text-aviation-textSecondary">Active Diverter Junction:</span>
                <span className="font-semibold text-aviation-navy">Lane 01 - 06 Ready</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-aviation-textSecondary">Digital Logic Unit (AND/OR):</span>
                <span className="font-semibold text-aviation-success">Synced (Clock: 1 kHz)</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('conveyor-simulation')}
              className="w-full mt-2 py-2 px-4 bg-aviation-lightBlue hover:bg-aviation-lightBlueHover text-aviation-accent font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Activity className="w-4 h-4" />
              View Live Interactive Conveyor
            </button>
          </div>
        </Card>

        {/* Section F: Upcoming Flights */}
        <Card
          title="Upcoming Flights Manifest"
          subtitle="Gate allocations & assigned automated chutes"
          action={
            <button
              onClick={() => onNavigate('flight-management')}
              className="text-xs text-aviation-accent hover:underline font-semibold"
            >
              Manage
            </button>
          }
        >
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {flights.slice(0, 5).map((flight) => (
              <div
                key={flight.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-aviation-border hover:bg-[#FAFCFE] transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-[#EAF3FC] text-aviation-accent">
                    <Plane className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-aviation-navy">{flight.flightNumber}</div>
                    <div className="text-[11px] text-aviation-textSecondary">
                      {flight.destination} • Gate {flight.gateNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-semibold text-aviation-navy">{flight.departureTime}</div>
                  <div className="mt-0.5">
                    <FlightStatusBadge status={flight.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Section D: Recent Baggage Activity Table */}
      <Card
        title="Recent Baggage Activity"
        subtitle="Latest check-in registrations, digital weight assessments, and lane allocations"
        action={
          <button
            onClick={() => onNavigate('registration')}
            className="text-xs text-aviation-accent hover:underline font-semibold flex items-center gap-1"
          >
            All Registrations
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-aviation-border text-aviation-textSecondary font-semibold">
                <th className="pb-3 px-3">Baggage ID</th>
                <th className="pb-3 px-3">Passenger</th>
                <th className="pb-3 px-3">Flight</th>
                <th className="pb-3 px-3">Destination</th>
                <th className="pb-3 px-3">Measured Weight</th>
                <th className="pb-3 px-3">Assigned Lane</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aviation-border">
              {luggage.slice(0, 7).map((bag) => (
                <tr key={bag.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-aviation-navy">
                    {bag.id}
                    {bag.isDemo && (
                      <span className="ml-1.5 text-[9px] bg-slate-100 text-slate-500 font-sans px-1 py-0.5 rounded">
                        DEMO
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-aviation-text font-medium">{bag.passengerName}</td>
                  <td className="py-3 px-3 font-semibold text-aviation-navy">{bag.flightNumber}</td>
                  <td className="py-3 px-3 text-aviation-textSecondary">{bag.destination}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{bag.weight.toFixed(1)} kg</span>
                      <WeightStatusBadge status={bag.weightStatus} />
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-aviation-navy border border-aviation-border">
                      {bag.assignedLane || 'Queueing'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <LuggageStatusBadge status={bag.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

