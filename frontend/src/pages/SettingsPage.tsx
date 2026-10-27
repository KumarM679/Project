import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import {
  Sliders,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  CloudLightning,
  ShieldAlert,
  Info
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { addToast, triggerRefresh, scenario, setScenario } = useApp();
  const [weights, setWeights] = useState({
    rainfall_weight: 0.35,
    drainage_deficit_weight: 0.30,
    blockage_weight: 0.15,
    impervious_slope_weight: 0.12,
    crowd_report_weight: 0.08,
  });

  const [thresholds, setThresholds] = useState({
    threshold_yellow: 30.0,
    threshold_orange: 55.0,
    threshold_red: 80.0,
    alert_dedup_hours: 3,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getSettings()
      .then((res) => {
        if (isMounted) {
          const map: Record<string, any> = {};
          res.settings.forEach((s) => {
            map[s.setting_key] = s.setting_value;
          });

          setWeights({
            rainfall_weight: parseFloat(map['rainfall_weight'] || '0.35'),
            drainage_deficit_weight: parseFloat(map['drainage_deficit_weight'] || '0.30'),
            blockage_weight: parseFloat(map['blockage_weight'] || '0.15'),
            impervious_slope_weight: parseFloat(map['impervious_slope_weight'] || '0.12'),
            crowd_report_weight: parseFloat(map['crowd_report_weight'] || '0.08'),
          });

          setThresholds({
            threshold_yellow: parseFloat(map['threshold_yellow'] || '30.0'),
            threshold_orange: parseFloat(map['threshold_orange'] || '55.0'),
            threshold_red: parseFloat(map['threshold_red'] || '80.0'),
            alert_dedup_hours: parseInt(map['alert_dedup_hours'] || '3'),
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Settings fetch error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, string> = {
        rainfall_weight: weights.rainfall_weight.toString(),
        drainage_deficit_weight: weights.drainage_deficit_weight.toString(),
        blockage_weight: weights.blockage_weight.toString(),
        impervious_slope_weight: weights.impervious_slope_weight.toString(),
        crowd_report_weight: weights.crowd_report_weight.toString(),
        threshold_yellow: thresholds.threshold_yellow.toString(),
        threshold_orange: thresholds.threshold_orange.toString(),
        threshold_red: thresholds.threshold_red.toString(),
        alert_dedup_hours: thresholds.alert_dedup_hours.toString(),
      };

      await api.updateSettings(payload);
      addToast('Hydrologic scoring weights and alert thresholds saved successfully!', 'success');
      triggerRefresh();
    } catch (err: any) {
      addToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setWeights({
      rainfall_weight: 0.35,
      drainage_deficit_weight: 0.30,
      blockage_weight: 0.15,
      impervious_slope_weight: 0.12,
      crowd_report_weight: 0.08,
    });
    setThresholds({
      threshold_yellow: 30.0,
      threshold_orange: 55.0,
      threshold_red: 80.0,
      alert_dedup_hours: 3,
    });
    addToast('Weights reset to baseline hydrologic standards', 'info');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="civic-card p-5 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-5 h-5 text-teal-300" />
            <h3 className="font-bold text-base text-white">Configurable Flood-Risk Scoring Engine Calibration</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Fine-tune constituent weights for rainfall intensity, drainage deficit, silt blockages, terrain slope,
            and citizen ground reports. Adjust multi-tier emergency alert thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Weight Sum Validation Pill */}
      <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
        Math.abs(totalWeight - 1.0) < 0.02
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <span className="flex items-center gap-2 font-medium">
          <Info className="w-4 h-4" />
          <span>Sum of Scoring Engine Weights: <strong>{(totalWeight * 100).toFixed(0)}%</strong></span>
        </span>
        <span className="text-[11px] font-semibold">
          {Math.abs(totalWeight - 1.0) < 0.02 ? 'Balanced Hydrologic Model (1.00)' : 'Weights do not sum to 100%'}
        </span>
      </div>

      {/* Scoring Engine Weights Sliders */}
      <div className="civic-card p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-teal-600" />
          <span>Constituent Risk Factor Weights (Rational Formula Calibration)</span>
        </h3>

        {/* 1. Rainfall Weight */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">1. Rainfall Load & Antecedent Saturation Weight</span>
            <span className="font-mono font-bold text-teal-700 text-sm">{Math.round(weights.rainfall_weight * 100)}%</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Current radar/AWS rainfall intensity (mm/hr) plus 1h and 3h antecedent precipitation memory.
          </p>
          <input
            type="range"
            min="0.10"
            max="0.60"
            step="0.01"
            value={weights.rainfall_weight}
            onChange={(e) => setWeights({ ...weights, rainfall_weight: parseFloat(e.target.value) })}
            className="w-full accent-teal-600 cursor-pointer"
          />
        </div>

        {/* 2. Drainage Deficit Weight */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">2. Drainage Capacity Deficit (Overtopping) Weight</span>
            <span className="font-mono font-bold text-rose-700 text-sm">{Math.round(weights.drainage_deficit_weight * 100)}%</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Excess runoff when effective precipitation load exceeds net carrying capacity of the stormwater conduit.
          </p>
          <input
            type="range"
            min="0.10"
            max="0.50"
            step="0.01"
            value={weights.drainage_deficit_weight}
            onChange={(e) => setWeights({ ...weights, drainage_deficit_weight: parseFloat(e.target.value) })}
            className="w-full accent-rose-600 cursor-pointer"
          />
        </div>

        {/* 3. Blockage & Silt Weight */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">3. Drain Silt & Solid Waste Blockage Penalty Weight</span>
            <span className="font-mono font-bold text-amber-700 text-sm">{Math.round(weights.blockage_weight * 100)}%</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Reduces outfall velocity based on recorded silt bed height (cm) and percentage of debris obstruction.
          </p>
          <input
            type="range"
            min="0.05"
            max="0.30"
            step="0.01"
            value={weights.blockage_weight}
            onChange={(e) => setWeights({ ...weights, blockage_weight: parseFloat(e.target.value) })}
            className="w-full accent-amber-600 cursor-pointer"
          />
        </div>

        {/* 4. Terrain & Slope Weight */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">4. Surface Imperviousness & Valley Depression Weight</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{Math.round(weights.impervious_slope_weight * 100)}%</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Reflects asphalt/concrete runoff coefficient and gravitational ponding risk in flat basins (&lt;0.8% slope).
          </p>
          <input
            type="range"
            min="0.05"
            max="0.25"
            step="0.01"
            value={weights.impervious_slope_weight}
            onChange={(e) => setWeights({ ...weights, impervious_slope_weight: parseFloat(e.target.value) })}
            className="w-full accent-slate-700 cursor-pointer"
          />
        </div>

        {/* 5. Crowdsource Citizen Weight */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">5. Crowdsourced Citizen Waterlog Confirmations Weight</span>
            <span className="font-mono font-bold text-purple-700 text-sm">{Math.round(weights.crowd_report_weight * 100)}%</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Boosts risk confidence based on the number and community upvotes of active ground observation reports.
          </p>
          <input
            type="range"
            min="0.02"
            max="0.20"
            step="0.01"
            value={weights.crowd_report_weight}
            onChange={(e) => setWeights({ ...weights, crowd_report_weight: parseFloat(e.target.value) })}
            className="w-full accent-purple-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Alert Generation Thresholds */}
      <div className="civic-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Configurable Alert Trigger Thresholds & Deduplication Window</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
            <span className="font-bold text-amber-800 block">Moderate Watch (Yellow)</span>
            <div className="flex items-center justify-between font-mono font-bold text-slate-800">
              <span>Score Threshold:</span>
              <span>&gt;= {thresholds.threshold_yellow}</span>
            </div>
            <input
              type="range"
              min="20"
              max="45"
              step="1"
              value={thresholds.threshold_yellow}
              onChange={(e) => setThresholds({ ...thresholds, threshold_yellow: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 space-y-2">
            <span className="font-bold text-orange-800 block">High Risk Advisory (Orange)</span>
            <div className="flex items-center justify-between font-mono font-bold text-slate-800">
              <span>Score Threshold:</span>
              <span>&gt;= {thresholds.threshold_orange}</span>
            </div>
            <input
              type="range"
              min="46"
              max="75"
              step="1"
              value={thresholds.threshold_orange}
              onChange={(e) => setThresholds({ ...thresholds, threshold_orange: Number(e.target.value) })}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
            <span className="font-bold text-rose-800 block">Critical Emergency Alert (Red)</span>
            <div className="flex items-center justify-between font-mono font-bold text-slate-800">
              <span>Score Threshold:</span>
              <span>&gt;= {thresholds.threshold_red}</span>
            </div>
            <input
              type="range"
              min="70"
              max="90"
              step="1"
              value={thresholds.threshold_red}
              onChange={(e) => setThresholds({ ...thresholds, threshold_red: Number(e.target.value) })}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Cooldown Deduplication Window */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 block">Alert Deduplication Cooldown Period</span>
            <span className="text-slate-500 text-[11px]">
              Suppresses identical automated alerts for the same street within this time window to prevent citizen alert fatigue.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="24"
              value={thresholds.alert_dedup_hours}
              onChange={(e) => setThresholds({ ...thresholds, alert_dedup_hours: Number(e.target.value) })}
              className="w-16 rounded border border-slate-300 p-1 font-bold text-center text-slate-800 bg-white"
            />
            <span className="text-slate-600 font-medium">Hours</span>
          </div>
        </div>
      </div>
    </div>
  );
};
