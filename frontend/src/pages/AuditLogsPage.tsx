import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ActivityLog } from '../types';
import { useApp } from '../context/AppContext';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Terminal,
  UserCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { refreshTrigger, addToast } = useApp();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getActivityLogs(80)
      .then((res) => {
        if (isMounted) {
          setLogs(res.logs);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Audit logs error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      search === '' ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.event_type.toLowerCase().includes(search.toLowerCase());

    const matchesEvent = eventFilter === 'all' || log.event_type === eventFilter;
    return matchesSearch && matchesEvent;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="civic-card p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base text-white">Immutable Operations & Decision Audit Trail</h3>
          </div>
          <p className="text-xs text-slate-300">
            Cryptographically verifiable audit log tracking every algorithmic nowcast trigger, threshold calibration,
            citizen submission, and municipal crew dispatch for civic accountability.
          </p>
        </div>

        <div className="text-right text-xs">
          <span className="font-mono text-teal-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            {logs.length} Total System Events
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event type, description, or actor..."
            className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            <span>Event Category:</span>
          </div>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="all">All Events ({logs.length})</option>
            <option value="ALERT_GENERATED">Alerts Generated</option>
            <option value="CREW_DISPATCHED">Crew Dispatched</option>
            <option value="CITIZEN_REPORT_SUBMITTED">Citizen Reports</option>
            <option value="DRAIN_RECORD_CREATED">Drainage Created/Updated</option>
            <option value="SETTINGS_UPDATED">Settings/Weights Calibrated</option>
            <option value="SIMULATION_SCENARIO_CHANGED">Simulation Scenarios</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="civic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Event Description</th>
                <th className="py-3 px-4">Source IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => {
                const isAlert = log.event_type.includes('ALERT');
                const isDispatch = log.event_type.includes('DISPATCH');

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAlert
                          ? 'bg-rose-100 text-rose-800'
                          : (isDispatch ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800')
                      }`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-xs">
                      <div className="font-bold text-slate-900">{log.actor}</div>
                      <span className="text-[10px] text-teal-700 font-semibold">{log.role}</span>
                    </td>
                    <td className="py-3 px-4 font-sans text-xs text-slate-700 max-w-md">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.ip_address}
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
