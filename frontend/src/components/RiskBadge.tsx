import React from 'react';
import { RiskSeverity } from '../types';

interface RiskBadgeProps {
  severity: RiskSeverity;
  score?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  severity,
  score,
  label,
  size = 'md',
  showPulse = false,
}) => {
  const configs = {
    green: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
      defaultLabel: 'Low Risk',
    },
    yellow: {
      bg: 'bg-amber-50 text-amber-800 border-amber-300',
      dot: 'bg-amber-500',
      defaultLabel: 'Moderate',
    },
    orange: {
      bg: 'bg-orange-50 text-orange-800 border-orange-300',
      dot: 'bg-orange-500',
      defaultLabel: 'High Risk',
    },
    red: {
      bg: 'bg-rose-50 text-rose-800 border-rose-300',
      dot: 'bg-rose-600',
      defaultLabel: 'Critical Flood',
    },
  };

  const current = configs[severity] || configs.green;
  const isSevere = severity === 'red' || severity === 'orange';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${sizeClasses[size]} transition-all ${
        showPulse && isSevere ? 'shadow-sm shadow-rose-200 ring-2 ring-rose-300/40' : ''
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${current.dot} ${
          showPulse && isSevere ? 'animate-ping inline-flex' : ''
        }`}
      />
      <span>{label || current.defaultLabel}</span>
      {score !== undefined && (
        <span className="ml-0.5 opacity-80 text-[11px] font-mono">
          ({Math.round(score)})
        </span>
      )}
    </span>
  );
};
