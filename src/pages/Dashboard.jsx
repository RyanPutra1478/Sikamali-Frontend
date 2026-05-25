import React, { useState, useEffect } from 'react';
import { previewAPI, announcementAPI } from '../services/api';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import {
  LayoutDashboard, Megaphone, Users, Home, Briefcase,
  AlertCircle, User, TrendingUp, CheckCircle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import './Dashboard.css';

// --- STYLING CONSTANTS ---
const VILLAGES = [
  'LAPAO-PAO',
  'MUARA LAPAO-PAO',
  'SAMAENRE',
  'TOLOWE PONRE WARU',
  'ULU WOLO',
  'WOLO'
];

const normalizeDesa = (desaStr) => {
  if (!desaStr) return '';
  const clean = desaStr.trim().toUpperCase().replace(/\s+/g, ' ');
  if (clean.includes('LAPAO-PAO') && !clean.includes('MUARA')) return 'LAPAO-PAO';
  if (clean.includes('MUARA LAPAO-PAO') || (clean.includes('MUARA') && clean.includes('LAPAO'))) return 'MUARA LAPAO-PAO';
  if (clean.includes('SAMAENRE')) return 'SAMAENRE';
  if (clean.includes('TOLOWE') || clean.includes('PONRE') || clean.includes('WARU')) return 'TOLOWE PONRE WARU';
  if (clean.includes('ULU WOLO') || (clean.includes('ULU') && clean.includes('WOLO'))) return 'ULU WOLO';
  if (clean.includes('WOLO') && !clean.includes('ULU')) return 'WOLO';
  return clean;
};

const isPra = (item) => {
  const status = (item.status_kesejahteraan || item.kategori_sosial || '').toLowerCase().replace(/\s+/g, '');
  return status.includes('prasejahtera') || item.is_prasejahtera === 1 || item.is_prasejahtera === true || item.is_prasejahtera === '1' || item.is_prasejahtera === 'true';
};

const isMandiri = (item) => {
  const status = (item.status_kesejahteraan || item.kategori_sosial || '').toLowerCase().replace(/\s+/g, '');
  return status === 'sejahteramandiri';
};

const getMemberDesa = (member, kkMap) => {
  const directDesa = member.desa || member.desa_kelurahan;
  if (directDesa) return directDesa;

  const kkNo = member.kk_nomor || member.no_kartu_keluarga || member.nomor_kk;
  if (kkNo && kkMap[kkNo]) {
    return kkMap[kkNo].desa || kkMap[kkNo].desa_kelurahan;
  }
  return '';
};

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
  const [announcements, setAnnouncements] = useState([]);
  const [kkData, setKkData] = useState([]);
  const [memberData, setMemberData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnnouncements, setShowAnnouncements] = useState(true);

  // Dynamic Chart Filters
  const [kkFilter, setKkFilter] = useState('jumlahKK');
  const [pendudukFilter, setPendudukFilter] = useState('jumlahPenduduk');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [annRes, kkRes, memberRes] = await Promise.all([
        announcementAPI.get().catch(() => []),
        previewAPI.getKK().catch(() => []),
        previewAPI.getMember().catch(() => [])
      ]);

      const activeNews = annRes.filter(item => item.is_active);
      setAnnouncements(activeNews);
      setKkData(Array.isArray(kkRes) ? kkRes : kkRes?.data || []);
      setMemberData(Array.isArray(memberRes) ? memberRes : memberRes?.data || []);
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- O(1) LOOKUP MAP ---
  const kkMap = {};
  kkData.forEach(kk => {
    if (kk.nomor_kk) {
      kkMap[kk.nomor_kk] = kk;
    }
  });

  // --- STATS CALCULATIONS ---
  const kkStats = VILLAGES.map(village => {
    const villageKks = kkData.filter(kk => normalizeDesa(kk.desa || kk.desa_kelurahan) === village);

    const total = villageKks.length;
    const pra = villageKks.filter(isPra).length;
    const mandiri = villageKks.filter(isMandiri).length;
    const sejahtera = villageKks.filter(k => !isPra(k) && !isMandiri(k)).length;

    return {
      desa: village,
      jumlahKK: total,
      praSejahtera: pra,
      sejahtera: sejahtera,
      sejahteraMandiri: mandiri
    };
  });

  const kkTotal = {
    desa: 'TOTAL',
    jumlahKK: kkStats.reduce((acc, curr) => acc + curr.jumlahKK, 0),
    praSejahtera: kkStats.reduce((acc, curr) => acc + curr.praSejahtera, 0),
    sejahtera: kkStats.reduce((acc, curr) => acc + curr.sejahtera, 0),
    sejahteraMandiri: kkStats.reduce((acc, curr) => acc + curr.sejahteraMandiri, 0)
  };

  const pendudukStats = VILLAGES.map(village => {
    const villageMembers = memberData.filter(m => {
      const mDesa = getMemberDesa(m, kkMap);
      return normalizeDesa(mDesa) === village;
    });

    const total = villageMembers.length;
    const angkatan = villageMembers.filter(d => {
      if (!d.status_kerja) return false;
      const sk = String(d.status_kerja).toLowerCase().trim();
      return sk === 'belum bekerja' || sk === 'sudah bekerja';
    }).length;

    const sudah = villageMembers.filter(d => {
      if (!d.status_kerja) return false;
      const sk = String(d.status_kerja).toLowerCase().trim();
      return sk === 'sudah bekerja';
    }).length;

    const belum = villageMembers.filter(d => {
      if (!d.status_kerja) return false;
      const sk = String(d.status_kerja).toLowerCase().trim();
      return sk === 'belum bekerja';
    }).length;

    return {
      desa: village,
      jumlahPenduduk: total,
      angkatanKerja: angkatan,
      sudahBekerja: sudah,
      belumBekerja: belum
    };
  });

  const pendudukTotal = {
    desa: 'TOTAL',
    jumlahPenduduk: pendudukStats.reduce((acc, curr) => acc + curr.jumlahPenduduk, 0),
    angkatanKerja: pendudukStats.reduce((acc, curr) => acc + curr.angkatanKerja, 0),
    sudahBekerja: pendudukStats.reduce((acc, curr) => acc + curr.sudahBekerja, 0),
    belumBekerja: pendudukStats.reduce((acc, curr) => acc + curr.belumBekerja, 0)
  };

  // Global counts for stat cards
  const globalTotalKK = kkTotal.jumlahKK;
  const globalTotalPenduduk = pendudukTotal.jumlahPenduduk;
  const globalAngkatanKerja = pendudukTotal.angkatanKerja;
  const globalSudahBekerja = pendudukTotal.sudahBekerja;
  const globalBelumBekerja = pendudukTotal.belumBekerja;

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
                <ResponsiveContainer width="100%" height={310}>
                  <ReBarChart data={kkStats} margin={{ top: 25, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" vertical={false} />
                    <XAxis
                      dataKey="desa"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
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
                <ResponsiveContainer width="100%" height={310}>
                  <ReBarChart data={pendudukStats} margin={{ top: 25, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" vertical={false} />
                    <XAxis
                      dataKey="desa"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
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
