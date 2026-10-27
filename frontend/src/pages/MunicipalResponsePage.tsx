import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { MunicipalResponse, Street } from '../types';
import {
  Truck,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Wrench,
  ShieldCheck,
  Send,
  Droplet
} from 'lucide-react';

interface MunicipalResponsePageProps {
  streetsList: Street[];
}

export const MunicipalResponsePage: React.FC<MunicipalResponsePageProps> = ({ streetsList }) => {
  const { activeCity, refreshTrigger, addToast } = useApp();
  const [incidents, setIncidents] = useState<MunicipalResponse[]>([]);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // New dispatch form state
  const [selectedStreet, setSelectedStreet] = useState<Street | null>(null);
  const [priority, setPriority] = useState('High');
  const [assignedTeam, setAssignedTeam] = useState('BBMP South QRT-Alpha');
  const [crewLead, setCrewLead] = useState('Asst. Exec. Engineer Praveen Kumar');
  const [pumps, setPumps] = useState(2);
  const [suction, setSuction] = useState(1);
  const [notes, setNotes] = useState('Deploying 2 mobile diesel pumps for underpass dewatering.');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getMunicipalResponses({ city: activeCity, priority: priorityFilter, status: statusFilter })
      .then((data) => {
        if (isMounted) {
          setIncidents(data.responses);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Municipal load error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCity, priorityFilter, statusFilter, refreshTrigger]);

  const handleUpdateStatus = async (id: number, status: string, notes?: string) => {
    try {
      await api.updateMunicipalResponse(id, { status, resolution_notes: notes });
      addToast(`Incident status updated to ${status}`, 'success');
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, status, resolution_notes: notes || inc.resolution_notes } : inc))
      );
    } catch (err: any) {
      addToast(`Failed to update incident: ${err.message}`, 'error');
    }
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStreet && streetsList.length > 0) {
      setSelectedStreet(streetsList[0]);
    }
    const st = selectedStreet || streetsList[0];

    try {
      const res = await api.createMunicipalResponse({
        street_id: st?.id,
        street_name: st?.name || 'Silk Board Junction',
        ward_name: st?.ward_name || 'Ward 176',
        city: st?.city || 'Bengaluru',
        priority,
        assigned_team: assignedTeam,
        crew_lead: crewLead,
        dewatering_pumps_deployed: pumps,
        suction_vehicles_count: suction,
        resolution_notes: notes,
      });

      addToast(`Emergency crew dispatched! Reference: ${res.incident_code}`, 'success');
      setIsDispatchModalOpen(false);
      // Reload
      const data = await api.getMunicipalResponses({ city: activeCity });
      setIncidents(data.responses);
    } catch (err: any) {
      addToast(`Dispatch failed: ${err.message}`, 'error');
    }
  };

  const activeDewateringCount = incidents.filter((i) => i.status === 'On-Site Dewatering').length;
  const totalPumps = incidents.reduce((acc, i) => acc + (i.dewatering_pumps_deployed || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="civic-card p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-white">Emergency Operations Triage & Resource Dispatch</h3>
          </div>
          <p className="text-xs text-slate-300">
            Real-time management of Quick Response Teams (QRT), heavy diesel dewatering pumps, and suction tanker trucks.
          </p>
        </div>

        <button
          onClick={() => {
            if (streetsList.length > 0) setSelectedStreet(streetsList[0]);
            setIsDispatchModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Dispatch Response Unit</span>
        </button>
      </div>

      {/* Equipment Resource Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="civic-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Active Dewatering Operations
          </span>
          <div className="text-2xl font-black text-blue-700">{activeDewateringCount} Hotspots</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Crews actively pumping floodwater</span>
        </div>

        <div className="civic-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            High-Capacity Pumps Deployed
          </span>
          <div className="text-2xl font-black text-teal-800 font-mono">{totalPumps} Diesel Pumps</div>
          <span className="text-[11px] text-teal-700 font-semibold mt-1 block">Combined 650,000 L/hr capacity</span>
        </div>

        <div className="civic-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Resolution SLA Benchmark
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono">42 Minutes</div>
          <span className="text-[11px] text-emerald-700 mt-1 block">Mean time to dewater arterial road</span>
        </div>
      </div>

      {/* Incidents Board */}
      <div className="civic-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-700">Priority Filter:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
            </select>

            <span className="font-bold text-slate-700 ml-2">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Dispatched">Dispatched</option>
              <option value="On-Site Dewatering">On-Site Dewatering</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <span className="text-xs text-slate-500">
            Total <strong>{incidents.length}</strong> Incidents Logged
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {incidents.map((inc) => (
            <div key={inc.id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.priority === 'Critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : (inc.priority === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-800')
                    }`}>
                      {inc.priority} Priority
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-600">{inc.incident_code}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.status === 'On-Site Dewatering'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : (inc.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900">{inc.street_name}</h4>
                  <div className="text-xs text-slate-500">{inc.city} • {inc.ward_name}</div>
                </div>

                <div className="text-right text-xs">
                  <div className="font-semibold text-slate-800">{inc.assigned_team}</div>
                  <div className="text-slate-400 text-[11px]">Lead: {inc.crew_lead}</div>
                  <div className="text-[10px] text-teal-700 font-mono mt-0.5 font-bold">
                    {inc.dewatering_pumps_deployed} Pumps ({inc.pump_capacity_hp}HP) • {inc.suction_vehicles_count} Suction Tankers
                  </div>
                </div>
              </div>

              {/* Progress & Notes */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold text-slate-900 block mb-0.5">Field Status & Notes:</span>
                {inc.resolution_notes}
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400">
                  Dispatched: {inc.dispatch_time} {inc.resolution_time && `• Cleared: ${inc.resolution_time}`}
                </span>

                <div className="flex items-center gap-2">
                  {inc.status === 'Dispatched' && (
                    <button
                      onClick={() => handleUpdateStatus(inc.id, 'On-Site Dewatering', 'Crews have set up mobile diesel suction hoses and started clearing flood ponding.')}
                      className="px-3 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 font-semibold"
                    >
                      Mark On-Site Dewatering
                    </button>
                  )}
                  {inc.status !== 'Completed' && inc.status !== 'Closed' && (
                    <button
                      onClick={() => handleUpdateStatus(inc.id, 'Completed', 'Floodwater successfully drained below curb level. Silt barrier cleared. Traffic flowing normally.')}
                      className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-xs"
                    >
                      Mark Dewatering Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dispatch Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0b1329] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-400" />
                <h4 className="font-bold text-sm">Dispatch Municipal Emergency Quick Response Team</h4>
              </div>
              <button onClick={() => setIsDispatchModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDispatch} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Flooded Street</label>
                <select
                  value={selectedStreet?.id || streetsList[0]?.id}
                  onChange={(e) => {
                    const st = streetsList.find((s) => s.id === Number(e.target.value));
                    if (st) setSelectedStreet(st);
                  }}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 bg-white"
                >
                  {streetsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.city}: {s.name} ({s.ward_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 bg-white"
                  >
                    <option value="Critical">🔴 Critical Emergency</option>
                    <option value="High">🟠 High Priority</option>
                    <option value="Medium">🟡 Medium Watch</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned QRT Wing</label>
                  <input
                    type="text"
                    value={assignedTeam}
                    onChange={(e) => setAssignedTeam(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dewatering Pumps (Units)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={pumps}
                    onChange={(e) => setPumps(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Suction Tankers</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={suction}
                    onChange={(e) => setSuction(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Crew Lead / Duty Engineer</label>
                <input
                  type="text"
                  value={crewLead}
                  onChange={(e) => setCrewLead(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dispatch Instructions & Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                >
                  Deploy Crew Immediately
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
