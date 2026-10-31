import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CommandCenter from './pages/CommandCenter';
import ClaimsList from './pages/ClaimsList';
import ClaimDetail from './pages/ClaimDetail';
import EvidenceUpload from './pages/EvidenceUpload';
import EvidenceStudio from './pages/EvidenceStudio';
import AgentCenter from './pages/AgentCenter';
import EvidenceGraph from './pages/EvidenceGraph';
import AdaptiveSimulator from './pages/AdaptiveSimulator';
import HumanReview from './pages/HumanReview';
import Reports from './pages/Reports';
import AdminConsole from './pages/AdminConsole';
import { auth } from './api';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Application Workspace */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="command-center" element={<CommandCenter />} />
          <Route path="claims" element={<ClaimsList />} />
          <Route path="claims/:claimId" element={<ClaimDetail />} />
          <Route path="evidence" element={<EvidenceUpload />} />
          <Route path="evidence/:claimId" element={<EvidenceUpload />} />
          <Route path="studio" element={<EvidenceStudio />} />
          <Route path="studio/:claimId" element={<EvidenceStudio />} />
          <Route path="agents" element={<AgentCenter />} />
          <Route path="agents/:claimId" element={<AgentCenter />} />
          <Route path="graph" element={<EvidenceGraph />} />
          <Route path="graph/:claimId" element={<EvidenceGraph />} />
          <Route path="simulator" element={<AdaptiveSimulator />} />
          <Route path="simulator/:claimId" element={<AdaptiveSimulator />} />
          <Route path="review" element={<HumanReview />} />
          <Route path="review/:claimId" element={<HumanReview />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:claimId" element={<Reports />} />
          <Route path="admin" element={<AdminConsole />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
