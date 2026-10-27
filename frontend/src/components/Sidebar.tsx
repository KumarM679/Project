import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  CloudRain,
  Map,
  Activity,
  Layers,
  Bell,
  Megaphone,
  Truck,
  BarChart3,
  History,
  Sliders,
  BookOpen,
  Flame,
  ShieldCheck,
  Building2,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  activeAlertsCount,
}) => {
  const { activeCity, setActiveCity, user, setUserRole } = useApp();

  const cities = ['All Cities', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Vijayawada', 'Mysuru'];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'rainfall', label: 'Rainfall Monitoring', icon: CloudRain },
    { id: 'flood-map', label: 'Interactive Flood Map', icon: Map },
    { id: 'risk-analysis', label: 'Street Risk Analysis', icon: Activity },
    { id: 'drainage', label: 'Drainage Management', icon: Layers },
    { id: 'alerts', label: 'Flood Risk Alerts', icon: Bell, badge: activeAlertsCount > 0 ? activeAlertsCount : undefined },
    { id: 'citizen-reports', label: 'Citizen Reports', icon: Megaphone },
    { id: 'municipal-response', label: 'Municipal Response', icon: Truck },
    { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'audit-logs', label: 'Activity Audit Log', icon: History },
    { id: 'settings', label: 'Scoring Engine & Settings', icon: Sliders },
    { id: 'methodology', label: 'Methodology & Help', icon: BookOpen },
    { id: 'firebase-specs', label: 'Firebase Architecture', icon: Flame },
  ];

  return (
    <aside className="w-72 bg-[#0b1329] text-slate-300 flex flex-col border-r border-slate-800 select-none flex-shrink-0 z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 bg-[#070d1e]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 font-bold text-lg">
            जल
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-white tracking-tight text-base">JalDrishti</h1>
              <span className="text-[10px] font-semibold bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">
              Urban Flood Nowcasting System
            </p>
          </div>
        </div>

        {/* City Filter Dropdown */}
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between mb-1">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-teal-400" />
              Operational Zone
            </span>
            <span className="text-teal-400 text-[10px] font-mono">Live AWS</span>
          </label>
          <select
            value={activeCity}
            onChange={(e) => setActiveCity(e.target.value)}
            className="w-full bg-slate-900/90 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-teal-500 font-medium transition-colors"
          >
            {cities.map((c) => (
              <option key={c} value={c} className="bg-slate-900 text-white">
                {c === 'All Cities' ? '🇮🇳 All Indian Monitored Cities' : `${c}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-500/15 text-teal-300 font-semibold border-l-4 border-teal-400 shadow-sm shadow-teal-500/10'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-teal-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse shadow-sm">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Switcher Pill */}
      <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            Active Role
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {user.role}
          </span>
        </div>

        <select
          value={user.role}
          onChange={(e) => setUserRole(e.target.value as UserRole)}
          className="w-full bg-slate-950 text-white text-xs rounded-md px-2 py-1.5 border border-slate-700/80 focus:border-teal-500 text-xs font-medium"
        >
          <option value="eoc_chief">EOC Commander (Chief of Ops)</option>
          <option value="ward_engineer">Ward Maintenance Engineer</option>
          <option value="citizen">Civic Citizen (Public User)</option>
          <option value="admin">System Admin (Scoring Tuner)</option>
        </select>

        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="truncate font-medium text-slate-300">{user.name}</span>
          <span className="text-teal-400 text-[10px]">{user.city}</span>
        </div>
      </div>

      {/* Experimental Disclaimer Notice */}
      <div className="p-3 bg-[#070d1e] border-t border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
        <AlertOctagon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="leading-tight">
          <strong className="text-amber-300 font-semibold">Demo Notice:</strong> Risk predictions are experimental estimates for demonstration. Not live disaster dispatches.
        </p>
      </div>
    </aside>
  );
};
