import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { DrainageRecord, Street } from '../types';
import { X, Layers, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';

interface DrainageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editRecord?: DrainageRecord | null;
  streetsList: Street[];
}

export const DrainageModal: React.FC<DrainageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editRecord,
  streetsList,
}) => {
  const { addToast } = useApp();
  const [streetId, setStreetId] = useState<number>(streetsList[0]?.id || 1);
  const [drainCode, setDrainCode] = useState('');
  const [drainType, setDrainType] = useState('RCC Box Storm Drain (Primary SWD)');
  const [nominalCap, setNominalCap] = useState(48.0);
  const [blockagePct, setBlockagePct] = useState(25.0);
  const [siltDepth, setSiltDepth] = useState(12.0);
  const [structuralStatus, setStructuralStatus] = useState('Good');
  const [desiltStatus, setDesiltStatus] = useState('Recent');
  const [maintenanceCrew, setMaintenanceCrew] = useState('Ward Desilting Wing QRT-2');
  const [outfall, setOutfall] = useState('Primary Outfall Stormwater Canal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editRecord) {
      setStreetId(editRecord.street_id);
      setDrainCode(editRecord.drain_code);
      setDrainType(editRecord.drain_type);
      setNominalCap(editRecord.nominal_capacity_mm_hr);
      setBlockagePct(editRecord.current_blockage_pct);
      setSiltDepth(editRecord.silt_depth_cm);
      setStructuralStatus(editRecord.structural_status);
      setDesiltStatus(editRecord.desilt_status);
      setMaintenanceCrew(editRecord.maintenance_crew);
      setOutfall(editRecord.discharge_outfall);
    } else {
      setStreetId(streetsList[0]?.id || 1);
      setDrainCode(`DRN-${Math.floor(100 + Math.random() * 900)}`);
      setDrainType('RCC Box Storm Drain (Primary SWD)');
      setNominalCap(48.0);
      setBlockagePct(25.0);
      setSiltDepth(12.0);
      setStructuralStatus('Good');
      setDesiltStatus('Recent');
      setMaintenanceCrew('Ward Desilting Wing QRT-2');
      setOutfall('Primary Outfall Stormwater Canal');
    }
  }, [editRecord, isOpen, streetsList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drainCode.trim()) {
      setError('Drain code is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editRecord) {
        await api.updateDrainage(editRecord.id, {
          nominal_capacity_mm_hr: nominalCap,
          current_blockage_pct: blockagePct,
          silt_depth_cm: siltDepth,
          structural_status: structuralStatus,
          desilt_status: desiltStatus,
          maintenance_crew: maintenanceCrew,
          discharge_outfall: outfall,
        });
        addToast(`Drainage record ${editRecord.drain_code} updated successfully`, 'success');
      } else {
        await api.createDrainage({
          street_id: streetId,
          drain_code: drainCode,
          drain_type: drainType,
          nominal_capacity_mm_hr: nominalCap,
          current_blockage_pct: blockagePct,
          silt_depth_cm: siltDepth,
          structural_status: structuralStatus,
          desilt_status: desiltStatus,
          maintenance_crew: maintenanceCrew,
          discharge_outfall: outfall,
        });
        addToast(`Drainage record ${drainCode} created!`, 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#0b1329] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {editRecord ? `Edit Drainage Record (${editRecord.drain_code})` : 'Register New Drainage Infrastructure Node'}
              </h3>
              <p className="text-xs text-slate-400">Specify conduit dimensions, sediment siltation, and choke levels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monitored Street Assignment <span className="text-rose-500">*</span>
              </label>
              <select
                value={streetId}
                disabled={!!editRecord}
                onChange={(e) => setStreetId(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-white focus:outline-none focus:border-teal-500 disabled:bg-slate-100"
              >
                {streetsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.city}: {s.name} ({s.ward_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Drain Infrastructure Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                readOnly={!!editRecord}
                value={drainCode}
                onChange={(e) => setDrainCode(e.target.value)}
                placeholder="e.g. DRN-BLR-012"
                className="w-full text-xs font-mono font-semibold rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500 read-only:bg-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Conduit / Drain Type
              </label>
              <select
                value={drainType}
                onChange={(e) => setDrainType(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-white focus:outline-none focus:border-teal-500"
              >
                <option value="RCC Box Storm Drain (Primary SWD)">RCC Box Storm Drain (Primary SWD)</option>
                <option value="Open Masonry Rajakaluve Channel">Open Masonry Rajakaluve Channel</option>
                <option value="Sump Pump & Catch Basin Grid">Sump Pump & Catch Basin Grid</option>
                <option value="Covered RCC Collector Drain">Covered RCC Collector Drain</option>
                <option value="Automated Sump Well & Dual Pumps">Automated Sump Well & Dual Pumps</option>
                <option value="Deep Micro-Tunnel Drain">Deep Micro-Tunnel Drain</option>
                <option value="Open Shoulder Swale Drain">Open Shoulder Swale Drain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Discharge Capacity (mm/hr runoff)
              </label>
              <input
                type="number"
                step="1"
                min="5"
                max="150"
                value={nominalCap}
                onChange={(e) => setNominalCap(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 font-semibold"
              />
            </div>
          </div>

          {/* Blockage Slider with Dynamic Feedback */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-600" />
                Current Blockage & Obstruction Severity
              </label>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                blockagePct >= 65 ? 'bg-rose-100 text-rose-700' : (blockagePct >= 35 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
              }`}>
                {blockagePct}% Blocked
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={blockagePct}
              onChange={(e) => setBlockagePct(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0% (Clean / Free Flow)</span>
              <span>50% (Substantial Choke)</span>
              <span>100% (Completely Impassable)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Silt Depth (cm)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="80"
                value={siltDepth}
                onChange={(e) => setSiltDepth(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Structural Status
              </label>
              <select
                value={structuralStatus}
                onChange={(e) => setStructuralStatus(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-white"
              >
                <option value="Good">Good (Intact walls)</option>
                <option value="Fair">Fair (Minor cracks)</option>
                <option value="Degraded">Degraded (Broken slabs)</option>
                <option value="Collapsed">Collapsed (Major failure)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Desilt Status
              </label>
              <select
                value={desiltStatus}
                onChange={(e) => setDesiltStatus(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-white font-semibold"
              >
                <option value="Recent">Recent (Cleaned &lt;30d)</option>
                <option value="Due">Due for Clearing</option>
                <option value="Overdue">Overdue (Critical)</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maintenance Crew Assigned
              </label>
              <input
                type="text"
                value={maintenanceCrew}
                onChange={(e) => setMaintenanceCrew(e.target.value)}
                placeholder="e.g. BBMP South QRT-3"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discharge Outfall Channel
              </label>
              <input
                type="text"
                value={outfall}
                onChange={(e) => setOutfall(e.target.value)}
                placeholder="e.g. Bellandur Lake Outfall Canal"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : (editRecord ? 'Save Changes' : 'Register Infrastructure')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
