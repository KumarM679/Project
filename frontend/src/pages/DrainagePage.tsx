import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { DrainageRecord, Street } from '../types';
import {
  Layers,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface DrainagePageProps {
  onOpenCreateModal: () => void;
  onEditRecord: (record: DrainageRecord) => void;
}

export const DrainagePage: React.FC<DrainagePageProps> = ({
  onOpenCreateModal,
  onEditRecord,
}) => {
  const { activeCity, refreshTrigger, addToast } = useApp();
  const [records, setRecords] = useState<DrainageRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getDrainage({ city: activeCity, search, status: statusFilter })
      .then((data) => {
        if (isMounted) {
          setRecords(data.drainage_records);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Drainage load error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCity, search, statusFilter, refreshTrigger]);

  const handleDelete = async (id: number, code: string) => {
    if (!window.confirm(`Are you sure you want to delete drainage infrastructure record ${code}?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await api.deleteDrainage(id);
      addToast(res.message, 'success');
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      addToast(`Failed to delete record: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const overdueCount = records.filter((r) => r.desilt_status === 'Overdue').length;
  const criticalBlockageCount = records.filter((r) => r.current_blockage_pct >= 50).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Stat Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="civic-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Drainage Nodes
          </span>
          <div className="text-2xl font-black text-slate-900">{records.length} Drains</div>
          <span className="text-[11px] text-slate-500 mt-1 block">RCC Canals, Box Drains, Pits</span>
        </div>

        <div className="civic-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Critical Choke (&gt;50% Blocked)
          </span>
          <div className="text-2xl font-black text-rose-600">{criticalBlockageCount}</div>
          <span className="text-[11px] text-rose-600 font-semibold mt-1 block">Severe outfall restriction</span>
        </div>

        <div className="civic-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Overdue Desilting Maintenance
          </span>
          <div className="text-2xl font-black text-amber-700">{overdueCount} Nodes</div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">Desilting excavator required</span>
        </div>

        <div className="civic-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Average Design Capacity
          </span>
          <div className="text-2xl font-black text-teal-900 font-mono">
            {records.length > 0 ? Math.round(records.reduce((acc, r) => acc + r.nominal_capacity_mm_hr, 0) / records.length) : 0}
            <span className="text-xs font-normal text-slate-500 ml-1">mm/h</span>
          </div>
          <span className="text-[11px] text-teal-700 mt-1 block">Hydraulic standard</span>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="civic-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drain code, street, or type..."
            className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            <span>Desilt Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses ({records.length})</option>
            <option value="Overdue">⚠️ Overdue Only</option>
            <option value="Due">⏳ Due for Clearing</option>
            <option value="Recent">✅ Recent / Clean</option>
            <option value="In Progress">🔄 In Progress</option>
          </select>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Drain Infrastructure</span>
          </button>
        </div>
      </div>

      {/* Drainage Records Table */}
      <div className="civic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-3 px-4">Drain Code</th>
                <th className="py-3 px-4">Street & Location</th>
                <th className="py-3 px-4">Conduit Type</th>
                <th className="py-3 px-4">Nominal Cap.</th>
                <th className="py-3 px-4">Blockage & Silt</th>
                <th className="py-3 px-4">Structure</th>
                <th className="py-3 px-4">Desilt Status</th>
                <th className="py-3 px-4">Maintenance Crew</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => {
                const isOverdue = r.desilt_status === 'Overdue';
                const isBlocked = r.current_blockage_pct >= 50;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {r.drain_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.street_name || 'Assigned Street'}</div>
                      <div className="text-[11px] text-slate-500">{r.city} • {r.ward_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700">{r.drain_type}</span>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        Outfall: {r.discharge_outfall}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {r.nominal_capacity_mm_hr} mm/h
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isBlocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {r.current_blockage_pct}%
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {r.silt_depth_cm}cm silt
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        r.structural_status === 'Good'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : (r.structural_status === 'Fair'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-50 text-rose-700 border border-rose-200')
                      }`}>
                        {r.structural_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : (r.desilt_status === 'Due' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                      }`}>
                        {r.desilt_status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Inspected: {r.last_inspected}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium">{r.maintenance_crew}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditRecord(r)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                          title="Edit Drainage Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.drain_code)}
                          disabled={deletingId === r.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Delete Drainage Node"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
