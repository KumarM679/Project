import React, { useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { X, Camera, AlertCircle, CheckCircle2, MapPin, Upload } from 'lucide-react';

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CitizenReportModal: React.FC<CitizenReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeCity, addToast } = useApp();
  const [streetName, setStreetName] = useState('');
  const [wardName, setWardName] = useState('Ward 150 - Bellandur');
  const [city, setCity] = useState(activeCity === 'All Cities' ? 'Bengaluru' : activeCity);
  const [reportType, setReportType] = useState('Waterlogged Road');
  const [waterDepth, setWaterDepth] = useState('Knee Deep (30-45cm)');
  const [description, setDescription] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const demoPhotos = [
    { label: 'Submerged Road', url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80' },
    { label: 'Underpass Flooding', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80' },
    { label: 'Choked Drain / Trash', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetName.trim()) {
      setError('Please provide the street or junction name.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a brief description of the waterlogging situation.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.submitCitizenReport({
        street_name: streetName,
        ward_name: wardName,
        city,
        latitude: 12.9260,
        longitude: 77.6834,
        report_type: reportType,
        water_depth: waterDepth,
        description,
        citizen_name: citizenName || 'Anonymous Citizen',
        phone_masked: phone ? `${phone.substring(0, 5)}*****` : '+91 98*** **301',
        photo_url: photoUrl,
      });

      addToast(`Report recorded! Reference: ${res.report_code}`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-[#0b1329] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Report Street Waterlogging or Choked Drain</h3>
              <p className="text-xs text-slate-400">Crowdsourced ground observations enhance nowcasting precision</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
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
                City <span className="text-rose-500">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Pune">Pune</option>
                <option value="Vijayawada">Vijayawada</option>
                <option value="Mysuru">Mysuru</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ward / Neighborhood
              </label>
              <input
                type="text"
                value={wardName}
                onChange={(e) => setWardName(e.target.value)}
                placeholder="e.g. Ward 150 - Bellandur"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Street / Junction Landmark <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={streetName}
                onChange={(e) => setStreetName(e.target.value)}
                placeholder="e.g. Outer Ring Road, Near Ecospace Gate 2"
                className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue Category
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="Waterlogged Road">🌊 Waterlogged Road / Street</option>
                <option value="Blocked Drain">🚫 Blocked Stormwater Drain / Silt</option>
                <option value="Broken Manhole">⚠️ Overflowing Manhole / Open Drain</option>
                <option value="Underpass Submerged">🚗 Underpass Submerged / Stalled Vehicles</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Water Depth
              </label>
              <select
                value={waterDepth}
                onChange={(e) => setWaterDepth(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="Ankle Deep (10-15cm)">🟢 Ankle Deep (10–15 cm) - Slow Traffic</option>
                <option value="Knee Deep (30-45cm)">🟡 Knee Deep (30–45 cm) - Two-wheelers stuck</option>
                <option value="Waist Deep (60-80cm)">🟠 Waist Deep (60–80 cm) - Cars submerged</option>
                <option value="Impassable / Submerged (>1m)">🔴 Impassable (&gt; 100 cm) - Severe Danger</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Ground Condition <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe current road condition, stalled traffic, flow direction, or drain choke details..."
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Photo Evidence Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Photo Evidence (Attach image)</span>
              <span className="text-[10px] text-teal-600 font-normal">Select demonstration sample or provide URL</span>
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {demoPhotos.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPhotoUrl(p.url)}
                  className={`text-left p-1.5 rounded-lg border transition-all ${
                    photoUrl === p.url
                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={p.url} alt={p.label} className="w-full h-14 object-cover rounded mb-1" />
                  <span className="text-[10px] text-slate-600 font-medium block truncate">{p.label}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Or paste custom image URL"
              className="w-full text-[11px] rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-600 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="e.g. Ramesh Gowda"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone (Masked for privacy)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98450 12345"
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
              <span>{isSubmitting ? 'Submitting...' : 'Submit Flood Observation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
