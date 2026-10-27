import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { CitizenReport } from '../types';
import {
  Megaphone,
  PlusCircle,
  ThumbsUp,
  MapPin,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Camera,
  ExternalLink
} from 'lucide-react';

interface CitizenReportsPageProps {
  onOpenReportModal: () => void;
}

export const CitizenReportsPage: React.FC<CitizenReportsPageProps> = ({ onOpenReportModal }) => {
  const { activeCity, refreshTrigger, addToast, user } = useApp();
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [upvotingId, setUpvotingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getCitizenReports({ city: activeCity, status: statusFilter })
      .then((data) => {
        if (isMounted) {
          setReports(data.reports);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Reports load error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCity, statusFilter, refreshTrigger]);

  const handleUpvote = async (reportId: number) => {
    setUpvotingId(reportId);
    try {
      const res = await api.upvoteCitizenReport(reportId);
      addToast('Confirmed ground observation! (+1 upvote)', 'success');
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, upvotes: res.upvotes } : r))
      );
    } catch (err: any) {
      addToast(`Upvote failed: ${err.message}`, 'error');
    } finally {
      setUpvotingId(null);
    }
  };

  const handleStatusChange = async (reportId: number, newStatus: string) => {
    try {
      await api.updateReportStatus(reportId, newStatus);
      addToast(`Observation status updated to ${newStatus}`, 'success');
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      addToast(`Failed to update status: ${err.message}`, 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Action Header */}
      <div className="civic-card p-5 bg-teal-50 border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-base text-teal-950">Crowdsourced Ground Observations & Verification</h3>
          </div>
          <p className="text-xs text-teal-800">
            Citizen reports provide ground-truth validation for the hydrologic nowcasting model. High community upvotes
            automatically boost the location's risk confidence score.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Street Waterlogging</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="civic-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-teal-600" />
          <span>Triage Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Reports ({reports.length})</option>
            <option value="Verified & Queued">Verified & Queued</option>
            <option value="Crew Dispatched">Crew Dispatched</option>
            <option value="Cleared">Cleared</option>
          </select>
        </div>

        <span className="text-xs text-slate-500">
          Showing <strong>{reports.length}</strong> reports in {activeCity}
        </span>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const isHighDepth = report.water_depth.includes('Waist') || report.water_depth.includes('Impassable');

          return (
            <div key={report.id} className="civic-card overflow-hidden flex flex-col justify-between">
              <div>
                {/* Image Header */}
                {report.photo_url && (
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={report.photo_url}
                      alt={report.street_name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md ${
                        isHighDepth ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {report.water_depth}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      {report.report_code}
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{report.street_name}</h4>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-teal-600" />
                        <span>{report.city} • {report.ward_name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {report.report_type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{report.description}"
                  </p>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>By: <strong className="text-slate-700">{report.citizen_name}</strong></span>
                    <span className="font-mono text-[10px]">{report.phone_masked}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleUpvote(report.id)}
                  disabled={upvotingId === report.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-teal-700 border border-teal-200 hover:bg-teal-50 active:bg-teal-100 transition-colors shadow-xs"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-teal-600" />
                  <span>Confirm ({report.upvotes})</span>
                </button>

                {/* Role-based status switcher for responders */}
                {user.role !== 'citizen' ? (
                  <select
                    value={report.status}
                    onChange={(e) => handleStatusChange(report.id, e.target.value)}
                    className="text-[11px] font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 focus:outline-none"
                  >
                    <option value="Verified & Queued">Verified & Queued</option>
                    <option value="Crew Dispatched">Crew Dispatched</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                ) : (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    report.status === 'Crew Dispatched'
                      ? 'bg-blue-100 text-blue-800'
                      : (report.status === 'Cleared' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800')
                  }`}>
                    {report.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
