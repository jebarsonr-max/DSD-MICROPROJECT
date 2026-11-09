import React from 'react';
import {
  LayoutDashboard,
  Luggage,
  Scale,
  GitFork,
  Cpu,
  PlaneTakeoff,
  BarChart3,
  Bell,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type PageId =
  | 'dashboard'
  | 'registration'
  | 'weight-analyzer'
  | 'smart-sorting'
  | 'conveyor-simulation'
  | 'flight-management'
  | 'digital-logic'
  | 'reports'
  | 'notifications'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { notifications, luggage } = useApp();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingLuggageCount = luggage.filter((b) => b.status === 'REGISTERED').length;

  const menuItems = [
    { id: 'dashboard' as PageId, label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'registration' as PageId, label: 'Luggage Registration', icon: Luggage, count: pendingLuggageCount },
    { id: 'weight-analyzer' as PageId, label: 'Weight Analyzer', icon: Scale },
    { id: 'smart-sorting' as PageId, label: 'Smart Sorting', icon: GitFork },
    { id: 'conveyor-simulation' as PageId, label: 'Conveyor Simulation', icon: Activity, highlight: true },
    { id: 'digital-logic' as PageId, label: 'Digital Logic Control', icon: Cpu, badge: 'DSD' },
    { id: 'flight-management' as PageId, label: 'Flight Management', icon: PlaneTakeoff },
    { id: 'reports' as PageId, label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'notifications' as PageId, label: 'Alerts & Notifications', icon: Bell, count: unreadCount },
    { id: 'settings' as PageId, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white border-r border-aviation-border flex flex-col transition-all duration-300 z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-aviation-border">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo: Minimal suitcase with airport flight path arrow */}
          <div className="w-10 h-10 rounded-lg bg-aviation-navy flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden group">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Suitcase Body */}
              <rect x="3" y="7" width="18" height="14" rx="2" stroke="white" strokeWidth="2" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="white" strokeWidth="2" />
              {/* Flight-Path / Sorting Arrow inside */}
              <path d="M12 11v6" stroke="#2878D0" strokeWidth="2.5" />
              <path d="M9 14l3-3 3 3" stroke="#2878D0" strokeWidth="2.5" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-aviation-navy tracking-tight">AeroSort</span>
                <span className="text-[11px] font-bold text-[#2878D0] bg-[#EAF3FC] px-1.5 py-0.5 rounded">AI</span>
              </div>
              <p className="text-[10px] text-aviation-textSecondary truncate font-medium">Baggage Automation</p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-aviation-textSecondary hover:text-aviation-navy hover:bg-[#F1F5F9] transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-aviation-navy text-white shadow-sm'
                  : 'text-aviation-text hover:bg-aviation-lightBlue hover:text-aviation-navy'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-aviation-textSecondary group-hover:text-aviation-navy'
                }`}
              />

              {!isCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-[#2878D0] text-white' : 'bg-[#EAF3FC] text-[#2878D0]'
                }`}>
                  {item.badge}
                </span>
              )}

              {!isCollapsed && item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-white text-aviation-navy' : 'bg-[#EAF3FC] text-aviation-accent'
                  }`}
                >
                  {item.count}
                </span>
              )}

              {/* Indicator dot on collapsed mode */}
              {isCollapsed && item.count !== undefined && item.count > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-aviation-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* System Status / DSD Project Footer */}
      <div className="p-3 border-t border-aviation-border bg-[#F8FAFC]">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-aviation-textSecondary">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-aviation-success animate-pulse" />
                PLC / Logic Online
              </span>
              <span className="font-mono text-[10px] bg-white border border-aviation-border px-1.5 py-0.5 rounded">
                DSD-v2.4
              </span>
            </div>
            <div className="p-2 rounded bg-white border border-aviation-border text-[11px] text-aviation-textSecondary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-aviation-success flex-shrink-0" />
              <span className="truncate">Digital System Design Microproject</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="System Online: DSD Microproject">
            <span className="w-2.5 h-2.5 rounded-full bg-aviation-success" />
          </div>
        )}
      </div>
    </aside>
  );
};

