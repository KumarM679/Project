import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  CloudLightning,
  RefreshCw,
  BellRing,
  PlusCircle,
  Radio,
  SlidersHorizontal,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onOpenReportModal: () => void;
  onOpenDrainageModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenReportModal,
  onOpenDrainageModal,
}) => {
  const { activeCity, scenario, setScenario, triggerRefresh, addToast, user } = useApp();
  const [isApplyingScenario, setIsApplyingScenario] = useState(false);
  const [isEvaluatingAlerts, setIsEvaluatingAlerts] = useState(false);

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Command Dashboard', subtitle: 'Real-time citywide rainfall, drainage deficit, and street inundation intelligence' },
    rainfall: { title: 'Rainfall Telemetry & Accumulation', subtitle: 'Automated Weather Stations (AWS), Doppler radar nowcasts, and 24h precipitation trends' },
    'flood-map': { title: 'Interactive GIS Flood Risk Map', subtitle: 'Street-level hydrodynamic risk contours, drainage nodes, and crowdsourced hazard pins' },
    'risk-analysis': { title: 'Street-Level Risk Analysis & Explainability', subtitle: 'Hydrologic rational formula breakdown: rainfall surplus vs effective drainage conveyance' },
    drainage: { title: 'Stormwater Drainage Network Management', subtitle: 'RCC box canals, catch basins, silt choke levels, and desilting maintenance registry' },
    alerts: { title: 'Flood Risk Alerts & Deduplication Engine', subtitle: 'Configurable multi-tier warnings, cooldown deduplication, and citizen advisory dispatches' },
    'citizen-reports': { title: 'Crowdsourced Citizen Flood Reports', subtitle: 'Community waterlogging verification, water depth observations, and geolocated photo evidence' },
    'municipal-response': { title: 'Municipal Emergency Response Triage', subtitle: 'Quick Response Team (QRT) assignments, mobile dewatering pumps, and clearance tracking' },
    analytics: { title: 'Hydro-Informatics & Historical Analytics', subtitle: 'Rainfall-runoff correlation, repeat flood hotspots, and municipal clearance SLAs' },
    'audit-logs': { title: 'System Activity & Operations Audit Trail', subtitle: 'Immutable tamper-evident record of all alert triggers, crew dispatches, and parameter edits' },
    settings: { title: 'Hydrologic Scoring Engine Weights & Thresholds', subtitle: 'Calibrate rainfall load, drainage deficit, blockage penalties, and simulation scenarios' },
    methodology: { title: 'Scientific Methodology & Hydrologic Formula', subtitle: 'Empirical rational runoff equation, explainability factor weights, and validation caveats' },
    'firebase-specs': { title: 'Firebase Authentication & Cloud Firestore Readiness', subtitle: 'Cloud migration architecture, role-based security rules, and SDK integration contracts' },
  };

  const handleScenarioChange = async (newScenario: 'dry' | 'moderate_shower' | 'monsoon_heavy' | 'cloudburst') => {
    setIsApplyingScenario(true);
    try {
      const res = await api.applyScenario(newScenario);
      setScenario(newScenario);
      addToast(res.description, 'success');
      triggerRefresh();
    } catch (err: any) {
      addToast(`Failed to apply scenario: ${err.message}`, 'error');
    } finally {
      setIsApplyingScenario(false);
    }
  };

  const handleTriggerAlertEngine = async () => {
    setIsEvaluatingAlerts(true);
    try {
      const res = await api.generateAlerts();
      addToast(res.message, res.new_alerts_count > 0 ? 'warning' : 'info');
      triggerRefresh();
    } catch (err: any) {
      addToast(`Alert generation failed: ${err.message}`, 'error');
    } finally {
      setIsEvaluatingAlerts(false);
    }
  };

  const currentInfo = tabTitles[currentTab] || { title: 'Urban Flood Nowcasting', subtitle: 'Civic-tech flood risk prediction' };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-6 py-3.5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Page Title & Breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-0.5">
            <span className="text-teal-700 font-semibold">{activeCity}</span>
            <span>/</span>
            <span className="text-slate-700 font-medium capitalize">{currentTab.replace('-', ' ')}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {currentInfo.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            {currentInfo.subtitle}
          </p>
        </div>

        {/* Action Controls & Scenario Simulator */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scenario Simulator Pill */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-600 px-2 flex items-center gap-1">
              <CloudLightning className="w-3.5 h-3.5 text-amber-600" />
              Scenario:
            </span>
            <select
              value={scenario}
              disabled={isApplyingScenario}
              onChange={(e) => handleScenarioChange(e.target.value as any)}
              className="text-xs font-semibold bg-white rounded-md px-2 py-1 text-slate-800 border border-slate-200 shadow-xs focus:outline-none focus:border-teal-500 cursor-pointer disabled:opacity-50"
            >
              <option value="dry">☀️ Dry Weather (0 mm/h)</option>
              <option value="moderate_shower">🌦️ Moderate Rain (24 mm/h)</option>
              <option value="monsoon_heavy">🌧️ Heavy Monsoon (58 mm/h)</option>
              <option value="cloudburst">⛈️ Cloudburst Event (98.5 mm/h)</option>
            </select>
          </div>

          {/* Quick Alert Evaluation Engine Button */}
          <button
            onClick={handleTriggerAlertEngine}
            disabled={isEvaluatingAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:bg-rose-200 transition-colors shadow-xs disabled:opacity-50"
            title="Evaluate hydrologic risk across all monitored streets and issue deduplicated alerts"
          >
            <BellRing className={`w-3.5 h-3.5 text-rose-600 ${isEvaluatingAlerts ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Evaluate Nowcast</span>
          </button>

          {/* Report Waterlogging Quick Action */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-xs shadow-teal-700/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Waterlog</span>
          </button>

          {/* Refresh Data */}
          <button
            onClick={() => {
              triggerRefresh();
              addToast('Refreshed telemetry & calculations', 'info');
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Refresh Live Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
