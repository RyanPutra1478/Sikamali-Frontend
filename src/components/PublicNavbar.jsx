import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function PublicNavbar() {
  const navigate = useNavigate();

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '1rem 5%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: 'white',
      background: 'rgba(6, 78, 59, 0.1)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        cursor: 'pointer'
      }} onClick={() => navigate('/')}>
        <img 
          src="/logo-icon.png" 
          alt="Sikamali Logo" 
          style={{ 
            width: '42px', 
            height: '42px', 
            background: '#ffffff', 
            borderRadius: '12px', 
            padding: '6px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
          }} 
        />
        <span style={{ 
          fontSize: '1.6rem', 
          fontWeight: '900',
          letterSpacing: '0.05em',
          color: '#ffffff',
          textTransform: 'uppercase'
        }}>Sikamali</span>
      </div>
      
      {/* Navbar links removed as requested */}

    </nav>
  );
}
