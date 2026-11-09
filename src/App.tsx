import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';
import { PageId } from './components/layout/Sidebar';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { LuggageRegistration } from './pages/LuggageRegistration';
import { WeightAnalyzer } from './pages/WeightAnalyzer';
import { SmartSorting } from './pages/SmartSorting';
import { ConveyorSimulation } from './pages/ConveyorSimulation';
import { DigitalLogicControl } from './pages/DigitalLogicControl';
import { FlightManagement } from './pages/FlightManagement';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { NotificationCenter } from './pages/NotificationCenter';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <OverviewDashboard onNavigate={setCurrentPage} />;
      case 'registration':
        return <LuggageRegistration />;
      case 'weight-analyzer':
        return <WeightAnalyzer />;
      case 'smart-sorting':
        return <SmartSorting />;
      case 'conveyor-simulation':
        return <ConveyorSimulation />;
      case 'digital-logic':
        return <DigitalLogicControl />;
      case 'flight-management':
        return <FlightManagement />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'notifications':
        return <NotificationCenter />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewDashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderCurrentPage()}
    </MainLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;

