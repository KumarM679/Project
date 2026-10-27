import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { Street } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import {
  Activity,
  Search,
  Filter,
  Layers,
  CloudRain,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  CheckCircle,
  BarChart,
  HelpCircle
} from 'lucide-react';

interface StreetRiskAnalysisPageProps {
  initialStreetId?: number;
}

export const StreetRiskAnalysisPage: React.FC<StreetRiskAnalysisPageProps> = ({ initialStreetId }) => {
  const { activeCity, refreshTrigger } = useApp();
  const [streets, setStreets] = useState<Street[]>([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(initialStreetId || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getStreets({ city: activeCity, search, risk: riskFilter })
      .then((data) => {
        if (isMounted) {
          setStreets(data.streets);
          if (initialStreetId && !expandedId) {
            setExpandedId(initialStreetId);
          } else if (!expandedId && data.streets.length > 0) {
            setExpandedId(data.streets[0].id);
          }
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load street risk analysis');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCity, search, riskFilter, refreshTrigger, initialStreetId]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Experimental Nowcasting Model (Hydro-Informatics Validation):</strong> Risk scores are
          dynamic hydrologic calculations combining live precipitation telemetry, antecedent accumulation, and net drainage
          carrying capacity. Scores are experimental estimates until validated against dense flood-event sensor grids.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by street name, ward, or city..."
            className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            <span>Risk Filter:</span>
          </div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Risk Levels ({streets.length})</option>
            <option value="red">🔴 Critical Severe (80-100)</option>
            <option value="orange">🟠 High Risk (55-79)</option>
            <option value="yellow">🟡 Moderate Risk (30-54)</option>
            <option value="green">🟢 Low Risk (0-29)</option>
          </select>
        </div>
      </div>

      {/* Street Risk Cards List */}
      <div className="space-y-4">
        {streets.map((street) => {
          const isExpanded = expandedId === street.id;
          const risk = street.risk_analysis;
          const drain = street.drainage;
          const rain = street.rainfall;

          return (
            <div
              key={street.id}
              className={`civic-card transition-all overflow-hidden ${
                isExpanded ? 'ring-2 ring-teal-500 shadow-md' : 'hover:border-slate-300'
              }`}
            >
              {/* Card Header Row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : street.id)}
                className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl font-bold text-sm font-mono flex items-center justify-center ${
                      risk?.severity === 'red'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : (risk?.severity === 'orange'
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : (risk?.severity === 'yellow' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'))
                    }`}
                  >
                    {Math.round(risk?.risk_score || 0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">{street.name}</h3>
                      {risk && (
                        <RiskBadge
                          severity={risk.severity}
                          score={risk.risk_score}
                          label={risk.risk_level}
                          size="sm"
                          showPulse={risk.severity === 'red'}
                        />
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-teal-700">{street.city}</span>
                      <span>•</span>
                      <span>{street.ward_name} ({street.ward_no})</span>
                      <span>•</span>
                      <span>Type: {street.road_type}</span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Summary Pills */}
                <div className="flex items-center gap-3 sm:gap-6 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">Rainfall Load</span>
                    <span className="font-bold font-mono text-slate-800">{risk?.effective_rainfall_mm_hr} mm/h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">Net Drainage</span>
                    <span className="font-bold font-mono text-slate-800">{risk?.effective_drainage_capacity_mm_hr} mm/h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">Blockage</span>
                    <span className={`font-bold font-mono ${
                      (risk?.effective_blockage_pct || 0) >= 50 ? 'text-rose-600' : 'text-slate-800'
                    }`}>
                      {risk?.effective_blockage_pct}%
                    </span>
                  </div>
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Factor Explainability Drawer */}
              {isExpanded && risk && (
                <div className="p-6 bg-slate-50/70 border-t border-slate-200 space-y-6">
                  {/* Action Summary Pill */}
                  <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
                    risk.severity === 'red'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : (risk.severity === 'orange'
                          ? 'bg-orange-50 border-orange-200 text-orange-800'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                  }`}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span><strong>Nowcast Guidance:</strong> {risk.action_summary}</span>
                  </div>

                  {/* Factor Explainability Breakdown Bars */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <BarChart className="w-3.5 h-3.5 text-teal-600" />
                      Constituent Risk Scoring Factor Breakdown (Weighted Contribution)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                      {/* Rainfall Factor */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex justify-between font-semibold text-slate-700 mb-1">
                          <span>Precipitation (35%)</span>
                          <span className="font-mono text-teal-700 font-bold">{risk.factors_breakdown.rainfall_component} pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(risk.factors_breakdown.rainfall_component / 35) * 100}%` }}
                            className="bg-teal-600 h-full"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Intensity: {rain?.current_intensity_mm_hr || 0}mm/h + Antecedent saturation
                        </span>
                      </div>

                      {/* Drainage Deficit Factor */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex justify-between font-semibold text-slate-700 mb-1">
                          <span>Capacity Deficit (30%)</span>
                          <span className="font-mono text-rose-700 font-bold">{risk.factors_breakdown.drainage_deficit_component} pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(risk.factors_breakdown.drainage_deficit_component / 30) * 100}%` }}
                            className="bg-rose-500 h-full"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Surplus: {risk.surplus_water_mm_hr} mm/hr overtopping
                        </span>
                      </div>

                      {/* Blockage Factor */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex justify-between font-semibold text-slate-700 mb-1">
                          <span>Silt & Blockage (15%)</span>
                          <span className="font-mono text-amber-700 font-bold">{risk.factors_breakdown.blockage_component} pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(risk.factors_breakdown.blockage_component / 15) * 100}%` }}
                            className="bg-amber-500 h-full"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {drain?.current_blockage_pct || 0}% debris + {drain?.silt_depth_cm || 0}cm silt
                        </span>
                      </div>

                      {/* Terrain Factor */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex justify-between font-semibold text-slate-700 mb-1">
                          <span>Impervious & Slope (12%)</span>
                          <span className="font-mono text-slate-700 font-bold">{risk.factors_breakdown.terrain_component} pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(risk.factors_breakdown.terrain_component / 12) * 100}%` }}
                            className="bg-slate-600 h-full"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Slope: {street.slope_gradient}% • Paved: {Math.round(street.surface_imperviousness * 100)}%
                        </span>
                      </div>

                      {/* Crowdsource Reports */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex justify-between font-semibold text-slate-700 mb-1">
                          <span>Citizen Signal (8%)</span>
                          <span className="font-mono text-purple-700 font-bold">{risk.factors_breakdown.crowdsource_component} pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(risk.factors_breakdown.crowdsource_component / 8) * 100}%` }}
                            className="bg-purple-600 h-full"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {street.citizen_reports_count || 0} active verified reports
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Natural Language Factors Behind Prediction */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Factor Explainability & Ground Hydrodynamic Analysis
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {risk.explanations.map((exp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-teal-600 font-bold mt-0.5">•</span>
                          <span>{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Infrastructure & Catchment Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">Drain Node Code</span>
                      <strong className="text-slate-800 font-mono">{drain?.drain_code || 'Unlinked'}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">Drain Conduit Type</span>
                      <strong className="text-slate-800 truncate block">{drain?.drain_type || 'Roadside Curb'}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">Desilt Status</span>
                      <strong className={`font-semibold ${drain?.desilt_status === 'Overdue' ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {drain?.desilt_status || 'Recent'}
                      </strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">Outfall Basin</span>
                      <strong className="text-slate-800 truncate block">{drain?.discharge_outfall || 'Natural Drain'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
