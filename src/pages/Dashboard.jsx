import React, { useState, useEffect } from 'react';
import { statisticsAPI } from '../services/api';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import {
  LayoutDashboard, Users, Home, Briefcase,
  AlertCircle, User, TrendingUp, CheckCircle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import './Dashboard.css';

// --- CHART FILTER HELPERS ---
const getKkFilterName = (filter) => {
  switch (filter) {
    case 'jumlahKK': return 'Jumlah KK';
    case 'praSejahtera': return 'Pra Sejahtera';
    case 'sejahtera': return 'Sejahtera';
    case 'sejahteraMandiri': return 'Sejahtera Mandiri';
    default: return 'Jumlah KK';
  }
};

const getKkColor = (filter) => {
  switch (filter) {
    case 'jumlahKK': return '#3b82f6';
    case 'praSejahtera': return '#f43f5e';
    case 'sejahtera': return '#6366f1';
    case 'sejahteraMandiri': return '#10b981';
    default: return '#3b82f6';
  }
};

const getPendudukFilterName = (filter) => {
  switch (filter) {
    case 'jumlahPenduduk': return 'Jumlah Penduduk';
    case 'angkatanKerja': return 'Angkatan Kerja';
    case 'sudahBekerja': return 'Sudah Bekerja';
    case 'belumBekerja': return 'Belum Bekerja';
    default: return 'Jumlah Penduduk';
  }
};

const getPendudukColor = (filter) => {
  switch (filter) {
    case 'jumlahPenduduk': return '#3b82f6';
    case 'angkatanKerja': return '#8b5cf6';
    case 'sudahBekerja': return '#10b981';
    case 'belumBekerja': return '#f43f5e';
    default: return '#6366f1';
  }
};

const formatDesaLabel = (desaName) => {
  if (!desaName) return '';
  const name = String(desaName).trim().toUpperCase();
  if (name.includes('TOLOWE') || name.includes('PONRE') || name.includes('WARU')) {
    return 'TOLOWE P.W.';
  }
  if (name.includes('MUARA') && (name.includes('LAPAO') || name.includes('PAO'))) {
    return 'MUARA L.P.';
  }
  return name;
};

export default function Dashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [kkStats, setKkStats] = useState([]);
  const [pendudukStats, setPendudukStats] = useState([]);
  
  // Totals for table footer
  const [kkTotal, setKkTotal] = useState({
    desa: 'TOTAL', jumlahKK: 0, praSejahtera: 0, sejahtera: 0, sejahteraMandiri: 0
  });
  const [pendudukTotal, setPendudukTotal] = useState({
    desa: 'TOTAL', jumlahPenduduk: 0, angkatanKerja: 0, sudahBekerja: 0, belumBekerja: 0
  });

  // Dashboard Summary stats (if needed)
  const [dashboardSummary, setDashboardSummary] = useState(null);

  // Dynamic Chart Filters
  const [kkFilter, setKkFilter] = useState('jumlahKK');
  const [pendudukFilter, setPendudukFilter] = useState('jumlahPenduduk');
  const [chartHeight, setChartHeight] = useState(280);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const updateChartHeight = () => {
      const width = window.innerWidth;
      if (width >= 1600) {
        setChartHeight(210);
      } else if (width >= 1280) {
        setChartHeight(220);
      } else if (width >= 1024) {
        setChartHeight(240);
      } else {
        setChartHeight(280);
      }
    };

    updateChartHeight();
    window.addEventListener('resize', updateChartHeight);
    return () => window.removeEventListener('resize', updateChartHeight);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [detailedStatsRes, dashboardStatsRes] = await Promise.all([
        statisticsAPI.getDetailed().catch(() => []),
        statisticsAPI.getDashboard().catch(() => ({}))
      ]);

      const detailedStats = Array.isArray(detailedStatsRes) ? detailedStatsRes : detailedStatsRes?.data || [];
      
      const mappedKkStats = detailedStats.map(item => ({
        desa: item.desa || '',
        jumlahKK: Number(item.totalKK) || 0,
        praSejahtera: Number(item.keluargaPrasejahtera) || 0,
        sejahtera: Number(item.keluargaSejahtera) || 0,
        sejahteraMandiri: Number(item.keluargaSejahteraMandiri) || 0
      }));

      const mappedPendudukStats = detailedStats.map(item => ({
        desa: item.desa || '',
        jumlahPenduduk: Number(item.totalPenduduk) || 0,
        angkatanKerja: Number(item.angkatanKerja) || 0,
        sudahBekerja: Number(item.sudahBekerja) || 0,
        belumBekerja: Number(item.belumBekerja) || 0
      }));

      setKkStats(mappedKkStats);
      setPendudukStats(mappedPendudukStats);

      setKkTotal({
        desa: 'TOTAL',
        jumlahKK: mappedKkStats.reduce((acc, curr) => acc + curr.jumlahKK, 0),
        praSejahtera: mappedKkStats.reduce((acc, curr) => acc + curr.praSejahtera, 0),
        sejahtera: mappedKkStats.reduce((acc, curr) => acc + curr.sejahtera, 0),
        sejahteraMandiri: mappedKkStats.reduce((acc, curr) => acc + curr.sejahteraMandiri, 0)
      });

      setPendudukTotal({
        desa: 'TOTAL',
        jumlahPenduduk: mappedPendudukStats.reduce((acc, curr) => acc + curr.jumlahPenduduk, 0),
        angkatanKerja: mappedPendudukStats.reduce((acc, curr) => acc + curr.angkatanKerja, 0),
        sudahBekerja: mappedPendudukStats.reduce((acc, curr) => acc + curr.sudahBekerja, 0),
        belumBekerja: mappedPendudukStats.reduce((acc, curr) => acc + curr.belumBekerja, 0)
      });

      setDashboardSummary(dashboardStatsRes);
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Memuat Data Dashboard Premium...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        {/* Banner */}
        <div className="dashboard-banner animate-up">
          <div className="banner-content banner-fade-in">
            <div className="banner-text">
              <h1 className="dashboard-title">
                Selamat Datang, <span className="highlight-text">{user?.nama || user?.username}</span>
              </h1>
              <p className="dashboard-subtitle">
                Akses pusat informasi kependudukan dan statistik kesejahteraan terintegrasi lingkar tambang.
              </p>
            </div>
            <div className="hero-badge">
              <LayoutDashboard size={16} /> Dashboard Ringkasan Wilayah
            </div>
          </div>
        </div>

        {/* VILLAGE LEVEL DATA TABLES */}
        <div className="dashboard-tables-section animate-up delay-1">
          <div className="dashboard-tables-grid">

            {/* TABLE 1: DATA KK */}
            <div className="premium-table-card">
              <div className="table-card-header">
                <h3>Data KK</h3>
                <span className="badge-green">Keluarga</span>
              </div>
              <div className="dashboard-table-wrapper">
                <table className="premium-summary-table">
                  <thead>
                    <tr>
                      <th>DESA</th>
                      <th className="align-center">JUMLAH KK</th>
                      <th className="align-center">PRA SEJAHTERA</th>
                      <th className="align-center">SEJAHTERA</th>
                      <th className="align-center">SEJAHTERA MANDIRI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kkStats.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.desa}</td>
                        <td className="align-center font-medium color-primary">{row.jumlahKK.toLocaleString('id-ID')}</td>
                        <td className="align-center text-rose">{row.praSejahtera.toLocaleString('id-ID')}</td>
                        <td className="align-center text-indigo">{row.sejahtera.toLocaleString('id-ID')}</td>
                        <td className="align-center text-emerald">{row.sejahteraMandiri.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>{kkTotal.desa}</td>
                      <td className="align-center">{kkTotal.jumlahKK.toLocaleString('id-ID')}</td>
                      <td className="align-center">{kkTotal.praSejahtera.toLocaleString('id-ID')}</td>
                      <td className="align-center">{kkTotal.sejahtera.toLocaleString('id-ID')}</td>
                      <td className="align-center">{kkTotal.sejahteraMandiri.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABLE 2: DATA PENDUDUK */}
            <div className="premium-table-card">
              <div className="table-card-header">
                <h3>Data Penduduk</h3>
                <span className="badge-blue">Jiwa</span>
              </div>
              <div className="dashboard-table-wrapper">
                <table className="premium-summary-table">
                  <thead>
                    <tr>
                      <th>DESA</th>
                      <th className="align-center">JUMLAH PENDUDUK</th>
                      <th className="align-center">ANGKATAN KERJA</th>
                      <th className="align-center">SUDAH BEKERJA</th>
                      <th className="align-center">BELUM BEKERJA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendudukStats.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.desa}</td>
                        <td className="align-center font-medium color-primary">{row.jumlahPenduduk.toLocaleString('id-ID')}</td>
                        <td className="align-center text-purple">{row.angkatanKerja.toLocaleString('id-ID')}</td>
                        <td className="align-center text-emerald">{row.sudahBekerja.toLocaleString('id-ID')}</td>
                        <td className="align-center text-rose">{row.belumBekerja.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>{pendudukTotal.desa}</td>
                      <td className="align-center">{pendudukTotal.jumlahPenduduk.toLocaleString('id-ID')}</td>
                      <td className="align-center">{pendudukTotal.angkatanKerja.toLocaleString('id-ID')}</td>
                      <td className="align-center">{pendudukTotal.sudahBekerja.toLocaleString('id-ID')}</td>
                      <td className="align-center">{pendudukTotal.belumBekerja.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* HIGH-FIDELITY RECHARTS CHARTS */}
        <div className="dashboard-charts-section animate-up delay-2">
          <div className="dashboard-charts-grid">

            {/* CHART 1: GRAFIK DATA KK */}
            <div className="premium-chart-card">
              <div className="chart-card-header">
                <h3>Grafik Data KK</h3>
                <select
                  className="chart-filter-select filter-green"
                  value={kkFilter}
                  onChange={(e) => setKkFilter(e.target.value)}
                >
                  <option value="jumlahKK">Jumlah KK</option>
                  <option value="praSejahtera">Pra Sejahtera</option>
                  <option value="sejahtera">Sejahtera</option>
                  <option value="sejahteraMandiri">Sejahtera Mandiri</option>
                </select>
              </div>
              <div className="recharts-container-premium">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <ReBarChart data={kkStats} margin={{ top: 16, right: 16, left: 6, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" vertical={false} />
                    <XAxis
                      dataKey="desa"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                      height={44}
                      tickMargin={8}
                      interval={0}
                      tickFormatter={formatDesaLabel}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <ReTooltip
                      cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                      contentStyle={{
                        background: '#064e3b',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        borderRadius: '16px',
                        padding: '12px'
                      }}
                      itemStyle={{ fontWeight: 'bold', color: 'white' }}
                      labelStyle={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Bar
                      dataKey={kkFilter}
                      name={getKkFilterName(kkFilter)}
                      radius={[8, 8, 0, 0]}
                      barSize={40}
                      fill={getKkColor(kkFilter)}
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    >
                      <LabelList
                        dataKey={kkFilter}
                        position="top"
                        fill="#1e293b"
                        fontSize={12}
                        fontWeight="900"
                      />
                      {kkStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getKkColor(kkFilter)} />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 2: GRAFIK PENDUDUK */}
            <div className="premium-chart-card">
              <div className="chart-card-header">
                <h3>Grafik Data Penduduk</h3>
                <select
                  className="chart-filter-select filter-blue"
                  value={pendudukFilter}
                  onChange={(e) => setPendudukFilter(e.target.value)}
                >
                  <option value="jumlahPenduduk">Jumlah Penduduk</option>
                  <option value="angkatanKerja">Angkatan Kerja</option>
                  <option value="sudahBekerja">Sudah Bekerja</option>
                  <option value="belumBekerja">Belum Bekerja</option>
                </select>
              </div>
              <div className="recharts-container-premium">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <ReBarChart data={pendudukStats} margin={{ top: 16, right: 16, left: 6, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" vertical={false} />
                    <XAxis
                      dataKey="desa"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                      height={44}
                      tickMargin={8}
                      interval={0}
                      tickFormatter={formatDesaLabel}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <ReTooltip
                      cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                      contentStyle={{
                        background: '#064e3b',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        borderRadius: '16px',
                        padding: '12px'
                      }}
                      itemStyle={{ fontWeight: 'bold', color: 'white' }}
                      labelStyle={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Bar
                      dataKey={pendudukFilter}
                      name={getPendudukFilterName(pendudukFilter)}
                      radius={[8, 8, 0, 0]}
                      barSize={40}
                      fill={getPendudukColor(pendudukFilter)}
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    >
                      <LabelList
                        dataKey={pendudukFilter}
                        position="top"
                        fill="#1e293b"
                        fontSize={12}
                        fontWeight="900"
                      />
                      {pendudukStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPendudukColor(pendudukFilter)} />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
