import React, { useState } from 'react';
import {
  PlaneTakeoff,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { FlightStatusBadge } from '../components/common/Badge';
import { Flight, FlightStatus } from '../types';

export const FlightManagement: React.FC = () => {
  const { flights, settings, addFlight, updateFlight, deleteFlight } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);

  // Form state
  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('Air India');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('14:00');
  const [gateNumber, setGateNumber] = useState('G-10');
  const [assignedLane, setAssignedLane] = useState('Lane 01');
  const [status, setStatus] = useState<FlightStatus>('Scheduled');
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingFlight(null);
    setFlightNumber(`AI ${Math.floor(600 + Math.random() * 300)}`);
    setAirline('Air India');
    setDestination('Goa');
    setDepartureTime('18:00');
    setGateNumber('G-06');
    setAssignedLane('Lane 01');
    setStatus('Scheduled');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (flight: Flight) => {
    setEditingFlight(flight);
    setFlightNumber(flight.flightNumber);
    setAirline(flight.airline);
    setDestination(flight.destination);
    setDepartureTime(flight.departureTime);
    setGateNumber(flight.gateNumber);
    setAssignedLane(flight.assignedLane);
    setStatus(flight.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!flightNumber.trim() || !destination.trim()) {
      setFormError('Flight number and destination are required.');
      return;
    }

    if (editingFlight) {
      await updateFlight(editingFlight.id, {
        flightNumber: flightNumber.trim().toUpperCase(),
        airline: airline.trim(),
        destination: destination.trim(),
        departureTime,
        gateNumber,
        assignedLane,
        status,
      });
      setIsModalOpen(false);
    } else {
      const res = await addFlight({
        flightNumber: flightNumber.trim().toUpperCase(),
        airline: airline.trim(),
        destination: destination.trim(),
        departureTime,
        gateNumber,
        assignedLane,
        status,
      });

      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res.message);
      }
    }
  };

  const filteredFlights = flights.filter((f) => {
    const matchesSearch =
      f.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.airline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.gateNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Button */}
      <div className="bg-white p-5 rounded-2xl border border-aviation-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-aviation-navy">Flight Manifest & Chute Allocation</h2>
            <span className="text-xs font-mono font-bold bg-[#EAF3FC] text-aviation-accent px-2.5 py-0.5 rounded-full">
              ACTIVE MANIFEST
            </span>
          </div>
          <p className="text-xs text-aviation-textSecondary mt-0.5">
            Configure scheduled flights, gate assignments, and dedicated conveyor sorting chutes (Lanes 01-05).
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-aviation-navy hover:bg-aviation-navyDark text-white transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Flight
        </button>
      </div>

      {/* Main Flights Table Card */}
      <Card
        title="Scheduled Commercial Flights"
        subtitle={`Managing ${flights.length} flights scheduled for departure`}
      >
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-aviation-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flight number, destination, gate, or airline..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-aviation-textSecondary font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-aviation-border rounded-lg px-2.5 py-1.5 bg-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Boarding">Boarding</option>
              <option value="Departed">Departed</option>
              <option value="Delayed">Delayed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-aviation-border text-aviation-textSecondary font-semibold">
                <th className="pb-3 px-3">Flight No.</th>
                <th className="pb-3 px-3">Airline</th>
                <th className="pb-3 px-3">Route (Origin – Destination)</th>
                <th className="pb-3 px-3">Departure</th>
                <th className="pb-3 px-3">Gate</th>
                <th className="pb-3 px-3">Assigned Chute</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aviation-border">
              {filteredFlights.map((flight) => (
                <tr key={flight.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-aviation-navy text-sm">
                    {flight.flightNumber}
                    {flight.isDemo && (
                      <span className="ml-1 text-[9px] bg-slate-100 text-slate-500 font-sans px-1 py-0.5 rounded">
                        DEMO
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-aviation-text font-medium">{flight.airline}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-aviation-navy">Chennai (MAA)</span>
                    <span className="text-aviation-textMuted mx-1.5">→</span>
                    <span className="font-bold text-aviation-accent">{flight.destination}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-aviation-navy">
                    {flight.departureTime}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-aviation-text">
                    {flight.gateNumber}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-aviation-lightBlue text-aviation-accent border border-[#C5DFF8]">
                      {flight.assignedLane}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <FlightStatusBadge status={flight.status} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(flight)}
                        className="p-1 rounded text-aviation-textSecondary hover:text-aviation-navy hover:bg-[#EAF3FC] transition-colors"
                        title="Edit Flight Manifest"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteFlight(flight.id)}
                        className="p-1 rounded text-aviation-textSecondary hover:text-aviation-danger hover:bg-[#FCEBEB] transition-colors"
                        title="Delete Flight"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFlights.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-aviation-textMuted">
                    No flights found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Flight Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFlight ? `Edit Flight — ${editingFlight.flightNumber}` : 'Add New Flight to Manifest'}
        subtitle="Manage airline flight scheduling, boarding gates, and assigned sorting lanes"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-[#FCEBEB] text-[#DC4545] border border-[#F8C6C6] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-aviation-navy mb-1">Flight Number *</label>
              <input
                type="text"
                required
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="e.g. AI 602"
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border font-mono font-bold text-aviation-navy focus:outline-none focus:border-aviation-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aviation-navy mb-1">Airline *</label>
              <input
                type="text"
                required
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                placeholder="e.g. Air India"
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-aviation-navy mb-1">Destination *</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Goa"
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border focus:outline-none focus:border-aviation-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aviation-navy mb-1">Departure Time *</label>
              <input
                type="text"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="15:30"
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border font-mono focus:outline-none focus:border-aviation-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-aviation-navy mb-1">Gate Number</label>
              <input
                type="text"
                value={gateNumber}
                onChange={(e) => setGateNumber(e.target.value)}
                placeholder="G-12"
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border font-mono focus:outline-none focus:border-aviation-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aviation-navy mb-1">Sorting Chute</label>
              <select
                value={assignedLane}
                onChange={(e) => setAssignedLane(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border bg-white focus:outline-none focus:border-aviation-accent"
              >
                {settings.lanesConfig.map((l) => (
                  <option key={l.laneId} value={l.laneId}>
                    {l.laneId} ({l.destination})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-aviation-navy mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FlightStatus)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-aviation-border bg-white focus:outline-none focus:border-aviation-accent"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Boarding">Boarding</option>
                <option value="Departed">Departed</option>
                <option value="Delayed">Delayed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-aviation-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-2 text-xs text-aviation-textSecondary hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs bg-aviation-navy hover:bg-aviation-navyDark text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              {editingFlight ? 'Update Flight' : 'Add Flight'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

