import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { can } from '../utils/permissions';
import { 
  LayoutDashboard, Database, Eye, Globe, Megaphone, 
  Users, ScrollText, ChevronRight, HelpCircle, User,
  Circle, AlertCircle, X
} from 'lucide-react';
import './Sidebar.css';

// =========================================================
// 1. MENU CONFIG DENGAN METADATA PERMISSION
// =========================================================

const BASE_MENU = [
  {
    to: '/dashboard',
    icon: <LayoutDashboard size={20} />,
    label: 'Dashboard',
    type: 'single'
  },
  {
    label: 'Database',
    icon: <Database size={20} />,
    type: 'group',
    key: 'database',
    children: [
      {
        to: '/admin/kk',
        label: 'Kartu Keluarga',
        permission: { section: 'database', module: 'kk', action: 'view' }
      },
      {
        to: '/admin/members',
        label: 'Anggota Keluarga',
        permission: { section: 'database', module: 'kk', action: 'view' }
      },
      {
        to: '/admin/employment',
        label: 'Angkatan Kerja',
        permission: { section: 'database', module: 'employment', action: 'view' }
      },
      {
        to: '/admin/kesejahteraan',
        label: 'Kesejahteraan',
        permission: { section: 'database', module: 'kesejahteraan', action: 'view' }
      },
    ],
  },
  {
    label: 'Data Preview',
    icon: <Eye size={20} />,
    type: 'group',
    key: 'preview',
    children: [
      {
        to: '/admin/preview/keluarga',
        label: 'Data Preview Keluarga',
        permission: { section: 'dataPreview', module: 'penduduk', action: 'view' }
      },
      {
        to: '/admin/preview/penduduk',
        label: 'Data Preview Penduduk',
        permission: { section: 'dataPreview', module: 'penduduk', action: 'view' }
      },
    ],
  },
  {
    to: '/admin/land',
    icon: <Globe size={20} />,
    label: 'Lokasi & Domisili',
    type: 'single',
    permission: { section: 'lokasiZona', module: 'land', action: 'view' }
  },
  {
    to: '/admin/announcements',
    icon: <Megaphone size={20} />,
    label: 'Pengumuman',
    type: 'single',
    permission: { section: 'management', module: 'announcements', action: 'view' }
  },
  {
    to: '/admin/users',
    icon: <Users size={20} />,
    label: 'Manajemen User',
    type: 'single',
    permission: { section: 'management', module: 'users', action: 'view' }
  },
  {
    to: '/admin/history',
    icon: <ScrollText size={20} />,
    label: 'History Log',
    type: 'single',
    permission: { section: 'management', module: 'users', action: 'view' }
  },
];

const ROLE_LABEL = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
  guest: 'Guest',
};

export default function Sidebar({ user, isOpen, onClose }) {
  const location = useLocation();
  const role = user?.role || 'guest';
  const [openGroup, setOpenGroup] = useState(null);
  const [showDeniedPopup, setShowDeniedPopup] = useState(false);

  const menuConfig = useMemo(() => {
    const filterItems = (items) => {
      return items.reduce((acc, item) => {
        if (role === 'guest') {
          const isDashboard = item.label === 'Dashboard';
          const isPreviewGroup = item.key === 'preview';
          const isPreviewChild = item.permission && item.permission.section === 'dataPreview';
          if (!isDashboard && !isPreviewGroup && !isPreviewChild) return acc;
        }

        let isAllowed = true;
        if (item.permission) {
          isAllowed = can(role, item.permission.section, item.permission.module, item.permission.action);
        }
        if (!isAllowed) return acc;

        if (item.children) {
          const filteredChildren = filterItems(item.children);
          if (filteredChildren.length > 0) {
            acc.push({ ...item, children: filteredChildren });
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, []);
    };
    return filterItems(BASE_MENU);
  }, [role]);

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  useEffect(() => {
    menuConfig.forEach((item) => {
      if (
        item.type === 'group' &&
        item.children?.some((child) => location.pathname.startsWith(child.to))
      ) {
        setOpenGroup(item.key);
      }
    });
  }, [location.pathname, menuConfig]);

  useEffect(() => {
    if (window.innerWidth <= 1024 && onClose) onClose();
  }, [location.pathname]);

  const renderItem = (item) => {
    const isDatabaseItem = (item) => {
      // Check if item or its parent is part of database
      if (item.key === 'database') return true;
      if (item.permission?.section === 'database') return true;
      return false;
    };

    const handleProtectedClick = (e, targetItem) => {
      if (role === 'user' && isDatabaseItem(targetItem)) {
        e.preventDefault();
        setShowDeniedPopup(true);
      }
    };

    if (item.type === 'single' || !item.children) {
      return (
        <Link
          key={item.to}
          to={item.to}
          onClick={(e) => handleProtectedClick(e, item)}
          className={`sidebar-item ${isActive(item.to) ? 'active' : ''}`}
        >
          <span className="sidebar-icon">{item.icon}</span>
          <span className="sidebar-label">{item.label}</span>
        </Link>
      );
    }

    const isOpenGroup = openGroup === item.key;
    return (
      <div key={item.key} className={`sidebar-group ${isOpenGroup ? 'open' : ''}`}>
        <div
          className="sidebar-item group-header"
          onClick={() => {
            if (role === 'user' && item.key === 'database') {
              setShowDeniedPopup(true);
            } else {
              setOpenGroup(isOpenGroup ? null : item.key);
            }
          }}
        >
          <span className="sidebar-icon">{item.icon}</span>
          <span className="sidebar-label">{item.label}</span>
          <ChevronRight 
            size={14} 
            className="chevron" 
            style={{ 
              transform: isOpenGroup ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform 0.3s ease'
            }} 
          />
        </div>

        {isOpenGroup && (
          <div className="submenu">
            {item.children.map((child) => (
              <Link
                key={child.to}
                to={child.to}
                onClick={(e) => handleProtectedClick(e, child)}
                className={`submenu-item ${isActive(child.to) ? 'active' : ''}`}
              >
                <div className="submenu-bullet"></div>
                <span>{child.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const roleLabel = ROLE_LABEL[role] || role;

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-icon">
          <img src="/logo-icon.png" alt="Sikamali" style={{ width: '40px' }} />
        </div>
        <div className="logo-text">
          <h2>SIKAMALI</h2>
          <span className="role-badge">{roleLabel}</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose}>×</button>
      </div>

      <div className="sidebar-content">
        <p className="section-title">MENU UTAMA</p>
        <div className="sidebar-menu-list">
          {menuConfig.map(renderItem)}
        </div>
      </div>

      {/* Access Denied Popup */}
      {showDeniedPopup && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'white',
            width: '90%',
            maxWidth: '380px',
            borderRadius: '24px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #f1f5f9',
            position: 'relative',
            animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <button 
              onClick={() => setShowDeniedPopup(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#f8fafc',
                border: 'none',
                borderRadius: '50%',
                padding: '5px',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: '64px',
              height: '64px',
              background: '#fef2f2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#ef4444'
            }}>
              <AlertCircle size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>
              Akses Terbatas
            </h3>
            
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              Maaf, halaman ini tidak dapat diakses oleh user.
            </p>

            <button 
              onClick={() => setShowDeniedPopup(false)}
              style={{
                marginTop: '25px',
                width: '100%',
                padding: '12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
              onMouseOver={(e) => e.target.style.background = '#059669'}
              onMouseOut={(e) => e.target.style.background = '#10b981'}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar-circle">
            <User size={20} />
          </div>
          <div className="user-info">
            <p className="user-name">{user?.username || 'Pengguna'}</p>
            <div className="status-indicator">
              <span className="status-dot"></span> Online
            </div>
          </div>
        </div>

        <div className="help-box">
          <div className="help-icon">
            <HelpCircle size={20} />
          </div>
          <div className="help-text">
            <p>Butuh Bantuan?</p>
            <button className="help-button">Hubungi Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
}