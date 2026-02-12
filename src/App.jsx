// D:\Sikamali-main\frontend\src\App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthForm from './components/AuthForm';
import CompleteProfileModal from './components/CompleteProfileModal';
import TokenExpirationPopup from './components/TokenExpirationPopup';
import ForceChangePassword from './components/ForceChangePassword';

import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Land from './pages/Land';
import Complaints from './pages/Complaints';
import Kesejahteraan from './pages/Kesejahteraan';

// Admin pages
import AdminLand from './pages/AdminLand';
import AdminKK from './pages/AdminKK';
import AdminMembers from './pages/AdminMembers';
import AdminEmployment from './pages/AdminEmployment';
import AdminPrasejahtera from './pages/AdminPrasejahtera';
import AdminUsers from './pages/AdminUsers';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminHistory from './pages/AdminHistory';
import DataPreviewKeluarga from './pages/DataPreviewKeluarga';
import DataPreviewPenduduk from './pages/DataPreviewPenduduk';
import LandingPage from './pages/LandingPage';

import { getRolePermissions } from './utils/permissions';
import { initTokenRefresh, cleanupTokenRefresh } from './services/api';

import './App.css';
import DataZona from './pages/DataZona';
import DataPenduduk from './pages/DataPenduduk';

// Cek kelengkapan profil
const isProfileComplete = (userData) => {
  if (!userData) return false;
  if (userData.role === 'admin' || userData.role === 'superadmin') return true;

  const hasNama = userData.nama && userData.nama.trim() !== '';
  const hasNIK = userData.nik && userData.nik.trim() !== '';
  const hasAlamat = userData.alamat && userData.alamat.trim() !== '';
  return hasNama && hasNIK && hasAlamat;
};

// Guard components outside move to avoid re-creation on every render
const RequireAuth = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RequireProfile = ({ user, role, onComplete, onCancel, children }) => {
  if (role !== 'user') return children;
  if (isProfileComplete(user)) return children;

  return (
    <CompleteProfileModal
      user={user}
      onComplete={onComplete}
      onClose={onCancel}
    />
  );
};

const RoleGuard = ({ allowedRoles, role, children }) => {
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showTokenPopup, setShowTokenPopup] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        // Initialize token refresh mechanism
        initTokenRefresh();
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);

    const handleTokenExpiration = () => {
      setShowTokenPopup(true);
    };

    window.addEventListener('token-expired', handleTokenExpiration);

    return () => {
      window.removeEventListener('token-expired', handleTokenExpiration);
      cleanupTokenRefresh();
    };
  }, []);

  const handleAuth = (authData) => {
    setUser(authData.user);
    localStorage.setItem('token', authData.token);
    if (authData.refreshToken) {
      localStorage.setItem('refreshToken', authData.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(authData.user));
    // Initialize token refresh after login
    initTokenRefresh();
  };

  const handleLogout = () => {
    // Cleanup token refresh before logout
    cleanupTokenRefresh();
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setShowTokenPopup(false);
    navigate('/');
  };

  const refreshUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        Memuat...
      </div>
    );
  }

  // Guards & Derived State (Only if user is logged in)
  let role = null;
  let perms = null;

  if (user) {
    role = user.role;
    perms = getRolePermissions(role);
  }



  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/login" 
        element={
          !user ? (
            <AuthForm onAuth={(authData) => {
              handleAuth(authData);
              navigate('/dashboard');
            }} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } 
      />

      {/* PRIVATE ROUTES */}
      <Route
        path="/*"
        element={
          <RequireAuth user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <TokenExpirationPopup
                isOpen={showTokenPopup}
                onClose={handleLogout}
              />
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route
                  path="/profile"
                  element={
                    role === 'user'
                      ? <Profile user={user} onUpdateUser={refreshUser} />
                      : <Navigate to="/dashboard" />
                  }
                />

                {/* ====== USER SELF-SERVICE (butuh profil lengkap) ====== */}

                {/* KK / Documents */}
                <Route
                  path="/documents"
                  element={
                    <RoleGuard allowedRoles={['user']} role={role}>
                      <RequireProfile user={user} role={role} onComplete={refreshUser} onCancel={() => navigate('/dashboard')}>
                        <AdminKK user={user} readOnly={false} />
                      </RequireProfile>
                    </RoleGuard>
                  }
                />

                {/* Peta tanah user */}
                <Route
                  path="/land"
                  element={
                    <RoleGuard allowedRoles={['user']} role={role}>
                      <RequireProfile user={user} role={role} onComplete={refreshUser} onCancel={() => navigate('/dashboard')}>
                        <Land user={user} />
                      </RequireProfile>
                    </RoleGuard>
                  }
                />

                {/* Pengaduan */}
                <Route
                  path="/complaints"
                  element={
                    <RoleGuard allowedRoles={['user']} role={role}>
                      <RequireProfile user={user} role={role} onComplete={refreshUser} onCancel={() => navigate('/dashboard')}>
                        <Complaints />
                      </RequireProfile>
                    </RoleGuard>
                  }
                />

                {/* Kesejahteraan (self-service) */}
                <Route
                  path="/kesejahteraan"
                  element={
                    <RoleGuard allowedRoles={['user']} role={role}>
                      <RequireProfile user={user} role={role} onComplete={refreshUser} onCancel={() => navigate('/dashboard')}>
                        <Kesejahteraan />
                      </RequireProfile>
                    </RoleGuard>
                  }
                />

                <Route
                  path="/admin/preview/keluarga"
                  element={
                    <RoleGuard allowedRoles={['superadmin', 'admin', 'user', 'guest']} role={role}>
                      <DataPreviewKeluarga user={user} />
                    </RoleGuard>
                  }
                />

                <Route
                  path="/admin/preview/penduduk"
                  element={
                    <RoleGuard allowedRoles={['superadmin', 'admin', 'user', 'guest']} role={role}>
                      <DataPreviewPenduduk user={user} />
                    </RoleGuard>
                  }
                />

                {/* ====== ADMIN AREA ====== */}

                {/* Admin Land (Now used for 'Data Zona' feature) */}
                <Route
                  path="/admin/land"
                  element={
                    <RoleGuard allowedRoles={['superadmin', 'admin', 'user']} role={role}>
                      <AdminLand readOnly={!perms?.lokasiZona?.land?.edit} />
                    </RoleGuard>
                  }
                />

                {/* Admin KK */}
                <Route
                  path="/admin/kk"
                  element={
                    <RoleGuard allowedRoles={['superadmin', 'admin']} role={role}>
                      <AdminKK mode="full" user={user} />
                    </RoleGuard>
                  }
                />

                {/* Admin Members */}
                <Route
                  path="/admin/members"
                  element={
                    <RoleGuard allowedRoles={['superadmin', 'admin']} role={role}>
                      <AdminMembers user={user} />
                    </RoleGuard>
                  }
                />

                {/* Admin Employment */}
                <Route
                  path="/admin/employment"
                  element={
                    <RoleGuard allowedRoles={['superadmin', 'admin']} role={role}>
                      <AdminEmployment
                        readOnly={!perms?.database?.employment?.edit}
                        canCreate={perms?.database?.employment?.insert}
                      />
                    </RoleGuard>
                  }
                />

                {/* Admin Kesejahteraan */}
                <Route
                  path="/admin/kesejahteraan"
                  element={
                    <RoleGuard allowedRoles={['superadmin', 'admin']} role={role}>
                      <AdminPrasejahtera
                        readOnly={!perms?.database?.kesejahteraan?.edit}
                        canCreate={perms?.database?.kesejahteraan?.insert}
                        canDelete={perms?.database?.kesejahteraan?.delete}
                        canExport={perms?.database?.kesejahteraan?.export}
                      />
                    </RoleGuard>
                  }
                />

                {/* Admin Users – hanya SUPERADMIN */}
                <Route
                  path="/admin/users"
                  element={
                    <RoleGuard allowedRoles={['superadmin']} role={role}>
                      <AdminUsers currentUser={user} />
                    </RoleGuard>
                  }
                />

                {/* Admin Pengumuman */}
                <Route
                  path="/admin/announcements"
                  element={
                    <RoleGuard allowedRoles={['superadmin', 'admin']} role={role}>
                      <AdminAnnouncements readOnly={false} />
                    </RoleGuard>
                  }
                />

                {/* Admin History Log (Superadmin Only) */}
                <Route
                  path="/admin/history"
                  element={
                    <RoleGuard allowedRoles={['superadmin']} role={role}>
                      <AdminHistory />
                    </RoleGuard>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;