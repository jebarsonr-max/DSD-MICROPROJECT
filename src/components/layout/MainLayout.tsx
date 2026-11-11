import React, { useState } from 'react';
import { Sidebar, PageId } from './Sidebar';
import { Header } from './Header';
import { Sparkles, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MainLayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentPage,
  onNavigate,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const {
    luggage,
    conveyorState,
    startConveyorSimulation,
    connectionStatus,
    apiBaseUrl,
    apiError,
    retryBackendConnection,
    apiLoading,
  } = useApp();

  const pendingBags = luggage.filter((b) => b.status === 'REGISTERED');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-aviation-bg font-sans">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header currentPage={currentPage} onNavigate={onNavigate} />

        {/* Global Demo Presentation Banner */}
        <div className="bg-[#17365D] text-white px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#0F233D] shadow-inner">
          <div className="flex items-center gap-2">
            <span className="bg-[#2878D0] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
              DEMO DATA ACTIVE
            </span>
            <span className="text-slate-200">
              Live Faculty Viva Demonstration Mode — Digital System Design (DSD) Baggage Automation
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300 hidden md:inline">
              Queue: <strong className="text-white">{pendingBags.length}</strong> Pending Bags
            </span>
            <button
              onClick={() => {
                if (currentPage !== 'conveyor-simulation') {
                  onNavigate('conveyor-simulation');
                }
                if (!conveyorState.isRunning) {
                  startConveyorSimulation();
                }
              }}
              className="bg-[#2878D0] hover:bg-[#1E63B0] text-white px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Launch Live Conveyor Demo</span>
            </button>
          </div>
        </div>

        {/* Backend Disconnected Notice Banner */}
        {connectionStatus === 'disconnected' && (
          <div className="bg-[#FFF5F5] border-b border-[#F8C8C8] px-6 py-2.5 flex items-center justify-between text-xs text-[#9B1C1C] transition-all">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC4545]" />
              <span>
                <strong>Backend Disconnected:</strong> {apiError || `Cannot reach server at ${apiBaseUrl}. Showing local demonstration records.`}
              </span>
            </div>
            <button
              onClick={() => retryBackendConnection()}
              disabled={apiLoading}
              className="px-3 py-1 bg-white hover:bg-[#FEE2E2] text-[#DC4545] font-bold rounded border border-[#F8C8C8] transition-colors shadow-xs disabled:opacity-50"
            >
              {apiLoading ? 'Connecting...' : 'Retry Connection'}
            </button>
          </div>
        )}

        {/* Dynamic Page Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

