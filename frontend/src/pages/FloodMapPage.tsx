import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { Street, DrainageRecord, CitizenReport } from '../types';
import {
  Layers,
  MapPin,
  Filter,
  Eye,
  AlertOctagon,
  Droplet,
  Compass,
  Info
} from 'lucide-react';

interface FloodMapPageProps {
  onNavigateToRisk: (streetId: number) => void;
}

export const FloodMapPage: React.FC<FloodMapPageProps> = ({ onNavigateToRisk }) => {
  const { activeCity, refreshTrigger } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [streets, setStreets] = useState<Street[]>([]);
  const [drainageList, setDrainageList] = useState<DrainageRecord[]>([]);
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Layer filter toggles
  const [showStreets, setShowStreets] = useState(true);
  const [showDrainage, setShowDrainage] = useState(true);
  const [showCitizenReports, setShowCitizenReports] = useState(true);
  const [riskFilter, setRiskFilter] = useState<string>('all'); // all, red, orange, yellow, green

  // City center coordinates lookup
  const cityCoordinates: Record<string, [number, number, number]> = {
    'All Cities': [13.0, 77.6, 7],
    Bengaluru: [12.965, 77.625, 12],
    Hyderabad: [17.43, 78.42, 12],
    Chennai: [13.03, 80.22, 12],
    Pune: [18.53, 73.82, 12],
    Vijayawada: [16.51, 80.64, 13],
    Mysuru: [12.31, 76.64, 13],
  };

  // Load Data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.getStreets({ city: activeCity }),
      api.getDrainage({ city: activeCity }),
      api.getCitizenReports({ city: activeCity }),
    ])
      .then(([streetRes, drainRes, repRes]) => {
        if (isMounted) {
          setStreets(streetRes.streets);
          setDrainageList(drainRes.drainage_records);
          setCitizenReports(repRes.reports);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Map data fetch error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCity, refreshTrigger]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCoord = cityCoordinates[activeCity] || cityCoordinates['Bengaluru'];
      const map = L.map(mapContainerRef.current, {
        center: [defaultCoord[0], defaultCoord[1]],
        zoom: defaultCoord[2],
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | JalDrishti Civic Tech',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    // Auto pan/zoom when activeCity changes
    if (mapInstanceRef.current) {
      const coords = cityCoordinates[activeCity] || cityCoordinates['Bengaluru'];
      mapInstanceRef.current.setView([coords[0], coords[1]], coords[2]);
    }
  }, [activeCity]);

  // Render Map Markers based on active toggles & filters
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // 1. Street Risk Markers
    if (showStreets) {
      streets.forEach((street) => {
        const risk = street.risk_analysis;
        const sev = risk?.severity || 'green';

        if (riskFilter !== 'all' && sev !== riskFilter) {
          return;
        }

        const colors = {
          green: '#16a34a',
          yellow: '#ca8a04',
          orange: '#ea580c',
          red: '#dc2626',
        };
        const color = colors[sev as keyof typeof colors] || '#16a34a';

        // Custom HTML Marker Icon
        const iconHtml = `
          <div style="
            background-color: ${color};
            width: ${sev === 'red' ? '30px' : '24px'};
            height: ${sev === 'red' ? '30px' : '24px'};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 800;
            font-size: 11px;
            font-family: sans-serif;
            ${sev === 'red' ? 'animation: pulse 1.5s infinite;' : ''}
          ">
            ${Math.round(risk?.risk_score || 0)}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'street-risk-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([street.latitude, street.longitude], { icon: customIcon });

        const popupHtml = `
          <div style="font-family: Inter, sans-serif; min-width: 230px; padding: 2px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 700; color: #0d9488; text-transform: uppercase;">
                ${street.city} • ${street.ward_name}
              </span>
              <span style="background: ${color}; color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                ${risk?.risk_level} (${risk?.risk_score})
              </span>
            </div>
            <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">
              ${street.name}
            </h4>
            <div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 6px;">
              <div>• Rain Load: <b>${risk?.effective_rainfall_mm_hr} mm/h</b></div>
              <div>• Net Drainage: <b>${risk?.effective_drainage_capacity_mm_hr} mm/h</b></div>
              <div>• Drain Blockage: <b>${risk?.effective_blockage_pct}%</b></div>
            </div>
            <p style="font-size: 11px; color: #334155; background: #f8fafc; padding: 6px; border-radius: 6px; border-left: 3px solid ${color}; margin: 6px 0;">
              ${risk?.action_summary}
            </p>
            <div style="font-size: 9px; color: #94a3b8; font-style: italic; margin-top: 4px;">
              * Experimental nowcasting estimate
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.addTo(markersLayerRef.current!);
      });
    }

    // 2. Stormwater Drainage Nodes
    if (showDrainage) {
      drainageList.forEach((drain) => {
        if (!drain.latitude || !drain.longitude) return;

        const isBlocked = drain.current_blockage_pct >= 50;
        const drainIcon = L.divIcon({
          html: `
            <div style="
              background: ${isBlocked ? '#b45309' : '#0284c7'};
              border: 2px solid white;
              width: 18px;
              height: 18px;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 9px;
              font-weight: bold;
              box-shadow: 0 2px 5px rgba(0,0,0,0.25);
            ">
              D
            </div>
          `,
          className: 'drain-marker',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const drainMarker = L.marker([drain.latitude, drain.longitude], { icon: drainIcon });
        drainMarker.bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 11px;">
            <div style="font-weight: 800; color: #0369a1; margin-bottom: 2px;">DRAIN NODE: ${drain.drain_code}</div>
            <div style="font-weight: 600; color: #0f172a;">${drain.drain_type}</div>
            <div style="margin-top: 4px; color: #475569;">
              <div>Nominal Capacity: <b>${drain.nominal_capacity_mm_hr} mm/h</b></div>
              <div>Blockage Level: <b>${drain.current_blockage_pct}%</b></div>
              <div>Silt Depth: <b>${drain.silt_depth_cm} cm</b></div>
              <div>Desilt Status: <b style="color: ${drain.desilt_status === 'Overdue' ? '#dc2626' : '#16a34a'};">${drain.desilt_status}</b></div>
              <div>Crew: ${drain.maintenance_crew}</div>
            </div>
          </div>
        `);
        drainMarker.addTo(markersLayerRef.current!);
      });
    }

    // 3. Citizen Crowdsourced Reports
    if (showCitizenReports) {
      citizenReports.forEach((rep) => {
        const repIcon = L.divIcon({
          html: `
            <div style="
              background: #9333ea;
              border: 2px solid white;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
              📢
            </div>
          `,
          className: 'citizen-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const repMarker = L.marker([rep.latitude, rep.longitude], { icon: repIcon });
        repMarker.bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 11px; max-width: 220px;">
            <div style="font-weight: 800; color: #7e22ce;">CITIZEN OBSERVATION</div>
            <div style="font-weight: 700; color: #0f172a; margin: 2px 0;">${rep.street_name}</div>
            <span style="background: #fdf2f8; color: #be185d; padding: 2px 5px; border-radius: 4px; font-weight: 700; font-size: 10px;">
              ${rep.water_depth}
            </span>
            <p style="color: #475569; margin: 6px 0; font-size: 10px;">${rep.description}</p>
            <div style="font-size: 9px; color: #94a3b8;">${rep.citizen_name} • ▲ ${rep.upvotes} Confirmations</div>
          </div>
        `);
        repMarker.addTo(markersLayerRef.current!);
      });
    }
  }, [streets, drainageList, citizenReports, showStreets, showDrainage, showCitizenReports, riskFilter]);

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Map Control Toolbar */}
      <div className="civic-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Layer Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <span className="text-slate-500 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            Layer Controls:
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={showStreets}
              onChange={(e) => setShowStreets(e.target.checked)}
              className="accent-teal-600 rounded"
            />
            <span className="text-slate-800">Street Risk Points ({streets.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={showDrainage}
              onChange={(e) => setShowDrainage(e.target.checked)}
              className="accent-teal-600 rounded"
            />
            <span className="text-slate-800">Drainage Nodes ({drainageList.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={showCitizenReports}
              onChange={(e) => setShowCitizenReports(e.target.checked)}
              className="accent-teal-600 rounded"
            />
            <span className="text-slate-800">Citizen Reports ({citizenReports.length})</span>
          </label>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Risk Filter:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="red">🔴 Severe / Critical Only</option>
            <option value="orange">🟠 High Risk Only</option>
            <option value="yellow">🟡 Moderate Watch</option>
            <option value="green">🟢 Low Risk</option>
          </select>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="civic-card p-2 overflow-hidden relative shadow-md">
        <div
          ref={mapContainerRef}
          className="w-full h-[620px] rounded-lg"
          style={{ minHeight: '520px' }}
        />

        {/* Map Legend Floating Overlay */}
        <div className="absolute bottom-6 right-6 z-20 bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200 shadow-xl max-w-xs text-xs pointer-events-auto">
          <div className="font-bold text-slate-900 mb-2 flex items-center justify-between">
            <span>Hydrodynamic Risk Legend</span>
            <span className="text-[10px] text-teal-600 font-mono">0-100 Score</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
                <span className="font-semibold text-rose-800">Severe / Critical</span>
              </span>
              <span className="font-mono text-slate-500">80–100</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="font-semibold text-orange-800">High Risk</span>
              </span>
              <span className="font-mono text-slate-500">55–79</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="font-semibold text-amber-800">Moderate Risk</span>
              </span>
              <span className="font-mono text-slate-500">30–54</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-800">Low Risk</span>
              </span>
              <span className="font-mono text-slate-500">0–29</span>
            </div>

            <div className="pt-2 mt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Drain
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Citizen
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
