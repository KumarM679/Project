import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { RainfallReading } from '../types';
import {
  CloudRain,
  Radio,
  Clock,
  TrendingUp,
  AlertCircle,
  Activity,
  Droplets,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const RainfallPage: React.FC = () => {
  const { activeCity, refreshTrigger } = useApp();
  const [readings, setReadings] = useState<RainfallReading[]>([]);
  const [hourlyTrends, setHourlyTrends] = useState<{ time: string; intensity_mm_hr: number; is_forecast: boolean }[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<RainfallReading | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getRainfall(activeCity)
      .then((data) => {
        if (isMounted) {
          setReadings(data.readings);
          setHourlyTrends(data.hourly_trends);
          setSummary(data.summary);
          if (data.readings.length > 0) setSelectedStation(data.readings[0]);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load rainfall data');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCity, refreshTrigger]);

  if (loading && readings.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Querying hydro-meteorological telemetry stations...</p>
      </div>
    );
  }

  // Calculate maximum trend intensity for SVG scaling
  const maxTrend = Math.max(...hourlyTrends.map((t) => t.intensity_mm_hr), 80);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Overview Metric Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="civic-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Active Rain Gauges
          </span>
          <div className="text-2xl font-black text-slate-900">{readings.length} Stations</div>
          <span className="text-[11px] text-teal-700 font-semibold mt-1 flex items-center gap-1">
            <Radio className="w-3 h-3 text-teal-600 animate-pulse" />
            100% Operational Telemetry
          </span>
        </div>

        <div className="civic-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Max Instantaneous Intensity
          </span>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {summary?.max_intensity || 0} <span className="text-xs font-medium text-slate-500">mm/h</span>
          </div>
          <span className="text-[11px] text-slate-500 truncate block mt-1">
            Recorded at: {summary?.max_station}
          </span>
        </div>

        <div className="civic-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Average 3-Hour Accumulation
          </span>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {Math.round(readings.reduce((acc, r) => acc + r.accumulation_3h, 0) / Math.max(1, readings.length))} mm
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
            Antecedent ground saturation high
          </span>
        </div>

        <div className="civic-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Doppler Radar Telemetry Status
          </span>
          <div className="text-2xl font-black text-teal-900 flex items-center gap-2">
            <span>SYNCHRONIZED</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Latency: 280ms • Multi-source blending
          </span>
        </div>
      </div>

      {/* Hourly Rainfall Trend & Nowcast Chart */}
      <div className="civic-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <span>24-Hour Precipitation Telemetry & 2-Hour Nowcast Forecast</span>
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated rainfall intensity profile (mm/hr) across monitored urban catchments
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-teal-700">
              <span className="w-3 h-3 rounded-sm bg-teal-500" />
              Observed AWS Readings
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-amber-700">
              <span className="w-3 h-3 rounded-sm bg-amber-400 border border-dashed border-amber-600" />
              Doppler Nowcast (+2h)
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full h-64 bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 relative">
          <div className="absolute left-4 top-2 text-[10px] text-slate-400 font-mono">Intensity (mm/hr)</div>
          <div className="w-full h-full flex items-end justify-between gap-2 pt-6 pb-6 px-4">
            {hourlyTrends.map((point, idx) => {
              const heightPct = Math.max(8, (point.intensity_mm_hr / maxTrend) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md shadow-md pointer-events-none whitespace-nowrap z-20 font-mono">
                    {point.intensity_mm_hr} mm/h ({point.is_forecast ? 'Forecast' : 'Observed'})
                  </div>

                  <span className="text-[10px] font-mono font-bold text-slate-700 mb-1 opacity-80 group-hover:opacity-100">
                    {point.intensity_mm_hr}
                  </span>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[38px] rounded-t-md transition-all duration-300 ${
                      point.is_forecast
                        ? 'bg-gradient-to-t from-amber-400 to-amber-300 border-2 border-dashed border-amber-600/80'
                        : (point.intensity_mm_hr > 50
                            ? 'bg-gradient-to-t from-rose-600 to-orange-500'
                            : 'bg-gradient-to-t from-teal-700 to-teal-500')
                    }`}
                  />
                  <span className="text-[10px] font-medium text-slate-500 mt-2 rotate-[-20deg] origin-top-left">
                    {point.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Station Cards Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>Automated Weather Stations (AWS) & Pluviometers</span>
          <span className="text-xs text-slate-500 font-normal">Click any station to inspect catchment accumulation</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {readings.map((st) => {
            const isSelected = selectedStation?.id === st.id;
            return (
              <div
                key={st.id}
                onClick={() => setSelectedStation(st)}
                className={`civic-card p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-teal-500 border-teal-500 bg-teal-50/10'
                    : 'hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {st.station_code}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">{st.station_name}</h4>
                    <span className="text-xs text-teal-700 font-semibold">{st.city}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black font-mono text-slate-900">
                      {st.current_intensity_mm_hr}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">mm/hr</span>
                  </div>
                </div>

                {/* Accumulation Meters */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-1.5 rounded">
                    <span className="text-[10px] text-slate-400 block font-medium">1h</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{st.accumulation_1h}mm</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded">
                    <span className="text-[10px] text-slate-400 block font-medium">3h</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{st.accumulation_3h}mm</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded">
                    <span className="text-[10px] text-slate-400 block font-medium">6h</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{st.accumulation_6h}mm</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded">
                    <span className="text-[10px] text-slate-400 block font-medium">24h</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{st.accumulation_24h}mm</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-teal-600" />
                    +2h Forecast: <strong className="text-slate-800">{st.forecast_next_2h_mm_hr} mm/h</strong>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    {st.sensor_status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 mt-2 truncate">
                  Feed: {st.data_source}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
