import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { FloodAlert } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import {
  BellRing,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Send,
  MessageSquare,
  AlertTriangle,
  Radio,
  FileCheck2
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { activeCity, refreshTrigger, addToast } = useApp();
  const [alerts, setAlerts] = useState<FloodAlert[]>([]);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewAlert, setPreviewAlert] = useState<FloodAlert | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getAlerts({ city: activeCity, severity: severityFilter, status: statusFilter })
      .then((data) => {
        if (isMounted) {
          setAlerts(data.alerts);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Alerts load error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCity, severityFilter, statusFilter, refreshTrigger]);

  const handleGenerateAlerts = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateAlerts();
      addToast(res.message, res.new_alerts_count > 0 ? 'warning' : 'info');
      // reload
      const data = await api.getAlerts({ city: activeCity, severity: severityFilter, status: statusFilter });
      setAlerts(data.alerts);
    } catch (err: any) {
      addToast(`Alert generation failed: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = async (alertId: number, newStatus: string) => {
    try {
      await api.updateAlertStatus(alertId, newStatus);
      addToast(`Alert status updated to ${newStatus}`, 'success');
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
      );
    } catch (err: any) {
      addToast(`Status update failed: ${err.message}`, 'error');
    }
  };

  const activeCount = alerts.filter((a) => a.status === 'Active').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Deduplication Info & Rule Trigger */}
      <div className="civic-card p-5 bg-gradient-to-r from-slate-900 to-navy-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <h3 className="font-bold text-base text-white">Rule-Based Flood Alert Generator & Deduplication Engine</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Continuously monitors hydrodynamic surplus. Pushes location-specific alerts when risk score crosses configured
            thresholds. Intelligent deduplication keys prevent redundant notification spam to citizens and emergency units.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateAlerts}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 transition-colors shadow-lg shadow-rose-900/30 disabled:opacity-50"
          >
            <BellRing className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Evaluating Hydrology...' : 'Evaluate & Generate Alerts'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Status Toolbar */}
      <div className="civic-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-bold text-slate-700">Filter Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Severities ({alerts.length})</option>
            <option value="red">🔴 Critical Severe Only</option>
            <option value="orange">🟠 High Advisory Only</option>
            <option value="yellow">🟡 Moderate Watch</option>
          </select>

          <span className="font-bold text-slate-700 ml-2">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active ({activeCount})</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Deduplication Window: <strong>3 Hours</strong> per Ward</span>
        </div>
      </div>

      {/* Alerts Cards List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="civic-card p-8 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-800">No Active Flood Alerts Matching Filters</h4>
            <p className="text-xs mt-1">Streets in this operational zone are currently operating within safe drainage thresholds.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'red';
            return (
              <div
                key={alert.id}
                className={`civic-card p-5 border-l-4 transition-all ${
                  isCritical
                    ? 'border-l-rose-600 bg-rose-50/20'
                    : (alert.severity === 'orange' ? 'border-l-orange-500 bg-orange-50/20' : 'border-l-amber-400')
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl font-mono font-bold text-xs flex items-center justify-center ${
                        isCritical ? 'bg-rose-100 text-rose-800' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {Math.round(alert.risk_score)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <RiskBadge
                          severity={alert.severity}
                          score={alert.risk_score}
                          size="sm"
                          showPulse={isCritical && alert.status === 'Active'}
                        />
                        <span className="text-xs font-mono font-bold text-slate-600">
                          {alert.alert_code}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          alert.status === 'Active'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : (alert.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800')
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900">{alert.title}</h4>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {alert.city} • {alert.ward_name} • Audience: {alert.target_audience}
                      </div>
                    </div>
                  </div>

                  {/* Deduplication Key Tag */}
                  <div className="text-right">
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 block truncate">
                      Dedup: {alert.deduplication_key}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Issued: {alert.timestamp}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs text-slate-700 font-medium my-2.5 bg-white p-3 rounded-lg border border-slate-200">
                  {alert.message}
                </p>

                {/* Recommendation Pill */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 mb-4 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-teal-900 font-semibold">Civic Advisory & Recommendation:</strong>{' '}
                    {alert.recommendation}
                  </div>
                </div>

                {/* Actions & Citizen Notification Preview */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewAlert(alert)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                      <span>Citizen SMS/WhatsApp Preview</span>
                    </button>
                  </div>

                  {/* Status update buttons */}
                  <div className="flex items-center gap-2">
                    {alert.status === 'Active' && (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, 'Acknowledged')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        Acknowledge Alert
                      </button>
                    )}
                    {alert.status !== 'Dispatched' && alert.status !== 'Resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, 'Dispatched')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        Dispatch QRT Crew
                      </button>
                    )}
                    {alert.status !== 'Resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, 'Resolved')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        Mark Water Receded / Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Citizen SMS / WhatsApp Advisory Preview Modal */}
      {previewAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0b1329] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-teal-400" />
                <h4 className="font-bold text-sm">Citizen Cell Broadcast Advisory (Simulated)</h4>
              </div>
              <button onClick={() => setPreviewAlert(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs leading-relaxed space-y-2 border border-slate-800">
                <div className="text-rose-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>[GOVT OF {previewAlert.city.toUpperCase()} - NDMA NOWCAST]</span>
                </div>
                <div className="font-semibold text-white">
                  FLOOD RISK ALERT: {previewAlert.street_name}
                </div>
                <div className="text-slate-300">
                  Heavy rainfall & stormwater drain overtopping detected in {previewAlert.ward_name}.
                  Severity: {previewAlert.severity.toUpperCase()} (Score: {Math.round(previewAlert.risk_score)}/100).
                </div>
                <div className="text-teal-300">
                  Advisory: {previewAlert.recommendation}
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                  Helpline: 1533 / 1077 • JalDrishti Citizen Portal
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                Targeted Audience: Citizens with registered mobile numbers within 1.5km geofence radius of {previewAlert.street_name}.
              </div>

              <button
                onClick={() => setPreviewAlert(null)}
                className="w-full py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
