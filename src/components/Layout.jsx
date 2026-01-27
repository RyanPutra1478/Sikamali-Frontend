import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import UserDropdown from './UserDropdown';
import './Layout.css';

export default function Layout({ children, user, onLogout }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    navigate('/profile');
  };

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <header className="main-header">
          <div className="header-left">
            {/* Hamburger Menu Button */}
            <button
              className="hamburger-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              ☰
            </button>

            <div className="logo-container">
              <img src="/logo-icon.png" alt="Sikamali Logo" className="logo-image" style={{ height: '40px', width: 'auto' }} />
              <h1 className="app-title">Sistem Informasi Kependudukan Masyarakat Lingkar Tambang</h1>
            </div>
          </div>
          <div className="header-right">
            <UserDropdown
              user={user}
              onLogout={handleLogout}
              onProfileClick={handleProfileClick}
            />
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
