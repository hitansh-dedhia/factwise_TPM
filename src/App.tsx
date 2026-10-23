import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { getRoleHomeRoute } from './lib/permissions';

// Screens S1 to S11
import { LoginScreen } from './screens/LoginScreen';
import { PatientListScreen } from './screens/PatientListScreen';
import { RecordTempScreen } from './screens/RecordTempScreen';
import { PatientDetailScreen } from './screens/PatientDetailScreen';
import { LogVisitScreen } from './screens/LogVisitScreen';
import { DischargeQueueScreen } from './screens/DischargeQueueScreen';
import { AdmitPatientScreen } from './screens/AdmitPatientScreen';
import { RoomOccupancyScreen } from './screens/RoomOccupancyScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { AuditLogScreen } from './screens/AuditLogScreen';
import { NotFoundPage } from './screens/NotFoundPage';

/** Redirects authenticated user from / to their role's home route */
const RoleHomeRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomeRoute(user.role)} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <Routes>
            {/* Public S1: Login */}
            <Route path="/login" element={<LoginScreen />} />

            {/* Authenticated Layout: S2 AppShell */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Root redirect to role-specific home */}
              <Route index element={<RoleHomeRedirect />} />

              {/* S10: Dashboard (ADMIN, HEAD_DOCTOR) */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute requiredAction="view_dashboard">
                    <DashboardScreen />
                  </ProtectedRoute>
                }
              />

              {/* S3: Patient List (All roles) */}
              <Route
                path="patients"
                element={
                  <ProtectedRoute requiredAction="view_patient_list">
                    <PatientListScreen />
                  </ProtectedRoute>
                }
              />

              {/* S5: Patient Detail (All roles) */}
              <Route
                path="patients/:id"
                element={
                  <ProtectedRoute requiredAction="view_patient_history">
                    <PatientDetailScreen />
                  </ProtectedRoute>
                }
              />

              {/* S4: Record Temperature (NURSE, DOCTOR fallback) */}
              <Route
                path="patients/:id/record-temp"
                element={
                  <ProtectedRoute
                    requiredActionsAny={['record_temperature', 'record_temperature_fallback']}
                  >
                    <RecordTempScreen />
                  </ProtectedRoute>
                }
              />

              {/* S6: Log Doctor Visit (DOCTOR only) */}
              <Route
                path="patients/:id/log-visit"
                element={
                  <ProtectedRoute requiredAction="log_visit">
                    <LogVisitScreen />
                  </ProtectedRoute>
                }
              />

              {/* S7: Discharge Queue (DOCTOR, ADMIN, HEAD_DOCTOR) */}
              <Route
                path="discharge"
                element={
                  <ProtectedRoute requiredAction="view_discharge_queue">
                    <DischargeQueueScreen />
                  </ProtectedRoute>
                }
              />

              {/* S8: Admit Patient (ADMIN only) */}
              <Route
                path="admit"
                element={
                  <ProtectedRoute requiredAction="admit_patient">
                    <AdmitPatientScreen />
                  </ProtectedRoute>
                }
              />

              {/* S9: Room Occupancy (All roles) */}
              <Route
                path="rooms"
                element={
                  <ProtectedRoute requiredAction="view_room_occupancy">
                    <RoomOccupancyScreen />
                  </ProtectedRoute>
                }
              />

              {/* S11: Audit Log (ADMIN, HEAD_DOCTOR) */}
              <Route
                path="audit"
                element={
                  <ProtectedRoute requiredAction="view_audit_log">
                    <AuditLogScreen />
                  </ProtectedRoute>
                }
              />

              {/* 404 inside layout */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Global fallback 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
