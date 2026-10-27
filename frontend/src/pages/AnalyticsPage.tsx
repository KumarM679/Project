import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Layers,
  MapPin,
  Clock,
  ShieldCheck,
  Building2,
  PieChart
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getAnalytics()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Analytics fetch error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Compiling multi-city hydro-informatics analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Historical Hotspot Recurrence Ranking Table */}
      <div className="civic-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Historical Urban Flood Recurrence Hotspots (Indian Demonstration Metros)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Vulnerability indices calibrated against monsoon flood history and catchment topography
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded border border-rose-200">
            Top Vulnerability Ranking
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Hotspot Corridor</th>
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3">Historical Floods / Year</th>
                <th className="py-2.5 px-3">Vulnerability Index (0-100)</th>
                <th className="py-2.5 px-3">Root Hydrologic Cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.historical_hotspots?.map((hs: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                      #{idx + 1}
                    </span>
                    <span>{hs.name}</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-teal-700">{hs.city}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {hs.historical_events_year} episodes / yr
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${hs.vulnerability_index}%` }}
                          className="bg-rose-600 h-full rounded-full"
                        />
                      </div>
                      <span className="font-mono font-bold text-rose-700">{hs.vulnerability_index}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs">{hs.primary_cause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Middle Row: Top Drainage Bottlenecks & City Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worst 5 Drainage Bottlenecks */}
        <div className="civic-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Severe Drainage Outfall Bottlenecks</span>
            </h3>
            <span className="text-[10px] text-slate-400">Ranked by Blockage %</span>
          </div>

          <div className="space-y-3">
            {data?.worst_bottlenecks?.map((bn: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 font-mono">{bn.drain_code} — {bn.street_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                    {bn.current_blockage_pct}% Blocked
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>{bn.city} • {bn.drain_type}</span>
                  <span>Silt Accumulation: <strong>{bn.silt_depth_cm} cm</strong></span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: `${bn.current_blockage_pct}%` }} className="bg-rose-500 h-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* City-Wise Monitored Network Comparison */}
        <div className="civic-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>City Telemetry & Capacity Comparison</span>
            </h3>
            <span className="text-[10px] text-slate-400">Multi-City Coverage</span>
          </div>

          <div className="space-y-3">
            {data?.city_stats?.map((cs: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{cs.city}</span>
                  <span className="font-semibold text-teal-700">{cs.street_count} Monitored Corridors</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mt-1">
                  <div>
                    Avg Drain Capacity: <strong className="font-mono text-slate-800">{Math.round(cs.avg_capacity || 45)} mm/h</strong>
                  </div>
                  <div>
                    Avg Blockage: <strong className="font-mono text-amber-700">{Math.round(cs.avg_blockage || 25)}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Resolution Breakdown */}
      <div className="civic-card p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Municipal Response Priority & Asset Deployment Distribution</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {data?.incident_priority_stats?.map((ps: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-center">
              <span className="text-xs font-bold text-slate-700 block mb-1">{ps.priority} Incidents</span>
              <div className="text-2xl font-black text-slate-900">{ps.count} Cases</div>
              <span className="text-[11px] text-teal-700 font-semibold mt-1 block">
                {ps.total_pumps || 0} Pumps Assigned
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
