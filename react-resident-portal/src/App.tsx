import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { ResidentDashboardPage } from './pages/resident/ResidentDashboardPage'
import { ResidentProfilePage } from './pages/resident/ResidentProfilePage'
import { ResidentVisitorsPage } from './pages/resident/ResidentVisitorsPage'

// Placeholder pages (kept minimal to avoid breaking scope). These routes can be expanded safely.
const NotFound = () => (
  <div className="p-6 text-muted-foreground">Not found.</div>
)

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/resident" replace />}
      />

      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/resident"
        element={
          <ProtectedRoute allowedRoles={['resident', 'admin']}>
            <AppLayout>
              <ResidentDashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/profile"
        element={
          <ProtectedRoute allowedRoles={['resident', 'admin']}>
            <AppLayout>
              <ResidentProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/visitors"
        element={
          <ProtectedRoute allowedRoles={['resident', 'admin']}>
            <AppLayout>
              <ResidentVisitorsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

