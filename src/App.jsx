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

import './App.css';
import DataZona from './pages/DataZona';
import DataPenduduk from './pages/DataPenduduk';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showTokenPopup, setShowTokenPopup] = useState(false);

  // Cek kelengkapan profil
  const isProfileComplete = (userData) => {
    if (!userData) return false;
    if (userData.role === 'admin' || userData.role === 'superadmin') return true;

    const hasNama = userData.nama && userData.nama.trim() !== '';
    const hasNIK = userData.nik && userData.nik.trim() !== '';
    const hasAlamat = userData.alamat && userData.alamat.trim() !== '';
    return hasNama && hasNIK && hasAlamat;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
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
    };
  }, []);

  const handleAuth = (authData) => {
    setUser(authData.user);
    localStorage.setItem('token', authData.token);
    if (authData.refreshToken) {
      localStorage.setItem('refreshToken', authData.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(authData.user));
  };

  const handleLogout = () => {
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

  // Guard profil lengkap (khusus role "user")
  const RequireProfile = ({ children }) => {
    if (role !== 'user') return children;
    if (isProfileComplete(user)) return children;

    return (
      <CompleteProfileModal
        user={user}
        onComplete={refreshUser}
        onClose={() => navigate('/dashboard')}
      />
    );
  };

  // Guard role: kalau tidak punya hak, lempar ke dashboard
  const withRoleGuard = (allowedRoles, element) => {
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
    return element;
  };

  const RequireAuth = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

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
          <RequireAuth>
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
          element={withRoleGuard(
            ['user'],
            <RequireProfile>
              <AdminKK user={user} readOnly={false} />
            </RequireProfile>
          )}
        />

        {/* Peta tanah user */}
        <Route
          path="/land"
          element={withRoleGuard(
            ['user'],
            <RequireProfile>
              <Land user={user} />
            </RequireProfile>
          )}
        />

        {/* Pengaduan */}
        <Route
          path="/complaints"
          element={withRoleGuard(
            ['user'],
            <RequireProfile>
              <Complaints />
            </RequireProfile>
          )}
        />

        {/* Kesejahteraan (self-service) */}
        <Route
          path="/kesejahteraan"
          element={withRoleGuard(
            ['user'],
            <RequireProfile>
              <Kesejahteraan />
            </RequireProfile>
          )}
        />

        {/* Kesejahteraan / Angkatan Kerja (self-service) */}
        <Route
          path="/kesejahteraan"
          element={withRoleGuard(
            ['user'],
            <RequireProfile>
              <Kesejahteraan />
            </RequireProfile>
          )}
        />

        <Route
          path="/admin/preview/keluarga"
          element={withRoleGuard(
            ['superadmin', 'admin', 'user', 'guest'],
            <DataPreviewKeluarga user={user} />
          )}
        />

        <Route
          path="/admin/preview/penduduk"
          element={withRoleGuard(
            ['superadmin', 'admin', 'user', 'guest'],
            <DataPreviewPenduduk user={user} />
          )}
        />

        {/* ====== ADMIN AREA ====== */}

        {/* Data Zona (Updated to point to AdminLand as requested) */}
        {/* Note: User requested 'Data Zona' to refer to AdminLand.jsx */}
        {/* We keep /admin/land route for AdminLand component */}



        {/* Admin Land (Now used for 'Data Zona' feature) */}
        <Route
          path="/admin/land"
          element={withRoleGuard(
            ['superadmin', 'admin', 'user'],
            <AdminLand readOnly={!perms?.lokasiZona?.land?.edit} />
          )}
        />

        {/* Admin KK */}

        <Route
          path="/admin/kk"
          element={withRoleGuard(
            ['superadmin', 'admin'],
            <AdminKK mode="full" user={user} />
          )}
        />

        {/* Admin Employment */}
        <Route
          path="/admin/members"
          element={withRoleGuard(
            ['superadmin', 'admin'],
            <AdminMembers user={user} />
          )}
        />

        {/* Admin Employment */}
        <Route
          path="/admin/employment"
          element={withRoleGuard(
            ['superadmin', 'admin'],
            <AdminEmployment
              readOnly={!perms?.database?.employment?.edit}
              canCreate={perms?.database?.employment?.insert}
            />
          )}
        />

        {/* Admin Kesejahteraan */}
        <Route
          path="/admin/kesejahteraan"
          element={withRoleGuard(
            ['superadmin', 'admin'],
            <AdminPrasejahtera
              readOnly={!perms?.database?.kesejahteraan?.edit}
              canCreate={perms?.database?.kesejahteraan?.insert}
              canDelete={perms?.database?.kesejahteraan?.delete}
            />
          )}
        />



        {/* Admin Users – hanya SUPERADMIN */}
        <Route
          path="/admin/users"
          element={withRoleGuard(
            ['superadmin'],
            <AdminUsers currentUser={user} />
          )}
        />

        {/* Admin Pengumuman */}
        <Route
          path="/admin/announcements"
          element={withRoleGuard(
            ['superadmin', 'admin'],
            <AdminAnnouncements readOnly={false} />
          )}
        />

        {/* Admin History Log (Superadmin Only) */}
        <Route
          path="/admin/history"
          element={withRoleGuard(
            ['superadmin'],
            <AdminHistory />
          )}
        />


        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  </RequireAuth>
  } />
</Routes>
  );
}

export default App;