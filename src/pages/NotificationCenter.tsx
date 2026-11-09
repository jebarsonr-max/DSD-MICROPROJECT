import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCheck,
  Trash2,
  Filter,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';

export const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, clearNotifications } = useApp();

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredNotifs = notifications.filter((n) => {
    if (severityFilter === 'ALL') return true;
    if (severityFilter === 'UNREAD') return !n.read;
    return n.severity === severityFilter;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertOctagon className="w-5 h-5 text-[#DC4545]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#E99A25]" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[#16A36A]" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[#2878D0]" />;
    }
  };

  const getSeverityBg = (severity: string, read: boolean) => {
    if (read) return 'bg-white border-aviation-border';
    switch (severity) {
      case 'high':
        return 'bg-[#FEF5F5] border-[#F8C6C6]';
      case 'warning':
        return 'bg-[#FEF9F0] border-[#FCE6BE]';
      case 'success':
        return 'bg-[#F2FAF6] border-[#C2EBDA]';
      case 'info':
      default:
        return 'bg-[#F0F7FF] border-[#C5DFF8]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-aviation-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-aviation-navy">Airport Operations Alert Center</h2>
            <span className="text-xs font-mono font-bold bg-[#EAF3FC] text-aviation-accent px-2.5 py-0.5 rounded-full">
              REAL-TIME LOG
            </span>
          </div>
          <p className="text-xs text-aviation-textSecondary mt-0.5">
            Automated alerts triggered by load-cell threshold comparators, RFID sensors, and conveyor diverter states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllNotificationsAsRead}
            disabled={notifications.every((n) => n.read)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-aviation-border text-aviation-navy hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5 text-aviation-accent" />
            Mark All as Read
          </button>
          <button
            onClick={clearNotifications}
            disabled={notifications.length === 0}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-[#F8C6C6] text-[#DC4545] hover:bg-[#FCEBEB] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
        {[
          { id: 'ALL', label: `All Alerts (${notifications.length})` },
          { id: 'UNREAD', label: `Unread (${notifications.filter((n) => !n.read).length})` },
          { id: 'high', label: `High Severity (${notifications.filter((n) => n.severity === 'high').length})` },
          { id: 'warning', label: `Warnings (${notifications.filter((n) => n.severity === 'warning').length})` },
          { id: 'success', label: `Success (${notifications.filter((n) => n.severity === 'success').length})` },
          { id: 'info', label: `Telemetry Info (${notifications.filter((n) => n.severity === 'info').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSeverityFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
              severityFilter === tab.id
                ? 'bg-aviation-navy text-white border-aviation-navy shadow-sm'
                : 'bg-white text-aviation-text border-aviation-border hover:bg-aviation-lightBlue'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List Card */}
      <Card
        title="Event Notification Feed"
        subtitle={`Displaying ${filteredNotifs.length} event items`}
      >
        <div className="space-y-3">
          {filteredNotifs.map((item) => (
            <div
              key={item.id}
              onClick={() => markNotificationAsRead(item.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-subtle ${getSeverityBg(
                item.severity,
                item.read
              )}`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white shadow-xs border border-aviation-border flex-shrink-0">
                  {getSeverityIcon(item.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-aviation-navy">{item.title}</h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-aviation-accent" />
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-aviation-textSecondary flex-shrink-0">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-aviation-textSecondary mt-1 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-[10px]">
                    <span className="font-mono bg-white border border-aviation-border px-1.5 py-0.5 rounded text-aviation-textSecondary font-semibold">
                      CATEGORY: {item.category}
                    </span>
                    <span className="font-mono bg-white border border-aviation-border px-1.5 py-0.5 rounded text-aviation-textSecondary font-semibold">
                      SEVERITY: {item.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredNotifs.length === 0 && (
            <div className="py-12 text-center text-aviation-textMuted text-xs">
              No notifications matching your filter criteria.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

