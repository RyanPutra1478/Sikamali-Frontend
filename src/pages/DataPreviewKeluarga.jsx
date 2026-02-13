import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  CircularProgress,
  TextField,
  InputAdornment,
  Grid,
  Card,
  IconButton,
  Tooltip,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  alpha,
  InputLabel,
  Menu,
  Button
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Home as HomeIcon, 
  VerifiedUser as VerifiedUserIcon, 
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Home, Download as FileDownloadIcon, RefreshCw as RefreshIcon } from 'lucide-react';
import { previewAPI, kkAPI, adminAPI, API_URL } from '../services/api';
import { getRolePermissions } from '../utils/permissions';
import * as XLSX from 'xlsx';
import './AdminTables.css';
import './AdminPage.css';

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, icon, color }) => (
  <Card
    sx={{
      minHeight: '80px',
      display: 'flex',
      alignItems: 'center',
      px: 2,
      borderRadius: '16px',
      border: '1px solid #f1f5f9',
      bgcolor: 'white',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 15px -5px ${alpha(color, 0.1)}`,
      }
    }}
  >
    {/* Decorative Glow (Top Right) */}
    <Box
      sx={{
        position: 'absolute',
        top: -15,
        right: -15,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle at center, ${alpha(color, 0.1)} 0%, transparent 70%)`,
        zIndex: 0
      }}
    />

    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: '12px',
        bgcolor: alpha(color, 0.08),
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 2,
        zIndex: 1,
        border: `1px solid ${alpha(color, 0.1)}`
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: 24 } })}
    </Box>

    <Box sx={{ zIndex: 1 }}>
      <Typography 
        variant="caption" 
        sx={{ 
          color: '#64748b', 
          fontWeight: 700, 
          display: 'block', 
          mb: 0.5,
          fontSize: '0.75rem'
        }}
      >
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 850, 
            color: '#0f172a', 
            fontSize: '1.4rem',
            lineHeight: 1 
          }}
        >
          {value.toLocaleString()}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#94a3b8', 
            fontWeight: 600, 
            fontSize: '0.75rem' 
          }}
        >
          Orang
        </Typography>
      </Box>
    </Box>
  </Card>
);

const DataPreviewKeluarga = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedDesa, setSelectedDesa] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedKK, setSelectedKK] = useState(null);
  const itemsPerPage = 15;

  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const openExportMenu = Boolean(exportMenuAnchor);

  const role = user?.role || 'user';
  const perms = getRolePermissions(role);
  const canExport = perms?.dataPreview?.penduduk?.export; // Reusing penduduk export perms for keluarga preview

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getKK();
      setData(Array.isArray(res) ? res : res?.data || []);
    } catch (error) {
      console.error("Error fetching KK data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setFilterValue('');
    setSelectedDesa('');
    setPage(1);
    setSelectedKK(null);
    setActiveTab('list');
    fetchData();
  };

  const handleViewDetail = async (kkId) => {
    setLoading(true);
    try {
      const detail = await kkAPI.getDetail(kkId);
      setSelectedKK(detail);
      setActiveTab("detail");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleExportExcel = (exportAll = false) => {
    setExportMenuAnchor(null);
    const sourceData = exportAll ? data : filteredData;
    const exportData = sourceData.map((row, index) => {
      const isPrasejahtera = (row.status_kesejahteraan || row.kategori_sosial)?.toLowerCase() === 'prasejahtera';
      return {
        'No': index + 1,
        'NO KARTU KELUARGA': row.nomor_kk,
        'Kepala Keluarga': row.kepala_keluarga,
        'Alamat': row.alamat,
        'Desa': row.desa || row.desa_kelurahan,
        'Kecamatan': row.kecamatan,
        'Zona': row.zona,
        'Koordinat': `${row.latitude || row.koordinat_latitude || '-'}, ${row.longitude || row.koordinat_longitude || '-'}`,
        'Jumlah Anggota': Array.isArray(row.members) ? row.members.length : (row.anggota_keluarga || 0),
        'Angkatan Kerja': row.angkatan_kerja,
        'Sudah Bekerja': row.sudah_bekerja,
        'Belum Bekerja': row.belum_bekerja,
        'Kategori Sosial': (row.status_kesejahteraan || row.kategori_sosial || (isPrasejahtera ? 'PRASEJAHTERA' : 'SEJAHTERA'))?.toString().toUpperCase(),
        'Tingkat Sosial': row.tingkat_sosial || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Keluarga");
    
    // Set column widths
    const wscols = [
      {wch: 5}, {wch: 25}, {wch: 20}, {wch: 35}, {wch: 15}, {wch: 15}, {wch: 10},
      {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 20}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Data_Keluarga_Sikamali_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const isPra = (item) => {
    return (item.status_kesejahteraan || item.kategori_sosial)?.toLowerCase() === 'prasejahtera';
  };

  const isMandiri = (item) => {
    return (item.status_kesejahteraan || item.kategori_sosial)?.toLowerCase() === 'sejahtera mandiri';
  };

  const uniqueDesa = [...new Set(data.map(item => item.desa || item.desa_kelurahan).filter(Boolean))].sort();

  const filteredData = data.filter(item => {
    const matchesSearch = 
      (item.kepala_keluarga || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nomor_kk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.alamat || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterValue === 'sejahtera' && (isPra(item) || isMandiri(item))) return false;
    if (filterValue === 'prasejahtera' && !isPra(item)) return false;
    if (filterValue === 'sejahtera_mandiri' && !isMandiri(item)) return false;

    if (selectedDesa && (item.desa || item.desa_kelurahan) !== selectedDesa) return false;
    
    return true;
  });

  const stats = {
    total: data.length,
    praSejahtera: data.filter(d => isPra(d)).length,
    sejahtera: data.filter(d => !isPra(d) && !isMandiri(d)).length,
    sejahteraMandiri: data.filter(d => isMandiri(d)).length
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box className="admin-header" sx={{ 
        flexDirection: { xs: 'column', md: 'row' }, 
        alignItems: { xs: 'flex-start', md: 'flex-end' },
        gap: { xs: 2, md: 0 },
        mb: '1.5rem', 
        borderBottom: '1px solid #e2e8f0', 
        paddingBottom: '1rem' 
      }}>
        <div className="header-title-section">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 850, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Home size={28} /> {activeTab === "detail" ? "Detail Kartu Keluarga" : "Data Preview Keluarga"}
          </h2>
          <p className="header-subtitle" style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '4px' }}>
            {activeTab === "detail" 
              ? `Melihat rincian anggota keluarga dan informasi domisili untuk KK: ${selectedKK?.nomor_kk}`
              : "Ringkasan data Kartu Keluarga dan statistik kesejahteraan desa lingkar tambang."}
          </p>
        </div>
        <Box className="header-actions" sx={{ 
          width: { xs: '100%', md: 'auto' }, 
          justifyContent: { xs: 'flex-start', md: 'flex-end' },
          gap: 1.5 
        }}>
          {activeTab === "list" ? (
            <>
              <Tooltip title="Refresh Data">
                <IconButton onClick={handleRefresh} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', p: 1.5 }}>
                  <RefreshIcon size={24} color="#10b981" />
                </IconButton>
              </Tooltip>
              {canExport && (
                <>
                  <Tooltip title="Export Excel">
                    <IconButton 
                      onClick={(e) => setExportMenuAnchor(e.currentTarget)} 
                      sx={{ bgcolor: '#ecfdf5', color: '#10b981', border: '1px solid #d1fae5', p: 1.5 }}
                    >
                      <FileDownloadIcon size={24} />
                    </IconButton>
                  </Tooltip>

                  <Menu
                    anchorEl={exportMenuAnchor}
                    open={openExportMenu}
                    onClose={() => setExportMenuAnchor(null)}
                    PaperProps={{
                      sx: {
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        borderRadius: 3,
                        mt: 1,
                        border: '1px solid #e2e8f0'
                      }
                    }}
                  >
                    <MenuItem onClick={() => handleExportExcel(false)} sx={{ fontWeight: 600, color: '#1e293b', gap: 1 }}>
                      <FileDownloadIcon size={18} /> Export Data Terfilter ({filteredData.length})
                    </MenuItem>
                    <MenuItem onClick={() => handleExportExcel(true)} sx={{ fontWeight: 600, color: '#10b981', gap: 1 }}>
                      <PeopleIcon size={18} /> Export Semua Data ({data.length})
                    </MenuItem>
                  </Menu>
                </>
              )}
            </>
          ) : (
            <Button 
              variant="outlined" 
              onClick={() => setActiveTab("list")}
              sx={{ 
                textTransform: 'none',
                borderRadius: '8px',
                px: 3,
                borderColor: '#9ca3af',
                color: '#4b5563',
                '&:hover': { borderColor: '#6b7280', bgcolor: '#f3f4f6' }
              }}
            >
              Kembali ke List
            </Button>
          )}
        </Box>
      </Box>

      {activeTab === "list" ? (
        <>

      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'nowrap', 
          gap: 2, 
          mb: 3, 
          overflowX: 'auto',
          pb: 1, // small padding for scrollbar
          '&::-webkit-scrollbar': { height: '6px' },
          '&::-webkit-scrollbar-track': { bgcolor: '#f1f5f9' },
          '&::-webkit-scrollbar-thumb': { 
            bgcolor: '#94a3b8', 
            borderRadius: '10px',
            '&:hover': { bgcolor: '#64748b' }
          }
        }}
      >
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <StatCard title="Total Kepala Keluarga" value={stats.total} icon={<HomeIcon />} color="#10b981" />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <StatCard title="Keluarga Prasejahtera" value={stats.praSejahtera} icon={<PeopleIcon />} color="#f43f5e" />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <StatCard title="Keluarga Sejahtera" value={stats.sejahtera} icon={<VerifiedUserIcon />} color="#6366f1" />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <StatCard title="Keluarga Sejahtera Mandiri" value={stats.sejahteraMandiri} icon={<VerifiedUserIcon />} color="#3b82f6" />
        </Box>
      </Box>

      {/* MAIN TABLE PAPER */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' }}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          gap: 2, 
          bgcolor: '#fcfcfc', 
          borderBottom: '1px solid #f1f5f9' 
        }}>
          <TextField
            size="small"
            placeholder="Cari No KK, Kepala Keluarga, dsb..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: 'white',
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 }, flex: { xs: '1 1 auto', sm: '0 0 auto' } }}>
            <InputLabel>Filter Status</InputLabel>
            <Select
              value={filterValue}
              label="Filter Status"
              onChange={(e) => {
                setFilterValue(e.target.value);
                setPage(1);
              }}
              sx={{ 
                borderRadius: 2.5, 
                bgcolor: 'white',
              }}
            >
              <MenuItem value=""><em>Semua Status</em></MenuItem>
              <MenuItem value="prasejahtera">Prasejahtera</MenuItem>
              <MenuItem value="sejahtera">Sejahtera</MenuItem>
              <MenuItem value="sejahtera_mandiri">Sejahtera Mandiri</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 }, flex: { xs: '1 1 auto', sm: '0 0 auto' } }}>
            <InputLabel>Filter Desa</InputLabel>
            <Select
              value={selectedDesa}
              label="Filter Desa"
              onChange={(e) => {
                setSelectedDesa(e.target.value);
                setPage(1);
              }}
              sx={{ 
                borderRadius: 2.5, 
                bgcolor: 'white',
              }}
            >
              <MenuItem value=""><em>Semua Desa</em></MenuItem>
              {uniqueDesa.map(desa => (
                <MenuItem key={desa} value={desa}>{desa}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <table className="modern-table" style={{ minWidth: 1800 }}>
            <thead>
              <tr>
                {[
                  'NO', 'NO KARTU KELUARGA', 'KEPALA KELUARGA', 'ALAMAT', 'DESA', 'KECAMATAN',
                  'ZONA', 'KOORDINAT', 'JUMLAH ANGGOTA', 'ANGKATAN KERJA', 'BEKERJA', 'BELUM BEKERJA', 'KATEGORI SOSIAL', 'TINGKAT SOSIAL', 'AKSI'
                ].map((head) => {
                  const centeredHeads = ['NO', 'JUMLAH ANGGOTA', 'ANGKATAN KERJA', 'BEKERJA', 'BELUM BEKERJA', 'AKSI'];
                  const isCentered = centeredHeads.includes(head);
                  return (
                    <th key={head} style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '800',
                      textAlign: isCentered ? 'center' : 'left',
                      padding: '8px 12px',
                      paddingLeft: isCentered ? '12px' : (head === 'ZONA' || head === 'KOORDINAT') ? '12px' : '12px'
                    }}>
                      {head}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', padding: '100px 0' }}>
                    <CircularProgress sx={{ color: '#10b981' }} />
                  </td>
                </tr>
              ) : (
                filteredData.slice((page-1)*itemsPerPage, page*itemsPerPage).map((row, index) => {
                  const isPrasejahtera = row.kategori_sosial?.toLowerCase() === 'prasejahtera';
                  return (
                    <tr key={index}>
                      <td style={{ textAlign: 'center', fontSize: '0.75rem', padding: '5px 12px' }}>{(page - 1) * itemsPerPage + index + 1}</td>
                      <td style={{ color: '#1e293b', fontSize: '0.75rem', padding: '5px 12px' }}>{row.nomor_kk}</td>
                      <td style={{ color: '#1e293b', fontSize: '0.75rem', padding: '5px 12px' }}>{row.kepala_keluarga}</td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem', padding: '5px 12px' }} title={row.alamat}>{row.alamat}</td>
                      <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.desa || row.desa_kelurahan || '-'}</td>
                      <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.kecamatan || '-'}</td>
                      <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
                        <span style={{ 
                          color: (() => {
                            const z = (row.zona || "").toUpperCase();
                            if (z.includes("RING 1")) return "#3b82f6";
                            if (z.includes("RING 2")) return "#10b981";
                            if (z.includes("RING 3")) return "#000000";
                            if (z.includes("RING 4")) return "#ef4444";
                            return "inherit";
                          })()
                        }}>
                          {row.zona || '-'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b', padding: '5px 12px' }}>
                        { (row.latitude || row.koordinat_latitude) && (row.longitude || row.koordinat_longitude) 
                          ? `${row.latitude || row.koordinat_latitude}, ${row.longitude || row.koordinat_longitude}` 
                          : '-' }
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.75rem', padding: '5px 12px' }}>{Array.isArray(row.members) ? row.members.length : (row.anggota_keluarga || 0)}</td>
                      <td style={{ textAlign: 'center', fontSize: '0.75rem', padding: '5px 12px' }}>{row.angkatan_kerja || 0}</td>
                      <td style={{ textAlign: 'center', fontSize: '0.75rem', padding: '5px 12px', color: (row.sudah_bekerja > 0 ? '#10b981' : 'inherit') }}>{row.sudah_bekerja || 0}</td>
                      <td style={{ textAlign: 'center', fontSize: '0.75rem', padding: '5px 12px', color: (row.belum_bekerja > 0 ? '#f43f5e' : 'inherit') }}>{row.belum_bekerja || 0}</td>
                      <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          textTransform: 'uppercase',
                          color: ((row.status_kesejahteraan || row.kategori_sosial || '').toLowerCase() === 'sejahtera mandiri' ? '#3b82f6' : 
                                 ((row.status_kesejahteraan || row.kategori_sosial || '').toLowerCase() === 'prasejahtera' || isPrasejahtera) ? '#ef4444' : '#10b981')
                        }}>
                          {row.status_kesejahteraan || row.kategori_sosial || (isPrasejahtera ? 'PRASEJAHTERA' : 'SEJAHTERA')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
                        {row.tingkat_sosial ? (
                          <span className={`status-badge-lg ${
                            row.tingkat_sosial.toLowerCase().includes('ekstrem') ? 'status-danger' : 
                            row.tingkat_sosial.toLowerCase().includes('miskin') ? 'status-moved' : 'status-newcomer'
                          }`} style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            {row.tingkat_sosial}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '5px 12px' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetail(row.id)}
                          sx={{ 
                            color: '#3b82f6', 
                            bgcolor: '#eff6ff',
                            '&:hover': { bgcolor: '#dbeafe' }
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Box>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={Math.ceil(filteredData.length / itemsPerPage)} 
            page={page} 
            onChange={(e,v) => setPage(v)} 
            sx={{ 
              '& .MuiPaginationItem-root': { fontWeight: 700 },
              '& .Mui-selected': { bgcolor: '#10b981 !important', color: 'white' } 
            }}
          />
        </Box>
      </Paper>
      </>
      ) : (
        <div
          className="detail-view-container"
          style={{ animation: "fadeIn 0.5s ease", width: '100%' }}
        >
          <div
            className="detail-header-card"
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "var(--shadow-md)",
              marginBottom: "2rem",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '20px' }}>
              {selectedKK.foto_rumah && (
                <div className="detail-photo">
                   <img 
                    src={`${API_URL}/land/photo/${selectedKK.foto_rumah}`} 
                    alt="Foto Rumah" 
                    style={{
                        width: '240px',
                        height: '160px',
                        objectFit: 'cover',
                        borderRadius: '16px',
                        border: '4px solid #f1f5f9',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                   />
                </div>
              )}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1e293b" }}>
                      Kartu Keluarga No. {selectedKK.nomor_kk}
                    </h2>
                    <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
                      Kepala Keluarga: <strong>{selectedKK.kepala_keluarga}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1.5rem",
              }}
            >
              <div className="info-item">
                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Alamat
                </label>
                <div style={{ fontWeight: 500 }}>{selectedKK.alamat}</div>
              </div>
              <div className="info-item">
                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Desa / Kelurahan
                </label>
                <div style={{ fontWeight: 500 }}>{selectedKK.desa}</div>
              </div>
              <div className="info-item">
                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Kecamatan
                </label>
                <div style={{ fontWeight: 500 }}>{selectedKK.kecamatan}</div>
              </div>
              <div className="info-item">
                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Kabupaten
                </label>
                <div style={{ fontWeight: 500 }}>{selectedKK.kabupaten}</div>
              </div>
              <div className="info-item">
                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Provinsi
                </label>
                <div style={{ fontWeight: 500 }}>{selectedKK.provinsi}</div>
              </div>
              <div className="info-item">
                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Zona Lingkar Tambang
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className={`status-badge-lg ${selectedKK.zona === "Ring 1" ? "status-danger" : "status-success"}`}>
                    {selectedKK.zona || "-"}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Koordinat (Lat, Lng)
                </label>
                <div style={{ fontWeight: 500 }}>
                  {(selectedKK.latitude || selectedKK.lat || selectedKK.lp_lat) && (selectedKK.longitude || selectedKK.lng || selectedKK.lp_lng) 
                    ? `${selectedKK.latitude || selectedKK.lat || selectedKK.lp_lat}, ${selectedKK.longitude || selectedKK.lng || selectedKK.lp_lng}` 
                    : "Belum Terdata"}
                </div>
              </div>
              <div className="info-item">
                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Tanggal Diterbitkan
                </label>
                <div style={{ fontWeight: 500 }}>
                  {formatDate(selectedKK.tanggal_diterbitkan)}
                </div>
              </div>
              <div className="info-item">
                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Status Hard Copy KK
                </label>
                <span className={`status-badge ${selectedKK.status_hard_copy === "LENGKAP" ? "status-success" : "status-pending"}`}>
                  {selectedKK.status_hard_copy || "BELUM ADA"}
                </span>
              </div>
              <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Keterangan
                </label>
                <div style={{ fontWeight: 400, color: "#4b5563", whiteSpace: "pre-wrap" }}>
                  {selectedKK.keterangan || "-"}
                </div>
              </div>
            </div>
          </div>

          <div className="members-list-section">
            <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "#1e293b" }}>
              Daftar Anggota Keluarga
            </h3>
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>No</th>
                      <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>NIK</th>
                      <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>Nama Lengkap</th>
                      <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>Jenis Kelamin</th>
                      <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>Hubungan</th>
                      <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedKK.members && selectedKK.members.length > 0 ? (
                      selectedKK.members.map((member, index) => (
                        <tr key={member.id}>
                          <td style={{ fontSize: "0.75rem" }}>{index + 1}</td>
                          <td style={{ fontSize: "0.75rem" }}>{member.nik}</td>
                          <td>
                            <div className="user-cell">
                              <span className="username-text" style={{ fontSize: '0.75rem', fontWeight: '600' }}>{member.nama}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: "0.75rem" }}>
                            <span style={{ 
                              fontWeight: '700',
                              color: member.jenis_kelamin?.toString().toUpperCase().startsWith('L') ? '#075985' : '#991b1b'
                            }}>
                              {member.jenis_kelamin?.toString().toUpperCase().startsWith('L') ? "LAKI-LAKI" : (member.jenis_kelamin?.toString().toUpperCase().startsWith('P') ? "PEREMPUAN" : "-")}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.75rem" }}>
                            <span className="kk-badge" style={{ fontSize: "0.75rem" }}>
                              {member.hubungan_keluarga}
                            </span>
                          </td>
                          <td>
                            <span style={{ 
                                fontSize: "0.75rem", 
                                color: (() => {
                                    const s = (member.status_domisili || '').toUpperCase().trim();
                                    if (s.includes('PENDATANG')) return '#3b82f6';
                                    return '#10b981';
                                })()
                            }}>
                                {(() => {
                                    const s = (member.status_domisili || '').toUpperCase().trim();
                                    if (s === 'PENDUDUK ASLI' || s === 'ASLI') return 'PENDUDUK TETAP';
                                    return s || '-';
                                })()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="no-data" style={{ textAlign: 'center', padding: '20px' }}>
                          Belum ada anggota keluarga terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Paper>
          </div>
        </div>
      )}
    </Container>
  );
};

export default DataPreviewKeluarga;
