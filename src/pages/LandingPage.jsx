import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { 
  Users, Home, Sparkles, AlertCircle, ChevronDown, 
  Briefcase, CheckCircle, TrendingUp, XCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, LabelList
} from 'recharts';

// Custom hook for animated counting
function useCountUp(end, duration = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;
    const startValue = count;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function: easeOutExpo
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentValue = Math.floor(easing * end);
      
      setCount(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const [stats, setStats] = useState({
    totalKK: 0,
    keluargaSejahtera: 0,
    keluargaPrasejahtera: 0,
    totalPenduduk: 0,
    angkatanKerja: 0,
    sudahBekerja: 0,
    belumBekerja: 0
  });
  const [villages, setVillages] = useState([]);
  const [selectedDesa, setSelectedDesa] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Comparison Data for Chart
  const [selectedMetric, setSelectedMetric] = useState('totalKK');
  const [comparisonData, setComparisonData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  // Metrics definitions for selection
  const metrics = [
    { id: 'totalKK', label: 'Kepala Keluarga', color: '#10b981' },
    { id: 'keluargaSejahtera', label: 'Sejahtera', color: '#8b5cf6' },
    { id: 'keluargaPrasejahtera', label: 'Pra Sejahtera', color: '#f59e0b' },
    { id: 'totalPenduduk', label: 'Penduduk', color: '#3b82f6' },
    { id: 'angkatanKerja', label: 'Angkatan Kerja', color: '#6366f1' },
    { id: 'sudahBekerja', label: 'Sudah Bekerja', color: '#10b981' },
    { id: 'belumBekerja', label: 'Belum Bekerja', color: '#ef4444' },
  ];

  const activeMetric = metrics.find(m => m.id === selectedMetric) || metrics[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Stats based on filter
        const statsData = await publicAPI.getStats(selectedDesa);
        
        // Map API response to state
        setStats({
          totalKK: statsData.totalKK || 0,
          keluargaSejahtera: statsData.keluargaSejahtera || 0,
          keluargaPrasejahtera: statsData.keluargaPrasejahtera || 0,
          totalPenduduk: statsData.totalPenduduk || 0,
          angkatanKerja: statsData.angkatanKerja || 0,
          sudahBekerja: statsData.sudahBekerja || 0,
          belumBekerja: statsData.belumBekerja || 0
        });
      } catch (err) {
        console.error('Gagal mengambil data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDesa]);

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const villageData = await publicAPI.getVillages();
        setVillages(villageData);
      } catch (err) {
        console.error('Gagal mengambil data desa:', err);
      }
    };
    fetchVillages();
  }, []);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoadingChart(true);
        const data = await publicAPI.getComparison(selectedMetric);
        setComparisonData(data);
      } catch (err) {
        console.error('Gagal mengambil data perbandingan:', err);
      } finally {
        setLoadingChart(false);
      }
    };
    fetchComparison();
  }, [selectedMetric]);


  const handleStartLogin = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/login');
    }, 800);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%',
      background: '#064e3b', 
      overflowX: 'hidden',
      overflowY: 'auto',
      scrollBehavior: 'smooth',
      position: 'relative',
      fontFamily: "'Inter', sans-serif"
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1); filter: blur(0); }
          to { opacity: 0; transform: scale(1.05); filter: blur(20px); }
        }
        @keyframes exitUp {
          to { transform: translateY(-100px); opacity: 0; filter: blur(10px); }
        }
        @keyframes exitDown {
          to { transform: translateY(100px); opacity: 0; filter: blur(10px); }
        }
        @keyframes exitLeft {
          to { transform: translateX(-100px); opacity: 0; filter: blur(10px); }
        }
        @keyframes exitRight {
          to { transform: translateX(100px); opacity: 0; filter: blur(10px); }
        }
        .animate-fade-in {
          opacity: 0;
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-fade-out {
          animation: fadeOut 0.8s cubic-bezier(0.7, 0, 0.3, 1) forwards !important;
        }
        .exit-up { animation: exitUp 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards !important; }
        .exit-down { animation: exitDown 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards !important; }
        .exit-left { animation: exitLeft 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards !important; }
        .exit-right { animation: exitRight 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards !important; }
        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
        .delay-3 { animation-delay: 0.6s; }
        .delay-4 { animation-delay: 0.8s; }
        
        .stat-card-glass {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        .stat-card-glass:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.3);
        }
        
        /* Custom Select Styles */
        .glass-select {
          appearance: none;
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50px;
          color: white;
          padding: 12px 50px 12px 25px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          outline: none;
          width: 100%;
          min-width: 250px;
          transition: all 0.3s ease;
          text-align: left;
        }
        .glass-select:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
        }
        .glass-select:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
        }
        .glass-select option {
          background: #064e3b;
          color: white;
          padding: 10px;
        }

        .chart-container-glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 30px;
          margin-top: 40px;
          width: 100%;
          max-width: 1100px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }

        .recharts-cartesian-grid-horizontal line,
        .recharts-cartesian-grid-vertical line {
          stroke: rgba(255, 255, 255, 0.1);
        }
        .recharts-text {
          fill: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 600;
        }
      `}</style>
      
      
      {/* Background Image with Overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `linear-gradient(rgba(6, 78, 59, 0.85), rgba(6, 78, 59, 0.7)), url('/village_hero_bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 1,
        transition: 'all 0.8s cubic-bezier(0.7, 0, 0.3, 1)',
        transform: isExiting ? 'scale(1.1)' : 'scale(1)',
        filter: isExiting ? 'blur(10px)' : 'none'
      }} />

      {/* Main Content Container */}
      <div className={isExiting ? "animate-fade-out" : ""} style={{
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 5% 60px',
        color: 'white',
        textAlign: 'center'
      }}>
        
        {/* Top Branding Section */}
        <div className={`animate-fade-in ${isExiting ? 'exit-up' : ''}`} style={{ marginBottom: '40px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            padding: '12px',
            borderRadius: '24px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.3)'
          }}>
            <img 
              src="/logo-icon.png" 
              alt="Logo" 
              style={{ 
                height: '80px', 
                width: '80px', 
                borderRadius: '16px', 
                background: 'white', 
                padding: '6px' 
              }} 
            />
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', 
            marginBottom: '10px', 
            fontWeight: '900',
            textShadow: '0 4px 12px rgba(0,0,0,0.3)',
            lineHeight: '1.1',
            letterSpacing: '-1.5px'
          }}>
            SIKAMALI
          </h1>
          
          <p style={{ 
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', 
            marginBottom: '30px',
            opacity: '0.8',
            maxWidth: '600px',
            margin: '0 auto 30px',
            lineHeight: '1.6'
          }}>
            Sistem Informasi Kependudukan Masyarakat Lingkar Tambang.
          </p>

          <button 
            onClick={handleStartLogin}
            className={isExiting ? 'exit-down' : ''}
            style={{ 
              padding: '16px 40px', 
              fontSize: '1rem', 
              borderRadius: '50px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.3s ease',
              marginBottom: '40px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Masuk Layanan
          </button>
        </div>

        {/* Filter Section */}
        <div className={`animate-fade-in delay-1 ${isExiting ? 'exit-down' : ''}`} style={{ marginBottom: '40px', position: 'relative', zIndex: 10, display: 'inline-block' }}>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedDesa}
              onChange={(e) => setSelectedDesa(e.target.value)}
              className="glass-select"
            >
              <option value="">Semua Wilayah (Total)</option>
              {villages.map(v => (
                <option key={v} value={v}>Desa {v}</option>
              ))}
            </select>
            {/* Custom Arrow Indicator */}
            <div style={{ 
              pointerEvents: 'none', 
              position: 'absolute', 
              right: '20px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <ChevronDown size={18} />
            </div>
          </div>
        </div>


        {/* Statistics Grid */}
        <div className="animate-fade-in delay-1" style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(120px, 15vw, 150px), 1fr))',
          gap: '12px',
          width: '100%',
          maxWidth: '1200px'
        }}>
          <StatCard Icon={Home} label="Kepala Keluarga" value={stats.totalKK} color="#10b981" />
          <StatCard Icon={Sparkles} label="Sejahtera" value={stats.keluargaSejahtera} color="#8b5cf6" />
          <StatCard Icon={AlertCircle} label="Pra Sejahtera" value={stats.keluargaPrasejahtera} color="#f59e0b" />
          <StatCard Icon={Users} label="Penduduk" value={stats.totalPenduduk} color="#3b82f6" />
          <StatCard Icon={TrendingUp} label="Angkatan Kerja" value={stats.angkatanKerja} color="#6366f1" />
          <StatCard Icon={CheckCircle} label="Sudah Bekerja" value={stats.sudahBekerja} color="#10b981" />
          <StatCard Icon={XCircle} label="Belum Bekerja" value={stats.belumBekerja} color="#ef4444" />
        </div>

        {/* Chart Section */}
        <div className="animate-fade-in delay-2 chart-container-glass">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                Perbandingan Data Per Desa
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase' }}>
                Kategori: {activeMetric.label}
              </p>
            </div>
            
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="glass-select"
                style={{ padding: '8px 40px 8px 15px', fontSize: '0.85rem', minWidth: '180px' }}
              >
                {metrics.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              <div style={{ pointerEvents: 'none', position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.8)' }}>
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: 350, opacity: loadingChart ? 0.5 : 1, transition: 'opacity 0.3s' }}>
            <ResponsiveContainer>
              <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="desa" 
                  axisLine={false} 
                  tickLine={false} 
                  interval={0}
                  tick={{ fontSize: 15, fill: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 28, fill: 'white', fontWeight: '900' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    background: 'rgba(6, 78, 59, 1)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    color: 'white'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey={(row) => row.value !== undefined ? row.value : row[selectedMetric]} 
                  id="value"
                  name={activeMetric.label}
                  radius={[8, 8, 0, 0]}
                  fill={activeMetric.color}
                  barSize={40}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  animationBegin={400}
                >
                  <LabelList 
                    dataKey={(row) => row.value !== undefined ? row.value : row[selectedMetric]} 
                    position="top" 
                    fill="white" 
                    fontSize={28} 
                    fontWeight="900" 
                  />
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={activeMetric.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Decorative Elements */}
      <div style={{
        position: 'absolute',
        bottom: '-50px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120%',
        height: '200px',
        background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />
    </div>
  );
}

function StatCard({ Icon, label, value, color }) {
  const animatedValue = useCountUp(value);
  
  return (
    <div className="stat-card-glass" style={{
      padding: '16px 12px',
      borderRadius: '16px',
      textAlign: 'center',
    }}>
      <div style={{ 
        marginBottom: '8px',
        background: `${color}30`,
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
        margin: '0 auto 8px',
        color: color
      }}>
        <Icon size={18} />
      </div>
      <h3 style={{ fontSize: '1.25rem', margin: '0 0 2px', color: 'white', fontWeight: '800' }}>
        {animatedValue.toLocaleString('id-ID')}
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: '600', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
    </div>
  );
}
