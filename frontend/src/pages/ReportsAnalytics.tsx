import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { WeightStatusBadge, LuggageStatusBadge } from '../components/common/Badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const ReportsAnalytics: React.FC = () => {
  const { luggage, flights, sortingHistory, settings } = useApp();

  // Filters
  const [selectedFlight, setSelectedFlight] = useState<string>('ALL');
  const [selectedDestination, setSelectedDestination] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filtered dataset
  const filteredBags = luggage.filter((bag) => {
    const flightMatch = selectedFlight === 'ALL' || bag.flightNumber === selectedFlight;
    const destMatch = selectedDestination === 'ALL' || bag.destination === selectedDestination;
    const statusMatch =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'SORTED' && bag.status === 'SORTED') ||
      (selectedStatus === 'OVERWEIGHT' && (bag.status === 'OVERWEIGHT' || bag.weightStatus === 'OVERWEIGHT')) ||
      (selectedStatus === 'PENDING' && bag.status === 'REGISTERED');

    return flightMatch && destMatch && statusMatch;
  });

  // Dynamic Metrics
  const totalBags = filteredBags.length;
  const processedBags = filteredBags.filter((b) => b.status === 'SORTED' || b.status === 'OVERWEIGHT' || b.status === 'MANUAL_INSPECTION');
  const totalProcessed = processedBags.length;
  const sortedBags = filteredBags.filter((b) => b.status === 'SORTED').length;
  const overweightBags = filteredBags.filter((b) => b.status === 'OVERWEIGHT' || b.weightStatus === 'OVERWEIGHT').length;
  const invalidBags = filteredBags.filter((b) => b.status === 'MANUAL_INSPECTION' || b.status === 'REJECTED').length;
  const successRate = totalProcessed > 0 ? ((sortedBags / totalProcessed) * 100).toFixed(1) : '100.0';
  const averageWeight = totalBags > 0 ? (filteredBags.reduce((acc, b) => acc + b.weight, 0) / totalBags).toFixed(1) : '0.0';

  // Destination distribution
  const destinationMap: Record<string, number> = {};
  filteredBags.forEach((b) => {
    destinationMap[b.destination] = (destinationMap[b.destination] || 0) + 1;
  });
  const destinationChartData = Object.entries(destinationMap).map(([name, count]) => ({
    name,
    count,
  }));

  // Weight Status pie data
  const pieData = [
    { name: 'Accepted (<14kg)', value: filteredBags.filter((b) => b.weightStatus === 'ACCEPTED').length, color: '#16A36A' },
    { name: 'Near Limit (14-15kg)', value: filteredBags.filter((b) => b.weightStatus === 'NEAR_LIMIT').length, color: '#E99A25' },
    { name: 'Overweight (>15kg)', value: filteredBags.filter((b) => b.weightStatus === 'OVERWEIGHT').length, color: '#DC4545' },
  ];

  // CSV Export Action
  const handleExportCSV = () => {
    const headers = ['Baggage ID', 'Passenger Name', 'Passenger ID', 'Flight', 'Destination', 'Weight (kg)', 'Status', 'Assigned Lane', 'Is Demo Record'];
    const rows = filteredBags.map((b) => [
      b.id,
      `"${b.passengerName}"`,
      b.passengerId,
      b.flightNumber,
      b.destination,
      b.weight.toFixed(2),
      b.status,
      b.assignedLane || 'None',
      b.isDemo ? 'Yes' : 'No',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AeroSort_Baggage_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Browser Print Action
  const handlePrint = () => {
    window.print();
  };

  const uniqueDestinations = Array.from(new Set(luggage.map((b) => b.destination)));

  return (
    <div className="space-y-6">
      {/* Top Banner with Export & Print */}
      <div className="bg-white p-5 rounded-2xl border border-aviation-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-aviation-navy">Baggage Analytics & Operational Reports</h2>
            <span className="text-xs font-mono font-bold bg-[#EAF3FC] text-aviation-accent px-2.5 py-0.5 rounded-full">
              VERIFIED AUDIT
            </span>
          </div>
          <p className="text-xs text-aviation-textSecondary mt-0.5">
            Statistical breakdown of baggage load, throughput compliance, and sorting accuracy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-aviation-border text-aviation-navy hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-aviation-accent" />
            Download CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-aviation-navy hover:bg-aviation-navyDark text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-aviation-border shadow-subtle grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-aviation-textSecondary font-semibold mb-1">Filter by Flight</label>
          <select
            value={selectedFlight}
            onChange={(e) => setSelectedFlight(e.target.value)}
            className="w-full border border-aviation-border rounded-lg px-2.5 py-1.5 bg-white font-medium"
          >
            <option value="ALL">All Flights</option>
            {flights.map((f) => (
              <option key={f.id} value={f.flightNumber}>
                {f.flightNumber} ({f.destination})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-aviation-textSecondary font-semibold mb-1">Filter by Destination</label>
          <select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="w-full border border-aviation-border rounded-lg px-2.5 py-1.5 bg-white font-medium"
          >
            <option value="ALL">All Destinations</option>
            {uniqueDestinations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-aviation-textSecondary font-semibold mb-1">Filter by Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border border-aviation-border rounded-lg px-2.5 py-1.5 bg-white font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="SORTED">Successfully Sorted</option>
            <option value="OVERWEIGHT">Overweight Diverted</option>
            <option value="PENDING">Pending Conveyor</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Filter Matches"
          value={totalBags}
          subtitle="Baggage records"
          icon={BarChart3}
          badge={{ text: 'Total', variant: 'info' }}
          iconBgColor="bg-[#EAF3FC]"
          iconColor="text-[#2878D0]"
        />
        <StatCard
          title="Sorted Compliant"
          value={sortedBags}
          subtitle="Dispatched to flights"
          icon={CheckCircle2}
          badge={{ text: 'Approved', variant: 'success' }}
          iconBgColor="bg-[#E8F7F0]"
          iconColor="text-[#16A36A]"
        />
        <StatCard
          title="Overweight Bags"
          value={overweightBags}
          subtitle={`Above ${settings.maxBaggageWeight} kg limit`}
          icon={AlertTriangle}
          badge={{ text: 'Safety Divert', variant: 'danger' }}
          iconBgColor="bg-[#FCEBEB]"
          iconColor="text-[#DC4545]"
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          subtitle="AND Gate Pass Rate"
          icon={CheckCircle2}
          badge={{ text: 'Accuracy', variant: 'success' }}
          iconBgColor="bg-[#E8F7F0]"
          iconColor="text-[#16A36A]"
        />
        <StatCard
          title="Average Bag Weight"
          value={`${averageWeight} kg`}
          subtitle="Payload density"
          icon={Clock}
          badge={{ text: 'Mean', variant: 'neutral' }}
          iconBgColor="bg-[#F1F5F9]"
          iconColor="text-aviation-navy"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Destination Flight Allocation"
          subtitle="Baggage count routed to each city"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={destinationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4EAF1" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#718096' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#718096' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#17365D" radius={[4, 4, 0, 0]} name="Bags" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Weight Category Distribution"
          subtitle="Proportion of Accepted, Near-Limit, and Overweight baggage"
        >
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs pt-2 border-t border-aviation-border">
            {pieData.map((p) => (
              <span key={p.name} className="flex items-center gap-1.5 font-medium text-aviation-navy">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}: <strong>{p.value}</strong>
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Filtered Data Table */}
      <Card
        title="Audit Manifest Table"
        subtitle={`Showing ${filteredBags.length} records matching current query`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-aviation-border text-aviation-textSecondary font-semibold">
                <th className="pb-3 px-3">Baggage ID</th>
                <th className="pb-3 px-3">Passenger</th>
                <th className="pb-3 px-3">Flight / Dest</th>
                <th className="pb-3 px-3">Weight</th>
                <th className="pb-3 px-3">Weight Status</th>
                <th className="pb-3 px-3">Assigned Lane</th>
                <th className="pb-3 px-3">Final Status</th>
                <th className="pb-3 px-3">Record Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aviation-border">
              {filteredBags.map((bag) => (
                <tr key={bag.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-2.5 px-3 font-mono font-semibold text-aviation-navy">{bag.id}</td>
                  <td className="py-2.5 px-3 font-medium text-aviation-navy">{bag.passengerName}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-aviation-navy">{bag.flightNumber}</span>
                    <span className="text-aviation-textSecondary ml-1">({bag.destination})</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-aviation-navy">{bag.weight.toFixed(1)} kg</td>
                  <td className="py-2.5 px-3">
                    <WeightStatusBadge status={bag.weightStatus} />
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-aviation-navy border border-aviation-border">
                      {bag.assignedLane || 'Pending'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <LuggageStatusBadge status={bag.status} />
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      bag.isDemo ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {bag.isDemo ? 'DEMO DATA' : 'USER CREATED'}
                    </span>
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

