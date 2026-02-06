import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';
import './UserDropdown.css';

export default function UserDropdown({ user, onLogout, onProfileClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);


  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="user-dropdown-container" ref={dropdownRef}>
      <button 
        className={`user-dropdown-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="user-name">{user?.nama || user?.username || 'User'}</span>
        <ChevronDown size={16} style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
          transition: 'transform 0.3s ease' 
        }} />
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-info">
            <span className="user-name">{user?.nama || user?.username}</span>
            <span className="user-role">{user?.role?.replace('_', ' ')}</span>
          </div>
          <button onClick={handleLogout} className="dropdown-item logout-btn">
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      )}
    </div>
  );
}

