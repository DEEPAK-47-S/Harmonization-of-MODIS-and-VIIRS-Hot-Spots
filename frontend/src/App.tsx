import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AOIProvider } from './context/AOIContext';
import { ToastProvider } from './context/ToastContext';
import { NavProvider } from './context/NavContext';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { GlobalExplorerPage } from './pages/GlobalExplorerPage';
import { FireMapPage } from './pages/FireMapPage';
import { CalendarPage } from './pages/CalendarPage';
import { TimeMachinePage } from './pages/TimeMachinePage';
import { ComparisonPage } from './pages/ComparisonPage';
import { CountryComparisonPage } from './pages/CountryComparisonPage';
import { TrendsPage } from './pages/TrendsPage';
import { InsightsPage } from './pages/InsightsPage';
import { CoverageMatrixPage } from './pages/CoverageMatrixPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AOIProvider>
        <NavProvider>
          <BrowserRouter>
            <div className="flex h-screen w-screen overflow-hidden bg-[#F4F1E9] font-sans text-[#252923] antialiased">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-14 md:pb-0">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/global-explorer" element={<GlobalExplorerPage />} />
                  <Route path="/fire-map" element={<FireMapPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/time-machine" element={<TimeMachinePage />} />
                  <Route path="/comparison" element={<ComparisonPage />} />
                  <Route path="/country-comparison" element={<CountryComparisonPage />} />
                  <Route path="/trends" element={<TrendsPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/coverage" element={<CoverageMatrixPage />} />
                  <Route path="/data-sources" element={<DataSourcesPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
              <MobileBottomNav />
            </div>
          </BrowserRouter>
        </NavProvider>
      </AOIProvider>
    </ToastProvider>
  );
};

export default App;
