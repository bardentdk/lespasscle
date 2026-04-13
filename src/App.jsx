import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Contextes
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout & Pages
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Apprenants from './pages/Apprenants';
import Groupes from './pages/Groupes';
import Dossiers from './pages/Dossiers';
import Planning from './pages/Planning';
import Suivi from './pages/Suivi';
import DashboardApprenant from './pages/DashboardApprenant';
import Parametres from './pages/Parametres';
import Exports from './pages/Exports';
import Equipe from './pages/Equipe';
import UpdatePassword from './pages/UpdatePassword';

// Composant de protection par rôle
const RoleProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();
  const role = user?.profile?.role;

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              {/* Page plein écran pour le mot de passe */}
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route element={<AppLayout />}>

                {/* Routes partagées */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/parametres" element={<Parametres />} />

                {/* Routes Admin Uniquement */}
                <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/apprenants" element={<Apprenants />} />
                  <Route path="/equipe" element={<Equipe />} /> {/* <-- NOUVELLE ROUTE ICI */}
                  <Route path="/groupes" element={<Groupes />} />
                  <Route path="/dossiers" element={<Dossiers />} />
                  <Route path="/exports" element={<Exports />} />
                </Route>
                {/* <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/apprenants" element={<Apprenants />} />
                  <Route path="/groupes" element={<Groupes />} />
                  <Route path="/dossiers" element={<Dossiers />} />
                  <Route path="/exports" element={<Exports />} />
                </Route> */}

                {/* Routes Admin & Formateurs */}
                <Route element={<RoleProtectedRoute allowedRoles={['admin', 'formateur']} />}>
                  <Route path="/planning" element={<Planning />} />
                  <Route path="/suivi" element={<Suivi />} />
                </Route>

                {/* Routes Apprenants Uniquement */}
                <Route element={<RoleProtectedRoute allowedRoles={['apprenant']} />}>
                  <Route path="/mon-dossier" element={<Dossiers />} />
                  <Route path="/dashboard-apprenant/:id" element={<DashboardApprenant />} />
                </Route>

              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}