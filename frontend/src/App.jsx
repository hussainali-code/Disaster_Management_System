import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import Teams from './pages/Teams';
import Resources from './pages/Resources';
import Hospitals from './pages/Hospitals';
import Finance from './pages/Finance';
import Approvals from './pages/Approvals';
import Events from './pages/Events';
import Users from './pages/Users';
import AuditTrail from './pages/AuditTrail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/hospitals" element={<ProtectedRoute><Hospitals /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
          <Route path="/approvals"    element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
          <Route path="/events"        element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/users"         element={<ProtectedRoute allowedRoles={['Administrator']}><Users /></ProtectedRoute>} />
          <Route path="/audit-trail"   element={<ProtectedRoute allowedRoles={['Administrator']}><AuditTrail /></ProtectedRoute>} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
