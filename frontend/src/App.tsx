import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AOIProvider } from './context/AOIContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { FireMapPage } from './pages/FireMapPage';
import { CalendarPage } from './pages/CalendarPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { TrendsPage } from './pages/TrendsPage';
import { InsightsPage } from './pages/InsightsPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AOIProvider>
        <BrowserRouter>
          <div className="flex h-screen w-screen overflow-hidden bg-[#F4F1E9] font-sans text-[#252923] antialiased">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/fire-map" element={<FireMapPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/comparison" element={<ComparisonPage />} />
                <Route path="/trends" element={<TrendsPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/data-sources" element={<DataSourcesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </AOIProvider>
    </ToastProvider>
  );
};

export default App;
