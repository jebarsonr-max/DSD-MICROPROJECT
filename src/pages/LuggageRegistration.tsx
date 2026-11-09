import React, { useState, useId } from 'react';
import {
  Luggage,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Barcode,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { WeightStatusBadge, LuggageStatusBadge } from '../components/common/Badge';
import { Baggage } from '../types';

export const LuggageRegistration: React.FC = () => {
  const { luggage, flights, settings, registerLuggage, updateLuggage, deleteLuggage } = useApp();

  // Form state
  const [bagId, setBagId] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerId, setPassengerId] = useState('');
  const [flightNumber, setFlightNumber] = useState(flights[0]?.flightNumber || 'AI 101');
  const [destination, setDestination] = useState(flights[0]?.destination || 'Delhi');
  const [airline, setAirline] = useState(flights[0]?.airline || 'Air India');
  const [weight, setWeight] = useState<string>('12.5');
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [flightFilter, setFlightFilter] = useState<string>('ALL');

  // Edit modal state
  const [editingBag, setEditingBag] = useState<Baggage | null>(null);
  const [editWeight, setEditWeight] = useState<number>(0);
  const [editPassenger, setEditPassenger] = useState<string>('');

  // Handle flight selection change -> auto-populate destination and airline
  const handleFlightChange = (selectedFlightNum: string) => {
    setFlightNumber(selectedFlightNum);
    const matchedFlight = flights.find((f) => f.flightNumber === selectedFlightNum);
    if (matchedFlight) {
      setDestination(matchedFlight.destination);
      setAirline(matchedFlight.airline);
    }
  };

  // Generate Unique Baggage ID
  const generateUniqueId = () => {
    let newId = '';
    let duplicate = true;
    while (duplicate) {
      newId = `BAG-${Math.floor(1000 + Math.random() * 9000)}`;
      duplicate = luggage.some((b) => b.id.toLowerCase() === newId.toLowerCase());
    }
    setBagId(newId);
    setPassengerId(`PAX-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Quick preset test bags for faculty demo
  const fillPreset = (type: 'normal' | 'nearLimit' | 'overweight') => {
    generateUniqueId();
    if (type === 'normal') {
      setPassengerName('Siddharth Rao');
      setWeight('11.5');
    } else if (type === 'nearLimit') {
      setPassengerName('Sunita Krishnan');
      setWeight('14.7');
    } else {
      setPassengerName('Rajesh Verma');
      setWeight('18.8');
    }
    setFormFeedback(null);
  };

  // Submit Registration Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setFormFeedback({ type: 'error', message: 'Please enter a valid positive weight in kilograms.' });
      return;
    }

    if (!passengerName.trim()) {
      setFormFeedback({ type: 'error', message: 'Passenger name is required.' });
      return;
    }

    const currentBagId = bagId.trim() || `BAG-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await registerLuggage({
      id: currentBagId,
      passengerName,
      passengerId: passengerId.trim() || `PAX-${Math.floor(100 + Math.random() * 900)}`,
      flightNumber,
      destination,
      airline,
      weight: parsedWeight,
    });

    if (res.success) {
      setFormFeedback({
        type: 'success',
        message: `Baggage ${res.baggage?.id} for passenger ${passengerName} registered successfully!`,
      });
      // Clear fields for next entry
      setBagId('');
      setPassengerName('');
      setPassengerId('');
      setWeight('12.0');
    } else {
      setFormFeedback({ type: 'error', message: res.message });
    }
  };

  // Save Edit
  const handleSaveEdit = () => {
    if (editingBag) {
      updateLuggage(editingBag.id, {
        passengerName: editPassenger,
        weight: editWeight,
      });
      setEditingBag(null);
    }
  };

  // Filtered luggage list
  const filteredLuggage = luggage.filter((bag) => {
    const matchesSearch =
      bag.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bag.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bag.passengerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bag.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bag.destination.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && bag.status === 'REGISTERED') ||
      (statusFilter === 'SORTED' && bag.status === 'SORTED') ||
      (statusFilter === 'OVERWEIGHT' && (bag.status === 'OVERWEIGHT' || bag.weightStatus === 'OVERWEIGHT'));

    const matchesFlight = flightFilter === 'ALL' || bag.flightNumber === flightFilter;

    return matchesSearch && matchesStatus && matchesFlight;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Demo presets */}
      <div className="bg-white p-4 rounded-xl border border-aviation-border shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-aviation-navy">Baggage Check-In & Tag Registration</h2>
          <p className="text-xs text-aviation-textSecondary">
            Digital ticketing terminal. Evaluates load cells and binds RFID barcodes to passenger manifest.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-aviation-textSecondary">Viva Demo Quick-Fill:</span>
          <button
            onClick={() => fillPreset('normal')}
            className="px-2.5 py-1 text-xs rounded font-medium bg-[#E8F7F0] text-[#16A36A] hover:bg-[#D4F3E4] transition-colors"
          >
            Normal (11.5 kg)
          </button>
          <button
            onClick={() => fillPreset('nearLimit')}
            className="px-2.5 py-1 text-xs rounded font-medium bg-[#FEF6E9] text-[#E99A25] hover:bg-[#FCEACF] transition-colors"
          >
            Near-Limit (14.7 kg)
          </button>
          <button
            onClick={() => fillPreset('overweight')}
            className="px-2.5 py-1 text-xs rounded font-medium bg-[#FCEBEB] text-[#DC4545] hover:bg-[#F8D4D4] transition-colors"
          >
            Overweight (18.8 kg)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Column */}
        <Card
          title="New Baggage Registration"
          subtitle="Enter passenger and baggage details"
          className="lg:col-span-1"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formFeedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  formFeedback.type === 'success'
                    ? 'bg-[#E8F7F0] text-[#16A36A] border border-[#C2EBDA]'
                    : 'bg-[#FCEBEB] text-[#DC4545] border border-[#F8C6C6]'
                }`}
              >
                {formFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{formFeedback.message}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-aviation-navy">Baggage ID (RFID / Barcode)</label>
                <button
                  type="button"
                  onClick={generateUniqueId}
                  className="text-[11px] text-aviation-accent hover:underline flex items-center gap-1 font-semibold"
                >
                  <Barcode className="w-3 h-3" />
                  Auto-Generate
                </button>
              </div>
              <input
                type="text"
                value={bagId}
                onChange={(e) => setBagId(e.target.value)}
                placeholder="e.g. BAG-1048"
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-aviation-navy mb-1">Passenger Name *</label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="e.g. Rohan Verma"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-aviation-navy mb-1">Passenger ID</label>
                <input
                  type="text"
                  value={passengerId}
                  onChange={(e) => setPassengerId(e.target.value)}
                  placeholder="e.g. PAX-542"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-aviation-navy mb-1">Flight Number *</label>
              <select
                value={flightNumber}
                onChange={(e) => handleFlightChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent bg-white"
              >
                {flights.map((f) => (
                  <option key={f.id} value={f.flightNumber}>
                    {f.flightNumber} — {f.destination} ({f.airline})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-aviation-navy mb-1">Destination</label>
                <input
                  type="text"
                  readOnly
                  value={destination}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border bg-[#F8FAFC] text-aviation-textSecondary cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-aviation-navy mb-1">Airline</label>
                <input
                  type="text"
                  readOnly
                  value={airline}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border bg-[#F8FAFC] text-aviation-textSecondary cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-aviation-navy">Baggage Weight (kg) *</label>
                <span className="text-[11px] text-aviation-textSecondary">
                  Limit: <strong>{settings.maxBaggageWeight} kg</strong>
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="12.5"
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent font-mono font-bold text-aviation-navy"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-aviation-navy hover:bg-aviation-navyDark text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Register & Print Luggage Tag
            </button>
          </form>
        </Card>

        {/* Right Table Column */}
        <Card
          title="Registered Baggage Records"
          subtitle={`Showing ${filteredLuggage.length} of ${luggage.length} baggage entries`}
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs text-aviation-textSecondary font-medium">Filter by Flight:</span>
              <select
                value={flightFilter}
                onChange={(e) => setFlightFilter(e.target.value)}
                className="text-xs border border-aviation-border rounded-lg px-2 py-1 bg-white"
              >
                <option value="ALL">All Flights</option>
                {flights.map((f) => (
                  <option key={f.id} value={f.flightNumber}>
                    {f.flightNumber} ({f.destination})
                  </option>
                ))}
              </select>
            </div>
          }
        >
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-aviation-textMuted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, Passenger Name, Flight, Destination..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-aviation-navy text-white'
                    : 'bg-[#F1F5F9] text-aviation-text hover:bg-aviation-lightBlue'
                }`}
              >
                All ({luggage.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  statusFilter === 'PENDING'
                    ? 'bg-aviation-navy text-white'
                    : 'bg-[#F1F5F9] text-aviation-text hover:bg-aviation-lightBlue'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('SORTED')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  statusFilter === 'SORTED'
                    ? 'bg-aviation-navy text-white'
                    : 'bg-[#F1F5F9] text-aviation-text hover:bg-aviation-lightBlue'
                }`}
              >
                Sorted
              </button>
              <button
                onClick={() => setStatusFilter('OVERWEIGHT')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  statusFilter === 'OVERWEIGHT'
                    ? 'bg-aviation-navy text-white'
                    : 'bg-[#F1F5F9] text-aviation-text hover:bg-aviation-lightBlue'
                }`}
              >
                Overweight
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-aviation-border text-aviation-textSecondary font-semibold">
                  <th className="pb-3 px-2">Baggage ID</th>
                  <th className="pb-3 px-2">Passenger</th>
                  <th className="pb-3 px-2">Flight / Dest</th>
                  <th className="pb-3 px-2">Weight</th>
                  <th className="pb-3 px-2">Weight Status</th>
                  <th className="pb-3 px-2">Lane</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aviation-border">
                {filteredLuggage.map((bag) => (
                  <tr key={bag.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-2 font-mono font-semibold text-aviation-navy">
                      {bag.id}
                      {bag.isDemo && (
                        <span className="ml-1 text-[9px] bg-slate-100 text-slate-500 font-sans px-1 py-0.5 rounded">
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="font-medium text-aviation-navy">{bag.passengerName}</div>
                      <div className="text-[10px] text-aviation-textSecondary font-mono">{bag.passengerId}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="font-semibold text-aviation-navy">{bag.flightNumber}</div>
                      <div className="text-[11px] text-aviation-textSecondary">{bag.destination}</div>
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold text-aviation-navy">
                      {bag.weight.toFixed(1)} kg
                    </td>
                    <td className="py-2.5 px-2">
                      <WeightStatusBadge status={bag.weightStatus} />
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-aviation-navy border border-aviation-border">
                        {bag.assignedLane || 'Pending'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingBag(bag);
                            setEditPassenger(bag.passengerName);
                            setEditWeight(bag.weight);
                          }}
                          className="p-1 rounded text-aviation-textSecondary hover:text-aviation-navy hover:bg-[#EAF3FC] transition-colors"
                          title="Edit Bag Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteLuggage(bag.id)}
                          className="p-1 rounded text-aviation-textSecondary hover:text-aviation-danger hover:bg-[#FCEBEB] transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLuggage.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-aviation-textMuted">
                      No baggage records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(editingBag)}
        onClose={() => setEditingBag(null)}
        title={`Edit Baggage Record — ${editingBag?.id}`}
        subtitle="Modify passenger details or measured scale weight"
      >
        {editingBag && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-aviation-navy mb-1">Passenger Name</label>
              <input
                type="text"
                value={editPassenger}
                onChange={(e) => setEditPassenger(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aviation-navy mb-1">Measured Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={editWeight}
                onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent font-mono font-bold"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditingBag(null)}
                className="px-3 py-1.5 text-xs text-aviation-textSecondary hover:bg-slate-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 text-xs bg-aviation-navy hover:bg-aviation-navyDark text-white rounded-lg transition-colors font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

