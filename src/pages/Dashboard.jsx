import React, { useState, useEffect } from 'react';
import { adminAPI, announcementAPI } from '../services/api';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell 
} from 'recharts';
import { 
  LayoutDashboard, Megaphone, Users, Home, Briefcase, 
  AlertCircle, FileText, User, MapPin, TrendingUp,
  GraduationCap
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = user?.role;
  const canViewStats = role === 'admin' || role === 'executive_guest' || role === 'guest';
  const isGuest = role === 'guest';

  useEffect(() => {
    loadAnnouncements();
    if (canViewStats) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [canViewStats]);

  const loadAnnouncements = async () => {
    try {
      const data = await announcementAPI.get();
      const activeNews = data.filter(item => item.is_active);
      setAnnouncements(activeNews);
    } catch (err) {
      console.error("Gagal memuat pengumuman", err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-banner">
        <div className="banner-content banner-fade-in">
          <div className="hero-badge">
            <LayoutDashboard size={16} /> Dashboard
          </div>
          <h1 className="dashboard-title">
            Selamat Datang, <span className="highlight-text">{user?.nama || user?.username}</span>
          </h1>
          <p className="dashboard-subtitle">
            Akses pusat informasi kependudukan dan manajemen data masyarakat lingkar tambang SIKAMALI.
          </p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* PENGUMUMAN - INTEGRATED AND STYLED */}
        <div className="animate-up delay-1" style={{ marginBottom: '3rem' }}>
          <div className="section-header">
            <Megaphone size={24} color="#f59e0b" />
            <h3>Papan Pengumuman</h3>
          </div>
          
          <div className="announcement-grid">
            {announcements.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Belum ada pengumuman hari ini.</p>
            ) : (
              announcements.map((news) => (
                <div key={news.id} className="premium-news-card">
                  <div className="news-header">
                    <span className="news-date">
                      {new Date(news.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                    <span className="news-badge">Info</span>
                  </div>
                  <h4>{news.title}</h4>
                  <p className="news-content">{news.content}</p>
                  <div className="news-footer">
                    <User size={14} /> <span>{news.author_name || 'Admin'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
