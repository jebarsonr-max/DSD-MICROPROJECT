import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Radio,
  User,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageId } from './Sidebar';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const {
    notifications,
    settings,
    resetDemoData,
    isBackendConnected,
    connectionStatus,
    apiBaseUrl,
    apiLoading,
    apiError,
    retryBackendConnection,
  } = useApp();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.read);

  const getPageTitle = (page: PageId) => {
    switch (page) {
      case 'dashboard':
        return { title: 'Overview Dashboard', category: 'Operations' };
      case 'registration':
        return { title: 'Luggage Registration Desk', category: 'Passenger Check-In' };
      case 'weight-analyzer':
        return { title: 'Digital Weight Analyzer', category: 'Sensor Station' };
      case 'smart-sorting':
        return { title: 'Smart Automated Luggage Sorting', category: 'Automation Engine' };
      case 'conveyor-simulation':
        return { title: 'Interactive Conveyor Belt Simulation', category: 'Live Visualizer' };
      case 'digital-logic':
        return { title: 'Digital Logic Control Unit', category: 'DSD Core Module' };
      case 'flight-management':
        return { title: 'Flight Manifest & Gate Allocations', category: 'Airlines' };
      case 'reports':
        return { title: 'Reports & Baggage Analytics', category: 'Data Intelligence' };
      case 'notifications':
        return { title: 'Notification & Alert Center', category: 'System Telemetry' };
      case 'settings':
        return { title: 'System Configuration', category: 'Airport Admin' };
    }
  };

  const pageInfo = getPageTitle(currentPage);

  return (
    <header className="h-16 bg-white border-b border-aviation-border px-6 flex items-center justify-between z-20">
      {/* Page Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs text-aviation-textSecondary">
          <span>{settings.airportCode}</span>
          <span>/</span>
          <span>{pageInfo.category}</span>
          <span>/</span>
          <span className="text-aviation-navy font-medium">{pageInfo.title}</span>
        </div>
        <h1 className="text-lg font-bold text-aviation-navy leading-tight">{pageInfo.title}</h1>
      </div>

      {/* Operational Controls & Status Bar */}
      <div className="flex items-center gap-3">
        {/* Backend REST API & DB Status Indicator (3 States: CONNECTED, CONNECTING, DISCONNECTED) */}
        {connectionStatus === 'connected' && (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-colors bg-[#E8F7F0] text-[#16A36A] border-[#C2EBDA]"
            title={`Backend connected at ${apiBaseUrl} — SQLite Active`}
          >
            <span className="w-2 h-2 rounded-full bg-[#16A36A] animate-pulse" />
            <span>CONNECTED (FASTAPI)</span>
          </div>
        )}

        {connectionStatus === 'connecting' && (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-colors bg-[#FEF6E9] text-[#E99A25] border-[#FCE2B6]"
            title={`Connecting to backend at ${apiBaseUrl}...`}
          >
            <span className="w-2 h-2 rounded-full bg-[#E99A25] animate-ping" />
            <span>CONNECTING API...</span>
          </div>
        )}

        {connectionStatus === 'disconnected' && (
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-colors bg-[#FCEBEB] text-[#DC4545] border-[#F8C8C8]"
              title={apiError || `Backend unavailable at ${apiBaseUrl}`}
            >
              <span className="w-2 h-2 rounded-full bg-[#DC4545]" />
              <span>DISCONNECTED</span>
            </div>
            <button
              onClick={() => retryBackendConnection()}
              disabled={apiLoading}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold rounded-full bg-white text-aviation-navy border border-aviation-border hover:bg-aviation-lightBlue hover:border-aviation-accent transition-colors shadow-subtle disabled:opacity-50"
              title="Click to retry connecting to the backend"
            >
              <RotateCcw className={`w-3 h-3 text-aviation-accent ${apiLoading ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Airport Status Indicator — ONLY displays SYSTEM ACTIVE when backend connected */}
        <div
          className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
            connectionStatus === 'connected'
              ? 'bg-[#E8F7F0] border-[#C2EBDA] text-[#16A36A]'
              : connectionStatus === 'connecting'
              ? 'bg-[#FEF6E9] border-[#FCE2B6] text-[#E99A25]'
              : 'bg-[#F1F5F9] border-aviation-border text-aviation-textSecondary'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-[#16A36A] animate-ping'
                : connectionStatus === 'connecting'
                ? 'bg-[#E99A25] animate-pulse'
                : 'bg-[#94A3B8]'
            }`}
          />
          <span className="font-semibold">{settings.airportCode} {settings.terminalName.split('—')[0].trim()}:</span>
          <span>
            {connectionStatus === 'connected'
              ? 'SYSTEM ACTIVE'
              : connectionStatus === 'connecting'
              ? 'CHECKING TELEMETRY...'
              : 'OFFLINE MODE'}
          </span>
        </div>

        {/* Live Date / Time Display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F7FA] border border-aviation-border text-xs text-aviation-text font-mono">
          <Clock className="w-3.5 h-3.5 text-aviation-accent" />
          <span>{currentDate}</span>
          <span className="text-aviation-borderDark font-sans">|</span>
          <span className="font-semibold text-aviation-navy">{currentTime}</span>
        </div>

        {/* Demo Data Reset Quick Action */}
        <button
          onClick={resetDemoData}
          title="Reset initial demo data (Faculty presentation mode)"
          className="hidden md:flex items-center gap-1.5 text-xs text-aviation-textSecondary hover:text-aviation-navy bg-white hover:bg-aviation-lightBlue border border-aviation-border px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-aviation-accent" />
          <span className="font-medium">Reset Demo</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-aviation-textSecondary hover:text-aviation-navy hover:bg-[#F1F5F9] transition-colors"
            title="System Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-aviation-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-aviation-border shadow-elevated p-3 z-50 animate-scale-up">
              <div className="flex items-center justify-between pb-2 border-b border-aviation-border mb-2">
                <span className="font-semibold text-sm text-aviation-navy">Recent Alerts</span>
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    onNavigate('notifications');
                  }}
                  className="text-xs text-aviation-accent hover:underline font-medium"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2 rounded-lg text-xs border ${
                      notif.read ? 'bg-[#FAFCFE] border-aviation-border' : 'bg-[#F0F7FF] border-[#D0E4FA]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-aviation-navy truncate">{notif.title}</span>
                      <span className="text-[10px] text-aviation-textMuted ml-1 flex-shrink-0">{notif.timestamp}</span>
                    </div>
                    <p className="text-aviation-textSecondary mt-0.5 line-clamp-2">{notif.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Administrator Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-aviation-border">
          <div className="w-8 h-8 rounded-full bg-aviation-navy text-white flex items-center justify-center font-bold text-xs">
            AO
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-aviation-navy leading-none">Airport Operations</p>
            <p className="text-[10px] text-aviation-textSecondary mt-0.5">DSD Evaluation Officer</p>
          </div>
        </div>
      </div>
    </header>
  );
};

