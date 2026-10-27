import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { api } from './api/client';
import type { Street, DrainageRecord } from './types';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { CitizenReportModal } from './components/CitizenReportModal';
import { DrainageModal } from './components/DrainageModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { RainfallPage } from './pages/RainfallPage';
import { FloodMapPage } from './pages/FloodMapPage';
import { StreetRiskAnalysisPage } from './pages/StreetRiskAnalysisPage';
import { DrainagePage } from './pages/DrainagePage';
import { AlertsPage } from './pages/AlertsPage';
import { CitizenReportsPage } from './pages/CitizenReportsPage';
import { MunicipalResponsePage } from './pages/MunicipalResponsePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { FirebaseSpecsPage } from './pages/FirebaseSpecsPage';

export const App: React.FC = () => {
  const { activeCity, refreshTrigger, triggerRefresh } = useApp();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [streetsList, setStreetsList] = useState<Street[]>([]);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isDrainageModalOpen, setIsDrainageModalOpen] = useState<boolean>(false);
  const [editDrainageRecord, setEditDrainageRecord] = useState<DrainageRecord | null>(null);

  // Navigation target street id
  const [targetStreetId, setTargetStreetId] = useState<number | undefined>(undefined);

  // Fetch streets & active alerts count
  useEffect(() => {
    let isMounted = true;
    api
      .getStreets({ city: activeCity })
      .then((res) => {
        if (isMounted) setStreetsList(res.streets);
      })
      .catch((err) => console.error('Streets fetch error:', err));

    api
      .getAlerts({ city: activeCity, status: 'Active' })
      .then((res) => {
        if (isMounted) setActiveAlertsCount(res.count);
      })
      .catch((err) => console.error('Alerts count fetch error:', err));

    return () => {
      isMounted = false;
    };
  }, [activeCity, refreshTrigger]);

  const handleNavigate = (tab: string, streetId?: number) => {
    if (streetId) {
      setTargetStreetId(streetId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditDrainage = (record: DrainageRecord) => {
    setEditDrainageRecord(record);
    setIsDrainageModalOpen(true);
  };

  const handleCloseDrainageModal = () => {
    setIsDrainageModalOpen(false);
    setEditDrainageRecord(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Deep Navy-Blue Civic Tech Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setTargetStreetId(undefined);
          setCurrentTab(tab);
        }}
        activeAlertsCount={activeAlertsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          currentTab={currentTab}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenDrainageModal={() => {
            setEditDrainageRecord(null);
            setIsDrainageModalOpen(true);
          }}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto pb-12">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onOpenDrainageModal={() => {
                setEditDrainageRecord(null);
                setIsDrainageModalOpen(true);
              }}
            />
          )}

          {currentTab === 'rainfall' && <RainfallPage />}

          {currentTab === 'flood-map' && (
            <FloodMapPage
              onNavigateToRisk={(id) => handleNavigate('risk-analysis', id)}
            />
          )}

          {currentTab === 'risk-analysis' && (
            <StreetRiskAnalysisPage initialStreetId={targetStreetId} />
          )}

          {currentTab === 'drainage' && (
            <DrainagePage
              onOpenCreateModal={() => {
                setEditDrainageRecord(null);
                setIsDrainageModalOpen(true);
              }}
              onEditRecord={handleOpenEditDrainage}
            />
          )}

          {currentTab === 'alerts' && <AlertsPage />}

          {currentTab === 'citizen-reports' && (
            <CitizenReportsPage onOpenReportModal={() => setIsReportModalOpen(true)} />
          )}

          {currentTab === 'municipal-response' && (
            <MunicipalResponsePage streetsList={streetsList} />
          )}

          {currentTab === 'analytics' && <AnalyticsPage />}

          {currentTab === 'audit-logs' && <AuditLogsPage />}

          {currentTab === 'settings' && <SettingsPage />}

          {currentTab === 'methodology' && <MethodologyPage />}

          {currentTab === 'firebase-specs' && <FirebaseSpecsPage />}
        </main>
      </div>

      {/* Floating Toast Notification Stack */}
      <ToastContainer />

      {/* Citizen Report Waterlogging Modal */}
      <CitizenReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={triggerRefresh}
      />

      {/* Drainage CRUD Modal */}
      <DrainageModal
        isOpen={isDrainageModalOpen}
        onClose={handleCloseDrainageModal}
        onSuccess={triggerRefresh}
        editRecord={editDrainageRecord}
        streetsList={streetsList}
      />
    </div>
  );
};
