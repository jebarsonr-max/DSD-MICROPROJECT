import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
  iconBgColor?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  iconBgColor = 'bg-[#EAF3FC]',
  iconColor = 'text-[#2878D0]',
}) => {
  const badgeColors = {
    success: 'bg-[#E8F7F0] text-[#16A36A]',
    warning: 'bg-[#FEF6E9] text-[#E99A25]',
    danger: 'bg-[#FCEBEB] text-[#DC4545]',
    info: 'bg-[#EAF3FC] text-[#2878D0]',
    neutral: 'bg-[#F1F5F9] text-[#475569]',
  };

  return (
    <div className="bg-white rounded-xl border border-aviation-border p-5 shadow-subtle hover:border-[#CBD5E1] transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-aviation-textSecondary uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-aviation-navy tracking-tight">{value}</span>
            {badge && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeColors[badge.variant]}`}>
                {badge.text}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-aviation-textMuted pt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconBgColor} ${iconColor} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

