import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { DashboardStats, Street } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import {
  CloudRain,
  MapPin,
  AlertTriangle,
  Layers,
  BellRing,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Truck,
  Droplet,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string, streetId?: number) => void;
  onOpenReportModal: () => void;
  onOpenDrainageModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenReportModal,
  onOpenDrainageModal,
}) => {
  const { activeCity, refreshTrigger, addToast } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getDashboardStats(activeCity)
      .then((data) => {
        if (isMounted) {
          setStats(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch dashboard data');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCity, refreshTrigger]);

  if (loading && !stats) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Computing street-level nowcasting telemetry...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 max-w-xl mx-auto text-center">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="font-bold text-base mb-1">Telemetry Fetch Error</h3>
          <p className="text-xs text-rose-600 mb-4">{error || 'Unable to connect to nowcasting engine.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Alert Banner if High-Risk Exists */}
      {stats.severe_risk_count > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 via-rose-100/70 to-amber-50 border border-rose-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                CRITICAL INUNDATION DETECTED: {stats.severe_risk_count} Monitored Streets in Severe Band
              </h4>
              <p className="text-xs text-rose-700 leading-tight">
                Simulated precipitation loads exceed drainage conduit discharge thresholds. Emergency dewatering deployed.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('alerts')}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
            >
              View Active Alerts ({stats.active_alerts_count})
            </button>
            <button
              onClick={() => onNavigate('flood-map')}
              className="px-3 py-1.5 rounded-lg bg-white text-rose-800 border border-rose-300 text-xs font-semibold hover:bg-rose-50 transition-colors"
            >
              View Map
            </button>
          </div>
        </div>
      )}

      {/* Top 5 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Monitored Streets */}
        <div className="civic-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monitored Streets</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.total_monitored_streets}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>{activeCity}</span>
              <span className="text-teal-700 font-semibold font-mono">100% telemetry</span>
            </div>
          </div>
        </div>

        {/* Current Rainfall */}
        <div className="civic-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Peak Rainfall</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <CloudRain className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-teal-900 font-mono">
              {stats.max_rainfall_mm_hr} <span className="text-xs font-normal text-slate-500">mm/h</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>City Avg: {stats.average_rainfall_mm_hr} mm/h</span>
              <span className="text-teal-700 font-semibold">Doppler Live</span>
            </div>
          </div>
        </div>

        {/* High Risk Streets */}
        <div className="civic-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High Risk Zones</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">
              {stats.high_risk_locations_count}
              <span className="text-xs font-medium text-slate-500 ml-1.5">
                ({stats.severe_risk_count} Critical)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Overtopping expected</span>
              <span className="text-rose-600 font-bold">Action Needed</span>
            </div>
          </div>
        </div>

        {/* Blocked Drains */}
        <div className="civic-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Blocked Drains</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700">{stats.blocked_drains_count}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Silt / Debris &gt;50%</span>
              <button
                onClick={() => onNavigate('drainage')}
                className="text-amber-800 font-bold hover:underline"
              >
                Inspect
              </button>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="civic-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Alerts</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <BellRing className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.active_alerts_count}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Deduplicated feed</span>
              <span className="text-teal-700 font-semibold">Broadcasting</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Risk Band Distribution Bar & Rainfall Hydrology Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Breakdown Card */}
        <div className="civic-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Street Risk Level Distribution</h3>
              <p className="text-xs text-slate-500">Hydrodynamic classification based on rainfall intensity vs net drain throughput</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {stats.total_monitored_streets} Streets Total
            </span>
          </div>

          {/* Stacked Percentage Bar */}
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex mb-4 shadow-inner">
            <div
              style={{ width: `${(stats.severe_risk_count / Math.max(1, stats.total_monitored_streets)) * 100}%` }}
              className="bg-rose-600 transition-all duration-500"
              title={`Severe Risk: ${stats.severe_risk_count}`}
            />
            <div
              style={{ width: `${((stats.high_risk_locations_count - stats.severe_risk_count) / Math.max(1, stats.total_monitored_streets)) * 100}%` }}
              className="bg-orange-500 transition-all duration-500"
              title={`High Risk: ${stats.high_risk_locations_count - stats.severe_risk_count}`}
            />
            <div
              style={{ width: `${(stats.moderate_risk_count / Math.max(1, stats.total_monitored_streets)) * 100}%` }}
              className="bg-amber-400 transition-all duration-500"
              title={`Moderate Risk: ${stats.moderate_risk_count}`}
            />
            <div
              style={{ width: `${(stats.low_risk_count / Math.max(1, stats.total_monitored_streets)) * 100}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Low Risk: ${stats.low_risk_count}`}
            />
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                Severe / Critical
              </div>
              <div className="text-lg font-black text-rose-900 mt-1">{stats.severe_risk_count}</div>
              <div className="text-[11px] text-rose-700">&gt;45cm deep, impassable</div>
            </div>

            <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-1.5 font-bold text-orange-800">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                High Risk
              </div>
              <div className="text-lg font-black text-orange-900 mt-1">
                {stats.high_risk_locations_count - stats.severe_risk_count}
              </div>
              <div className="text-[11px] text-orange-700">15–30cm waterlogging</div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Moderate Risk
              </div>
              <div className="text-lg font-black text-amber-900 mt-1">{stats.moderate_risk_count}</div>
              <div className="text-[11px] text-amber-700">Curbside pooling</div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Low Risk
              </div>
              <div className="text-lg font-black text-emerald-900 mt-1">{stats.low_risk_count}</div>
              <div className="text-[11px] text-emerald-700">Discharge within normal</div>
            </div>
          </div>
        </div>

        {/* Quick Operations Actions Card */}
        <div className="civic-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Municipal Response Quick Actions</h3>
            <p className="text-xs text-slate-500 mb-4">Command triggers for ward engineers & emergency dispatchers</p>
            <div className="space-y-2.5">
              <button
                onClick={onOpenReportModal}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Droplet className="w-4 h-4 text-teal-700" />
                  <div>
                    <div className="text-xs font-bold">Report Street Waterlogging</div>
                    <div className="text-[11px] text-teal-700">Crowdsource observations with water depth</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-teal-600" />
              </button>

              <button
                onClick={onOpenDrainageModal}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-slate-600" />
                  <div>
                    <div className="text-xs font-bold">Register / Edit Drainage Node</div>
                    <div className="text-[11px] text-slate-500">Update silt depth & blockage percentage</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('municipal-response')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-blue-700" />
                  <div>
                    <div className="text-xs font-bold">Deploy Dewatering Pumps</div>
                    <div className="text-[11px] text-blue-700">Assign Quick Response Teams to hot zones</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              Nowcast Refresh: 5m cycle
            </span>
            <span className="font-semibold text-teal-700">Experimental Civic Model</span>
          </div>
        </div>
      </div>

      {/* High-Risk Locations Spotlight Table */}
      <div className="civic-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>High & Severe Risk Locations Spotlight</span>
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Priority Triage
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Ranked by composite nowcasting score (precipitation load + drain choke + terrain depression)
            </p>
          </div>
          <button
            onClick={() => onNavigate('risk-analysis')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Streets ({stats.total_monitored_streets})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-2.5 px-3">Street / Junction</th>
                <th className="py-2.5 px-3">City & Ward</th>
                <th className="py-2.5 px-3">Rain Load</th>
                <th className="py-2.5 px-3">Effective Drain</th>
                <th className="py-2.5 px-3">Blockage %</th>
                <th className="py-2.5 px-3">Risk Band</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.high_risk_spotlight.map((street) => {
                const risk = street.computed_risk;
                return (
                  <tr key={street.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{street.name}</div>
                      <div className="text-[11px] text-slate-500">{street.road_type} • Slope: {street.slope_gradient}%</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-700">{street.city}</div>
                      <div className="text-[11px] text-slate-500">{street.ward_name} ({street.ward_no})</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {risk?.effective_rainfall_mm_hr} mm/h
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {risk?.effective_drainage_capacity_mm_hr} mm/h
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        (risk?.effective_blockage_pct || 0) >= 60 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {risk?.effective_blockage_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {risk && (
                        <RiskBadge
                          severity={risk.severity}
                          score={risk.risk_score}
                          label={risk.risk_level}
                          showPulse={risk.severity === 'red'}
                        />
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('risk-analysis', street.id)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 transition-colors"
                      >
                        Explain Factors
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Recent Incidents & Citizen Crowd Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Municipal Incidents */}
        <div className="civic-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-700" />
              Active Municipal QRT Dispatches
            </h3>
            <button
              onClick={() => onNavigate('municipal-response')}
              className="text-xs text-teal-700 font-semibold hover:underline"
            >
              View Board
            </button>
          </div>
          <div className="space-y-3">
            {stats.recent_incidents.map((inc) => (
              <div key={inc.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{inc.street_name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inc.status === 'On-Site Dewatering'
                      ? 'bg-blue-100 text-blue-800'
                      : (inc.status === 'Dispatched' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                  }`}>
                    {inc.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">{inc.resolution_notes}</p>
                <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                  <span>Assigned: {inc.assigned_team} ({inc.dewatering_pumps_deployed} pumps)</span>
                  <span>Lead: {inc.crew_lead}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Citizen Reports */}
        <div className="civic-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              Recent Ground Observations (Crowdsourced)
            </h3>
            <button
              onClick={() => onNavigate('citizen-reports')}
              className="text-xs text-teal-700 font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {stats.recent_citizen_reports.map((rep) => (
              <div key={rep.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                {rep.photo_url && (
                  <img
                    src={rep.photo_url}
                    alt="Waterlogging condition"
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-slate-200"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="font-bold text-slate-900 truncate">{rep.street_name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex-shrink-0">
                      {rep.water_depth}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">{rep.description}</p>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>By: {rep.citizen_name}</span>
                    <span className="font-semibold text-teal-700">▲ {rep.upvotes} Confirmations</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
