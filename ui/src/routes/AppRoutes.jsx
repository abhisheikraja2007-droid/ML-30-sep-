import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Public Pages
import { Landing } from '../pages/Landing';
import { Login } from '../pages/Login';
import { ForgotPassword } from '../pages/ForgotPassword';

// Protected Pages
import { Dashboard } from '../pages/Dashboard';
import { Resolve } from '../pages/Resolve';
import { Comparison } from '../pages/Comparison';
import { Results } from '../pages/Results';
import { ResultDetailsPage } from '../pages/ResultDetailsPage';
import { Validation } from '../pages/Validation';
import { History } from '../pages/History';
import { Settings } from '../pages/Settings';
import { NotFound } from '../pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes Application Shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Resolve Entity Routes */}
        <Route path="/resolve" element={<Resolve />} />
        <Route path="/resolve/:source1Id" element={<Resolve />} />
        <Route path="/resolve/:source1Id/compare/:candidateId" element={<Comparison />} />

        {/* Results Routes */}
        <Route path="/results" element={<Results />} />
        <Route path="/results/:source1Id" element={<ResultDetailsPage />} />

        {/* Validation & History */}
        <Route path="/validation" element={<Validation />} />
        <Route path="/history" element={<History />} />

        {/* Settings Routes */}
        <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
        <Route path="/settings/profile" element={<Settings />} />
        <Route path="/settings/appearance" element={<Settings />} />
        <Route path="/settings/security" element={<Settings />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
